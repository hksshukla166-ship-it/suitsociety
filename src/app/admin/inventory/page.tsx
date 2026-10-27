"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  AdminLayout,
  AdminHeader,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminSelect,
} from "@/components/admin/AdminLayout";

interface InventoryRecord {
  id: string;
  type: string;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  notes?: string;
  created_at: string;
  product?: { name?: string; barcode?: string; stock?: number };
}

export default function AdminInventoryPage() {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    product_id: "",
    type: "stock_in",
    quantity: 1,
    notes: "",
  });
  const [products, setProducts] = useState<{ id: string; name: string; barcode: string; stock: number }[]>([]);

  const load = (q?: string) => {
    setLoading(true);
    const param = q ? `?search=${encodeURIComponent(q)}` : "";
    fetch(`/api/admin/inventory${param}`)
      .then((r) => r.json())
      .then((d) => setRecords(d.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  const handleStockUpdate = async () => {
    if (!form.product_id || form.quantity <= 0) {
      toast.error("Select a product and enter quantity");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Stock updated");
      setShowForm(false);
      setForm({ product_id: "", type: "stock_in", quantity: 1, notes: "" });
      load(search);
      fetch("/api/admin/products")
        .then((r) => r.json())
        .then((d) => setProducts(d.products || []));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-start mb-6">
        <AdminHeader title="Inventory" description="Stock management and history" />
        <AdminButton onClick={() => setShowForm(!showForm)}>Stock In / Out</AdminButton>
      </div>

      {showForm && (
        <AdminCard className="mb-6">
          <h3 className="text-white font-medium mb-4">Update Stock</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Product</label>
              <AdminSelect
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              >
                <option value="">Select product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.barcode}) — Stock: {p.stock}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Type</label>
              <AdminSelect
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="stock_in">Stock In</option>
                <option value="stock_out">Stock Out</option>
              </AdminSelect>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Quantity</label>
              <AdminInput
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Notes</label>
              <AdminInput
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <AdminButton onClick={handleStockUpdate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Stock"}
            </AdminButton>
            <AdminButton variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </AdminButton>
          </div>
        </AdminCard>
      )}

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <AdminInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by barcode or product name..."
          className="max-w-md"
        />
        <AdminButton type="submit">
          <Search className="w-4 h-4" />
        </AdminButton>
      </form>

      <AdminCard>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : !records.length ? (
          <p className="text-zinc-500 text-center py-8">No inventory records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-white/10">
                  <th className="text-left py-3 px-2">Product</th>
                  <th className="text-left py-3 px-2">Barcode</th>
                  <th className="text-left py-3 px-2">Type</th>
                  <th className="text-right py-3 px-2">Qty</th>
                  <th className="text-right py-3 px-2">Before</th>
                  <th className="text-right py-3 px-2">After</th>
                  <th className="text-left py-3 px-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 text-zinc-300">
                    <td className="py-3 px-2">{r.product?.name || "-"}</td>
                    <td className="py-3 px-2 font-mono text-xs">{r.product?.barcode}</td>
                    <td className="py-3 px-2 capitalize">{r.type.replace("_", " ")}</td>
                    <td className="py-3 px-2 text-right">{r.quantity > 0 ? `+${r.quantity}` : r.quantity}</td>
                    <td className="py-3 px-2 text-right">{r.previous_stock}</td>
                    <td className="py-3 px-2 text-right">{r.new_stock}</td>
                    <td className="py-3 px-2 text-zinc-500">
                      {new Date(r.created_at).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </AdminLayout>
  );
}
