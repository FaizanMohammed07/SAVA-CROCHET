import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Star,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  Truck,
  Shield,
  RotateCcw,
  Sparkles,
  Clock,
  Paintbrush,
} from "lucide-react";
import {
  useProduct,
  useProductReviews,
  useCreateReview,
  useRecommendations,
} from "@/hooks/useProducts";
import { useAddToCart } from "@/hooks/useCart";
import {
  useToggleWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { useCartAnimation } from "@/hooks/useCartAnimation";
import ProductCard from "@/components/ProductCard";
import { toast } from "sonner";

const getColorHex = (colorName: string) => {
  const map: Record<string, string> = {
    White: "#ffffff",
    Black: "#000000",
    Beige: "#f5f5dc",
    Cream: "#fffdd0",
    Brown: "#8b4513",
    "Light Blue": "#add8e6",
    Blue: "#0000ff",
    Pink: "#ffc0cb",
    Red: "#ff0000",
    Green: "#008000",
    "Olive Green": "#556b2f",
    Yellow: "#ffff00",
    Purple: "#800080",
    Lavender: "#e6e6fa",
    Orange: "#ffa500",
    Grey: "#808080",
    Mint: "#98ff98",
    Rose: "#ff007f",
    Navy: "#000080",
    Sage: "#8A9A5B",
    Rust: "#b7410e",
    Mustard: "#ffdb58",
  };
  return map[colorName] || "#cccccc";
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: productData, isLoading } = useProduct(id!);
  const { data: reviewsData } = useProductReviews(id!);
  const addToCart = useAddToCart();
  const toggleWishlist = useToggleWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const createReview = useCreateReview(id!);
  const { data: wishlistData } = useWishlist();

  const { triggerFlyToCart } = useCartAnimation();
  const { data: recommendationsData } = useRecommendations(id!, 8);

  const wishlist: string[] =
    wishlistData?.data?.wishlist?.map((p) => p._id) || [];
  const product = productData?.data?.product;
  const reviews = productData?.data?.reviews || reviewsData?.data || [];
  const recommendations = recommendationsData?.data?.recommendations || [];

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [addToCartSuccess, setAddToCartSuccess] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const mainImageRef = useRef<HTMLImageElement>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="h-4 w-48 bg-muted rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <div className="aspect-square rounded-2xl bg-muted animate-shimmer" />
              <div className="flex gap-3 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-20 h-20 rounded-xl bg-muted animate-pulse"
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-6 w-32 bg-muted rounded animate-pulse" />
              <div className="h-20 w-full bg-muted rounded animate-pulse" />
              <div className="h-12 w-full bg-muted rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl mb-2">Product Not Found</h2>
          <button
            onClick={() => navigate("/shop")}
            className="text-primary hover:underline font-body text-sm"
          >
            Browse all products
          </button>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist.includes(product._id);
  const images = product.images?.length
    ? product.images
    : [{ url: "/placeholder.svg", public_id: "" }];
  const colors = product.colors || [];
  const sizes = product.size ? [product.size] : [];
  const discount = product.discountPrice
    ? Math.round(
        ((product.price - product.discountPrice) / product.price) * 100,
      )
    : 0;

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    // Trigger flying animation
    if (mainImageRef.current) {
      const rect = mainImageRef.current.getBoundingClientRect();
      triggerFlyToCart(images[selectedImage]?.url || "/placeholder.svg", rect);
    }
    addToCart.mutate(
      {
        productId: product._id,
        quantity,
        color: selectedColor || undefined,
        size: selectedSize || undefined,
      },
      {
        onSuccess: () => {
          setAddToCartSuccess(true);
          toast.success("Added to cart!");
          setTimeout(() => setAddToCartSuccess(false), 2000);
        },
        onError: () => toast.error("Failed to add to cart"),
      },
    );
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleWishlist = () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (isWishlisted) {
      removeFromWishlist.mutate(product._id, {
        onSuccess: () => toast.success("Removed from wishlist"),
      });
    } else {
      toggleWishlist.mutate(product._id, {
        onSuccess: () => toast.success("Added to wishlist"),
      });
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    createReview.mutate(
      {
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
      },
      {
        onSuccess: () => {
          toast.success("Review submitted!");
          setShowReviewForm(false);
          setReviewForm({ rating: 5, title: "", comment: "" });
        },
        onError: () => toast.error("Failed to submit review"),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-sm font-body text-muted-foreground mb-6 md:mb-8"
        >
          <Link
            to="/shop"
            className="hover:text-foreground transition-colors duration-200"
          >
            Shop
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <Link
            to={`/shop?category=${product.category}`}
            className="hover:text-foreground transition-colors duration-200"
          >
            {product.category}
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="text-foreground truncate max-w-[200px]">
            {product.productName}
          </span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
          {/* Images Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Main Image with Texture Ultra Zoom and Color Tint */}
            <div
              className={`relative aspect-square rounded-2xl overflow-hidden bg-muted mb-4 group ${
                imageZoomed ? "cursor-none" : "cursor-zoom-in"
              }`}
              onMouseEnter={() => setImageZoomed(true)}
              onMouseLeave={() => setImageZoomed(false)}
              onMouseMove={handleImageMouseMove}
            >
              {/* Shimmer loading */}
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-shimmer" />
              )}

              {/* Base Image */}
              <img
                ref={mainImageRef}
                src={images[selectedImage]?.url}
                alt={product.productName}
                className="w-full h-full object-cover transition-transform duration-500 ease-out"
                style={
                  imageZoomed
                    ? {
                        transform: "scale(3.5)",
                        transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                      }
                    : undefined
                }
                onLoad={() => setImageLoaded(true)}
              />

              {/* Live Color Customizer Overlay */}
              {selectedColor && (
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-color transition-colors duration-700 ease-in-out"
                  style={{
                    backgroundColor: getColorHex(selectedColor),
                    opacity: 0.45,
                  }}
                />
              )}

              {/* Custom Magnifier Cursor */}
              <AnimatePresence>
                {imageZoomed && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pointer-events-none absolute w-32 h-32 border-2 border-white/50 rounded-full shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] backdrop-blur-[1px] flex items-center justify-center bg-transparent z-10 overflow-hidden"
                    style={{
                      left: `calc(${zoomPos.x}% - 4rem)`,
                      top: `calc(${zoomPos.y}% - 4rem)`,
                    }}
                  >
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md">
                      <Sparkles size={10} />
                      Texture Zoom
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageLoaded(false);
                      setSelectedImage((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1,
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageLoaded(false);
                      setSelectedImage((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1,
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-gradient-to-r from-dusty-pink to-dusty-pink/80 text-white text-sm font-body font-medium px-3 py-1 rounded-full shadow-lg"
                  >
                    -{discount}% OFF
                  </motion.span>
                )}
                {product.stock > 0 && product.stock <= 5 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-amber-500/90 text-white text-xs font-body px-3 py-1 rounded-full shadow-lg"
                  >
                    Only {product.stock} left!
                  </motion.span>
                )}
                {product.isFeatured && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-sage/90 text-white text-xs font-body px-3 py-1 rounded-full shadow-lg flex items-center gap-1"
                  >
                    <Sparkles size={12} /> Featured
                  </motion.span>
                )}
              </div>
              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-body px-3 py-1.5 rounded-full">
                  {selectedImage + 1} / {images.length}
                </div>
              )}
            </div>
            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {images.map((img, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setImageLoaded(false);
                      setSelectedImage(i);
                    }}
                    className={`relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      i === selectedImage
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-primary/30"
                    }`}
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {i === selectedImage && (
                      <motion.div
                        layoutId="thumb-indicator"
                        className="absolute inset-0 bg-primary/10"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="space-y-6"
          >
            <div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-body text-primary/80 tracking-widest uppercase mb-2"
              >
                {product.category}
              </motion.p>
              <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] text-foreground leading-tight mb-3">
                {product.productName}
              </h1>
              {product.rating?.average > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={`transition-colors ${
                          i < Math.round(product.rating.average)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground font-body">
                    {product.rating.average.toFixed(1)} ({product.rating.count}{" "}
                    {product.rating.count === 1 ? "review" : "reviews"})
                  </span>
                </motion.div>
              )}
            </div>

            {/* Price */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-baseline gap-3"
            >
              <span className="font-display text-3xl md:text-4xl text-foreground">
                ₹{(product.discountPrice || product.price).toLocaleString()}
              </span>
              {product.discountPrice && (
                <>
                  <span className="font-body text-lg text-muted-foreground line-through">
                    ₹{product.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-body font-medium text-dusty-pink bg-dusty-pink/10 px-2 py-0.5 rounded-full">
                    Save ₹
                    {(product.price - product.discountPrice).toLocaleString()}
                  </span>
                </>
              )}
            </motion.div>

            {/* Description & Handmade Counter */}
            <div className="space-y-4">
              <p className="font-body text-muted-foreground leading-relaxed text-[0.938rem]">
                {product.description}
              </p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2.5 bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200/60 dark:border-amber-700/50 px-3.5 py-2 rounded-xl shadow-sm"
              >
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-20" />
                  <Clock
                    className="text-amber-600 dark:text-amber-500 relative z-10"
                    size={16}
                  />
                </div>
                <span className="text-sm font-body font-medium text-amber-800 dark:text-amber-400">
                  Handmade in{" "}
                  <span className="font-display font-semibold text-base">
                    {Math.floor(product._id.charCodeAt(0) % 6) + 4} hours
                  </span>
                </span>
              </motion.div>
            </div>

            {/* Live Color Customizer */}
            {colors.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="bg-card border rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 text-sm font-body font-medium text-foreground">
                    <Paintbrush size={16} className="text-primary" />
                    Color Customizer
                  </label>
                  {selectedColor && (
                    <span className="text-sm font-body text-muted-foreground transition-all">
                      Selected:{" "}
                      <strong className="text-foreground">
                        {selectedColor}
                      </strong>
                    </span>
                  )}
                </div>

                <div className="flex gap-3 flex-wrap">
                  {colors.map((c) => (
                    <motion.button
                      key={c}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedColor(c)}
                      className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 group overflow-hidden ${
                        selectedColor === c
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md scale-110"
                          : "ring-1 ring-border shadow-sm hover:ring-primary/50"
                      }`}
                      title={c}
                    >
                      {/* Base color */}
                      <div
                        className="absolute inset-0 z-0 transition-colors"
                        style={{ backgroundColor: getColorHex(c) }}
                      />

                      {/* Feel the Yarn texture overlay */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay z-10"
                        style={{
                          backgroundImage: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 40%), repeating-linear-gradient(45deg, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 2px, transparent 2px, transparent 4px)`,
                        }}
                      />

                      {/* Selection checkmark */}
                      <AnimatePresence>
                        {selectedColor === c && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="relative z-20 bg-background/80 backdrop-blur-sm rounded-full p-1"
                          >
                            <Check size={14} className="text-foreground" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  <span className="inline-block animate-pulse-soft text-primary mr-1">
                    ✨
                  </span>
                  Select a color to preview how it looks live. Hover to "feel
                  the yarn"!
                </p>
              </motion.div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-sm font-body font-medium text-foreground mb-3">
                  Size
                </label>
                <div className="flex gap-2">
                  {sizes.map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(s)}
                      className={`px-5 py-2.5 rounded-xl border text-sm font-body transition-all duration-200 ${
                        selectedSize === s
                          ? "border-primary bg-primary/5 text-foreground shadow-sm"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                      }`}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quantity + Add to Cart */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              className="flex items-center gap-3 md:gap-4"
            >
              <div className="flex items-center border border-border rounded-xl bg-background">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-muted transition-colors rounded-l-xl active:scale-95"
                >
                  <Minus size={16} />
                </button>
                <span className="w-12 text-center font-body text-sm font-medium select-none">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity(Math.min(product.stock, quantity + 1))
                  }
                  className="p-3 hover:bg-muted transition-colors rounded-r-xl active:scale-95"
                >
                  <Plus size={16} />
                </button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addToCart.isPending}
                className={`flex-1 py-3.5 rounded-xl font-body text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 ${
                  addToCartSuccess
                    ? "bg-sage text-white"
                    : "bg-primary text-primary-foreground hover:shadow-xl hover:shadow-primary/30"
                } disabled:opacity-60 disabled:shadow-none`}
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
                  ) : addToCartSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check size={18} />
                      Added!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag size={18} />
                      {product.stock === 0 ? "Sold Out" : "Add to Cart"}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlist}
                className={`p-3.5 rounded-xl border transition-all duration-200 ${
                  isWishlisted
                    ? "border-dusty-pink bg-dusty-pink/10 text-dusty-pink shadow-sm shadow-dusty-pink/20"
                    : "border-border text-muted-foreground hover:text-dusty-pink hover:border-dusty-pink hover:bg-dusty-pink/5"
                }`}
              >
                <Heart
                  size={20}
                  fill={isWishlisted ? "currentColor" : "none"}
                  className="transition-all duration-200"
                />
              </motion.button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { icon: Truck, label: "Free Shipping", sub: "Orders ₹999+" },
                {
                  icon: Shield,
                  label: "Secure Payment",
                  sub: "100% Protected",
                },
                { icon: RotateCcw, label: "Easy Returns", sub: "7 Day Policy" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/20 transition-colors duration-200"
                >
                  <Icon size={18} className="text-primary mb-1.5" />
                  <span className="text-xs font-body font-medium text-foreground">
                    {label}
                  </span>
                  <span className="text-[10px] font-body text-muted-foreground">
                    {sub}
                  </span>
                </div>
              ))}
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="border-t border-border pt-6 space-y-3"
            >
              {product.material && (
                <div className="flex gap-2 text-sm font-body">
                  <span className="text-muted-foreground w-28">Material:</span>
                  <span className="text-foreground">
                    {Array.isArray(product.material)
                      ? product.material.join(", ")
                      : product.material}
                  </span>
                </div>
              )}
              {product.handmadeTime && (
                <div className="flex gap-2 text-sm font-body">
                  <span className="text-muted-foreground w-28">
                    Handmade Time:
                  </span>
                  <span className="text-foreground">
                    {product.handmadeTime}
                  </span>
                </div>
              )}
              <div className="flex gap-2 text-sm font-body">
                <span className="text-muted-foreground w-28">
                  Availability:
                </span>
                <span
                  className={`font-medium ${
                    product.stock > 0 ? "text-sage" : "text-destructive"
                  }`}
                >
                  {product.stock > 0
                    ? `${product.stock} in stock`
                    : "Out of stock"}
                </span>
              </div>
              {product.difficulty && (
                <div className="flex gap-2 text-sm font-body">
                  <span className="text-muted-foreground w-28">
                    Difficulty:
                  </span>
                  <span className="text-foreground capitalize">
                    {product.difficulty}
                  </span>
                </div>
              )}
              {product.weight && (
                <div className="flex gap-2 text-sm font-body">
                  <span className="text-muted-foreground w-28">Weight:</span>
                  <span className="text-foreground">{product.weight}g</span>
                </div>
              )}
              {product.tags?.length > 0 && (
                <div className="flex gap-2 text-sm font-body flex-wrap">
                  <span className="text-muted-foreground w-28">Tags:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {product.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/shop?search=${tag}`}
                        className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs hover:bg-primary/10 hover:text-primary transition-colors duration-200"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mt-16 md:mt-20"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl md:text-3xl text-foreground">
                Customer Reviews
              </h2>
              {reviews.length > 0 && (
                <p className="text-sm font-body text-muted-foreground mt-1">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              )}
            </div>
            {isAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="px-5 py-2.5 rounded-xl border border-border text-sm font-body hover:bg-muted hover:border-primary/30 transition-all duration-200"
              >
                Write a Review
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {showReviewForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmitReview}
                className="bg-card rounded-2xl p-6 border border-border mb-8 space-y-4 overflow-hidden"
              >
                <div>
                  <label className="block text-sm font-body text-foreground mb-2">
                    Rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() =>
                          setReviewForm({ ...reviewForm, rating: star })
                        }
                      >
                        <Star
                          size={28}
                          className={`transition-colors duration-200 ${
                            star <= reviewForm.rating
                              ? "text-amber-400 fill-amber-400"
                              : "text-border hover:text-amber-300"
                          }`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-body text-foreground mb-1.5">
                    Title (optional)
                  </label>
                  <input
                    value={reviewForm.title}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, title: e.target.value })
                    }
                    placeholder="Sum it up in a few words"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-body text-foreground mb-1.5">
                    Review
                  </label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) =>
                      setReviewForm({ ...reviewForm, comment: e.target.value })
                    }
                    rows={4}
                    placeholder="Tell others about your experience..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all duration-200 resize-none"
                    required
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={createReview.isPending}
                  className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-all duration-200 flex items-center gap-2"
                >
                  {createReview.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Submit Review
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {reviews.length === 0 ? (
            <div className="text-center py-16 bg-muted/30 rounded-2xl border border-border/50">
              <Star
                size={32}
                className="mx-auto mb-3 text-muted-foreground/30"
              />
              <p className="text-muted-foreground font-body">
                No reviews yet. Be the first to share your thoughts!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sage/30 to-primary/20 flex items-center justify-center text-sm font-medium text-foreground">
                        {review.user?.firstName?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-body text-sm font-medium text-foreground">
                          {review.user?.fullName ||
                            `${review.user?.firstName || ""} ${review.user?.lastName || ""}`.trim() ||
                            "Anonymous"}
                        </p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < review.rating
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-muted-foreground/20"
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-body">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  {review.title && (
                    <p className="font-body text-sm font-medium text-foreground mb-1">
                      {review.title}
                    </p>
                  )}
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {review.comment}
                  </p>
                  {review.isVerifiedPurchase && (
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-body text-sage">
                      <Check size={12} /> Verified Purchase
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="mt-16 md:mt-20"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl text-foreground">
                  You May Also Like
                </h2>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  Handpicked just for you
                </p>
              </div>
              <Link
                to="/shop"
                className="text-sm font-body text-primary hover:text-primary/80 transition-colors duration-200 hidden sm:block"
              >
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {recommendations.map((rec, idx) => (
                <ProductCard key={rec._id} product={rec} index={idx} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Mobile Sticky Add to Cart Bar */}
      {product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border p-4 lg:hidden z-40">
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <div className="flex-shrink-0">
              <p className="font-display text-lg text-foreground">
                ₹{(product.discountPrice || product.price).toLocaleString()}
              </p>
              {product.discountPrice && (
                <p className="text-xs font-body text-muted-foreground line-through">
                  ₹{product.price.toLocaleString()}
                </p>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className={`flex-1 py-3 rounded-xl font-body text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                addToCartSuccess
                  ? "bg-sage text-white"
                  : "bg-primary text-primary-foreground"
              } disabled:opacity-60`}
            >
              {addToCart.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : addToCartSuccess ? (
                <>
                  <Check size={16} /> Added!
                </>
              ) : (
                <>
                  <ShoppingBag size={16} /> Add to Cart
                </>
              )}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
