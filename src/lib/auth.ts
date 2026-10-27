import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createServiceClient } from "./supabase/server";
import { DEFAULT_ADMIN } from "./constants";

const ADMIN_SESSION_COOKIE = "ss_admin_session";
const USER_SESSION_COOKIE = "user_token";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const USER_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function initializeDefaultAdmin(): Promise<void> {
  const supabase = createServiceClient();
  const passwordHash = await hashPassword(DEFAULT_ADMIN.password);

  const { data: existing } = await supabase
    .from("admin_users")
    .select("id, username, password_hash")
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

  const valid = await verifyPassword(DEFAULT_ADMIN.password, existing[0].password_hash);
  if (!valid) {
    await supabase
      .from("admin_users")
      .update({ password_hash: passwordHash })
      .eq("id", existing[0].id);
  }
}

export async function adminLogin(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  const { ensureDatabaseReady } = await import("@/lib/init-db");
  const dbStatus = await ensureDatabaseReady();
  if (!dbStatus.dbReady) {
    return {
      success: false,
      error: dbStatus.message || "Database is not ready. Check MySQL settings in .env.local.",
    };
  }

  await initializeDefaultAdmin();

  const supabase = createServiceClient();
  const trimmedUsername = username.trim();

  const { data: admins, error } = await supabase
    .from("admin_users")
    .select("*")
    .ilike("username", trimmedUsername);

  if (error) {
    if (error.message.includes("admin_users") || error.message.includes("schema cache")) {
      return {
        success: false,
        error: "Database not set up. Run mysql/schema.sql or use Admin login to auto-initialize.",
      };
    }
    return { success: false, error: "Login failed. Please try again." };
  }

  if (!admins?.length) {
    return { success: false, error: "Invalid credentials" };
  }

  const admin = admins[0];
  let valid = await verifyPassword(password, admin.password_hash);

  if (
    !valid &&
    trimmedUsername.toLowerCase() === DEFAULT_ADMIN.username.toLowerCase() &&
    password === DEFAULT_ADMIN.password
  ) {
    const passwordHash = await hashPassword(DEFAULT_ADMIN.password);
    await supabase
      .from("admin_users")
      .update({ password_hash: passwordHash })
      .eq("id", admin.id);
    valid = true;
  }

  if (!valid) return { success: false, error: "Invalid credentials" };

  const cookieStore = await cookies();
  const sessionData = JSON.stringify({ id: admin.id, username: admin.username, exp: Date.now() + SESSION_DURATION });
  const encoded = Buffer.from(sessionData).toString("base64");

  cookieStore.set(ADMIN_SESSION_COOKIE, encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });

  return { success: true };
}

export async function adminLogout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export async function getAdminSession(): Promise<{ id: string; username: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE);
  if (!session?.value) return null;

  try {
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (data.exp < Date.now()) {
      cookieStore.delete(ADMIN_SESSION_COOKIE);
      return null;
    }
    return { id: data.id, username: data.username };
  } catch {
    return null;
  }
}

export async function updateAdminCredentials(
  adminId: string,
  newUsername?: string,
  newPassword?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServiceClient();
  const updates: Record<string, string> = {};

  if (newUsername) updates.username = newUsername;
  if (newPassword) updates.password_hash = await hashPassword(newPassword);

  if (Object.keys(updates).length === 0) return { success: false, error: "Nothing to update" };

  const { error } = await supabase
    .from("admin_users")
    .update(updates)
    .eq("id", adminId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function createUserToken(user: {
  id: string;
  phone?: string;
  name?: string | null;
  full_name?: string | null;
}): Promise<string> {
  const sessionData = JSON.stringify({
    id: user.id,
    phone: user.phone,
    name: user.full_name || user.name,
    exp: Date.now() + USER_SESSION_DURATION,
  });
  return Buffer.from(sessionData).toString("base64");
}

export async function getUserSession(): Promise<{ id: string; phone?: string; name?: string } | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(USER_SESSION_COOKIE);
  if (!session?.value) return null;

  try {
    const data = JSON.parse(Buffer.from(session.value, "base64").toString());
    if (data.exp < Date.now()) {
      cookieStore.delete(USER_SESSION_COOKIE);
      return null;
    }
    return { id: data.id, phone: data.phone, name: data.name };
  } catch {
    return null;
  }
}

export async function createAdminToken(admin: {
  id: string;
  username: string;
  must_change_credentials?: boolean;
}): Promise<string> {
  const sessionData = JSON.stringify({
    id: admin.id,
    username: admin.username,
    must_change_credentials: admin.must_change_credentials,
    exp: Date.now() + SESSION_DURATION,
  });
  return Buffer.from(sessionData).toString("base64");
}
