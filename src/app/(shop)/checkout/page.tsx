"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrder, validateCoupon } from "@/actions/orders";
import { toast } from "sonner";
import { Loader2, CreditCard } from "lucide-react";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface LoggedInUser {
  id: string;
  phone: string;
  full_name?: string;
  name?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [form, setForm] = useState({
    name: "", phone: "", address: "", city: "", state: "", pincode: "",
  });

  const finalTotal = total - couponDiscount;

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
      return;
    }

    fetch("/api/user")
      .then(async (res) => {
        if (!res.ok) {
          router.push("/account?redirect=/checkout");
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setForm((prev) => ({
          ...prev,
          name: data.user.full_name || data.user.name || prev.name,
          phone: data.user.phone || prev.phone,
        }));
      })
      .catch(() => router.push("/account?redirect=/checkout"))
      .finally(() => setAuthLoading(false));
  }, [items.length, router]);

  const applyCoupon = async () => {
    const result = await validateCoupon(couponCode, total, items.map((i) => i.productId));
    if (result.valid && result.discount !== undefined) {
      setCouponDiscount(result.discount);
      toast.success(`Coupon applied! Saved ${formatPrice(result.discount)}`);
    } else {
      toast.error(result.error);
    }
  };

  const razorpayConfigured = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to place an order");
      router.push("/account?redirect=/checkout");
      return;
    }
    if (!razorpayConfigured) {
      toast.error("Razorpay is not configured yet. Add payment keys in Settings.");
      return;
    }
    setLoading(true);

    try {
      const orderResult = await createOrder({
        items,
        shippingName: form.name,
        shippingPhone: form.phone,
        shippingAddress: form.address,
        shippingCity: form.city,
        shippingState: form.state,
        shippingPincode: form.pincode,
        couponCode: couponDiscount > 0 ? couponCode : undefined,
      });

      if (orderResult.error) throw new Error(orderResult.error);

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(finalTotal * 100),
          currency: "INR",
          name: "Suit Society",
          description: `Order ${orderResult.orderNumber}`,
          order_id: orderResult.razorpayOrderId,
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: orderResult.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              clearCart();
              router.push(`/order-confirmation?order=${verifyData.orderNumber}`);
            } else {
              toast.error("Payment verification failed");
            }
          },
          prefill: { name: form.name, contact: form.phone },
          theme: { color: "#C9A962" },
        });
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || items.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="font-serif text-3xl tracking-wider mb-8">CHECKOUT</h1>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="font-serif text-xl">Shipping Details</h2>
          <p className="text-sm text-muted-foreground">
            Ordering as <strong>{user.phone}</strong>
          </p>
          {[
            { key: "name", label: "Full Name", placeholder: "John Doe" },
            { key: "phone", label: "Phone", placeholder: "9876543210", readOnly: true },
            { key: "address", label: "Address", placeholder: "Street address" },
            { key: "city", label: "City", placeholder: "Raigarh" },
            { key: "state", label: "State", placeholder: "Chhattisgarh" },
            { key: "pincode", label: "Pincode", placeholder: "496001" },
          ].map((field) => (
            <div key={field.key}>
              <Label>{field.label}</Label>
              <Input
                required
                readOnly={field.readOnly}
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                className={field.readOnly ? "bg-muted" : undefined}
              />
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            <h2 className="font-serif text-xl">Order Summary</h2>
            {items.map((item) => (
              <div key={`${item.productId}-${item.color}`} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(total)}</span></div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-emerald-600"><span>Coupon Discount</span><span>-{formatPrice(couponDiscount)}</span></div>
              )}
              <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{formatPrice(finalTotal)}</span></div>
            </div>
          </div>

          <div className="flex gap-2">
            <Input placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <Button type="button" variant="outline" onClick={applyCoupon}>Apply</Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <div className="flex items-center gap-2 mb-2"><CreditCard className="w-4 h-4" /><span className="font-medium">Payment Method</span></div>
            <p className="text-muted-foreground">Razorpay (Cards, UPI, Net Banking, Wallets)</p>
            {!razorpayConfigured && (
              <p className="text-amber-600 text-xs mt-2">Payment gateway not configured yet — checkout will be enabled after Razorpay keys are added.</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Cash on Delivery is not available</p>
          </div>

          <Button type="submit" variant="gold" size="lg" className="w-full" disabled={loading || !razorpayConfigured}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : razorpayConfigured ? `Pay ${formatPrice(finalTotal)}` : "Payments Coming Soon"}
          </Button>
        </div>
      </form>
    </div>
  );
}
