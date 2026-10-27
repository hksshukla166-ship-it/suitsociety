"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { MAX_VIDEO_SIZE_LABEL, validateVideoFileSize } from "@/lib/upload-limits";
import { uploadAdminVideo } from "@/lib/admin-video-upload";
import {
  AdminHeader,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminSelect,
} from "./AdminLayout";

interface ProductOption {
  id: string;
  name: string;
}

interface ProductVideoOption {
  id: string;
  url: string;
  title?: string;
  product_id?: string;
  product?: { id: string; name: string; slug?: string } | null;
}

interface VideoItem {
  id: string;
  title?: string;
  video_url: string;
  thumbnail_url?: string;
  product_id?: string;
  sort_order?: number;
  is_active?: boolean;
}

export function AdminVideosManager() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productVideos, setProductVideos] = useState<ProductVideoOption[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<VideoItem | null>(null);
  const [form, setForm] = useState({
    title: "",
    video_url: "",
    thumbnail_url: "",
    product_id: "",
    sort_order: 0,
    is_active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [videosRes, productsRes, productVideosRes] = await Promise.all([
        fetch("/api/admin/videos"),
        fetch("/api/admin/products"),
        fetch("/api/admin/product-videos"),
      ]);
      const videosJson = await videosRes.json();
      const productsJson = await productsRes.json();
      const productVideosJson = await productVideosRes.json();
      setVideos(videosJson.data || []);
      setProductVideos(productVideosJson.data || []);
      setProducts(
        (productsJson.data || productsJson.products || []).map((p: ProductOption) => ({
          id: p.id,
          name: p.name,
        }))
      );
    } catch {
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({
      title: "",
      video_url: "",
      thumbnail_url: "",
      product_id: "",
      sort_order: 0,
      is_active: true,
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleProductVideoSelect = (videoId: string) => {
    const pv = productVideos.find((v) => v.id === videoId);
    if (!pv) return;
    setForm({
      ...form,
      video_url: pv.url,
      product_id: pv.product_id || pv.product?.id || "",
      title: form.title || pv.title || pv.product?.name || "",
    });
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file (mp4, webm)");
      return;
    }
    const sizeError = validateVideoFileSize(file.size);
    if (sizeError) {
      toast.error(sizeError);
      e.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const publicUrl = await uploadAdminVideo(file);
      setForm({ ...form, video_url: publicUrl });
      toast.success("Video uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.video_url) {
      toast.error("Video URL is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        product_id: form.product_id || null,
        sort_order: Number(form.sort_order) || 0,
      };
      const res = await fetch("/api/admin/videos", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      toast.success(editing ? "Video updated" : "Video added");
      resetForm();
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    await fetch(`/api/admin/videos?id=${id}`, { method: "DELETE" });
    toast.success("Video deleted");
    load();
  };

  return (
    <>
      <AdminHeader
        title="Homepage Videos"
        description="Add videos to play on the homepage. Link a product so customers can shop directly."
      />

      <div className="flex justify-end mb-4">
        <AdminButton onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Video
        </AdminButton>
      </div>

      {showForm && (
        <AdminCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400">Title</label>
              <AdminInput value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Linked Product</label>
              <AdminSelect
                value={form.product_id}
                onChange={(e) => setForm({ ...form, product_id: e.target.value })}
              >
                <option value="">No product link</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </AdminSelect>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-zinc-400">Select from product videos</label>
              <AdminSelect
                value=""
                onChange={(e) => handleProductVideoSelect(e.target.value)}
              >
                <option value="">Choose a product video...</option>
                {productVideos.map((pv) => (
                  <option key={pv.id} value={pv.id}>
                    {pv.product?.name || "Product"} — {pv.title || pv.url.slice(-30)}
                  </option>
                ))}
              </AdminSelect>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-zinc-400">Video URL *</label>
              <AdminInput
                required
                placeholder="https://... (mp4 or hosted video URL)"
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-zinc-400">Or upload video file</label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={handleVideoUpload}
                disabled={uploading}
                className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500 file:text-zinc-950"
              />
              <p className="text-xs text-zinc-500 mt-1">Maximum file size: {MAX_VIDEO_SIZE_LABEL}</p>
              {uploading && <p className="text-xs text-zinc-500 mt-1">Uploading...</p>}
            </div>
            <div>
              <label className="text-sm text-zinc-400">Thumbnail URL</label>
              <AdminInput
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400">Sort Order</label>
              <AdminInput
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span className="text-sm text-zinc-300">Show on homepage</span>
            </div>
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
        ) : !videos.length ? (
          <p className="text-zinc-500 text-center py-8">No videos yet. Add your first homepage video.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-zinc-400 border-b border-white/10">
                  <th className="text-left py-3 px-2">Title</th>
                  <th className="text-left py-3 px-2">Product</th>
                  <th className="text-left py-3 px-2">Status</th>
                  <th className="text-right py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video.id} className="border-b border-white/5 text-zinc-300">
                    <td className="py-3 px-2">{video.title || "Untitled"}</td>
                    <td className="py-3 px-2">
                      {products.find((p) => p.id === video.product_id)?.name || "-"}
                    </td>
                    <td className="py-3 px-2">
                      <span className={video.is_active ? "text-green-400" : "text-red-400"}>
                        {video.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => {
                          setEditing(video);
                          setForm({
                            title: video.title || "",
                            video_url: video.video_url,
                            thumbnail_url: video.thumbnail_url || "",
                            product_id: video.product_id || "",
                            sort_order: video.sort_order || 0,
                            is_active: video.is_active ?? true,
                          });
                          setShowForm(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-amber-400"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400"
                      >
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
