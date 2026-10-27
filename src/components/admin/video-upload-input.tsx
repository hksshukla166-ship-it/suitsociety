"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MAX_VIDEO_SIZE_LABEL, validateVideoFileSize } from "@/lib/upload-limits";
import { uploadAdminVideo } from "@/lib/admin-video-upload";
import { cn } from "@/lib/utils";

interface Props {
  onUploaded: (url: string) => void;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  hintClassName?: string;
}

export function VideoUploadInput({
  onUploaded,
  disabled,
  className,
  inputClassName,
  hintClassName,
}: Props) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please upload a video file (mp4, webm)");
      e.target.value = "";
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
      onUploaded(publicUrl);
      toast.success("Video uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleChange}
        disabled={disabled || uploading}
        className={cn(
          "block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-amber-500 file:text-zinc-950 disabled:opacity-50",
          inputClassName
        )}
      />
      <p className={cn("text-xs text-muted-foreground mt-1", hintClassName)}>
        Maximum file size: {MAX_VIDEO_SIZE_LABEL}
      </p>
      {uploading && (
        <p className={cn("text-xs text-muted-foreground mt-1 flex items-center gap-1", hintClassName)}>
          <Loader2 className="w-3 h-3 animate-spin" /> Uploading...
        </p>
      )}
    </div>
  );
}
