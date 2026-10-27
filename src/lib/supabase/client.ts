/** Browser client — uploads go through signed URLs / API, not direct MySQL. */
export function createClient() {
  return {
    storage: {
      from(_bucket: string) {
        return {
          async uploadToSignedUrl(
            _path: string,
            _token: string,
            file: File,
            options?: { contentType?: string; upsert?: boolean }
          ) {
            const signedUrl = sessionStorage.getItem("ss_last_signed_upload_url");
            if (!signedUrl) {
              return { data: null, error: { message: "Missing signed upload URL" } };
            }
            const putResponse = await fetch(signedUrl, {
              method: "PUT",
              headers: { "Content-Type": options?.contentType || file.type || "application/octet-stream" },
              body: file,
            });
            if (!putResponse.ok) {
              const text = (await putResponse.text()).trim();
              return { data: null, error: { message: text || "Upload failed" } };
            }
            return { data: { path: _path }, error: null };
          },
        };
      },
    },
    auth: {
      async getUser() {
        return { data: { user: null }, error: null };
      },
    },
  };
}
