import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

const HERO_FIELDS = [
  "title",
  "subtitle",
  "image_url",
  "mobile_image_url",
  "link_url",
  "button_text",
  "sort_order",
  "is_active",
] as const;

function pickHeroFields(body: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  for (const key of HERO_FIELDS) {
    if (key in body) row[key] = body[key];
  }
  if (!row.title) row.title = "Hero Slide";
  if (!row.button_text) row.button_text = "Shop Now";
  return row;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("homepage_heroes")
    .select("*")
    .order("sort_order");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data: data || [] });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("homepage_heroes")
    .insert(pickHeroFields(body))
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id, ...updates } = await request.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("homepage_heroes")
    .update(pickHeroFields(updates))
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
  await supabase.from("homepage_heroes").delete().eq("id", id);
  return Response.json({ success: true });
}
