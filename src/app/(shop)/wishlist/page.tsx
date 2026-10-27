"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Loader2 } from "lucide-react";
import { ProductCard } from "@/components/shop/product-card";
import { useWishlist } from "@/context/WishlistContext";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { items } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!items.length) {
      setProducts([]);
      setLoading(false);
      return;
    }

    fetch(`/api/products/by-ids?ids=${items.join(",")}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [items]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl md:text-4xl tracking-wider mb-8 flex items-center gap-3">
        <Heart className="w-8 h-8 text-gold" /> My Wishlist
      </h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : !items.length ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
          <Link href="/products">
            <Button variant="luxury">Browse Collection</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
