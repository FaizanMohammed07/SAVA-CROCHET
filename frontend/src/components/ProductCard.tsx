import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Eye, ShoppingBag, Star, Check, Loader2 } from "lucide-react";
import type { Product } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useAddToCart } from "@/hooks/useCart";
import { useToggleWishlist, useWishlist } from "@/hooks/useWishlist";
import { useCartAnimation } from "@/hooks/useCartAnimation";
import { toast } from "sonner";

interface Props {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: Props) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const { data: wishlistData } = useWishlist();
  const { triggerFlyToCart } = useCartAnimation();
  const cardRef = useRef<HTMLDivElement>(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const wishlist: string[] =
    wishlistData?.data?.wishlist?.map((p: { _id: string }) => p._id) || [];
  const isWishlisted = wishlist.includes(product._id);
  const image = product.images?.[0]?.url || "/placeholder.svg";
  const secondImage = product.images?.[1]?.url;
  const discount = product.discountPrice
    ? Math.round(
        ((product.price - product.discountPrice) / product.price) * 100,
      )
    : 0;
  const effectivePrice = product.discountPrice || product.price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Trigger flying animation
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      triggerFlyToCart(image, rect);
    }

    addToCart.mutate(
      { productId: product._id, quantity: 1 },
      {
        onSuccess: () => {
          setAddedToCart(true);
          toast.success(`${product.productName} added to cart!`);
          setTimeout(() => setAddedToCart(false), 2000);
        },
        onError: () => toast.error("Failed to add to cart"),
      },
    );
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    toggleWishlist.mutate(product._id, {
      onSuccess: () =>
        toast.success(
          isWishlisted ? "Removed from wishlist" : "Added to wishlist",
        ),
    });
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className="group relative"
    >
      <Link to={`/shop/${product._id}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted">
          {/* Shimmer placeholder */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          )}

          {/* Primary Image */}
          <img
            src={image}
            alt={product.productName}
            onLoad={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-700 ease-out ${
              imageLoaded ? "opacity-100" : "opacity-0"
            } ${secondImage ? "group-hover:opacity-0 group-hover:scale-110" : "group-hover:scale-110"}`}
          />

          {/* Secondary Image (hover swap) */}
          {secondImage && (
            <img
              src={secondImage}
              alt={`${product.productName} alt`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-all duration-700 ease-out scale-105 group-hover:scale-100"
            />
          )}

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-dusty-pink text-white text-[11px] font-body font-semibold px-2.5 py-1 rounded-lg shadow-sm"
              >
                -{discount}%
              </motion.span>
            )}
            {product.stock > 0 && product.stock <= 3 && (
              <span className="bg-amber-500 text-white text-[10px] font-body font-medium px-2 py-0.5 rounded-lg">
                Only {product.stock} left
              </span>
            )}
            {product.isFeatured && (
              <span className="bg-foreground/80 backdrop-blur-sm text-background text-[10px] font-body font-medium px-2 py-0.5 rounded-lg">
                Featured
              </span>
            )}
          </div>

          {/* Sold Out overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-white font-body text-sm font-semibold bg-black/40 px-5 py-2 rounded-full border border-white/20">
                Sold Out
              </span>
            </div>
          )}

          {/* Floating action buttons (right side) */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <motion.button
              onClick={handleToggleWishlist}
              whileTap={{ scale: 0.85 }}
              className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-sm transition-all duration-300 ${
                isWishlisted
                  ? "bg-dusty-pink text-white shadow-dusty-pink/30"
                  : "bg-white/80 text-foreground opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 hover:bg-dusty-pink hover:text-white"
              }`}
            >
              <Heart
                size={15}
                fill={isWishlisted ? "currentColor" : "none"}
                className={isWishlisted ? "animate-scale-in" : ""}
              />
            </motion.button>

            <motion.div className="opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 delay-75">
              <Link
                to={`/shop/${product._id}`}
                onClick={(e) => e.stopPropagation()}
                className="w-9 h-9 rounded-full bg-white/80 backdrop-blur-md text-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center shadow-sm transition-all duration-200"
              >
                <Eye size={15} />
              </Link>
            </motion.div>
          </div>

          {/* Add to Cart button (bottom, slides up on hover) — desktop */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out hidden md:block">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addToCart.isPending}
              className={`w-full py-3 rounded-xl text-sm font-body font-semibold backdrop-blur-md shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                addedToCart
                  ? "bg-sage text-white"
                  : "bg-white/90 text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
              }`}
            >
              <AnimatePresence mode="wait">
                {addToCart.isPending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </motion.div>
                ) : addedToCart ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <Check size={16} />
                    Added!
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5"
                  >
                    <ShoppingBag size={15} />
                    Add to Cart
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Rating badge (bottom-left on hover) */}
          {product.rating?.average > 0 && (
            <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0 hidden md:block">
              <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-medium shadow-sm">
                <Star size={11} className="text-amber-500 fill-amber-500" />
                {product.rating.average.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="pt-3.5 px-0.5">
          {/* Category */}
          <p className="text-[11px] font-body text-muted-foreground/70 tracking-widest uppercase mb-1">
            {product.category?.replace(/-/g, " ")}
          </p>

          {/* Name */}
          <h3 className="font-display text-base md:text-lg text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors duration-300">
            {product.productName}
          </h3>

          {/* Price + Rating */}
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-baseline gap-2">
              <span className="font-body text-base font-bold text-foreground">
                ₹{effectivePrice.toLocaleString()}
              </span>
              {product.discountPrice && (
                <span className="font-body text-xs text-muted-foreground line-through">
                  ₹{product.price.toLocaleString()}
                </span>
              )}
            </div>

            {product.rating?.average > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={10}
                      className={
                        i < Math.round(product.rating.average)
                          ? "text-amber-400 fill-amber-400"
                          : "text-border"
                      }
                    />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  ({product.rating.count})
                </span>
              </div>
            )}
          </div>

          {/* Color swatches */}
          {product.colors?.length > 1 && (
            <div className="flex items-center gap-1 mt-2">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color}
                  title={color}
                  className="w-3.5 h-3.5 rounded-full border border-border/50 shadow-sm"
                  style={{ backgroundColor: getColorHex(color) }}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[10px] text-muted-foreground ml-0.5">
                  +{product.colors.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Mobile: Always-visible Add to Cart */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addToCart.isPending}
            className={`mt-3 w-full py-2.5 rounded-xl text-xs font-body font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 md:hidden ${
              addedToCart
                ? "bg-sage text-white"
                : "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98] disabled:opacity-50"
            }`}
          >
            {addToCart.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : addedToCart ? (
              <>
                <Check size={13} /> Added!
              </>
            ) : (
              <>
                <ShoppingBag size={13} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

// ─── Color name → hex ────────────────────────────────────────
function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    red: "#EF4444",
    blue: "#3B82F6",
    green: "#22C55E",
    yellow: "#EAB308",
    pink: "#EC4899",
    purple: "#A855F7",
    orange: "#F97316",
    white: "#FFFFFF",
    black: "#1F2937",
    brown: "#92400E",
    beige: "#D4A574",
    cream: "#FFFDD0",
    navy: "#1E3A5F",
    teal: "#14B8A6",
    coral: "#FF7F7F",
    sage: "#9CAF88",
    lavender: "#E6E6FA",
    mint: "#98FB98",
    peach: "#FFDAB9",
    burgundy: "#800020",
    ivory: "#FFFFF0",
    rust: "#B7410E",
    olive: "#808000",
    grey: "#9CA3AF",
    gray: "#9CA3AF",
    maroon: "#800000",
    gold: "#FFD700",
    silver: "#C0C0C0",
    tan: "#D2B48C",
    charcoal: "#36454F",
    mauve: "#E0B0FF",
  };
  return colorMap[colorName.toLowerCase().replace(/[\s-]/g, "_")] || "#D1D5DB";
}

export default ProductCard;
