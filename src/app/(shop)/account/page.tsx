"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, MapPin, Package, Star } from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import { useWishlist } from "@/context/WishlistContext";

type Tab = "orders" | "addresses" | "reviews";

interface User {
  id: string;
  phone: string;
  name?: string;
  full_name?: string;
  email?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { refreshWishlist } = useWishlist();
  const [redirectTo, setRedirectTo] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [addresses, setAddresses] = useState<Record<string, unknown>[]>([]);
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);
  const [reviewForm, setReviewForm] = useState({
    product_id: "",
    product_name: "",
    rating: 5,
    title: "",
    comment: "",
  });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [loginStep, setLoginStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [fallbackOtp, setFallbackOtp] = useState("");

  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address_line: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
  });

  const loadUser = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      }
      setUser(null);
      return false;
    } catch {
      setUser(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (activeTab: Tab) => {
    const endpoints = {
      orders: "/api/user/orders",
      addresses: "/api/user/addresses",
      reviews: "/api/user/reviews",
    };
    const res = await fetch(endpoints[activeTab]);
    if (!res.ok) return;
    const data = await res.json();
    if (activeTab === "orders") setOrders(data.orders || []);
    if (activeTab === "addresses") setAddresses(data.addresses || []);
    if (activeTab === "reviews") setReviews(data.reviews || []);
  };

  useEffect(() => {
    loadUser();
    const params = new URLSearchParams(window.location.search);
    setRedirectTo(params.get("redirect") || "");
  }, []);

  useEffect(() => {
    if (user) loadTabData(tab);
  }, [user, tab]);

  const sendOtp = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send_otp" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.fallbackOtp) {
        setFallbackOtp(String(data.fallbackOtp));
        toast.message(data.message || "Your verification code is shown below");
      } else {
        setFallbackOtp("");
        toast.success(data.message || "OTP call initiated — answer your phone");
      }
      if (data.devOtp) toast.message(`Dev OTP: ${data.devOtp}`);
      setLoginStep("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setAuthLoading(false);
    }
  };

  const verifyOtp = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, name, action: "verify_otp" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
      await refreshWishlist();
      toast.success("Logged in successfully");
      if (redirectTo) router.push(redirectTo);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/otp", { method: "DELETE" });
    setUser(null);
    setOrders([]);
    setAddresses([]);
    setReviews([]);
    await refreshWishlist();
    toast.success("Logged out");
  };

  const saveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/user/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(addressForm),
    });
    if (res.ok) {
      toast.success("Address saved");
      setAddressForm({ name: "", phone: "", address_line: "", city: "", state: "", pincode: "", is_default: false });
      loadTabData("addresses");
    } else {
      toast.error("Failed to save address");
    }
  };

  const openReviewForm = (productId: string, productName: string) => {
    setReviewForm({ product_id: productId, product_name: productName, rating: 5, title: "", comment: "" });
    setTab("reviews");
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.product_id) {
      toast.error("Select a product to review");
      return;
    }
    if (!reviewForm.comment.trim()) {
      toast.error("Please write your review");
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/user/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: reviewForm.product_id,
          rating: reviewForm.rating,
          title: reviewForm.title,
          comment: reviewForm.comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Review submitted for admin approval");
      setReviewForm({ product_id: "", product_name: "", rating: 5, title: "", comment: "" });
      loadTabData("reviews");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <h1 className="font-serif text-3xl text-center mb-2">My Account</h1>
        <p className="text-muted-foreground text-center text-sm mb-8">
          Login with phone OTP — we&apos;ll call you, or show your code on screen
        </p>

        <div className="p-8 border rounded-2xl bg-white shadow-sm">
          {loginStep === "phone" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
              <button
                onClick={sendOtp}
                disabled={authLoading || phone.length < 10}
                className="w-full py-3 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light disabled:opacity-50"
              >
                {authLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send OTP"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {fallbackOtp && (
                <div className="rounded-xl border-2 border-gold bg-amber-50 px-4 py-4 text-center">
                  <p className="text-sm font-medium text-amber-900 mb-1">Your verification code</p>
                  <p className="text-3xl font-bold tracking-[0.35em] text-charcoal">{fallbackOtp}</p>
                  <p className="text-xs text-amber-800 mt-2">
                    Enter this code below. We also tried calling your phone.
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="6-digit OTP"
                  maxLength={6}
                  className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:border-gold tracking-widest text-center text-lg"
                />
              </div>
              <button
                onClick={verifyOtp}
                disabled={authLoading || otp.length !== 6}
                className="w-full py-3 bg-gold text-charcoal font-medium rounded-lg hover:bg-gold-light disabled:opacity-50"
              >
                {authLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Verify & Login"}
              </button>
              <button
                onClick={() => {
                  setLoginStep("phone");
                  setFallbackOtp("");
                  setOtp("");
                }}
                className="w-full text-sm text-muted-foreground hover:text-charcoal"
              >
                Change phone number
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="font-serif text-3xl">My Account</h1>
          <p className="text-muted-foreground mt-1">{user.full_name || user.name || user.phone}</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {([
          { id: "orders" as Tab, label: "Orders", icon: Package },
          { id: "addresses" as Tab, label: "Addresses", icon: MapPin },
          { id: "reviews" as Tab, label: "Reviews", icon: Star },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
              tab === id ? "border-gold text-charcoal" : "border-transparent text-muted-foreground"
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "orders" && (
        <div className="space-y-4">
          {!orders.length ? (
            <p className="text-muted-foreground text-center py-12">No orders yet</p>
          ) : (
            orders.map((order) => {
              const items = (order.order_items || order.items || []) as Array<{
                id?: string;
                product_id?: string;
                product_name?: string;
                size?: string;
                quantity?: number;
              }>;

              return (
                <div key={String(order.id)} className="p-6 border rounded-xl">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium">{String(order.order_number)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(String(order.created_at)).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(Number(order.total))}</p>
                      <p className="text-sm capitalize text-muted-foreground">{String(order.status)}</p>
                    </div>
                  </div>

                  {items.length > 0 && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex justify-between items-center text-sm gap-4"
                        >
                          <div>
                            <p className="font-medium">{item.product_name}</p>
                            {item.size && (
                              <p className="text-muted-foreground text-xs">Size: {item.size}</p>
                            )}
                          </div>
                          {item.product_id && (
                            <button
                              onClick={() => openReviewForm(item.product_id!, item.product_name || "Product")}
                              className="text-xs px-3 py-1.5 border rounded-lg hover:border-gold hover:text-gold shrink-0"
                            >
                              Write Review
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "addresses" && (
        <div className="space-y-6">
          <form onSubmit={saveAddress} className="p-6 border rounded-xl space-y-4">
            <h3 className="font-medium">Add New Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "name", label: "Name" },
                { key: "phone", label: "Phone" },
                { key: "address_line", label: "Address", full: true },
                { key: "city", label: "City" },
                { key: "state", label: "State" },
                { key: "pincode", label: "Pincode" },
              ].map(({ key, label, full }) => (
                <div key={key} className={full ? "md:col-span-2" : ""}>
                  <label className="block text-sm mb-1">{label}</label>
                  <input
                    required
                    value={String(addressForm[key as keyof typeof addressForm] ?? "")}
                    onChange={(e) => setAddressForm({ ...addressForm, [key]: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gold"
                  />
                </div>
              ))}
            </div>
            <button type="submit" className="px-6 py-2 bg-gold text-charcoal rounded-lg text-sm font-medium">
              Save Address
            </button>
          </form>

          {addresses.map((addr) => (
            <div key={String(addr.id)} className="p-4 border rounded-xl text-sm">
              <p className="font-medium">{String(addr.full_name || addr.name)} · {String(addr.phone)}</p>
              <p className="text-muted-foreground mt-1">
                {String(addr.address_line1 || addr.address_line)}, {String(addr.city)}, {String(addr.state)} - {String(addr.pincode)}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "reviews" && (
        <div className="space-y-6">
          <form onSubmit={submitReview} className="p-6 border rounded-xl space-y-4">
            <h3 className="font-medium">Write a Review</h3>
            {reviewForm.product_name && (
              <p className="text-sm text-muted-foreground">
                Reviewing: <span className="text-charcoal font-medium">{reviewForm.product_name}</span>
              </p>
            )}
            {!reviewForm.product_id && (
              <p className="text-sm text-muted-foreground">
                Go to your Orders tab and click &quot;Write Review&quot; on a product you purchased.
              </p>
            )}
            <div>
              <label className="block text-sm mb-2">Rating</label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => {
                  const value = i + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: value })}
                      className="text-xl"
                    >
                      <span className={value <= reviewForm.rating ? "text-gold" : "text-muted"}>★</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm mb-1">Title (optional)</label>
              <input
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gold"
                placeholder="Summarize your experience"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Your Review</label>
              <textarea
                required
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gold resize-none"
                placeholder="Share your experience with this product..."
              />
            </div>
            <button
              type="submit"
              disabled={reviewSubmitting || !reviewForm.product_id}
              className="px-6 py-2 bg-gold text-charcoal rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {reviewSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
            </button>
          </form>

          {!reviews.length ? (
            <p className="text-muted-foreground text-center py-8">No reviews submitted yet</p>
          ) : (
            reviews.map((review) => {
              const product = review.product as { name?: string } | undefined;
              return (
                <div key={String(review.id)} className="p-4 border rounded-xl">
                  <div className="flex justify-between">
                    <p className="font-medium">{product?.name}</p>
                    <span className="text-gold">{"★".repeat(Number(review.rating))}</span>
                  </div>
                  {!!review.title && <p className="text-sm mt-1">{String(review.title)}</p>}
                  {!!review.comment && (
                    <p className="text-sm text-muted-foreground mt-1">{String(review.comment)}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {review.is_approved ? "Approved" : "Pending approval"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
