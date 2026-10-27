"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AdminHeader,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminTextarea,
} from "./AdminLayout";
import { ImageUploadInput } from "./image-upload-input";

export interface FieldConfig {
  key: string;
  label: string;
  type?: "text" | "number" | "url" | "textarea" | "checkbox" | "select" | "datetime-local" | "image";
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  defaultValue?: string | number | boolean;
  bucket?: string;
}

interface AdminCrudPageProps {
  title: string;
  description?: string;
  apiPath: string;
  fields: FieldConfig[];
  columns: { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[];
  emptyMessage?: string;
}

export function AdminCrudPage({
  title,
  description,
  apiPath,
  fields,
  columns,
  emptyMessage = "No items yet",
}: AdminCrudPageProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath);
      const json = await res.json();
      setItems(json.data || json.products || []);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    const defaults: Record<string, unknown> = {};
    fields.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.key] = f.defaultValue;
      else if (f.type === "checkbox") defaults[f.key] = true;
      else defaults[f.key] = "";
    });
    setForm(defaults);
    setEditing(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditing(item);
    const values: Record<string, unknown> = {};
    fields.forEach((f) => {
      values[f.key] = item[f.key] ?? (f.type === "checkbox" ? false : "");
    });
    setForm(values);
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = editing ? { ...form, id: editing.id } : form;
      const res = await fetch(apiPath, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(editing ? "Updated successfully" : "Created successfully");
      resetForm();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`${apiPath}?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <AdminHeader title={title} description={description} />
        <AdminButton onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1 inline" /> Add New
        </AdminButton>
      </div>

      {showForm && (
        <AdminCard className="mb-6">
          <h3 className="text-white font-medium mb-4">{editing ? "Edit" : "Create"} {title.slice(0, -1)}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <label className="block text-sm text-zinc-400 mb-1">{field.label}</label>
                {field.type === "textarea" ? (
                  <AdminTextarea
                    value={String(form[field.key] ?? "")}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                  />
                ) : field.type === "checkbox" ? (
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={!!form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })}
                      className="rounded"
                    />
                    Active
                  </label>
                ) : field.type === "select" ? (
                  <AdminSelect
                    value={String(form[field.key] ?? "")}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </AdminSelect>
                ) : field.type === "image" ? (
                  <ImageUploadInput
                    value={String(form[field.key] ?? "")}
                    onChange={(url) => setForm({ ...form, [field.key]: url })}
                    bucket={field.bucket || "banners"}
                    label={field.label}
                  />
                ) : (
                  <AdminInput
                    type={field.type || "text"}
                    required={field.required}
                    value={String(form[field.key] ?? "")}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value,
                      })
                    }
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <AdminButton onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </AdminButton>
            <AdminButton variant="secondary" onClick={resetForm}>Cancel</AdminButton>
          </div>
        </AdminCard>
      )}

      <AdminCard>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          </div>
        ) : !items.length ? (
          <p className="text-zinc-500 text-center py-8">{emptyMessage}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-white/10">
                  {columns.map((col) => (
                    <th key={col.key} className="text-left py-3 px-2">{col.label}</th>
                  ))}
                  <th className="text-right py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={String(item.id)} className="border-b border-white/5 text-zinc-300">
                    {columns.map((col) => (
                      <td key={col.key} className="py-3 px-2">
                        {col.render
                          ? col.render(item)
                          : String(item[col.key] ?? "-")}
                      </td>
                    ))}
                    <td className="py-3 px-2 text-right">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-zinc-400 hover:text-amber-400">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(String(item.id))} className="p-1.5 text-zinc-400 hover:text-red-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>
    </>
  );
}
