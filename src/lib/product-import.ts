import type { createServiceClient } from "@/lib/supabase/server";

type DbClient = ReturnType<typeof createServiceClient>;
import { slugify } from "@/lib/utils";
import { resolveProductBarcode } from "@/lib/barcode";
import {
  calculateSellingPrice,
  parseColorList,
  parseExcelProductRow,
  parseSizeList,
  uniqueSlug,
  type ExcelProductRow,
} from "@/lib/product-catalog";

type ImportResult = {
  imported: number;
  skipped: number;
  errors: string[];
  skippedDetails: string[];
  total: number;
};

async function ensureCategory(
  supabase: DbClient,
  name: string
): Promise<string | null> {
  if (!name) return null;
  const slug = slugify(name);
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("categories")
    .insert({ name, slug, is_active: true })
    .select("id")
    .single();

  if (error) throw new Error(`Category "${name}": ${error.message}`);
  return created.id;
}

async function ensureFabric(
  supabase: DbClient,
  name: string
): Promise<string | null> {
  if (!name) return null;
  const slug = slugify(name);
  const { data: existing } = await supabase
    .from("fabrics")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data: created, error } = await supabase
    .from("fabrics")
    .insert({ name, slug, is_active: true })
    .select("id")
    .single();

  if (error) throw new Error(`Fabric "${name}": ${error.message}`);
  return created.id;
}

async function findExistingProduct(
  supabase: DbClient,
  row: ExcelProductRow
) {
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("name", row.name.trim())
    .maybeSingle();

  return data;
}

export async function importProductRows(
  supabase: DbClient,
  rows: Record<string, unknown>[]
): Promise<ImportResult> {
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];
  const skippedDetails: string[] = [];

  for (const rawRow of rows) {
    try {
      const row = parseExcelProductRow(rawRow);
      if (!row) {
        skipped++;
        skippedDetails.push("Empty row (no product name)");
        continue;
      }

      const existing = await findExistingProduct(supabase, row);
      if (existing) {
        skipped++;
        skippedDetails.push(`Already exists: ${row.name}`);
        continue;
      }

      const categoryId = await ensureCategory(supabase, row.category);
      const fabricId = await ensureFabric(supabase, row.fabric);
      const price = calculateSellingPrice(row.mrp, row.discountPercent);
      const colors = parseColorList(row.color);
      const sizes = parseSizeList(row.size);
      const slug = uniqueSlug(row.name, row.productCode || String(Date.now()));
      const barcode = await resolveProductBarcode(supabase, row.productCode);

      const { error } = await supabase.from("products").insert({
        name: row.name,
        slug,
        description: row.description,
        sku: row.productCode || null,
        barcode,
        category_id: categoryId,
        fabric_id: fabricId,
        price,
        compare_at_price: row.mrp || null,
        colors,
        sizes,
        stock: 0,
        specifications: {
          cost_price: row.costPrice,
          discount_percent: row.discountPercent,
          color: row.color,
          fabric: row.fabric,
        },
        is_active: true,
      });

      if (error) throw new Error(error.message);
      imported++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : "Unknown row error");
    }
  }

  return { imported, skipped, errors, skippedDetails, total: rows.length };
}

export async function seedCatalogLookups(supabase: DbClient) {
  const { CATALOG_CATEGORIES, CATALOG_FABRICS } = await import("@/lib/product-catalog");

  for (const [index, name] of CATALOG_CATEGORIES.entries()) {
    const slug = slugify(name);
    await supabase.from("categories").upsert(
      { name, slug, sort_order: index, is_active: true },
      { onConflict: "slug" }
    );
  }

  for (const name of CATALOG_FABRICS) {
    const slug = slugify(name);
    await supabase.from("fabrics").upsert(
      { name, slug, is_active: true },
      { onConflict: "slug" }
    );
  }
}
