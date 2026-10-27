import { capitalizeFabricName } from "@/lib/product-catalog";
import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("fabrics")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const name = capitalizeFabricName(String(body.name || ""));
  if (!name) {
    return Response.json({ error: "Name is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("fabrics")
    .insert({ ...body, name, slug: slugify(name) })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const { id, ...updates } = body;
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  if (updates.name) {
    updates.name = capitalizeFabricName(String(updates.name));
    updates.slug = slugify(updates.name);
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("fabrics")
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

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("fabrics").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
