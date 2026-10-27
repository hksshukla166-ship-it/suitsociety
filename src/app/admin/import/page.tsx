"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EXCEL_COLUMN_GUIDE, CATALOG_CATEGORIES, CATALOG_FABRICS, CATALOG_COLORS, CATALOG_SIZES } from "@/lib/product-catalog";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, Upload } from "lucide-react";

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [seedCatalog, setSeedCatalog] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    total: number;
    errors: string[];
  } | null>(null);

  const handleImport = async () => {
    if (!file) {
      toast.error("Select an Excel file first");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("seed_catalog", seedCatalog.toString());

    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Import failed");
        return;
      }

      setResult(json);
      toast.success(`Imported ${json.imported} products`);
    } catch {
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-serif tracking-wider text-white">Excel Product Import</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import products from your spreadsheet with categories, fabrics, colors, and sizes.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Expected Excel Columns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {EXCEL_COLUMN_GUIDE.map((col) => (
                <span key={col} className="px-2 py-1 text-xs rounded-md bg-muted border">
                  {col}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Catalog from Spreadsheet</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-1">Categories</p>
              <p className="text-muted-foreground">{CATALOG_CATEGORIES.join(", ")}</p>
            </div>
            <div>
              <p className="font-medium mb-1">Fabrics</p>
              <p className="text-muted-foreground">{CATALOG_FABRICS.join(", ")}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upload File</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={seedCatalog}
                onChange={(e) => setSeedCatalog(e.target.checked)}
              />
              Seed categories &amp; fabrics from spreadsheet before import
            </label>
            <Button variant="luxury" onClick={handleImport} disabled={loading || !file}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-4 h-4" /> Import Products</>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card>
            <CardHeader><CardTitle>Import Result</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Total rows: {result.total}</p>
              <p className="text-green-600">Imported: {result.imported}</p>
              <p className="text-yellow-600">Skipped: {result.skipped}</p>
              {result.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-medium text-red-600">Errors:</p>
                  <ul className="list-disc pl-5 text-red-600">
                    {result.errors.map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
