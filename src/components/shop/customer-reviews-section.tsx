import Link from "next/link";
import { Star } from "lucide-react";
import { Review } from "@/types";

interface Props {
  reviews: Review[];
}

export function CustomerReviewsSection({ reviews }: Props) {
  if (!reviews.length) return null;

  return (
    <section className="container mx-auto px-4">
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl tracking-wider">CUSTOMER REVIEWS</h2>
        <p className="text-muted-foreground text-sm mt-2">
          What our customers say about Suit Society
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reviews.map((review) => {
          const product = review.product as { name?: string; slug?: string } | undefined;
          return (
            <div key={review.id} className="p-5 border rounded-xl bg-white shadow-sm">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < review.rating ? "fill-gold text-gold" : "text-muted"}`}
                  />
                ))}
              </div>
              {review.title && <p className="font-medium text-sm mb-1">{review.title}</p>}
              {review.comment && (
                <p className="text-sm text-muted-foreground line-clamp-4">{review.comment}</p>
              )}
              <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{review.user?.full_name || "Customer"}</span>
                {product?.slug ? (
                  <Link href={`/products/${product.slug}#reviews`} className="text-gold hover:underline shrink-0">
                    {product.name}
                  </Link>
                ) : product?.name ? (
                  <span className="shrink-0">{product.name}</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
