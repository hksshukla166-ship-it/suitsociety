import { getUserSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getUserSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", session.id);

  return Response.json({ productIds: (data || []).map((row) => row.product_id) });
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const supabase = createServiceClient();

  if (body.action === "merge" && Array.isArray(body.productIds)) {
    const uniqueIds = [...new Set(body.productIds.filter(Boolean))] as string[];
    if (uniqueIds.length) {
      await supabase.from("wishlists").upsert(
        uniqueIds.map((productId) => ({ user_id: session.id, product_id: productId })),
        { onConflict: "user_id,product_id", ignoreDuplicates: true }
      );
    }
    const { data } = await supabase
      .from("wishlists")
      .select("product_id")
      .eq("user_id", session.id);
    return Response.json({ productIds: (data || []).map((row) => row.product_id) });
  }

  const productId = body.productId as string | undefined;
  if (!productId) return Response.json({ error: "Product ID required" }, { status: 400 });

  if (body.action === "remove") {
    await supabase.from("wishlists").delete().eq("user_id", session.id).eq("product_id", productId);
    return Response.json({ success: true, added: false });
  }

  await supabase.from("wishlists").upsert(
    { user_id: session.id, product_id: productId },
    { onConflict: "user_id,product_id" }
  );
  return Response.json({ success: true, added: true });
}
