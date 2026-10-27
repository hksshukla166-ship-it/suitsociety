import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2/promise";
import { getPool } from "@/lib/db/pool";

export function mediaPublicUrl(mediaId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/media/${mediaId}`;
}

export async function saveMediaFile(
  bucket: string,
  buffer: Buffer,
  contentType: string,
  existingId?: string
): Promise<{ id: string; publicUrl: string }> {
  const id = existingId || randomUUID();
  const pool = getPool();
  await pool.execute(
    `INSERT INTO media_files (id, bucket, content_type, file_data) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE bucket = VALUES(bucket), content_type = VALUES(content_type), file_data = VALUES(file_data)`,
    [id, bucket, contentType, buffer]
  );
  return { id, publicUrl: mediaPublicUrl(id) };
}

export async function getMediaFile(
  id: string
): Promise<{ contentType: string; data: Buffer } | null> {
  const pool = getPool();
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT content_type, file_data FROM media_files WHERE id = ? LIMIT 1`,
    [id]
  );
  const row = rows[0];
  if (!row) return null;
  const data = Buffer.isBuffer(row.file_data)
    ? row.file_data
    : Buffer.from(row.file_data as ArrayBuffer);
  return { contentType: row.content_type as string, data };
}
