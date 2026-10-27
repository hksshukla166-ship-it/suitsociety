import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("*, orders(count)")
    .order("created_at", { ascending: false });

  return Response.json({ data: data || [] });
}
