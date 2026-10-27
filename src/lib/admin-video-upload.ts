import { createClient } from "@/lib/supabase/client";
import { parseApiResponse } from "@/lib/api-response";
import { MAX_VIDEO_SIZE_LABEL } from "@/lib/upload-limits";

interface SignedUploadResponse {
  path: string;
  token: string;
  signedUrl: string;
  publicUrl: string;
  error?: string;
}

async function uploadToStorage(
  bucket: string,
  path: string,
  token: string,
  signedUrl: string,
  file: File
) {
  const supabase = createClient();
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file, {
    contentType: file.type || "video/mp4",
    upsert: false,
  });

  if (!error) return;

  const putResponse = await fetch(signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "video/mp4",
    },
    body: file,
  });

  if (putResponse.ok) return;

  const putError = (await putResponse.text()).trim();
  if (putResponse.status === 413 || /entity too large/i.test(putError)) {
    throw new Error(`Video must be ${MAX_VIDEO_SIZE_LABEL} or smaller.`);
  }

  throw new Error(putError || error.message || "Upload to storage failed");
}

export async function uploadAdminVideo(file: File, bucket = "videos"): Promise<string> {
  const signedRes = await fetch("/api/admin/upload/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "video/mp4",
      size: file.size,
      bucket,
    }),
  });

  const signed = await parseApiResponse<SignedUploadResponse>(signedRes);
  if (!signedRes.ok) {
    throw new Error(signed.error || "Could not prepare upload");
  }

  if (!signed.signedUrl || !signed.publicUrl || !signed.path || !signed.token) {
    throw new Error("Invalid upload response from server");
  }

  if (typeof sessionStorage !== "undefined") {
    sessionStorage.setItem("ss_last_signed_upload_url", signed.signedUrl);
  }

  await uploadToStorage(bucket, signed.path, signed.token, signed.signedUrl, file);
  return signed.publicUrl;
}
