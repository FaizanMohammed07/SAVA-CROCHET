import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SlidersHorizontal,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/ProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "All",
  "Amigurumi",
  "Clothing",
  "Accessories",
  "Home Decor",
  "Baby Items",
  "Bags & Purses",
  "Seasonal",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "popularity", label: "Most Popular" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const page = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const search = searchParams.get("search") || "";
  const [searchInput, setSearchInput] = useState(search);

  const { data, isLoading } = useProducts({
    page,
    limit: 12,
    category: category && category !== "All" ? category : undefined,
    sort,
    search: search || undefined,
  });

  const products = data?.data || [];
  const pagination = data?.pagination;

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam("search", searchInput);
  };

  const activeFiltersCount = [category, search].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground mb-2 md:mb-3">
              Our Collection
            </h1>
            <p className="text-muted-foreground font-body max-w-xl text-sm md:text-base">
              Each piece is lovingly handcrafted with premium yarns. Discover
              unique crochet creations made just for you.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Mobile Category Pills - horizontal scroll */}
        <div className="md:hidden mb-4 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  updateParam("category", cat === "All" ? "" : cat)
                }
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-body font-medium transition-all duration-200 ${
                  (cat === "All" && !category) || category === cat
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 md:mb-8">
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  updateParam("search", "");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </form>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilters(!showFilters)}
              className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-body hover:bg-muted transition-all duration-200 md:hidden"
            >
              <SlidersHorizontal size={16} /> Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {activeFiltersCount}
                </span>
              )}
            </motion.button>

            <div className="flex items-center gap-3 ml-auto">
              {pagination && (
                <span className="text-xs font-body text-muted-foreground hidden sm:block">
                  {pagination.total}{" "}
                  {pagination.total === 1 ? "product" : "products"}
                </span>
              )}
              <Select
                value={sort}
                onValueChange={(v) => updateParam("sort", v)}
              >
                <SelectTrigger className="w-[180px] sm:w-[200px] rounded-xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active filters display */}
        {(category || search) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 flex-wrap mb-6"
          >
            <span className="text-xs font-body text-muted-foreground">
              Active:
            </span>
            {category && (
              <button
                onClick={() => updateParam("category", "")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body hover:bg-primary/20 transition-colors"
              >
                {category} <X size={12} />
              </button>
            )}
            {search && (
              <button
                onClick={() => {
                  setSearchInput("");
                  updateParam("search", "");
                }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-body hover:bg-primary/20 transition-colors"
              >
                "{search}" <X size={12} />
              </button>
            )}
            <button
              onClick={() => {
                setSearchInput("");
                setSearchParams(new URLSearchParams());
              }}
              className="text-xs font-body text-muted-foreground hover:text-foreground transition-colors ml-1"
            >
              Clear all
            </button>
          </motion.div>
        )}

        <div className="flex gap-8">
          {/* Sidebar filters - Desktop + Mobile slide */}
          <AnimatePresence>
            {(showFilters || typeof window !== "undefined") && (
              <aside
                className={`w-56 shrink-0 space-y-6 ${showFilters ? "block" : "hidden"} md:block`}
              >
                <div>
                  <h3 className="font-display text-lg text-foreground mb-3">
                    Categories
                  </h3>
                  <div className="space-y-1">
                    {CATEGORIES.map((cat) => (
                      <motion.button
                        key={cat}
                        whileHover={{ x: 4 }}
                        onClick={() =>
                          updateParam("category", cat === "All" ? "" : cat)
                        }
                        className={`block w-full text-left px-3 py-2 rounded-lg text-sm font-body transition-all duration-200 ${
                          (cat === "All" && !category) || category === cat
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {cat}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </AnimatePresence>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              /* Skeleton grid */
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] rounded-2xl bg-muted animate-shimmer" />
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20"
              >
                <Package
                  size={48}
                  className="mx-auto mb-4 text-muted-foreground/30"
                />
                <p className="text-muted-foreground font-body text-lg mb-1">
                  No products found
                </p>
                <p className="text-muted-foreground font-body text-sm">
                  Try adjusting your filters or search term
                </p>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSearchInput("");
                    setSearchParams(new URLSearchParams());
                  }}
                  className="mt-4 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body hover:opacity-90 transition"
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            ) : (
              <>
                <motion.div
                  key={`${category}-${sort}-${page}-${search}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                >
                  {products.map((product, idx) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      index={idx}
                    />
                  ))}
                </motion.div>

                {/* Improved pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 mt-10"
                  >
                    <button
                      onClick={() =>
                        updateParam("page", String(Math.max(1, page - 1)))
                      }
                      disabled={page <= 1}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-all duration-200"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1,
                    )
                      .filter((p) => {
                        // Show first, last, current, and neighbors
                        return (
                          p === 1 ||
                          p === pagination.totalPages ||
                          Math.abs(p - page) <= 1
                        );
                      })
                      .map((p, idx, arr) => (
                        <span key={p} className="flex items-center gap-2">
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="text-muted-foreground text-xs">
                              ...
                            </span>
                          )}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => updateParam("page", String(p))}
                            className={`w-10 h-10 rounded-xl text-sm font-body transition-all duration-200 ${
                              p === pagination.page
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "bg-card border border-border text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {p}
                          </motion.button>
                        </span>
                      ))}
                    <button
                      onClick={() =>
                        updateParam(
                          "page",
                          String(Math.min(pagination.totalPages, page + 1)),
                        )
                      }
                      disabled={page >= pagination.totalPages}
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-border text-muted-foreground hover:bg-muted disabled:opacity-40 transition-all duration-200"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
