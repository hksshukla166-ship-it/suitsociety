"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/types";
import { formatPrice, cn } from "@/lib/utils";
import { getPrimaryImageUrl } from "@/lib/product-images";
import { useWishlist } from "@/context/WishlistContext";

interface ProductCardProps {
  product: Product;
  index?: number;
  showFlashBadge?: boolean;
}

export function ProductCard({ product, index = 0, showFlashBadge = false }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const primaryImage = getPrimaryImageUrl(product.images);

  const price = product.effective_price ?? product.price;
  const comparePrice = product.compare_at_price ?? product.price;
  const hasDiscount = price < comparePrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="product-card group"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-cream mb-3">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="product-image object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />

          {hasDiscount && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-red-600 text-white text-xs font-medium rounded">
              {product.discount_percentage}% OFF
            </span>
          )}

          {(showFlashBadge || product.flash_sale) && (
            <span className="absolute top-3 right-3 px-2 py-1 bg-gold text-charcoal text-xs font-bold rounded animate-pulse">
              FLASH SALE
            </span>
          )}

          {product.is_new_arrival && !showFlashBadge && !product.flash_sale && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-charcoal text-white text-xs tracking-wider rounded">
              NEW
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            className={cn(
              "absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100",
              isInWishlist(product.id)
                ? "bg-red-500 text-white"
                : "bg-white/90 text-charcoal hover:bg-white"
            )}
            aria-label="Add to wishlist"
          >
            <Heart className={cn("w-4 h-4", isInWishlist(product.id) && "fill-current")} />
          </button>
        </div>

        <div className="space-y-1">
          {product.brand && (
            <p className="text-xs text-gold tracking-wider uppercase">{product.brand.name}</p>
          )}
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-gold transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-medium">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(comparePrice)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4] skeleton rounded-lg" />
          <div className="h-3 skeleton rounded w-1/3" />
          <div className="h-4 skeleton rounded w-2/3" />
          <div className="h-4 skeleton rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function CountdownTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(endDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (timeLeft.expired) return <span className="text-red-500 font-medium">Sale Ended</span>;

  return (
    <div className="flex gap-2 text-center">
      {[
        { value: timeLeft.days, label: "Days" },
        { value: timeLeft.hours, label: "Hrs" },
        { value: timeLeft.minutes, label: "Min" },
        { value: timeLeft.seconds, label: "Sec" },
      ].map(({ value, label }) => (
        <div key={label} className="bg-charcoal text-white px-3 py-2 rounded min-w-[50px]">
          <div className="text-lg font-bold">{String(value).padStart(2, "0")}</div>
          <div className="text-[10px] uppercase tracking-wider opacity-60">{label}</div>
        </div>
      ))}
    </div>
  );
}

function getTimeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    expired: false,
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}
