import { requireAdmin, unauthorized } from "@/lib/admin-crud";
import { saveMediaFile } from "@/lib/db/media";

export async function PUT(request: Request) {
  const session = await requireAdmin();
  if (!session) return unauthorized();

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const bucket = url.searchParams.get("bucket") || "videos";

  if (!id) {
    return Response.json({ error: "Missing media id" }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (!buffer.length) {
    return Response.json({ error: "Empty body" }, { status: 400 });
  }

  const contentType = request.headers.get("content-type") || "application/octet-stream";

  try {
    await saveMediaFile(bucket, buffer, contentType, id);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
