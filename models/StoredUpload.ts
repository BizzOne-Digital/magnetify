import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ALL_UPLOAD_FOLDERS, SAFE_FILENAME } from "@/lib/uploadConstants";

const StoredUploadSchema = new Schema(
  {
    folder: { type: String, required: true, enum: ALL_UPLOAD_FOLDERS as unknown as string[] },
    filename: { type: String, required: true, match: SAFE_FILENAME, maxlength: 120 },
    mimeType: { type: String, required: true, enum: ["image/jpeg", "image/png", "image/webp", "image/gif"] },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

StoredUploadSchema.index({ folder: 1, filename: 1 }, { unique: true });

export type StoredUploadDoc = InferSchemaType<typeof StoredUploadSchema>;

export const StoredUpload: Model<StoredUploadDoc> =
  (mongoose.models.StoredUpload as Model<StoredUploadDoc>) ||
  mongoose.model<StoredUploadDoc>("StoredUpload", StoredUploadSchema);

export default StoredUpload;
