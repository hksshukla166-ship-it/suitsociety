"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminInput } from "./AdminLayout";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

interface ImageUploadInputProps {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  label?: string;
  disabled?: boolean;
}

export function ImageUploadInput({
  value,
  onChange,
  bucket = "banners",
  label = "Image",
  disabled = false,
}: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WebP, or GIF image");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be 10 MB or smaller");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", bucket);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <AdminInput
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... or upload below"
        disabled={disabled || uploading}
      />
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          disabled={disabled || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 hover:border-amber-400/40 hover:text-amber-400 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload {label}
        </button>
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Preview" className="h-12 w-12 rounded object-cover border border-white/10" />
        )}
      </div>
    </div>
  );
}
