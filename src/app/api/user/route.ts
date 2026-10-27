import { getUserSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getUserSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.id)
    .single();

  return Response.json({ user });
}
