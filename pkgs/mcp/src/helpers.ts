/**
 * Helper function to get file extension from content type
 *
 * @param contentType - MIME type of the file
 * @returns File extension with dot prefix
 */
export function getFileExtension(contentType: string): string {
  const mimeToExtension: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
    "text/plain": ".txt",
    "application/json": ".json",
    "text/html": ".html",
    "text/css": ".css",
    "application/javascript": ".js",
    "application/octet-stream": ".bin",
  };

  return mimeToExtension[contentType] || ".bin";
}
