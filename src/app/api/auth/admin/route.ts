import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newUsername, newPassword } = await request.json();
    const supabase = createServiceClient();

    const { data: admin } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", session.id)
      .single();

    if (!admin) {
      return Response.json({ error: "Admin not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) {
      return Response.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      must_change_credentials: false,
      updated_at: new Date().toISOString(),
    };

    if (newUsername && newUsername !== admin.username) {
      updates.username = newUsername;
    }

    if (newPassword) {
      updates.password_hash = await bcrypt.hash(newPassword, 12);
    }

    const { error } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("id", admin.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return Response.json({ success: true });
}
