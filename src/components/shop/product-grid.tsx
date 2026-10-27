"use client";

import Link from "next/link";
import { Product } from "@/types";
import { ProductCard } from "./product-card";

interface Props {
  products: Product[];
  total: number;
  currentPage: number;
}

export function ProductGrid({ products, total, currentPage }: Props) {
  const totalPages = Math.ceil(total / 12);

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">No products found</p>
        <Link href="/products" className="text-gold hover:underline mt-2 inline-block">Browse all products</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Link
              key={page}
              href={`?page=${page}`}
              className={`w-10 h-10 flex items-center justify-center rounded text-sm transition-colors ${
                page === currentPage ? "bg-luxury-black text-white" : "hover:bg-muted"
              }`}
            >
              {page}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
