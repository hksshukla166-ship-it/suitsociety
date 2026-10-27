"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  Star,
  Truck,
  Shield,
  RotateCcw,
  ZoomIn,
} from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "@/components/product/ProductCard";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice, cn } from "@/lib/utils";
import { getPrimaryImageUrl } from "@/lib/product-images";
import type { Product } from "@/types";

interface ProductDetailProps {
  product: Product & { effective_price: number; discount_percentage: number };
  relatedProducts: Product[];
}

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "");
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const images = product.images || [];
  const price = product.effective_price;
  const comparePrice = product.compare_at_price ?? product.price;
  const hasDiscount = price < comparePrice;
  const avgRating =
    product.reviews?.length
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0;

  const handleAddToCart = () => {
    if (product.stock <= 0) {
      toast.error("Product is out of stock");
      return;
    }
    const primaryImage = getPrimaryImageUrl(images, "");
    addItem({
      productId: product.id,
      name: product.name,
      image: primaryImage,
      price,
      compareAtPrice: comparePrice,
      color: selectedColor,
      size: selectedSize,
      quantity,
      stock: product.stock,
    });
    toast.success("Added to cart");
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-cream mb-4 group">
            {images.length > 0 ? (
              <>
                <Image
                  src={images[selectedImage]?.url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  priority
                />
                <button
                  onClick={() => setZoomOpen(true)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Zoom image"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">No image</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative w-20 h-24 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors",
                    i === selectedImage ? "border-gold" : "border-transparent"
                  )}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.brand && (
            <p className="text-gold tracking-wider uppercase text-sm mb-2">{product.brand.name}</p>
          )}
          <h1 className="font-serif text-3xl md:text-4xl mb-4">{product.name}</h1>

          {avgRating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("w-4 h-4", i < Math.round(avgRating) ? "fill-gold text-gold" : "text-gray-300")}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">({product.reviews?.length} reviews)</span>
            </div>
          )}

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-medium">{formatPrice(price)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.compare_at_price ?? product.price)}</span>
                <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-medium rounded">
                  {product.discount_percentage}% OFF
                </span>
              </>
            )}
          </div>

          {product.fabric && (
            <p className="text-sm text-gray-600 mb-4">
              Fabric: <span className="font-medium">{product.fabric.name}</span>
            </p>
          )}

          <p className={cn("text-sm mb-6", product.stock > 0 ? "text-green-600" : "text-red-600")}>
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {product.colors?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Color: {selectedColor}</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "px-4 py-2 border rounded-lg text-sm transition-colors",
                      selectedColor === color ? "border-gold bg-gold/10" : "border-black/10 hover:border-gold/50"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Size: {selectedSize}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "w-12 h-12 border rounded-lg text-sm transition-colors",
                      selectedSize === size ? "border-gold bg-gold/10" : "border-black/10 hover:border-gold/50"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-black/10 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-cream transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-3 hover:bg-cream transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-charcoal text-white font-medium tracking-wider hover:bg-charcoal/90 transition-colors disabled:opacity-50 rounded-lg"
            >
              <ShoppingBag className="w-5 h-5" /> Add to Cart
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              className={cn(
                "w-14 h-14 border rounded-lg flex items-center justify-center transition-colors",
                isInWishlist(product.id) ? "border-red-500 text-red-500 bg-red-50" : "border-black/10 hover:border-gold"
              )}
              aria-label="Add to wishlist"
            >
              <Heart className={cn("w-5 h-5", isInWishlist(product.id) && "fill-current")} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 py-6 border-t border-b border-black/5 mb-8">
            {[
              { icon: Truck, text: "Free Shipping" },
              { icon: Shield, text: "Secure Payment" },
              { icon: RotateCcw, text: "Easy Returns" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="text-center">
                <Icon className="w-5 h-5 mx-auto mb-1 text-gold" />
                <p className="text-xs text-gray-600">{text}</p>
              </div>
            ))}
          </div>

          {product.description && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
            </div>
          )}

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Specifications</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(product.specifications)
                  .filter(([key]) => !["cost_price", "discount_percent"].includes(key.toLowerCase().replace(/\s+/g, "_")))
                  .map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-black/5">
                    <dt className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {product.reviews && product.reviews.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl mb-6">Customer Reviews</h2>
          <div className="space-y-4">
            {product.reviews.map((review) => (
              <div key={review.id} className="p-4 border border-black/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-gold text-gold" : "text-gray-300")} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{review.user?.full_name || "Customer"}</span>
                </div>
                {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
                {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="font-serif text-2xl mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.slice(0, 4).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {zoomOpen && images[selectedImage] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setZoomOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
            <Image src={images[selectedImage].url} alt={product.name} fill className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
