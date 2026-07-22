/**
 * Strips path separators and any character outside a safe allow-list from a
 * user-supplied filename before it's ever used in a public_id hint, stored,
 * or logged — defense against path traversal / control-character injection
 * from a hostile `Content-Disposition` filename.
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? filename;
  const sanitized = base
    .normalize("NFKD")
    .replace(/[^\w.-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 150);
  return sanitized.length > 0 ? sanitized : "upload";
}
