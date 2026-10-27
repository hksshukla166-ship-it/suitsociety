import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { ensureStorageBucket } from "@/lib/storage-setup";
import { createServiceClient } from "@/lib/supabase/server";
import { validateVideoFileSize } from "@/lib/upload-limits";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "videos";

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return Response.json(
        { error: "Upload failed. The file may have exceeded the server upload limit. Please try again." },
        { status: 400 }
      );
    }

    const isVideoUpload = bucket === "videos" || file.type.startsWith("video/");
    if (isVideoUpload) {
      const sizeError = validateVideoFileSize(file.size);
      if (sizeError) {
        return Response.json({ error: sizeError }, { status: 400 });
      }
    } else if ((bucket === "banners" || bucket === "images") && !file.type.startsWith("image/")) {
      return Response.json({ error: "Please upload an image file (JPG, PNG, WebP, or GIF)" }, { status: 400 });
    }

    const supabase = createServiceClient();
    await ensureStorageBucket(bucket);
    const ext = file.name.split(".").pop() || "mp4";
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return Response.json({ url: data.publicUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    if (/entity too large|body exceeded|413/i.test(message)) {
      return Response.json(
        {
          error:
            "Upload too large. Videos must be 11 MB or smaller. Use Admin → Videos upload (direct to storage). Restart dev server after updates.",
        },
        { status: 413 }
      );
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
