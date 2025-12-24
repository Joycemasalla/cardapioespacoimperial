import { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product, ProductVariation } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, notes?: string, variation?: ProductVariation, secondFlavor?: Product) => void;
  removeItem: (cartItemKey: string) => void;
  updateQuantity: (cartItemKey: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate a unique key for cart items
export const generateCartItemKey = (product: Product, variation?: ProductVariation, secondFlavor?: Product) => {
  let key = product.id;
  if (variation) key += `-${variation.id}`;
  if (secondFlavor) key += `-${secondFlavor.id}`;
  return key;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (product: Product, quantity = 1, notes?: string, variation?: ProductVariation, secondFlavor?: Product) => {
    setItems((prev) => {
      const key = generateCartItemKey(product, variation, secondFlavor);
      const existing = prev.find((item) => 
        generateCartItemKey(item.product, item.variation, item.secondFlavor) === key
      );
      
      if (existing) {
        return prev.map((item) =>
          generateCartItemKey(item.product, item.variation, item.secondFlavor) === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, notes, variation, secondFlavor }];
    });
  };

  const removeItem = (cartItemKey: string) => {
    setItems((prev) => prev.filter((item) => 
      generateCartItemKey(item.product, item.variation, item.secondFlavor) !== cartItemKey
    ));
  };

  const updateQuantity = (cartItemKey: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(cartItemKey);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        generateCartItemKey(item.product, item.variation, item.secondFlavor) === cartItemKey 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => setItems([]);

  const getItemPrice = (item: CartItem) => {
    // If has variation, use variation price
    if (item.variation) {
      return item.variation.price;
    }
    // Otherwise use product price with promotion if applicable
    const product = item.product;
    if (product.promotion && product.promotion.is_active) {
      const discount = product.promotion.discount_percent / 100;
      return product.price * (1 - discount);
    }
    return product.price;
  };

  const total = items.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
