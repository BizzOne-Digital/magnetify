"use client";
/**
 * Browser-only photo storage (IndexedDB). Customer photos stay on the device while editing;
 * nothing is uploaded until checkout.
 */
const DB_NAME = "magnetify";
const STORE = "photos";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const putPhoto = (key: string, blob: Blob) => tx("readwrite", (s) => s.put(blob, key));
export const getPhoto = (key: string) => tx<Blob | undefined>("readonly", (s) => s.get(key));
export const deletePhoto = (key: string) => tx("readwrite", (s) => s.delete(key));
export const allPhotoKeys = () => tx<IDBValidKey[]>("readonly", (s) => s.getAllKeys());

const urlCache = new Map<string, string>();
export async function getPhotoUrl(key: string): Promise<string | null> {
  if (urlCache.has(key)) return urlCache.get(key)!;
  const blob = await getPhoto(key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image"));
    img.src = src;
  });
}

const MAX_SOURCE_PX = 2000;
export const ACCEPTED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
export const MAX_PHOTO_BYTES = 25 * 1024 * 1024;

/** Validates, downscales (keeps phones fast) and stores a photo. Returns its key and dimensions. */
export async function ingestPhoto(file: File): Promise<{ key: string; w: number; h: number }> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > MAX_PHOTO_BYTES) throw new Error("That photo is larger than 25MB.");
  const src = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(src);
  } catch {
    URL.revokeObjectURL(src);
    throw new Error("This photo format is not supported by your browser. Please use JPG or PNG.");
  }
  const ratio = Math.min(1, MAX_SOURCE_PX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * ratio);
  const h = Math.round(img.naturalHeight * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(src);
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("Could not process photo"))), "image/jpeg", 0.9)
  );
  const key = `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await putPhoto(key, blob);
  return { key, w, h };
}
