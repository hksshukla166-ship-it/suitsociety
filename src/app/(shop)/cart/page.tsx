"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, itemCount } = useCart();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  const handleCheckout = () => {
    if (!isLoggedIn) {
      toast.error("Please login to place an order");
      router.push("/account?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="font-serif text-2xl mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Discover our premium collection</p>
        <Link href="/products"><Button variant="luxury">Continue Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-serif text-3xl tracking-wider mb-8">SHOPPING CART ({itemCount})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={`${item.productId}-${item.color}-${item.size}`}
              className="flex gap-4 p-4 border rounded-lg">
              <div className="relative w-24 h-32 rounded-md overflow-hidden bg-muted shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-medium">{item.name}</h3>
                {item.color && <p className="text-sm text-muted-foreground">Color: {item.color}</p>}
                {item.size && <p className="text-sm text-muted-foreground">Size: {item.size}</p>}
                <p className="font-semibold">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border rounded-md">
                    <button onClick={() => {
                      const ok = updateQuantity(item.productId, item.quantity - 1, item.color, item.size);
                      if (!ok && item.quantity > 1) toast.error("Unable to update quantity");
                    }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted"><Minus className="w-3 h-3" /></button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => {
                      if (item.quantity >= item.stock) {
                        toast.error(`Only ${item.stock} available for size ${item.size || "this item"}`);
                        return;
                      }
                      const ok = updateQuantity(item.productId, item.quantity + 1, item.color, item.size);
                      if (!ok) toast.error(`Only ${item.stock} available for size ${item.size || "this item"}`);
                    }}
                      className="w-8 h-8 flex items-center justify-center hover:bg-muted"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button onClick={() => removeItem(item.productId, item.color, item.size)}
                    className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-24 h-fit">
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="font-serif text-xl">Order Summary</h2>
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping</span><span className="text-emerald-600">FREE</span></div>
            <div className="border-t pt-4 flex justify-between font-semibold text-lg">
              <span>Total</span><span>{formatPrice(total)}</span>
            </div>
            <Button variant="luxury" size="lg" className="w-full" onClick={handleCheckout}>
              Proceed to Checkout <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            {!isLoggedIn && (
              <p className="text-xs text-muted-foreground text-center">
                <Link href="/account?redirect=/checkout" className="text-gold hover:underline">
                  Login with your phone
                </Link>{" "}
                to place an order
              </p>
            )}
            <p className="text-xs text-muted-foreground text-center">Secure payment via Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
