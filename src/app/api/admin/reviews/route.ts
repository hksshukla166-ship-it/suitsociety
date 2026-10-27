import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

async function updateProductRatings(supabase: ReturnType<typeof createServiceClient>, productId: string) {
  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_approved", true);

  const count = reviews?.length || 0;
  const avg = count
    ? (reviews || []).reduce((sum, r) => sum + r.rating, 0) / count
    : 0;

  await supabase
    .from("products")
    .update({ rating_avg: avg, rating_count: count })
    .eq("id", productId);
}

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const approved = new URL(request.url).searchParams.get("approved");
  const supabase = createServiceClient();

  let query = supabase
    .from("reviews")
    .select("*, product:products(name, slug), user:users(full_name, phone)")
    .order("created_at", { ascending: false });

  if (approved === "false") query = query.eq("is_approved", false);
  if (approved === "true") query = query.eq("is_approved", true);

  const { data } = await query;
  return Response.json({ data: data || [] });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id, is_approved } = await request.json();
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("reviews")
    .select("product_id")
    .eq("id", id)
    .single();

  const { data, error } = await supabase
    .from("reviews")
    .update({ is_approved })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (existing?.product_id) {
    await updateProductRatings(supabase, existing.product_id);
  }

  return Response.json({ data });
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Review ID required" }, { status: 400 });

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("reviews")
    .select("product_id")
    .eq("id", id)
    .single();

  await supabase.from("reviews").delete().eq("id", id);

  if (existing?.product_id) {
    await updateProductRatings(supabase, existing.product_id);
  }

  return Response.json({ success: true });
}
