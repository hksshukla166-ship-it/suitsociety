import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const status = new URL(request.url).searchParams.get("status");
  const supabase = createServiceClient();

  let query = supabase
    .from("orders")
    .select("*, order_items(*, product:products(barcode, sku)), user:users(full_name, phone)")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data: data || [] });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id, status } = await request.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
