import { useState, useCallback, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingBag } from "lucide-react";
import {
  CartAnimationContext,
  useCartAnimation,
} from "@/hooks/useCartAnimation";

// ─── Types ──────────────────────────────────────────────────
interface FlyingItem {
  id: string;
  imageUrl: string;
  startX: number;
  startY: number;
}

// ─── Provider ───────────────────────────────────────────────
export function CartAnimationProvider({ children }: { children: ReactNode }) {
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [cartBouncing, setCartBouncing] = useState(false);
  const idCounter = useRef(0);

  const triggerFlyToCart = useCallback(
    (imageUrl: string, sourceRect: DOMRect) => {
      const id = `fly-${idCounter.current++}`;
      const item: FlyingItem = {
        id,
        imageUrl,
        startX: sourceRect.left + sourceRect.width / 2,
        startY: sourceRect.top + sourceRect.height / 2,
      };

      setFlyingItems((prev) => [...prev, item]);

      // Trigger cart bounce after flying animation
      setTimeout(() => {
        setCartBouncing(true);
        setTimeout(() => setCartBouncing(false), 600);
      }, 500);

      // Remove flying item after animation completes
      setTimeout(() => {
        setFlyingItems((prev) => prev.filter((f) => f.id !== id));
      }, 900);
    },
    [],
  );

  // Find the cart icon position (navbar cart)
  const getCartIconPosition = () => {
    const cartIcon = document.querySelector("[data-cart-icon]");
    if (cartIcon) {
      const rect = cartIcon.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    return { x: window.innerWidth - 60, y: 30 };
  };

  return (
    <CartAnimationContext.Provider value={{ triggerFlyToCart, cartBouncing }}>
      {children}
      {/* Flying items portal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {flyingItems.map((item) => {
              const target = getCartIconPosition();
              return (
                <motion.div
                  key={item.id}
                  initial={{
                    opacity: 1,
                    scale: 1,
                    x: item.startX - 24,
                    y: item.startY - 24,
                  }}
                  animate={{
                    opacity: [1, 0.9, 0.7, 0],
                    scale: [1, 0.7, 0.4, 0.15],
                    x: target.x - 24,
                    y: target.y - 24,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.7,
                    ease: [0.2, 0.8, 0.2, 1],
                  }}
                  className="fixed z-[200] pointer-events-none"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-2xl ring-2 ring-primary/50">
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>,
          document.body,
        )}
    </CartAnimationContext.Provider>
  );
}

// ─── AddToCartButton (reusable with animation) ─────────────
interface AddToCartButtonProps {
  onAdd: () => void;
  isPending: boolean;
  isSuccess: boolean;
  disabled?: boolean;
  productImage?: string;
  variant?: "card" | "detail" | "mini";
  className?: string;
}

export function AddToCartButton({
  onAdd,
  isPending,
  isSuccess,
  disabled = false,
  productImage,
  variant = "card",
  className = "",
}: AddToCartButtonProps) {
  const { triggerFlyToCart } = useCartAnimation();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isPending) return;

    // Trigger flying animation
    if (productImage && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      triggerFlyToCart(productImage, rect);
    }

    // Show success state briefly
    onAdd();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
  };

  const baseClasses = {
    card: "w-full py-2.5 rounded-xl text-sm font-body font-medium transition-all duration-300 flex items-center justify-center gap-2",
    detail:
      "flex-1 py-3.5 rounded-xl text-sm font-body font-medium transition-all duration-300 flex items-center justify-center gap-2",
    mini: "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
  };

  const stateClasses = showSuccess
    ? "bg-sage text-white scale-[0.98]"
    : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 disabled:hover:shadow-none";

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled || isPending}
      className={`${baseClasses[variant]} ${stateClasses} ${className}`}
    >
      <AnimatePresence mode="wait">
        {isPending ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </motion.div>
        ) : showSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Check size={variant === "mini" ? 14 : 16} />
            {variant !== "mini" && <span>Added!</span>}
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-1.5"
          >
            <ShoppingBag size={variant === "mini" ? 14 : 16} />
            {variant !== "mini" && <span>Add to Cart</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
