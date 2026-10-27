"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product, FlashSale } from "@/types";

interface FlashSaleWithProducts extends FlashSale {
  products: Product[];
}

function Countdown({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0 });
        return;
      }
      setTimeLeft({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex gap-2 text-sm font-mono">
      {[timeLeft.h, timeLeft.m, timeLeft.s].map((v, i) => (
        <span key={i} className="px-3 py-1.5 bg-charcoal text-white rounded-lg">
          {pad(v)}
        </span>
      ))}
    </div>
  );
}

export function FlashSalePage({ flashSales }: { flashSales: FlashSaleWithProducts[] }) {
  if (!flashSales.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <Zap className="w-16 h-16 mx-auto text-gray-200 mb-4" />
        <h1 className="font-serif text-3xl mb-2">Flash Sale</h1>
        <p className="text-gray-500 mb-6">No active flash sales right now. Check back soon!</p>
        <Link href="/shop" className="text-gold hover:underline">Browse All Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 text-red-600 rounded-full text-sm font-medium mb-4">
          <Zap className="w-4 h-4" /> Limited Time Offers
        </div>
        <h1 className="font-serif text-4xl md:text-5xl mb-2">Flash Sale</h1>
        <p className="text-gray-500">Exclusive deals — hurry before they&apos;re gone</p>
      </div>

      {flashSales.map((sale) => (
        <section key={sale.id} className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 p-6 bg-gradient-to-r from-charcoal to-charcoal/90 text-white rounded-2xl">
            <div>
              <h2 className="font-serif text-2xl">{sale.title}</h2>
              <p className="text-white/60 text-sm mt-1">Ends in</p>
            </div>
            <Countdown endDate={sale.ends_at} />
          </div>

          {sale.banner_url && (
            <div className="mb-8 rounded-2xl overflow-hidden aspect-[21/6] relative bg-cream">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={sale.banner_url} alt={sale.title} className="w-full h-full object-cover" />
            </div>
          )}

          {sale.products?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sale.products.map((product) => (
                <ProductCard key={product.id} product={product} showFlashBadge />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No products in this sale yet</p>
          )}
        </section>
      ))}
    </div>
  );
}
