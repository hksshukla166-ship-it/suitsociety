import { revalidatePath } from "next/cache";
import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function revalidateCategoryPages() {
  revalidatePath("/");
  revalidatePath("/admin/categories");
  revalidatePath("/products");
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const supabase = createServiceClient();
  const slug = body.slug || slugify(body.name || "category");

  const { data, error } = await supabase
    .from("categories")
    .insert({ ...body, slug })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  revalidateCategoryPages();
  return Response.json({ data });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const { id, ...updates } = await request.json();
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  revalidateCategoryPages();
  return Response.json({ data });
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  revalidateCategoryPages();
  return Response.json({ success: true });
}
