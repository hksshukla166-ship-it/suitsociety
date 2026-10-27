import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { ensureStorageBucket } from "@/lib/storage-setup";
import { createServiceClient } from "@/lib/supabase/server";
import { validateVideoFileSize } from "@/lib/upload-limits";

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  try {
    const body = await request.json();
    const fileName = String(body.fileName || "");
    const contentType = String(body.contentType || "video/mp4");
    const size = Number(body.size);
    const bucket = String(body.bucket || "videos");

    if (!fileName || !Number.isFinite(size) || size <= 0) {
      return Response.json({ error: "Invalid file metadata" }, { status: 400 });
    }

    const isVideoUpload = bucket === "videos" || contentType.startsWith("video/");
    if (isVideoUpload) {
      const sizeError = validateVideoFileSize(size);
      if (sizeError) {
        return Response.json({ error: sizeError }, { status: 400 });
      }
    }

    const ext = fileName.split(".").pop() || "mp4";
    const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const supabase = createServiceClient();
    await ensureStorageBucket(bucket);
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path);

    if (error || !data) {
      const errMsg =
        error && typeof error === "object" && "message" in error
          ? String((error as { message: string }).message)
          : "Could not create upload URL";
      return Response.json({ error: errMsg }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);

    return Response.json({
      path: data.path,
      token: data.token,
      signedUrl: data.signedUrl,
      publicUrl: urlData.publicUrl,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not prepare upload" },
      { status: 500 }
    );
  }
}
