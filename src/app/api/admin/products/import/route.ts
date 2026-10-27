import { getAdminSession } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { importProductRows, seedCatalogLookups } from "@/lib/product-import";
import * as XLSX from "xlsx";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const seedCatalog = formData.get("seed_catalog") === "true";

    if (!file) return Response.json({ error: "Excel file required" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

    const supabase = createServiceClient();

    if (seedCatalog) {
      await seedCatalogLookups(supabase);
    }

    const result = await importProductRows(supabase, rows);

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}
