import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CATALOG_CATEGORIES = [
  "Readymade 3-pc Suits",
  "Korean Shirts/ Midis",
  "Wedding/Festive collection",
  "Co-Ord Sets",
  "Winter Wear",
  "Night Suits",
];

const CATALOG_FABRICS = [
  "Cotton",
  "Imported Fabric",
  "Silk",
  "Mul Cotton",
  "Dola Silk",
];

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

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
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

  for (const [index, name] of CATALOG_CATEGORIES.entries()) {
    const { error } = await supabase.from("categories").upsert(
      { name, slug: slugify(name), sort_order: index + 1, is_active: true },
      { onConflict: "slug" }
    );
    if (error) console.error(`Category failed: ${name} - ${error.message}`);
    else console.log(`Category ready: ${name}`);
  }

  for (const name of CATALOG_FABRICS) {
    const { error } = await supabase.from("fabrics").upsert(
      { name, slug: slugify(name), is_active: true },
      { onConflict: "slug" }
    );
    if (error) console.error(`Fabric failed: ${name} - ${error.message}`);
    else console.log(`Fabric ready: ${name}`);
  }

  console.log("\nCatalog seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
