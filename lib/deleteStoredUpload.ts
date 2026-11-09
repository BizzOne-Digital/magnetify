import "server-only";
import { connectDB } from "@/lib/db";
import StoredUpload from "@/models/StoredUpload";
import { isSafeFilename, isUploadFolder } from "@/lib/uploadConstants";

export function parseStoredUploadUrl(url: unknown): { folder: string; filename: string } | null {
  if (typeof url !== "string" || !url.startsWith("/api/uploads/")) return null;
  const parts = url.slice("/api/uploads/".length).split("?")[0].split("/");
  if (parts.length !== 2) return null;
  const [folder, filename] = parts;
  if (!isUploadFolder(folder) || !isSafeFilename(filename)) return null;
  return { folder, filename };
}

/** Deletes a MongoDB-stored upload by its public URL. Silently ignores non-stored URLs (Unsplash, legacy). */
export async function deleteStoredUploadByUrl(url: unknown): Promise<boolean> {
  const parsed = parseStoredUploadUrl(url);
  if (!parsed) return false;
  try {
    await connectDB();
    const res = await StoredUpload.deleteOne({ folder: String(parsed.folder), filename: String(parsed.filename) });
    return res.deletedCount > 0;
  } catch (err) {
    console.error("[upload] delete failed", err);
    return false;
  }
}

/** After a document is saved with new image(s), remove images that are no longer used. */
export async function deleteReplacedUploads(previous: unknown[], next: unknown[]) {
  const keep = new Set(next.filter((v): v is string => typeof v === "string"));
  const stale = previous.filter((v) => typeof v === "string" && !keep.has(v));
  await Promise.all(stale.map((u) => deleteStoredUploadByUrl(u)));
}

/** Recursively collect every /api/uploads/ URL inside an arbitrary JSON value. */
export function collectUploadUrls(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    if (value.startsWith("/api/uploads/")) out.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((v) => collectUploadUrls(v, out));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((v) => collectUploadUrls(v, out));
  }
  return out;
}
