import type { createServiceClient } from "@/lib/supabase/server";

type DbClient = ReturnType<typeof createServiceClient>;
import {
  barcodeFromProductCode,
  generateFallbackBarcode,
} from "@/lib/barcode-utils";

export { barcodeFromProductCode, normalizeBarcodeFromCode } from "@/lib/barcode-utils";

export async function resolveProductBarcode(
  supabase: DbClient,
  productCode?: string | null,
  excludeProductId?: string
): Promise<string> {
  const base = barcodeFromProductCode(productCode);

  if (!base) {
    return resolveUniqueBarcode(supabase, generateFallbackBarcode(), excludeProductId);
  }

  return resolveUniqueBarcode(supabase, base, excludeProductId);
}

async function resolveUniqueBarcode(
  supabase: DbClient,
  base: string,
  excludeProductId?: string
): Promise<string> {
  let candidate = base;
  let suffix = 1;

  while (suffix <= 99) {
    let query = supabase.from("products").select("id").eq("barcode", candidate);
    if (excludeProductId) query = query.neq("id", excludeProductId);

    const { data } = await query.maybeSingle();
    if (!data) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  throw new Error("Could not generate a unique barcode");
}

/** @deprecated Use resolveProductBarcode */
export async function generateUniqueBarcode(): Promise<string> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();
  return resolveProductBarcode(supabase, null);
}
