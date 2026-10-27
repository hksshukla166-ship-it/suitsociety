import { createServiceClient } from "@/lib/supabase/server";

export async function getSetting<T = Record<string, unknown>>(key: string): Promise<T | null> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase.from("settings").select("value").eq("key", key).maybeSingle();
    return (data?.value as T) || null;
  } catch {
    return null;
  }
}

export async function getSizeChartUrl(): Promise<string> {
  const setting = await getSetting<{ url?: string }>("size_chart");
  return setting?.url || "/size-chart.svg";
}

export async function saveSetting(key: string, value: Record<string, unknown>): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("settings").upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );
    return !error;
  } catch {
    return false;
  }
}
