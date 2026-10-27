import bcrypt from "bcryptjs";
import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const supabase = createServiceClient();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, username, email, must_change_credentials, last_login")
    .eq("id", session.id)
    .single();

  const { data: settings } = await supabase.from("settings").select("*");

  return Response.json({ admin, settings: settings || [] });
}

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const body = await request.json();
  const supabase = createServiceClient();

  if (body.username || body.password) {
    const updates: Record<string, unknown> = { must_change_credentials: false };

    if (body.username) {
      const { data: existing } = await supabase
        .from("admin_users")
        .select("id")
        .eq("username", body.username)
        .neq("id", session.id)
        .single();
      if (existing) {
        return Response.json({ error: "Username already taken" }, { status: 400 });
      }
      updates.username = body.username;
    }

    if (body.currentPassword && body.password) {
      const { data: admin } = await supabase
        .from("admin_users")
        .select("password_hash")
        .eq("id", session.id)
        .single();

      const valid = await bcrypt.compare(body.currentPassword, admin?.password_hash || "");
      if (!valid) {
        return Response.json({ error: "Current password is incorrect" }, { status: 400 });
      }
      updates.password_hash = await bcrypt.hash(body.password, 12);
    }

    await supabase.from("admin_users").update(updates).eq("id", session.id);
  }

  if (body.sizeChartUrl !== undefined) {
    const { error } = await supabase.from("settings").upsert(
      {
        key: "size_chart",
        value: { url: body.sizeChartUrl },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  if (body.catalogSizes !== undefined) {
    const sizes = Array.isArray(body.catalogSizes)
      ? body.catalogSizes.map((size: unknown) => String(size).trim()).filter(Boolean)
      : [];
    const { error } = await supabase.from("settings").upsert(
      {
        key: "catalog_sizes",
        value: { sizes },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ success: true });
}
