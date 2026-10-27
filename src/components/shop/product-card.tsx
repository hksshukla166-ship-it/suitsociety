"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingBag } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, calculateDiscountPercentage } from "@/lib/utils";
import { getPrimaryImageUrl } from "@/lib/product-images";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/context/WishlistContext";
import { cn } from "@/lib/utils";
import { sortSizes } from "@/lib/product-utils";
import { getSizeStock, isSizeInStock } from "@/lib/inventory";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  showBadge?: "new" | "sale" | "flash" | "trending" | null;
}

export function ProductCard({ product, showBadge }: ProductCardProps) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const image = getPrimaryImageUrl(product.images);
  const mrp = product.compare_at_price ?? product.price;
  const sellingPrice = product.effective_price ?? product.price;
  const hasDiscount = mrp > sellingPrice;
  const discountPct = hasDiscount
    ? product.discount_percentage || calculateDiscountPercentage(mrp, sellingPrice)
    : 0;

  const defaultSize = sortSizes(product.sizes).find((s) => isSizeInStock(product, s));
  const defaultStock = defaultSize ? getSizeStock(product, defaultSize) : product.stock;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (defaultStock <= 0) {
      toast.error("Out of stock");
      return;
    }
    const added = addItem({
      productId: product.id,
      name: product.name,
      image,
      price: sellingPrice,
      compareAtPrice: hasDiscount ? mrp : undefined,
      color: product.colors[0],
      size: defaultSize,
      quantity: 1,
      stock: defaultStock,
    });
    if (!added) {
      toast.error("Unable to add — stock limit reached");
      return;
    }
    toast.success("Added to cart");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted mb-3">
          <Image
            src={image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

          {showBadge === "new" && <Badge variant="new" className="absolute top-3 left-3">NEW</Badge>}
          {showBadge === "flash" && <Badge variant="flash" className="absolute top-3 left-3">FLASH SALE</Badge>}
          {showBadge === "trending" && <Badge className="absolute top-3 left-3">TRENDING</Badge>}
          {hasDiscount && (
            <Badge variant="sale" className="absolute top-3 right-3">{discountPct}% OFF</Badge>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button variant="luxury" size="sm" className="w-full" onClick={handleAddToCart}>
              <ShoppingBag className="w-4 h-4 mr-1" /> Add to Cart
            </Button>
          </div>

          <button
            className={cn(
              "absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white",
              isInWishlist(product.id) && "opacity-100 bg-red-50 text-red-500"
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const wasInWishlist = isInWishlist(product.id);
              toggleWishlist(product.id);
              toast.success(wasInWishlist ? "Removed from wishlist" : "Added to wishlist");
            }}
            aria-label="Toggle wishlist"
          >
            <Heart className={cn("w-4 h-4", isInWishlist(product.id) && "fill-current")} />
          </button>
        </div>

        <div className="space-y-1">
          {product.brand && (
            <p className="text-xs text-muted-foreground tracking-wider uppercase">{product.brand.name}</p>
          )}
          <h3 className="text-sm font-medium line-clamp-2 group-hover:text-gold transition-colors">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{formatPrice(sellingPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-sm text-muted-foreground line-through">{formatPrice(mrp)}</span>
                <span className="text-xs font-medium text-emerald-600">{discountPct}% OFF</span>
              </>
            )}
          </div>
          {product.rating_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="text-gold">★</span> {product.rating_avg.toFixed(1)} ({product.rating_count})
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
