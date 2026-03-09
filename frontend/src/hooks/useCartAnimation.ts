import { createContext, useContext } from "react";

export interface CartAnimationContextType {
  triggerFlyToCart: (imageUrl: string, sourceRect: DOMRect) => void;
  cartBouncing: boolean;
}

export const CartAnimationContext = createContext<CartAnimationContextType>({
  triggerFlyToCart: () => {},
  cartBouncing: false,
});

export const useCartAnimation = () => useContext(CartAnimationContext);
