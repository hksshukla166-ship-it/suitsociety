import { createServiceClient } from "@/lib/supabase/server";
import { searchProducts } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return Response.json({ results: [] });
  }

  try {
    const results = await searchProducts(q);
    return Response.json({ results });
  } catch {
    return Response.json({ results: [] });
  }
}
