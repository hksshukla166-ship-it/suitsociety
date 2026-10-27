"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";

interface WishlistContextType {
  items: string[];
  isLoading: boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const WISHLIST_KEY = "suit-society-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggedInRef = useRef(false);
  const hasMergedRef = useRef(false);

  const persistGuest = useCallback((next: string[]) => {
    if (!isLoggedInRef.current) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    }
  }, []);

  const syncFromServer = useCallback(async (guestIds: string[] = []) => {
    try {
      const res = await fetch("/api/user/wishlist");
      if (!res.ok) {
        isLoggedInRef.current = false;
        return null;
      }

      isLoggedInRef.current = true;

      if (!hasMergedRef.current && guestIds.length) {
        hasMergedRef.current = true;
        const mergeRes = await fetch("/api/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "merge", productIds: guestIds }),
        });
        if (mergeRes.ok) {
          const data = await mergeRes.json();
          localStorage.removeItem(WISHLIST_KEY);
          return data.productIds as string[];
        }
      }

      const data = await res.json();
      return data.productIds as string[];
    } catch {
      isLoggedInRef.current = false;
      return null;
    }
  }, []);

  const refreshWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      let guestIds: string[] = [];
      try {
        const saved = localStorage.getItem(WISHLIST_KEY);
        if (saved) guestIds = JSON.parse(saved);
      } catch {}

      const serverIds = await syncFromServer(guestIds);
      if (serverIds) {
        setItems(serverIds);
        return;
      }

      isLoggedInRef.current = false;
      hasMergedRef.current = false;

      setItems((prev) => {
        const next = guestIds.length ? guestIds : prev;
        if (next.length) {
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
        }
        return next;
      });
    } finally {
      setIsLoading(false);
    }
  }, [syncFromServer]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const syncToggle = useCallback(async (productId: string, adding: boolean) => {
    if (!isLoggedInRef.current) return;
    try {
      await fetch("/api/user/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: adding ? "add" : "remove" }),
      });
    } catch {}
  }, []);

  const addToWishlist = useCallback(
    (productId: string) => {
      setItems((prev) => {
        if (prev.includes(productId)) return prev;
        const next = [...prev, productId];
        persistGuest(next);
        syncToggle(productId, true);
        return next;
      });
    },
    [persistGuest, syncToggle]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const next = prev.filter((id) => id !== productId);
        persistGuest(next);
        syncToggle(productId, false);
        return next;
      });
    },
    [persistGuest, syncToggle]
  );

  const isInWishlist = useCallback(
    (productId: string) => items.includes(productId),
    [items]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      setItems((prev) => {
        const exists = prev.includes(productId);
        const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
        persistGuest(next);
        syncToggle(productId, !exists);
        return next;
      });
    },
    [persistGuest, syncToggle]
  );

  return (
    <WishlistContext.Provider
      value={{
        items,
        isLoading,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within WishlistProvider");
  return context;
}
