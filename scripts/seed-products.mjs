import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";
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

const EXCEL_PATH =
  process.env.EXCEL_PATH ||
  "C:/Users/buttu/Downloads/Untitled spreadsheet.xlsx";

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function cell(row, ...keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function numberCell(row, ...keys) {
  const raw = cell(row, ...keys);
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseRow(row) {
  const name = cell(row, "Product Name", "name", "Name");
  if (!name) return null;

  const discountRaw = numberCell(row, "Discount Percent", "discount_percent");
  const discountPercent = discountRaw > 1 ? discountRaw / 100 : discountRaw;

  return {
    productCode: cell(row, "Product Code", "product_code", "SKU"),
    name,
    mrp: numberCell(row, "MRP", "mrp"),
    discountPercent,
    costPrice: numberCell(row, "Cost Price", "cost_price"),
    category: cell(row, "Category", "category"),
    color: cell(row, "Color", "color"),
    fabric: cell(row, "Fabric", "fabric"),
    size: cell(row, "Size", "size"),
    description: cell(row, "Description", "description"),
  };
}

function parseSizes(sizeText) {
  return sizeText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseColors(colorText) {
  return colorText
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function sellingPrice(mrp, discountPercent) {
  if (!mrp) return 0;
  const discount = Math.min(Math.max(discountPercent, 0), 1);
  return Math.round(mrp * (1 - discount) * 100) / 100;
}

function barcodeFromCode(productCode) {
  if (!productCode?.trim()) return null;
  return productCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20) || null;
}

async function resolveBarcode(supabase, productCode) {
  const base = barcodeFromCode(productCode) || `SS${Date.now().toString().slice(-6)}`;
  let candidate = base;
  let suffix = 1;
  while (suffix <= 99) {
    const { data } = await supabase.from("products").select("id").eq("barcode", candidate).maybeSingle();
    if (!data) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  throw new Error(`Could not assign barcode for ${base}`);
}

async function ensureLookup(supabase, table, name) {
  if (!name) return null;
  const slug = slugify(name);
  const { data: existing } = await supabase
    .from(table)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from(table)
    .insert({ name, slug, is_active: true })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const excelPath = resolve(EXCEL_PATH);
  if (!existsSync(excelPath)) {
    console.error(`Excel file not found: ${excelPath}`);
    process.exit(1);
  }

  const supabase = createClient(url, key);
  const workbook = XLSX.read(readFileSync(excelPath));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const categories = [
    "Readymade 3-pc Suits",
    "Korean Shirts/ Midis",
    "Wedding/Festive collection",
    "Co-Ord Sets",
    "Winter Wear",
    "Night Suits",
  ];
  const fabrics = ["Cotton", "Imported Fabric", "Silk", "Mul Cotton", "Dola Silk"];

  for (const [index, name] of categories.entries()) {
    await supabase.from("categories").upsert(
      { name, slug: slugify(name), sort_order: index, is_active: true },
      { onConflict: "slug" }
    );
  }

  for (const name of fabrics) {
    await supabase.from("fabrics").upsert(
      { name, slug: slugify(name), is_active: true },
      { onConflict: "slug" }
    );
  }

  let imported = 0;
  let skipped = 0;

  for (const rawRow of rows) {
    const row = parseRow(rawRow);
    if (!row) {
      skipped++;
      continue;
    }

    const { data: existingName } = await supabase
      .from("products")
      .select("id")
      .eq("name", row.name.trim())
      .maybeSingle();
    if (existingName) {
      skipped++;
      console.log(`Skipped (exists): ${row.name}`);
      continue;
    }

    const categoryId = await ensureLookup(supabase, "categories", row.category);
    const fabricId = await ensureLookup(supabase, "fabrics", row.fabric);
    const barcode = await resolveBarcode(supabase, row.productCode);

    const { error } = await supabase.from("products").insert({
      name: row.name,
      slug: `${slugify(row.name)}-${slugify(row.productCode || String(Date.now()))}`,
      description: row.description,
      sku: row.productCode || null,
      barcode,
      category_id: categoryId,
      fabric_id: fabricId,
      price: sellingPrice(row.mrp, row.discountPercent),
      compare_at_price: row.mrp || null,
      colors: parseColors(row.color),
      sizes: parseSizes(row.size),
      stock: 0,
      specifications: {
        cost_price: row.costPrice,
        discount_percent: row.discountPercent,
        color: row.color,
        fabric: row.fabric,
      },
      is_active: true,
    });

    if (error) {
      console.error(`Failed: ${row.name} - ${error.message}`);
      skipped++;
      continue;
    }

    imported++;
    console.log(`Imported: ${row.name}`);
  }

  console.log(`\nDone. Imported ${imported}, skipped ${skipped}, total ${rows.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
