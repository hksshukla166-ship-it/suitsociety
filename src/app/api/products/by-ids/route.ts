import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const ids = new URL(request.url).searchParams.get("ids")?.split(",").filter(Boolean);
  if (!ids?.length) return Response.json({ products: [] });

  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_images(*), brand:brands(*), category:categories(*)")
    .in("id", ids)
    .eq("is_active", true);

  const products = (data || []).map((p) => ({ ...p, images: p.product_images }));
  return Response.json({ products });
}
