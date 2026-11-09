import "server-only";
import crypto from "node:crypto";
import { connectDB } from "@/lib/db";
import StoredUpload from "@/models/StoredUpload";
import { ALLOWED_IMAGE_TYPES, type UploadFolder } from "@/lib/uploadConstants";

export class UploadError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/** Validates an uploaded image and stores its bytes in MongoDB. Never touches the filesystem. */
export async function storeImageUpload(file: unknown, folder: UploadFolder, maxBytes: number) {
  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    throw new UploadError("No file provided");
  }
  const f = file as File;
  const ext = ALLOWED_IMAGE_TYPES[f.type];
  if (!ext) throw new UploadError("Unsupported file type. Use PNG, JPEG, WebP or GIF.", 415);
  if (f.size <= 0) throw new UploadError("File is empty");
  if (f.size > maxBytes) {
    throw new UploadError(`File is too large. Maximum size is ${Math.round(maxBytes / 1024 / 1024)}MB.`, 413);
  }

  const buffer = Buffer.from(await f.arrayBuffer());
  if (buffer.length > maxBytes) throw new UploadError("File is too large.", 413);
  if (!matchesMagicBytes(buffer, f.type)) throw new UploadError("File content does not match its image type.", 415);

  const filename = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${ext}`;
  await connectDB();
  await StoredUpload.create({ folder, filename, mimeType: f.type as "image/jpeg", size: buffer.length, data: buffer });

  return { url: `/api/uploads/${folder}/${filename}`, filename, size: buffer.length, folder };
}

function matchesMagicBytes(b: Buffer, mime: string) {
  if (b.length < 12) return false;
  switch (mime) {
    case "image/jpeg":
      return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
    case "image/png":
      return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
    case "image/gif":
      return b.subarray(0, 3).toString("ascii") === "GIF";
    case "image/webp":
      return b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP";
    default:
      return false;
  }
}
