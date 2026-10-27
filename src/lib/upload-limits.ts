export const MAX_VIDEO_SIZE_BYTES = 11 * 1024 * 1024;
export const MAX_VIDEO_SIZE_LABEL = "11 MB";

export function validateVideoFileSize(size: number): string | null {
  if (size > MAX_VIDEO_SIZE_BYTES) {
    return `Video must be ${MAX_VIDEO_SIZE_LABEL} or smaller`;
  }
  return null;
}
