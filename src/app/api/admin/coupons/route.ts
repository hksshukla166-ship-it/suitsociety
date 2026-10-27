import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("coupons")
    .select("*, coupon_products(product_id), coupon_categories(category_id), coupon_users(user_id)")
    .order("created_at", { ascending: false });

  return Response.json({ data: data || [] });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const { product_ids, category_ids, user_ids, ...couponData } = body;
  const supabase = createServiceClient();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .insert({ ...couponData, code: couponData.code.toUpperCase() })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (product_ids?.length) {
    await supabase.from("coupon_products").insert(
      product_ids.map((pid: string) => ({ coupon_id: coupon.id, product_id: pid }))
    );
  }
  if (category_ids?.length) {
    await supabase.from("coupon_categories").insert(
      category_ids.map((cid: string) => ({ coupon_id: coupon.id, category_id: cid }))
    );
  }
  if (user_ids?.length) {
    await supabase.from("coupon_users").insert(
      user_ids.map((uid: string) => ({ coupon_id: coupon.id, user_id: uid }))
    );
  }

  return Response.json({ data: coupon });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const { id, product_ids, category_ids, user_ids, ...updates } = body;
  const supabase = createServiceClient();

  if (updates.code) updates.code = updates.code.toUpperCase();

  const { data, error } = await supabase
    .from("coupons")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  if (product_ids !== undefined) {
    await supabase.from("coupon_products").delete().eq("coupon_id", id);
    if (product_ids.length) {
      await supabase.from("coupon_products").insert(
        product_ids.map((pid: string) => ({ coupon_id: id, product_id: pid }))
      );
    }
  }

  return Response.json({ data });
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  const supabase = createServiceClient();
  await supabase.from("coupons").delete().eq("id", id);
  return Response.json({ success: true });
}
