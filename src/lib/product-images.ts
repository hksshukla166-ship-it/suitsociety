import type { ProductImage } from "@/types";

export function getPrimaryImageUrl(
  images?: ProductImage[] | null,
  fallback = "/placeholder-product.svg"
): string {
  if (!images?.length) return fallback;

  const primary = images.find((img) => img.is_primary);
  if (primary?.url) return primary.url;

  const sorted = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  return sorted[0]?.url || fallback;
}
