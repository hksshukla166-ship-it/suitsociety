import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("homepage_videos")
    .select("*, product:products(id, name, slug)")
    .order("sort_order");
  return Response.json({ data: data || [] });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("homepage_videos").insert(body).select().single();
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id, ...updates } = await request.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("homepage_videos")
    .update(updates)
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
  await supabase.from("homepage_videos").delete().eq("id", id);
  return Response.json({ success: true });
}
