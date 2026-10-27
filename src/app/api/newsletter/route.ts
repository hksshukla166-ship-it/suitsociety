import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) return Response.json({ error: "Email required" }, { status: 400 });

    const supabase = createServiceClient();
    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert({ email, is_active: true }, { onConflict: "email" });

    if (error) throw error;
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Subscription failed" }, { status: 500 });
  }
}
