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

loadEnvFile();

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const { data: products, error: listError } = await supabase.from("products").select("id, name");
  if (listError) {
    console.error(listError.message);
    process.exit(1);
  }

  const count = products?.length || 0;
  if (count === 0) {
    console.log("No products to delete.");
    return;
  }

  await supabase.from("product_images").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("inventory").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error } = await supabase.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(`Deleted ${count} products.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
