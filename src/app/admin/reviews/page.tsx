"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout, AdminHeader, AdminCard, AdminButton } from "@/components/admin/AdminLayout";

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_approved: boolean;
  created_at: string;
  product?: { name?: string; slug?: string };
  user?: { full_name?: string; phone?: string };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("pending");

  const load = useCallback(() => {
    setLoading(true);
    const param =
      filter === "pending" ? "?approved=false" : filter === "approved" ? "?approved=true" : "";
    fetch(`/api/admin/reviews${param}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.data || []))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateReview = async (id: string, is_approved: boolean) => {
    const res = await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_approved }),
    });
    if (res.ok) {
      toast.success(is_approved ? "Review approved" : "Review rejected");
      load();
    } else {
      toast.error("Failed to update review");
    }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    const res = await fetch(`/api/admin/reviews?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Review deleted");
      load();
    } else {
      toast.error("Failed to delete review");
    }
  };

  return (
    <AdminLayout>
      <AdminHeader title="Reviews" description="Moderate customer reviews" />

      <div className="flex gap-2 mb-6">
        {(["pending", "approved", "all"] as const).map((f) => (
          <AdminButton
            key={f}
            variant={filter === f ? "primary" : "secondary"}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </AdminButton>
        ))}
      </div>

      <AdminCard>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : !reviews.length ? (
          <p className="text-zinc-500 text-center py-8">No reviews found</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="p-4 border border-white/10 rounded-lg flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400">{"★".repeat(review.rating)}</span>
                    <span className="text-zinc-500 text-xs">
                      {new Date(review.created_at).toLocaleDateString("en-IN")}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        review.is_approved
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {review.is_approved ? "Approved" : "Pending"}
                    </span>
                  </div>
                  {review.title && <p className="text-white font-medium">{review.title}</p>}
                  {review.comment && <p className="text-zinc-400 text-sm mt-1">{review.comment}</p>}
                  <p className="text-zinc-500 text-xs mt-2">
                    {review.product?.name} · {review.user?.full_name || review.user?.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!review.is_approved && (
                    <button
                      onClick={() => updateReview(review.id, true)}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {review.is_approved && (
                    <button
                      onClick={() => updateReview(review.id, false)}
                      className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
