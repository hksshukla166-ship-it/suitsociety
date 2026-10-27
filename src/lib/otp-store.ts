import { createServiceClient } from "@/lib/supabase/server";

type OtpRecord = {
  otp_hash: string;
  expires_at: string;
  verified: boolean;
  created_at: string;
};

function otpKey(phone: string) {
  return `otp:${phone}`;
}

export async function saveOtpSession(
  phone: string,
  otpHash: string,
  expiresAt: string
): Promise<{ error?: string }> {
  const supabase = createServiceClient();
  const record: OtpRecord = {
    otp_hash: otpHash,
    expires_at: expiresAt,
    verified: false,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("settings").upsert(
    { key: otpKey(phone), value: record },
    { onConflict: "key" }
  );

  if (error) return { error: error.message };
  return {};
}

export async function getActiveOtpSession(phone: string): Promise<OtpRecord | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", otpKey(phone))
    .maybeSingle();

  if (error || !data?.value) return null;

  const record = data.value as OtpRecord;
  if (record.verified || new Date(record.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return record;
}

export async function markOtpVerified(phone: string): Promise<void> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", otpKey(phone))
    .maybeSingle();

  if (!data?.value) return;

  const record = data.value as OtpRecord;
  await supabase.from("settings").upsert(
    {
      key: otpKey(phone),
      value: { ...record, verified: true },
    },
    { onConflict: "key" }
  );
}
