/**
 * ========================================
 * CONTEXTO: CartContext (Carrinho de Compras)
 * ========================================
 * 
 * Gerencia o estado global do carrinho de compras.
 * Permite adicionar, remover e atualizar itens de qualquer
 * componente da aplicação.
 * 
 * FUNCIONALIDADES:
 * - addItem: Adicionar produto ao carrinho
 * - removeItem: Remover produto do carrinho
 * - updateQuantity: Alterar quantidade de um item
 * - clearCart: Limpar todo o carrinho
 * - total: Valor total do carrinho
 * - itemCount: Quantidade total de itens
 * 
 * COMO USAR:
 * ```typescript
 * import { useCart } from '@/contexts/CartContext';
 * 
 * function MeuComponente() {
 *   const { items, addItem, total } = useCart();
 *   // ...
 * }
 * ```
 * 
 * ========================================
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, Product, ProductVariation } from '@/types';

// Tipos do contexto
interface CartContextType {
  items: CartItem[];                    // Lista de itens no carrinho
  addItem: (product: Product, quantity?: number, notes?: string, variation?: ProductVariation, secondFlavor?: Product) => void;
  removeItem: (cartItemKey: string) => void;
  updateQuantity: (cartItemKey: string, quantity: number) => void;
  clearCart: () => void;
  total: number;                        // Valor total
  itemCount: number;                    // Quantidade de itens
}

// Contexto React
const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Gera uma chave única para cada item do carrinho
 * Considera: produto + variação + segundo sabor
 */
export const generateCartItemKey = (product: Product, variation?: ProductVariation, secondFlavor?: Product) => {
  let key = product.id;
  if (variation) key += `-${variation.id}`;
  if (secondFlavor) key += `-${secondFlavor.id}`;
  return key;
};

/**
 * Provider do Carrinho
 * Envolve a aplicação e fornece o estado do carrinho
 */
export function CartProvider({ children }: { children: ReactNode }) {
  // Estado local: lista de itens
  const [items, setItems] = useState<CartItem[]>([]);

  /**
   * Adiciona um produto ao carrinho
   * Se já existir, incrementa a quantidade
   */
  const addItem = (product: Product, quantity = 1, notes?: string, variation?: ProductVariation, secondFlavor?: Product) => {
    setItems((prev) => {
      const key = generateCartItemKey(product, variation, secondFlavor);
      const existing = prev.find((item) => 
        generateCartItemKey(item.product, item.variation, item.secondFlavor) === key
      );
      
      // Se já existe, incrementa quantidade
      if (existing) {
        return prev.map((item) =>
          generateCartItemKey(item.product, item.variation, item.secondFlavor) === key
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      // Senão, adiciona novo item
      return [...prev, { product, quantity, notes, variation, secondFlavor }];
    });
  };

  /**
   * Remove um item do carrinho pela chave
   */
  const removeItem = (cartItemKey: string) => {
    setItems((prev) => prev.filter((item) => 
      generateCartItemKey(item.product, item.variation, item.secondFlavor) !== cartItemKey
    ));
  };

  /**
   * Atualiza a quantidade de um item
   * Se quantidade <= 0, remove o item
   */
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

  /**
   * Limpa todos os itens do carrinho
   */
  const clearCart = () => setItems([]);

  /**
   * Calcula o preço de um item considerando:
   * - Variação (se tiver)
   * - Promoção (se tiver)
   */
  const getItemPrice = (item: CartItem) => {
    // Se tem variação, usa preço da variação
    if (item.variation) {
      return item.variation.price;
    }
    
    // Senão, usa preço do produto (com desconto se houver promoção)
    const product = item.product;
    if (product.promotion && product.promotion.is_active) {
      const discount = product.promotion.discount_percent / 100;
      return product.price * (1 - discount);
    }
    return product.price;
  };

  // Calcula o total do carrinho
  const total = items.reduce(
    (sum, item) => sum + getItemPrice(item) * item.quantity,
    0
  );

  // Calcula a quantidade total de itens
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

/**
 * Hook para usar o carrinho
 * Deve ser usado dentro de um CartProvider
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context;
}
