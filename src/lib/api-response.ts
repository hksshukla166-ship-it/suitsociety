export async function parseApiResponse<T extends { error?: string }>(
  response: Response
): Promise<T> {
  const text = await response.text();

  if (!text) {
    return { error: response.statusText || "Empty server response" } as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const message = text.trim();

    if (response.status === 413 || /request entity too large/i.test(message)) {
      throw new Error(
        "Upload is too large for the server limit. Videos must be 11 MB or smaller. Stop the dev server, run npm run dev again, then retry."
      );
    }

    throw new Error(message.slice(0, 240) || "Unexpected server response");
  }
}
