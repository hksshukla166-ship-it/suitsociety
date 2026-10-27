import { createServiceClient } from "./supabase/server";
import type { Product } from "@/types";

export async function getProducts(options: {
  category?: string;
  brand?: string;
  fabric?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: string;
  search?: string;
  featured?: boolean;
  newArrival?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
  todaysDeal?: boolean;
  limit?: number;
  offset?: number;
}) {
  const supabase = createServiceClient();
  let query = supabase
    .from("products")
    .select(
      "*, category:categories(*), brand:brands(*), fabric:fabrics(*), product_images(*)",
      { count: "exact" }
    )
    .eq("is_active", true);

  if (options.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", options.category)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
  }

  if (options.brand) {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", options.brand)
      .single();
    if (brand) query = query.eq("brand_id", brand.id);
  }

  if (options.fabric) {
    const { data: fabric } = await supabase
      .from("fabrics")
      .select("id")
      .eq("slug", options.fabric)
      .single();
    if (fabric) query = query.eq("fabric_id", fabric.id);
  }

  if (options.color) query = query.contains("colors", [options.color]);
  if (options.size) query = query.contains("sizes", [options.size]);
  if (options.minPrice) query = query.gte("price", options.minPrice);
  if (options.maxPrice) query = query.lte("price", options.maxPrice);
  if (options.inStock) query = query.gt("stock", 0);
  if (options.featured) query = query.eq("is_featured", true);
  if (options.newArrival) query = query.eq("is_new_arrival", true);
  if (options.trending) query = query.eq("is_trending", true);
  if (options.bestSeller) query = query.eq("is_best_seller", true);
  if (options.todaysDeal) query = query.eq("is_trending", true);

  if (options.search) {
    query = query.or(
      `name.ilike.%${options.search}%,description.ilike.%${options.search}%,barcode.ilike.%${options.search}%`
    );
  }

  switch (options.sort) {
    case "price_low":
      query = query.order("price", { ascending: true });
      break;
    case "price_high":
      query = query.order("price", { ascending: false });
      break;
    case "popular":
      query = query.order("views", { ascending: false });
      break;
    case "best_selling":
      query = query.order("sales_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  if (options.limit) query = query.limit(options.limit);
  if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 20) - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const products = (data || []).map((p) => ({
    ...p,
    images: p.product_images,
  })) as Product[];

  return { products, count: count || 0 };
}

export async function getProductBySlug(slug: string) {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, category:categories(*), brand:brands(*), fabric:fabrics(*), product_images(*), product_videos(*), reviews(*, user:users(full_name, phone))"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  await supabase
    .from("products")
    .update({ views: (data.views || 0) + 1 })
    .eq("id", data.id);

  return {
    ...data,
    images: data.product_images,
    videos: data.product_videos,
    reviews: (data.reviews || []).filter((r: { is_approved: boolean }) => r.is_approved),
  } as Product;
}

export async function searchProducts(query: string, limit = 8) {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("products")
    .select("id, name, slug, price, product_images(url, sort_order)")
    .eq("is_active", true)
    .or(`name.ilike.%${query}%,barcode.ilike.%${query}%`)
    .limit(limit);

  return data || [];
}

export async function getRelatedProducts(
  productId: string,
  categoryId?: string,
  limit = 8
) {
  const supabase = createServiceClient();

  let query = supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("is_active", true)
    .neq("id", productId)
    .limit(limit);

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data } = await query;
  return (data || []).map((p) => ({ ...p, images: p.product_images })) as Product[];
}

export async function generateUniqueBarcode(): Promise<string> {
  const { resolveProductBarcode } = await import("@/lib/barcode");
  const supabase = createServiceClient();
  return resolveProductBarcode(supabase, null);
}
