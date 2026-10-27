import { getUserSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getUserSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("phone")
    .eq("id", session.id)
    .single();

  const phone = user?.phone || session.phone;

  let query = supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (phone) {
    query = query.or(`user_id.eq.${session.id},shipping_phone.eq.${phone}`);
  } else {
    query = query.eq("user_id", session.id);
  }

  const { data } = await query;

  return Response.json({ orders: data || [] });
}
