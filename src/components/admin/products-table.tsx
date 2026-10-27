"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarcodeDownloadButton } from "@/components/admin/BarcodeDownloadButton";
import { deleteProduct } from "@/actions/products";
import { Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type AdminProductRow = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string;
  price: number;
  stock: number;
  is_active: boolean;
  category?: { name: string } | null;
};

export function ProductsTable({ products }: { products: AdminProductRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.category?.name || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const handleDelete = (product: AdminProductRow) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    startTransition(async () => {
      const result = await deleteProduct(product.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Product deleted");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, code, barcode, category..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">Product</th>
              <th className="text-left p-3 font-medium">Code</th>
              <th className="text-left p-3 font-medium">Barcode</th>
              <th className="text-left p-3 font-medium">Category</th>
              <th className="text-left p-3 font-medium">Price</th>
              <th className="text-left p-3 font-medium">Stock</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th className="text-left p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-t hover:bg-muted/30">
                <td className="p-3 font-medium">{product.name}</td>
                <td className="p-3 font-mono text-xs">{product.sku || "-"}</td>
                <td className="p-3 font-mono text-xs">{product.barcode}</td>
                <td className="p-3 text-muted-foreground">{product.category?.name || "-"}</td>
                <td className="p-3">{formatPrice(product.price)}</td>
                <td className="p-3">
                  <span
                    className={
                      product.stock <= 0
                        ? "text-red-600"
                        : product.stock <= 5
                          ? "text-yellow-600"
                          : ""
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="p-3">
                  <Badge variant={product.is_active ? "default" : "secondary"}>
                    {product.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-gold hover:underline text-xs"
                    >
                      Edit
                    </Link>
                    <BarcodeDownloadButton value={product.barcode} productName={product.name} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      disabled={pending}
                      onClick={() => handleDelete(product)}
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  {search ? "No products match your search." : "No products yet. Add your first product!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
