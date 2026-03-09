import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import {
  useCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
} from "@/hooks/useCart";
import { toast } from "sonner";

const Cart = () => {
  const { data: cartData, isLoading } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const clearCart = useClearCart();
  const navigate = useNavigate();

  const cart = cartData?.data?.cart;
  const items = cart?.items || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-brown" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="text-muted-foreground" size={32} />
          </div>
          <h2 className="font-display text-2xl text-foreground mb-2">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground font-body mb-6">
            Start adding handmade treasures to your cart
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition"
          >
            <ShoppingBag size={16} /> Browse Collection
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl md:text-4xl text-foreground mb-8"
        >
          Shopping Cart
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const image =
                item.product?.images?.[0]?.url || "/placeholder.svg";
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 bg-card rounded-2xl p-4 border border-border"
                >
                  <Link
                    to={`/shop/${(item.product as { _id: string })?._id || item.product}`}
                    className="w-24 h-24 rounded-xl overflow-hidden bg-muted shrink-0"
                  >
                    <img
                      src={image}
                      alt={item.product?.productName}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/shop/${(item.product as { _id: string })?._id || item.product}`}
                    >
                      <h3 className="font-display text-lg text-foreground truncate">
                        {item.product?.productName || "Product"}
                      </h3>
                    </Link>
                    <div className="flex gap-3 text-xs text-muted-foreground font-body mt-1">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <p className="font-body text-sm font-semibold text-foreground mt-2">
                      ₹{item.price?.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() =>
                        removeItem.mutate(item._id, {
                          onSuccess: () => toast.success("Removed from cart"),
                        })
                      }
                      className="p-1.5 text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center border border-border rounded-lg">
                      <button
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item._id,
                            quantity: Math.max(1, item.quantity - 1),
                          })
                        }
                        className="p-1.5 hover:bg-muted transition"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-body">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item._id,
                            quantity: item.quantity + 1,
                          })
                        }
                        className="p-1.5 hover:bg-muted transition"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            <button
              onClick={() =>
                clearCart.mutate(undefined, {
                  onSuccess: () => toast.success("Cart cleared"),
                })
              }
              className="text-sm text-destructive font-body hover:underline"
            >
              Clear Cart
            </button>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-card rounded-2xl p-6 border border-border sticky top-24">
              <h3 className="font-display text-xl text-foreground mb-4">
                Order Summary
              </h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">
                    Items ({cart?.totalItems})
                  </span>
                  <span>₹{cart?.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-body text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-sage">Calculated at checkout</span>
                </div>
                <div className="section-divider" />
                <div className="flex justify-between font-body font-semibold">
                  <span>Subtotal</span>
                  <span>₹{cart?.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-body text-sm font-medium hover:opacity-90 transition"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/shop"
                className="block text-center text-sm text-primary font-body mt-4 hover:underline"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
