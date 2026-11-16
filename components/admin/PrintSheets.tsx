"use client";

import { useState } from "react";
import { Printer } from "lucide-react";
import { toast } from "sonner";

// A4 at 300 DPI.
const PAGE_W = 2480;
const PAGE_H = 3508;
// Cut sheet per magnet at 300 DPI (finished face + 3/8" flap each side).
const LAYOUT = {
  "2x2": { cw: 826, ch: 826, cols: 3, rows: 3 }, // 2.75" x 2.75", 3 across x 3 down
  "2x3": { cw: 1126, ch: 826, cols: 2, rows: 3 }, // 3.75" x 2.75" horizontal, 2 across x 3 down
  "2x3v": { cw: 826, ch: 1126, cols: 3, rows: 2 }, // 2.75" x 3.75" vertical, 3 across x 2 down
} as const;

function load(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not load an artwork image"));
    img.src = src;
  });
}

/** Lays an order line's magnet artworks onto A4 pages, ready to print at 100% (actual size). */
export function PrintSheets({ urls, size, orderNumber }: { urls: string[]; size: string; orderNumber: string }) {
  const [busy, setBusy] = useState(false);
  const L = LAYOUT[size as keyof typeof LAYOUT] ?? LAYOUT["2x2"];
  const perPage = L.cols * L.rows;
  const pages = Math.ceil(urls.length / perPage);

  async function run() {
    setBusy(true);
    try {
      const imgs = await Promise.all(urls.map(load));
      const gapX = (PAGE_W - L.cols * L.cw) / (L.cols + 1);
      const gapY = (PAGE_H - L.rows * L.ch) / (L.rows + 1);
      for (let p = 0; p < pages; p++) {
        const canvas = document.createElement("canvas");
        canvas.width = PAGE_W;
        canvas.height = PAGE_H;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, PAGE_W, PAGE_H);
        imgs.slice(p * perPage, (p + 1) * perPage).forEach((img, i) => {
          const col = i % L.cols;
          const row = Math.floor(i / L.cols);
          const x = gapX + col * (L.cw + gapX);
          const y = gapY + row * (L.ch + gapY);
          // Artwork is already at 300 DPI; draw at native size, centred in its cell.
          const w = Math.min(img.naturalWidth, L.cw);
          const h = Math.min(img.naturalHeight, L.ch);
          ctx.drawImage(img, x + (L.cw - w) / 2, y + (L.ch - h) / 2, w, h);
        });
        const blob = await new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Render failed"))), "image/jpeg", 0.95));
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${orderNumber}-${size === "2x3v" ? "2x3-vertical" : size}-A4-page-${p + 1}.jpg`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
      toast.success(`${pages} A4 page${pages > 1 ? "s" : ""} downloaded. Print at 100% / actual size.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={run} disabled={busy || !urls.length} className="btn-gold inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
      {busy ? "Preparing…" : `Download A4 print sheet${pages > 1 ? "s" : ""} (${pages})`}
    </button>
  );
}
