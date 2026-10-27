import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const envPath = resolve(__dirname, "../.env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

function barcodeFromProductCode(productCode) {
  if (!productCode?.trim()) return null;
  const normalized = productCode
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);
  return normalized || null;
}

async function resolveUniqueBarcode(supabase, base, excludeProductId) {
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

  throw new Error(`Could not assign barcode for ${base}`);
}

loadEnvFile();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, sku, barcode")
    .order("created_at");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let updated = 0;

  for (const product of products || []) {
    const desired = barcodeFromProductCode(product.sku);
    if (!desired) continue;
    if (product.barcode === desired) continue;

    const barcode = await resolveUniqueBarcode(supabase, desired, product.id);
    const { error: updateError } = await supabase
      .from("products")
      .update({ barcode })
      .eq("id", product.id);

    if (updateError) {
      console.error(`${product.name}: ${updateError.message}`);
      continue;
    }

    updated += 1;
    console.log(`${product.name}: ${product.barcode} -> ${barcode}`);
  }

  console.log(`\nUpdated ${updated} product barcodes.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
