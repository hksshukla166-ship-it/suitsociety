import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

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

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function buildDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const ref = getProjectRef();
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!ref || !password) return null;
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

loadEnvFile();

async function applySqlFixes() {
  const dbUrl = buildDbUrl();
  if (!dbUrl) {
    console.log("Skip SQL fixes: set SUPABASE_DB_PASSWORD or SUPABASE_DB_URL in .env.local");
    return;
  }

  const sql = postgres(dbUrl, { ssl: "require", max: 1 });
  const migration = readFileSync(
    resolve(__dirname, "../supabase/migrations/002_product_image_primary.sql"),
    "utf8"
  );

  for (const statement of migration.split(";").map((s) => s.trim()).filter(Boolean)) {
    try {
      await sql.unsafe(statement);
      console.log("Applied SQL fix");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes("already exists")) {
        console.warn("SQL warning:", msg);
      }
    }
  }

  await sql.end();
}

function normalizeBarcode(code) {
  return code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
}

async function fixBarcodes() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: products, error } = await supabase
    .from("products")
    .select("id, sku, barcode, name")
    .order("created_at");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  let updated = 0;
  const used = new Set();

  for (const product of products || []) {
    if (!product.sku?.trim()) continue;

    let candidate = normalizeBarcode(product.sku);
    if (!candidate) continue;

    let suffix = 1;
    while (used.has(candidate) || (await supabase.from("products").select("id").eq("barcode", candidate).neq("id", product.id).maybeSingle()).data) {
      suffix += 1;
      candidate = `${normalizeBarcode(product.sku)}-${suffix}`;
    }

    used.add(candidate);

    if (product.barcode === candidate) continue;

    const { error: updateError } = await supabase
      .from("products")
      .update({ barcode: candidate })
      .eq("id", product.id);

    if (updateError) {
      console.error(`${product.name}: ${updateError.message}`);
      continue;
    }

    console.log(`${product.sku} -> ${candidate}`);
    updated++;
  }

  console.log(`\nBarcode fix complete. Updated ${updated} products.`);
}

async function main() {
  await applySqlFixes();
  await fixBarcodes();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
