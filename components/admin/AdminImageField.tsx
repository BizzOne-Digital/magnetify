"use client";

import { useId, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUp, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { ALLOWED_IMAGE_TYPES, MAX_ADMIN_UPLOAD_BYTES, type AdminUploadFolder } from "@/lib/uploadConstants";
import { getSafeImageUrl } from "@/lib/imageUrl";

/** Vercel functions accept ~4.5MB request bodies, so larger still images are re-encoded to WebP in the browser first. */
const PLATFORM_SAFE_BYTES = 4 * 1024 * 1024;

async function compressIfNeeded(file: File): Promise<File> {
  if (file.size <= PLATFORM_SAFE_BYTES || file.type === "image/gif") return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("Could not read image"));
      i.src = url;
    });
    for (const [maxPx, q] of [
      [2600, 0.88],
      [2000, 0.82],
      [1600, 0.78],
    ] as const) {
      const r = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * r);
      c.height = Math.round(img.naturalHeight * r);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise<Blob | null>((res) => c.toBlob(res, "image/webp", q));
      if (blob && blob.size <= PLATFORM_SAFE_BYTES) {
        return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
      }
    }
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function AdminImageField({
  value,
  onChange,
  folder,
  label,
  help,
}: {
  value: string;
  onChange: (url: string) => void;
  folder: AdminUploadFolder;
  label: string;
  help?: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED_IMAGE_TYPES[file.type]) {
      toast.error("Unsupported format. Please use PNG, JPEG, WebP or GIF.");
      return;
    }
    if (file.size > MAX_ADMIN_UPLOAD_BYTES) {
      toast.error("Image is larger than 8MB. Please choose a smaller file.");
      return;
    }
    setUploading(true);
    try {
      const ready = await compressIfNeeded(file);
      const fd = new FormData();
      fd.append("file", ready);
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) throw new Error("Your session expired. Please log in again.");
      if (!res.ok || !json.url) throw new Error(json.error || "Upload failed");
      onChange(json.url as string); // store URL only — never binary
      toast.success("Image uploaded. Remember to save your changes.");
    } catch (err) {
      toast.error((err as Error).message || "Network error during upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const preview = value ? getSafeImageUrl(value) : "";

  return (
    <div>
      <span className="label" id={`${id}-label`}>
        {label}
      </span>
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#101010] p-3 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gold/30 bg-black">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`${label} preview`} className="h-full w-full object-cover" />
          ) : (
            <ImageUp className="h-8 w-8 text-gold/50" aria-hidden="true" />
          )}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Loader2 className="h-6 w-6 animate-spin text-gold" aria-label="Uploading" />
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            aria-labelledby={`${id}-label`}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="flex flex-wrap gap-2">
            {value ? (
              <>
                <button type="button" className="btn btn-secondary btn-sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                  <RefreshCw className="h-4 w-4" aria-hidden="true" /> Replace
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={uploading}
                  onClick={() => {
                    onChange("");
                    toast.message("Image removed. Save to apply.");
                  }}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                </button>
              </>
            ) : (
              <button type="button" className="btn btn-gold btn-sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                <ImageUp className="h-4 w-4" aria-hidden="true" /> {uploading ? "Uploading…" : "Upload image"}
              </button>
            )}
          </div>
          <p className="truncate text-xs text-muted" title={value}>
            {value || "PNG, JPEG, WebP or GIF · max 8MB"}
          </p>
          {help ? <p className="text-xs text-muted">{help}</p> : null}
        </div>
      </div>
    </div>
  );
}
