import { getUserSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getUserSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", session.id)
    .order("is_default", { ascending: false });

  return Response.json({ addresses: data || [] });
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const supabase = createServiceClient();

  if (body.is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", session.id);
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({
      user_id: session.id,
      full_name: body.name || body.full_name,
      phone: body.phone,
      address_line1: body.address_line || body.address_line1,
      city: body.city,
      state: body.state,
      pincode: body.pincode,
      is_default: body.is_default || false,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ address: data });
}

export async function DELETE(request: Request) {
  const session = await getUserSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "ID required" }, { status: 400 });

  const supabase = createServiceClient();
  await supabase.from("addresses").delete().eq("id", id).eq("user_id", session.id);
  return Response.json({ success: true });
}
