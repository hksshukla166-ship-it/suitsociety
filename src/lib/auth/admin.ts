import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import { DEFAULT_ADMIN } from "@/lib/constants";

export const ADMIN_COOKIE = "ss_admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback-secret";
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSessionToken(adminId: string): string {
  const payload = `${adminId}:${Date.now()}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [adminId, timestamp, sig] = parts;
    const payload = `${adminId}:${timestamp}`;
    const expected = createHmac("sha256", getSecret()).update(payload).digest("hex");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
    const age = Date.now() - parseInt(timestamp);
    if (age > SESSION_MAX_AGE * 1000) return null;
    return adminId;
  } catch {
    return null;
  }
}

export async function setAdminSession(adminId: string) {
  const token = createSessionToken(adminId);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function getAdminSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function ensureDefaultAdmin() {
  const supabase = createServiceClient();
  const { data: existing } = await supabase.from("admin_users").select("id").limit(1);
  if (existing && existing.length > 0) return;
  const hash = await hashPassword(DEFAULT_ADMIN.password);
  await supabase.from("admin_users").insert({
    username: DEFAULT_ADMIN.username,
    password_hash: hash,
  });
}

export async function adminLogin(username: string, password: string) {
  const supabase = createServiceClient();
  await ensureDefaultAdmin();
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, password_hash")
    .eq("username", username)
    .single();
  if (!admin) return { error: "Invalid credentials" };
  const valid = await verifyPassword(password, admin.password_hash);
  if (!valid) return { error: "Invalid credentials" };
  await setAdminSession(admin.id);
  return { success: true };
}

export async function updateAdminCredentials(
  adminId: string,
  newUsername?: string,
  newPassword?: string
) {
  const supabase = createServiceClient();
  const updates: Record<string, string> = {};
  if (newUsername) updates.username = newUsername;
  if (newPassword) updates.password_hash = await hashPassword(newPassword);
  if (Object.keys(updates).length === 0) return { error: "Nothing to update" };
  const { error } = await supabase.from("admin_users").update(updates).eq("id", adminId);
  if (error) return { error: error.message };
  return { success: true };
}
