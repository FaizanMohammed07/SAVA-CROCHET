import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  TrendingUp,
  Clock,
  ArrowRight,
  Star,
  Loader2,
} from "lucide-react";
import { useSearchSuggestions } from "@/hooks/useProducts";
import type { Product } from "@/types";

// ─── Local Storage helpers for recent searches ──────────────
const RECENT_SEARCHES_KEY = "sava_recent_searches";
const MAX_RECENT = 6;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const recent = getRecentSearches().filter(
    (s) => s.toLowerCase() !== trimmed.toLowerCase(),
  );
  recent.unshift(trimmed);
  localStorage.setItem(
    RECENT_SEARCHES_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT)),
  );
}

function clearRecentSearches() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// ─── Format price helper ────────────────────────────────────
function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatCategory(cat: string) {
  return cat
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ─── ProductSuggestionCard ──────────────────────────────────
function ProductSuggestionCard({
  product,
  isActive,
  onClick,
}: {
  product: Product;
  isActive: boolean;
  onClick: () => void;
}) {
  const hasDiscount =
    product.discountPrice && product.discountPrice < product.price;
  const effectivePrice = hasDiscount ? product.discountPrice! : product.price;
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice!) / product.price) * 100,
      )
    : 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 ${
        isActive ? "bg-sage/15 dark:bg-sage/10" : "hover:bg-muted/50"
      }`}
    >
      {/* Product Image */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        {product.images?.[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.productName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No img
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {product.productName}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {formatCategory(product.category)}
          </span>
          {product.rating?.average > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star size={10} fill="currentColor" />
              {product.rating.average.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-semibold text-foreground">
          {formatPrice(effectivePrice)}
        </p>
        {hasDiscount && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground line-through">
              {formatPrice(product.price)}
            </span>
            <span className="text-[10px] font-medium text-green-600">
              {discountPercent}% off
            </span>
          </div>
        )}
      </div>

      <ArrowRight size={14} className="text-muted-foreground flex-shrink-0" />
    </button>
  );
}

// ─── Main SearchOverlay ─────────────────────────────────────
interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Debounce input → query (200ms for snappy feel)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Fetch suggestions (trending if empty, results if query)
  const { data: suggestionsData, isLoading } =
    useSearchSuggestions(debouncedQuery);
  const suggestions = suggestionsData?.data;

  // Load recent searches on open
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setInputValue("");
      setDebouncedQuery("");
      setActiveIndex(-1);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset active index when suggestions change
  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  // Navigate to product
  const goToProduct = useCallback(
    (product: Product) => {
      addRecentSearch(product.productName);
      onClose();
      navigate(`/shop/${product._id}`);
    },
    [navigate, onClose],
  );

  // Navigate to search results page
  const goToSearch = useCallback(
    (query: string) => {
      if (!query.trim()) return;
      addRecentSearch(query.trim());
      onClose();
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    },
    [navigate, onClose],
  );

  // Navigate to category
  const goToCategory = useCallback(
    (category: string) => {
      onClose();
      navigate(`/shop?category=${encodeURIComponent(category)}`);
    },
    [navigate, onClose],
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const products = suggestions?.products || [];
      const maxIndex = products.length - 1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeIndex >= 0 && products[activeIndex]) {
          goToProduct(products[activeIndex]);
        } else {
          goToSearch(inputValue);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [suggestions, activeIndex, inputValue, goToProduct, goToSearch, onClose],
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-suggestion]");
    items[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleClearRecent = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  const products = suggestions?.products || [];
  const categories = suggestions?.categories || [];
  const isTrending = suggestions?.type === "trending";
  const hasQuery = inputValue.trim().length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-0 z-[101] md:top-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl"
          >
            <div className="bg-background md:rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[85vh] flex flex-col">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search
                  size={20}
                  className="text-muted-foreground flex-shrink-0"
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search for products, categories..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                  autoComplete="off"
                  spellCheck={false}
                />
                {isLoading && (
                  <Loader2
                    size={16}
                    className="text-muted-foreground animate-spin"
                  />
                )}
                {hasQuery && (
                  <button
                    onClick={() => {
                      setInputValue("");
                      inputRef.current?.focus();
                    }}
                    className="p-1 hover:bg-muted rounded-full transition-colors"
                  >
                    <X size={16} className="text-muted-foreground" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md bg-muted/50 transition-colors hidden md:block"
                >
                  ESC
                </button>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-muted rounded-full transition-colors md:hidden"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              {/* Results Body */}
              <div
                ref={listRef}
                className="overflow-y-auto overscroll-contain flex-1"
                style={{ maxHeight: "calc(85vh - 60px)" }}
              >
                {/* Recent Searches (only when no query and there are recent searches) */}
                {!hasQuery && recentSearches.length > 0 && (
                  <div className="px-4 pt-3 pb-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Clock size={12} /> Recent Searches
                      </span>
                      <button
                        onClick={handleClearRecent}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {recentSearches.map((search) => (
                        <button
                          key={search}
                          onClick={() => {
                            setInputValue(search);
                          }}
                          className="px-3 py-1.5 text-xs rounded-full bg-muted/70 text-foreground hover:bg-muted transition-colors"
                        >
                          {search}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section Header */}
                <div className="px-4 pt-3 pb-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    {isTrending && !hasQuery ? (
                      <>
                        <TrendingUp size={12} /> Trending Products
                      </>
                    ) : hasQuery ? (
                      <>
                        <Search size={12} /> Results for "{inputValue.trim()}"
                      </>
                    ) : null}
                  </span>
                </div>

                {/* Category Chips */}
                {categories.length > 0 && hasQuery && (
                  <div className="px-4 py-2 flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => goToCategory(cat)}
                        className="px-3 py-1 text-xs rounded-full bg-sage/15 text-sage-dark hover:bg-sage/25 transition-colors border border-sage/20"
                      >
                        {formatCategory(cat)}
                      </button>
                    ))}
                  </div>
                )}

                {/* Product Suggestions */}
                {products.length > 0 ? (
                  <div className="py-1">
                    {products.map((product, index) => (
                      <div key={product._id} data-suggestion>
                        <ProductSuggestionCard
                          product={product}
                          isActive={index === activeIndex}
                          onClick={() => goToProduct(product)}
                        />
                      </div>
                    ))}
                  </div>
                ) : hasQuery && !isLoading ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      No products found for "{inputValue.trim()}"
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Try a different search term
                    </p>
                  </div>
                ) : null}

                {/* View All Results Button */}
                {hasQuery && products.length > 0 && (
                  <div className="px-4 py-3 border-t border-border">
                    <button
                      onClick={() => goToSearch(inputValue)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors rounded-lg hover:bg-muted/50"
                    >
                      View all results for "{inputValue.trim()}"
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}

                {/* Keyboard Hint (desktop only) */}
                {!hasQuery && (
                  <div className="hidden md:flex items-center justify-center gap-4 px-4 py-3 border-t border-border text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
                        ↑↓
                      </kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
                        Enter
                      </kbd>
                      Select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">
                        Esc
                      </kbd>
                      Close
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
