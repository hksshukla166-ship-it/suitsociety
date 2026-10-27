"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { formatPrice, calculateDiscountPercentage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";
import { useWishlist } from "@/context/WishlistContext";
import { formatProductDescription, sortSizes } from "@/lib/product-utils";
import { getPrimaryImageUrl } from "@/lib/product-images";
import { getSizeStock, isSizeInStock, parseSizeStock } from "@/lib/inventory";
import { DEFAULT_PRODUCT_NOTICE } from "@/lib/product-notice";
import { cn } from "@/lib/utils";
import { Heart, ShoppingBag, Minus, Plus, ZoomIn, Star, Truck, Shield, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

const HIDDEN_SPEC_KEYS = new Set(["cost_price", "discount_percent", "cost price", "discount percent"]);

function getVisibleSpecifications(specifications: Record<string, unknown>) {
  return Object.entries(specifications).filter(([key]) => {
    const normalized = key.toLowerCase().replace(/\s+/g, "_");
    return !HIDDEN_SPEC_KEYS.has(key.toLowerCase()) && !HIDDEN_SPEC_KEYS.has(normalized);
  });
}

interface Props {
  product: Product;
}

export function ProductDetail({ product }: Props) {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const sortedSizes = sortSizes(product.sizes);
  const sizeStock = parseSizeStock(product.size_stock);
  const hasSizeStock = Object.keys(sizeStock).length > 0;

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || "");
  const [selectedSize, setSelectedSize] = useState(
    sortedSizes.find((s) => isSizeInStock(product, s)) || sortedSizes[0] || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [zoomed, setZoomed] = useState(false);

  const images = useMemo(
    () =>
      [...(product.images || [])].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      ),
    [product.images]
  );
  const displayImages = images.length > 0 ? images : [];

  const mrp = product.compare_at_price ?? product.price;
  const sellingPrice = product.effective_price ?? product.price;
  const hasDiscount = mrp > sellingPrice;
  const discountPct = hasDiscount
    ? product.discount_percentage || calculateDiscountPercentage(mrp, sellingPrice)
    : 0;
  const visibleSpecs = product.specifications
    ? getVisibleSpecifications(product.specifications as Record<string, unknown>)
    : [];

  const selectedSizeStock = getSizeStock(product, selectedSize || undefined);
  const inStock = selectedSize ? selectedSizeStock > 0 : (product.stock > 0 || getSizeStock(product) > 0);

  useEffect(() => {
    setQuantity(1);
  }, [selectedSize]);

  useEffect(() => {
    if (quantity > selectedSizeStock && selectedSizeStock > 0) {
      setQuantity(selectedSizeStock);
    }
  }, [selectedSizeStock, quantity]);

  const handleAddToCart = () => {
    if (!selectedSize && sortedSizes.length > 0) {
      toast.error("Please select a size");
      return;
    }
    if (!inStock) {
      toast.error("Out of stock for selected size");
      return;
    }
    const added = addItem({
      productId: product.id,
      name: product.name,
      image: getPrimaryImageUrl(displayImages, ""),
      price: sellingPrice,
      compareAtPrice: hasDiscount ? mrp : undefined,
      color: selectedColor,
      size: selectedSize,
      quantity,
      stock: selectedSizeStock,
    });
    if (!added) {
      toast.error(`Only ${selectedSizeStock} available in size ${selectedSize}`);
      return;
    }
    toast.success("Added to cart");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-4">
          <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted cursor-zoom-in" onClick={() => setZoomed(!zoomed)}>
            {displayImages.length > 0 ? (
              <Image src={displayImages[selectedImage]?.url} alt={product.name} fill
                className={`object-cover transition-transform duration-300 ${zoomed ? "scale-150" : ""}`} priority />
            ) : (
              <div className="absolute inset-0 luxury-gradient flex items-center justify-center text-muted-foreground">No Image</div>
            )}
            <button className="absolute top-4 right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center">
              <ZoomIn className="w-5 h-5" />
            </button>
            {hasDiscount && <Badge variant="sale" className="absolute top-4 left-4 text-sm">{discountPct}% OFF</Badge>}
          </div>
          {displayImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {displayImages.map((img, i) => (
                <button key={img.id} onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-24 rounded-md overflow-hidden shrink-0 border-2 transition-colors ${
                    i === selectedImage ? "border-gold" : "border-transparent"
                  }`}>
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
          {product.videos && product.videos.length > 0 && (
            <div className="space-y-2">
              {product.videos.map((v) => (
                <video key={v.id} src={v.url} controls className="w-full rounded-lg" poster="" />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {product.brand && <p className="text-sm text-muted-foreground tracking-widest uppercase">{product.brand.name}</p>}
          <h1 className="font-serif text-3xl md:text-4xl tracking-wide">{product.name}</h1>

          {product.rating_count > 0 && (
            <a href="#reviews" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(product.rating_avg) ? "fill-gold text-gold" : "text-muted"}`} />
              ))}</div>
              <span className="text-sm text-muted-foreground">({product.rating_count} reviews)</span>
            </a>
          )}

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-3xl font-semibold">{formatPrice(sellingPrice)}</span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through">{formatPrice(mrp)}</span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded">
                  {discountPct}% OFF
                </span>
              </>
            )}
          </div>

          {product.fabric && (
            <p className="text-sm"><span className="text-muted-foreground">Fabric:</span> {product.fabric.name}</p>
          )}

          {selectedSize && (
            <p className={`text-sm font-medium ${inStock ? "text-emerald-600" : "text-red-500"}`}>
              {inStock
                ? hasSizeStock
                  ? `${selectedSizeStock} available in size ${selectedSize}`
                  : "In Stock"
                : "Out of Stock"}
            </p>
          )}

          {product.colors.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Color: {selectedColor}</p>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((c) => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2 text-sm border rounded-md transition-colors ${
                      selectedColor === c ? "border-gold bg-gold/10" : "hover:border-gold/50"
                    }`}>{c}</button>
                ))}
              </div>
            </div>
          )}

          {sortedSizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Size: {selectedSize || "Select size"}</p>
                <Link href="/size-chart" className="text-xs text-gold hover:underline">Size Chart</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {sortedSizes.map((s) => {
                  const sizeAvailable = isSizeInStock(product, s);
                  return (
                    <button
                      key={s}
                      onClick={() => sizeAvailable && setSelectedSize(s)}
                      disabled={!sizeAvailable}
                      className={cn(
                        "min-w-[3rem] h-12 px-2 text-sm border rounded-md transition-colors",
                        !sizeAvailable && "opacity-40 cursor-not-allowed line-through",
                        selectedSize === s && sizeAvailable ? "border-gold bg-gold/10" : "hover:border-gold/50"
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-md">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-muted">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedSizeStock || product.stock, quantity + 1))}
                disabled={!inStock || quantity >= selectedSizeStock}
                className="w-10 h-10 flex items-center justify-center hover:bg-muted disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="luxury" size="lg" className="flex-1" onClick={handleAddToCart} disabled={!inStock}>
              <ShoppingBag className="w-5 h-5 mr-2" /> Add to Cart
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const wasInWishlist = isInWishlist(product.id);
                toggleWishlist(product.id);
                toast.success(wasInWishlist ? "Removed from wishlist" : "Added to wishlist");
              }}
              className={cn(isInWishlist(product.id) && "border-red-500 text-red-500")}
            >
              <Heart className={cn("w-5 h-5", isInWishlist(product.id) && "fill-current")} />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center"><Truck className="w-5 h-5 mx-auto mb-1 text-gold" /><p className="text-xs">Free Delivery</p></div>
            <div className="text-center"><Shield className="w-5 h-5 mx-auto mb-1 text-gold" /><p className="text-xs">Secure Payment</p></div>
            <div className="text-center"><RotateCcw className="w-5 h-5 mx-auto mb-1 text-gold" /><p className="text-xs">Same-Day Shipping</p></div>
          </div>

          {product.description && (
            <div className="pt-4 border-t">
              <h3 className="font-serif text-lg mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {formatProductDescription(product.description)}
              </p>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{DEFAULT_PRODUCT_NOTICE}</p>
            </div>
          </div>

          {visibleSpecs.length > 0 && (
            <div className="pt-4 border-t">
              <h3 className="font-serif text-lg mb-2">Specifications</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {visibleSpecs.map(([key, val]) => (
                  <div key={key}><dt className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</dt><dd className="font-medium">{String(val)}</dd></div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
