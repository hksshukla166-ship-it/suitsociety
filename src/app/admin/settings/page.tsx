"use client";

import { useEffect, useState } from "react";
import { Loader2, Shield, Plus, X, Database } from "lucide-react";
import { toast } from "sonner";
import {
  AdminLayout,
  AdminHeader,
  AdminCard,
  AdminButton,
  AdminInput,
} from "@/components/admin/AdminLayout";
import { BRAND, DEFAULT_ADMIN } from "@/lib/constants";
import { CATALOG_SIZES } from "@/lib/product-catalog";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSizeChart, setSavingSizeChart] = useState(false);
  const [uploadingSizeChart, setUploadingSizeChart] = useState(false);
  const [sizeChartUrl, setSizeChartUrl] = useState("/size-chart.svg");
  const [catalogSizes, setCatalogSizes] = useState<string[]>([]);
  const [newSize, setNewSize] = useState("");
  const [savingSizes, setSavingSizes] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [migrationPassword, setMigrationPassword] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [admin, setAdmin] = useState<{ username: string; must_change_credentials?: boolean } | null>(null);
  const [form, setForm] = useState({
    username: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setAdmin(d.admin);
        setForm((f) => ({ ...f, username: d.admin?.username || "" }));
        const sizeChartSetting = (d.settings || []).find((item: { key: string }) => item.key === "size_chart");
        if (sizeChartSetting?.value?.url) setSizeChartUrl(sizeChartSetting.value.url);
        const sizesSetting = (d.settings || []).find((item: { key: string }) => item.key === "catalog_sizes");
        if (sizesSetting?.value?.sizes?.length) {
          setCatalogSizes(sizesSetting.value.sizes);
        } else {
          setCatalogSizes([...CATALOG_SIZES]);
        }
      })
      .finally(() => setLoading(false));

    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setNeedsMigration(Boolean(data.needsMigration)))
      .catch(() => undefined);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password && !form.currentPassword) {
      toast.error("Current password is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          currentPassword: form.currentPassword || undefined,
          password: form.password || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Settings updated successfully");
      setForm((f) => ({ ...f, currentPassword: "", password: "", confirmPassword: "" }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSizeChartUpload = async (file: File) => {
    setUploadingSizeChart(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "images");
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Upload failed");
      setSizeChartUrl(uploadData.url);
      toast.success("Size chart uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingSizeChart(false);
    }
  };

  const handleSaveSizeChart = async () => {
    setSavingSizeChart(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sizeChartUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Size chart updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingSizeChart(false);
    }
  };

  const saveCatalogSizes = async (sizes: string[]) => {
    setSavingSizes(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogSizes: sizes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCatalogSizes(sizes);
      toast.success("Sizes updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSavingSizes(false);
    }
  };

  const handleAddSize = async () => {
    const trimmed = newSize.trim();
    if (!trimmed) {
      toast.error("Enter a size label");
      return;
    }
    if (catalogSizes.some((size) => size.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("This size already exists");
      return;
    }
    await saveCatalogSizes([...catalogSizes, trimmed]);
    setNewSize("");
  };

  const handleRemoveSize = async (size: string) => {
    await saveCatalogSizes(catalogSizes.filter((item) => item !== size));
  };

  const handleRunMigrations = async () => {
    setMigrating(true);
    try {
      const res = await fetch("/api/admin/migrate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dbPassword: migrationPassword || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Migration failed");
      toast.success("Database migrations applied. You can add products now.");
      setNeedsMigration(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Migration failed");
    } finally {
      setMigrating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <AdminHeader title="Settings" description="Manage admin credentials and store info" />

      {admin?.must_change_credentials && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Please change your default credentials after first login.
        </div>
      )}

      {needsMigration && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">
          Product columns are missing in your database (`cost_price`, `discount_percent`, `size_stock`).
          Apply migrations below before adding products.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard>
          <h3 className="text-white font-medium mb-4">Change Admin Credentials</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Username</label>
              <AdminInput
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Current Password</label>
              <AdminInput
                type="password"
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">New Password</label>
              <AdminInput
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Confirm New Password</label>
              <AdminInput
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              />
            </div>
            <AdminButton type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </AdminButton>
          </form>
        </AdminCard>

        <AdminCard>
          <h3 className="text-white font-medium mb-4">Product Sizes</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Add custom size labels for products, e.g. 3XL (44). These appear when adding or editing products.
          </p>
          <div className="space-y-4">
            <div className="flex gap-2">
              <AdminInput
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="e.g. 3XL (44)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSize();
                  }
                }}
              />
              <AdminButton type="button" onClick={handleAddSize} disabled={savingSizes}>
                {savingSizes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              </AdminButton>
            </div>
            {catalogSizes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {catalogSizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-zinc-800 text-sm text-zinc-200"
                  >
                    {size}
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(size)}
                      disabled={savingSizes}
                      className="text-zinc-500 hover:text-red-400"
                      aria-label={`Remove ${size}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">
                No custom sizes yet. Default sizes from the catalog are used until you add one here.
              </p>
            )}
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="text-white font-medium mb-4">Size Chart Image</h3>
          <p className="text-sm text-zinc-400 mb-4">
            Upload or paste a URL for the size chart shown on the storefront Size Chart page.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Image URL</label>
              <AdminInput
                value={sizeChartUrl}
                onChange={(e) => setSizeChartUrl(e.target.value)}
                placeholder="/size-chart.svg"
              />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSizeChartUpload(file);
                }}
                disabled={uploadingSizeChart}
                className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30"
              />
              {uploadingSizeChart && <p className="text-xs text-zinc-500 mt-1">Uploading...</p>}
            </div>
            {sizeChartUrl && (
              <div className="rounded-lg border border-zinc-800 overflow-hidden bg-zinc-900/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sizeChartUrl} alt="Size chart preview" className="w-full max-h-64 object-contain" />
              </div>
            )}
            <AdminButton type="button" onClick={handleSaveSizeChart} disabled={savingSizeChart}>
              {savingSizeChart ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Size Chart"}
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400" />
            Database Migrations
          </h3>
          <p className="text-sm text-zinc-400 mb-4">
            Run this if product creation fails with a missing `cost_price` column error.
            Uses your Supabase database password (Settings → Database in Supabase Dashboard).
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Supabase Database Password</label>
              <AdminInput
                type="password"
                value={migrationPassword}
                onChange={(e) => setMigrationPassword(e.target.value)}
                placeholder="Leave blank if SUPABASE_DB_PASSWORD is in .env.local"
              />
            </div>
            <AdminButton type="button" onClick={handleRunMigrations} disabled={migrating}>
              {migrating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Database Migrations"}
            </AdminButton>
          </div>
        </AdminCard>

        <AdminCard>
          <h3 className="text-white font-medium mb-4">Store Information</h3>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-zinc-500">Brand</dt>
              <dd className="text-white">{BRAND.name}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd className="text-white">{BRAND.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Phone</dt>
              <dd className="text-white">{BRAND.phone}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Address</dt>
              <dd className="text-white">{BRAND.address}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Default Admin Username</dt>
              <dd className="text-zinc-400 font-mono">{DEFAULT_ADMIN.username}</dd>
            </div>
          </dl>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
