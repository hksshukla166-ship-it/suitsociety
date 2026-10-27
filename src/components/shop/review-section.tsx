"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  created_at: string;
  user?: { full_name?: string | null };
}

interface Props {
  productId: string;
  productName: string;
  reviews: Review[];
  isLoggedIn: boolean;
}

export function ReviewSection({ productId, productName, reviews, isLoggedIn }: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to write a review");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please write your review");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/user/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, rating, title, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Review submitted! It will appear after admin approval.");
      setTitle("");
      setComment("");
      setRating(5);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="container mx-auto px-4 py-12 border-t">
      <h2 className="font-serif text-2xl tracking-wider mb-2">CUSTOMER REVIEWS</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Share your experience with {productName}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="p-6 border rounded-xl bg-white">
          <h3 className="font-medium mb-4">Write a Review</h3>
          {isLoggedIn ? (
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm mb-2">Your Rating</label>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const value = i + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            value <= (hoverRating || rating)
                              ? "fill-gold text-gold"
                              : "text-muted"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Title (optional)</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Your Review</label>
                <textarea
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Tell us what you liked about this product..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gold resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-gold text-charcoal rounded-lg text-sm font-medium hover:bg-gold-light disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
              </button>
            </form>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm mb-4">
                Login to share your review with other customers
              </p>
              <Link
                href={`/account?redirect=/products`}
                className="inline-block px-6 py-2.5 bg-gold text-charcoal rounded-lg text-sm font-medium"
              >
                Login to Review
              </Link>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-medium mb-4">
            {reviews.length ? `${reviews.length} Review${reviews.length > 1 ? "s" : ""}` : "No reviews yet"}
          </h3>
          {reviews.length > 0 ? (
            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-sm">
                      {review.user?.full_name || "Customer"}
                    </span>
                    <span className="text-gold text-sm">{"★".repeat(review.rating)}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  {review.title && <p className="font-medium text-sm">{review.title}</p>}
                  {review.comment && (
                    <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Be the first to review this product!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
