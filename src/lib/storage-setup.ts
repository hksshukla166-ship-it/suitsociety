/** MySQL stores files in media_files — no external buckets to configure. */
export async function ensureStorageBucket(_bucket: string): Promise<void> {
  return;
}

export async function ensureStorageBuckets(): Promise<void> {
  return;
}
