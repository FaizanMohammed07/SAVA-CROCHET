import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Heart, Trash2, ShoppingBag } from "lucide-react";
import { useWishlist, useRemoveFromWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useCart";
import { toast } from "sonner";

const Wishlist = () => {
  const { data: wishlistData, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addToCart = useAddToCart();

  const wishlistProducts = wishlistData?.data?.wishlist || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl text-foreground mb-8"
        >
          My Wishlist
        </motion.h1>

        {wishlistProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Heart className="text-muted-foreground" size={28} />
            </div>
            <h2 className="font-display text-xl text-foreground mb-2">
              No items in wishlist
            </h2>
            <p className="text-muted-foreground font-body mb-4">
              Save items you love for later
            </p>
            <Link
              to="/shop"
              className="text-primary font-body text-sm hover:underline"
            >
              Browse Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistProducts.map((product) => {
              const image = product.images?.[0]?.url || "/placeholder.svg";
              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-2xl overflow-hidden border border-border"
                >
                  <Link to={`/shop/${product._id}`} className="block">
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={image}
                        alt={product.productName}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/shop/${product._id}`}>
                      <h3 className="font-display text-lg text-foreground line-clamp-1">
                        {product.productName}
                      </h3>
                    </Link>
                    <p className="font-body text-sm font-semibold text-foreground mt-1">
                      ₹{product.price.toLocaleString()}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() =>
                          addToCart.mutate(
                            { productId: product._id, quantity: 1 },
                            {
                              onSuccess: () => toast.success("Added to cart!"),
                            },
                          )
                        }
                        disabled={product.stock === 0}
                        className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-body font-medium hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-1.5"
                      >
                        <ShoppingBag size={14} /> Add to Cart
                      </button>
                      <button
                        onClick={() =>
                          removeFromWishlist.mutate(product._id, {
                            onSuccess: () => toast.success("Removed"),
                          })
                        }
                        className="p-2 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
