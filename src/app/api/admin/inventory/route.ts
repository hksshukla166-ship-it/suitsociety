import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const search = new URL(request.url).searchParams.get("search");
  const supabase = createServiceClient();

  let query = supabase
    .from("inventory")
    .select("*, product:products(name, barcode, stock)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (search) {
    const { data: products } = await supabase
      .from("products")
      .select("id")
      .or(`barcode.ilike.%${search}%,name.ilike.%${search}%`);

    const ids = (products || []).map((p) => p.id);
    if (ids.length) query = query.in("product_id", ids);
    else return Response.json({ data: [] });
  }

  const { data } = await query;
  return Response.json({ data: data || [] });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { product_id, type, quantity, notes } = await request.json();
  const supabase = createServiceClient();

  const { data: product } = await supabase
    .from("products")
    .select("stock")
    .eq("id", product_id)
    .single();

  if (!product) return Response.json({ error: "Product not found" }, { status: 404 });

  const previousStock = product.stock;
  const delta = type === "stock_out" ? -Math.abs(quantity) : Math.abs(quantity);
  const newStock = Math.max(0, previousStock + delta);

  await supabase
    .from("products")
    .update({ stock: newStock })
    .eq("id", product_id);

  const { data, error } = await supabase
    .from("inventory")
    .insert({
      product_id,
      type,
      quantity: delta,
      previous_stock: previousStock,
      new_stock: newStock,
      notes,
      created_by: session.id,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}
