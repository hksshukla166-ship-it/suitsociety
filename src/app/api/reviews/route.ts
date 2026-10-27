import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const productId = new URL(request.url).searchParams.get("product_id");
  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit")) || 10, 50);

  const supabase = createServiceClient();
  let query = supabase
    .from("reviews")
    .select("*, user:users(full_name), product:products(name, slug)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (productId) query = query.eq("product_id", productId);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ reviews: data || [] });
}
