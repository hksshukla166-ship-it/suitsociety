import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/admin";
import { isFonosterConfigured, sendOtpViaFonoster } from "@/lib/fonoster";

export async function sendOTP(phone: string): Promise<{ success?: boolean; error?: string; devOtp?: string }> {
  const cleanPhone = phone.replace(/\D/g, "");
  if (cleanPhone.length !== 10) return { error: "Enter valid 10-digit phone number" };

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const supabase = createServiceClient();
  await supabase.from("otp_sessions").insert({
    phone: cleanPhone,
    otp_hash: otpHash,
    expires_at: expiresAt,
  });

  if (isFonosterConfigured()) {
    try {
      const result = await sendOtpViaFonoster(cleanPhone, otp);
      if (!result.delivered && process.env.FONOSTER_OTP_FALLBACK !== "true") {
        return { error: "Failed to send OTP. Please try again." };
      }
    } catch {
      return { error: "Failed to send OTP. Please try again." };
    }
  }

  return {
    success: true,
    devOtp:
      process.env.NODE_ENV === "development" && !isFonosterConfigured()
        ? otp
        : undefined,
  };
}

export async function verifyOTP(phone: string, otp: string) {
  const cleanPhone = phone.replace(/\D/g, "");
  const supabase = createServiceClient();

  const { data: records } = await supabase
    .from("otp_sessions")
    .select("*")
    .eq("phone", cleanPhone)
    .eq("verified", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  if (!records?.length) return { error: "OTP expired or not found" };

  const valid = await bcrypt.compare(otp, records[0].otp_hash);
  if (!valid) return { error: "Invalid OTP" };

  await supabase.from("otp_sessions").update({ verified: true }).eq("id", records[0].id);

  let userId: string;
  const { data: existing } = await supabase.from("users").select("id").eq("phone", cleanPhone).maybeSingle();
  if (existing && !Array.isArray(existing)) {
    userId = (existing as { id: string }).id;
  } else {
    userId = randomUUID();
    await supabase.from("users").insert({ id: userId, phone: cleanPhone });
  }

  return { success: true, userId };
}

export async function getCurrentUser() {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  return profile;
}
