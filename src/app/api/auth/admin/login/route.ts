import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { createAdminToken } from "@/lib/auth";
import { DEFAULT_ADMIN } from "@/lib/constants";
import { ensureDatabaseReady } from "@/lib/init-db";

async function ensureDefaultAdmin(supabase: ReturnType<typeof createServiceClient>) {
  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, 12);

  const { data: existing } = await supabase
    .from("admin_users")
    .select("id, password_hash")
    .ilike("username", DEFAULT_ADMIN.username)
    .limit(1);

  if (!existing?.length) {
    const { count } = await supabase
      .from("admin_users")
      .select("id", { count: "exact", head: true });

    if ((count ?? 0) === 0) {
      await supabase.from("admin_users").insert({
        username: DEFAULT_ADMIN.username,
        password_hash: passwordHash,
      });
    }
    return;
  }

  const valid = await bcrypt.compare(DEFAULT_ADMIN.password, existing[0].password_hash);
  if (!valid) {
    await supabase
      .from("admin_users")
      .update({ password_hash: passwordHash })
      .eq("id", existing[0].id);
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json({ error: "Username and password required" }, { status: 400 });
    }

    const dbStatus = await ensureDatabaseReady();
    if (!dbStatus.dbReady) {
      return Response.json(
        { error: dbStatus.message || "Database is not ready" },
        { status: 503 }
      );
    }

    const supabase = createServiceClient();
    await ensureDefaultAdmin(supabase);
    const { data: admins, error } = await supabase
      .from("admin_users")
      .select("*")
      .ilike("username", username.trim())
      .limit(1);

    const admin = admins?.[0];

    if (error || !admin) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    await supabase
      .from("admin_users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", admin.id);

    const token = await createAdminToken({
      id: admin.id,
      username: admin.username,
      must_change_credentials: admin.must_change_credentials,
    });

    const cookieStore = await cookies();
    cookieStore.set("ss_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return Response.json({
      success: true,
      mustChangeCredentials: admin.must_change_credentials,
    });
  } catch {
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  cookieStore.delete("ss_admin_session");
  return Response.json({ success: true });
}
