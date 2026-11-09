/** Shared (client + server) upload rules. */
export const ADMIN_UPLOAD_FOLDERS = ["products", "gallery", "pages", "misc"] as const;
/** "orders" holds customer magnet artwork submitted at checkout (never writable via the admin upload API). */
export const ALL_UPLOAD_FOLDERS = [...ADMIN_UPLOAD_FOLDERS, "orders"] as const;

export type AdminUploadFolder = (typeof ADMIN_UPLOAD_FOLDERS)[number];
export type UploadFolder = (typeof ALL_UPLOAD_FOLDERS)[number];

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export const MAX_ADMIN_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_ORDER_UPLOAD_BYTES = 4 * 1024 * 1024;

export const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

export function isUploadFolder(v: unknown): v is UploadFolder {
  return typeof v === "string" && (ALL_UPLOAD_FOLDERS as readonly string[]).includes(v);
}

export function isAdminUploadFolder(v: unknown): v is AdminUploadFolder {
  return typeof v === "string" && (ADMIN_UPLOAD_FOLDERS as readonly string[]).includes(v);
}

export function isSafeFilename(v: unknown): v is string {
  return (
    typeof v === "string" &&
    v.length > 0 &&
    v.length <= 120 &&
    !v.includes("..") &&
    !v.includes("/") &&
    !v.includes("\\") &&
    SAFE_FILENAME.test(v)
  );
}

export const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};
