"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { CartItem } from "@/types";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => boolean;
  removeItem: (productId: string, color?: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, color?: string, size?: string) => boolean;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ss_cart");
    if (saved) {
      try { setItems(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ss_cart", JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: CartItem): boolean => {
    let added = false;
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === item.productId && i.color === item.color && i.size === item.size
      );
      if (idx >= 0) {
        const nextQty = prev[idx].quantity + item.quantity;
        if (nextQty > item.stock) return prev;
        const updated = [...prev];
        updated[idx].quantity = nextQty;
        added = true;
        return updated;
      }
      if (item.quantity > item.stock || item.stock <= 0) return prev;
      added = true;
      return [...prev, item];
    });
    return added;
  }, []);

  const removeItem = useCallback((productId: string, color?: string, size?: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.color === color && i.size === size))
    );
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, color?: string, size?: string): boolean => {
    let updatedOk = false;
    setItems((prev) =>
      prev.map((i) => {
        if (i.productId !== productId || i.color !== color || i.size !== size) return i;
        const nextQty = Math.max(1, Math.min(quantity, i.stock));
        updatedOk = nextQty === quantity || quantity <= i.stock;
        return { ...i, quantity: nextQty };
      })
    );
    return updatedOk;
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
