import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("flash_sales")
    .select("*")
    .order("starts_at", { ascending: false });

  return Response.json({ data: data || [] });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const supabase = createServiceClient();

  const saleData = {
    title: body.title,
    banner_url: body.banner_url || null,
    discount_percentage: body.discount_percentage ?? body.discount_value ?? 0,
    product_ids: body.product_ids || [],
    starts_at: body.starts_at ?? body.start_date,
    ends_at: body.ends_at ?? body.end_date,
    is_active: body.is_active ?? true,
  };

  const { data: sale, error } = await supabase
    .from("flash_sales")
    .insert(saleData)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data: sale });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const { id, ...updates } = body;
  const supabase = createServiceClient();

  const saleData = {
    ...updates,
    ...(updates.discount_value !== undefined && { discount_percentage: updates.discount_value }),
    ...(updates.start_date !== undefined && { starts_at: updates.start_date }),
    ...(updates.end_date !== undefined && { ends_at: updates.end_date }),
  };
  delete saleData.discount_value;
  delete saleData.start_date;
  delete saleData.end_date;
  delete saleData.discount_type;

  const { data, error } = await supabase
    .from("flash_sales")
    .update(saleData)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  const supabase = createServiceClient();
  await supabase.from("flash_sales").delete().eq("id", id);
  return Response.json({ success: true });
}
