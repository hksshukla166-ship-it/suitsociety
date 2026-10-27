import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";
import { validateVideoFileSize } from "@/lib/upload-limits";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("product_videos")
    .select("id, url, title, product_id, product:products(id, name, slug)")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ data: [], error: error.message });
  }

  return Response.json({ data: data || [] });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const productId = String(body.productId || "");
    const url = String(body.url || "");
    const title = body.title ? String(body.title) : null;
    const size = Number(body.size);

    if (!productId || !url) {
      return Response.json({ error: "Product ID and video URL are required" }, { status: 400 });
    }

    if (Number.isFinite(size) && size > 0) {
      const sizeError = validateVideoFileSize(size);
      if (sizeError) {
        return Response.json({ error: sizeError }, { status: 400 });
      }
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("product_videos")
      .insert({
        product_id: productId,
        url,
        title,
      })
      .select("id, url, title, product_id")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ data });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not save product video" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Video ID required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase.from("product_videos").delete().eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
