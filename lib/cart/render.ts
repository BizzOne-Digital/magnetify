"use client";
import { drawSize } from "./geometry";
import { getPhotoUrl, loadImage } from "./imageStore";
import { FRAME_RATIO, PRINT_PX, type MagnetSize, type TileState } from "./types";

/** Renders the final print-ready magnet artwork (photo crop + text) to a JPEG blob at 300 DPI. */
export async function renderTile(tile: TileState, size: MagnetSize): Promise<Blob> {
  if (!tile.imageKey) throw new Error("Tile has no photo");
  const url = await getPhotoUrl(tile.imageKey);
  if (!url) throw new Error("A photo is missing from this device. Please re-upload it.");
  const img = await loadImage(url);
  const { w: PW, h: PH } = PRINT_PX[size];
  const canvas = document.createElement("canvas");
  canvas.width = PW;
  canvas.height = PH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, PW, PH);

  const ratio = FRAME_RATIO[size];
  const { w, h } = drawSize(tile, ratio);
  const dw = w * PW;
  const dh = h * PH;
  const cx = (0.5 + tile.x) * PW;
  const cy = (0.5 + tile.y) * PH;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);

  if (tile.text.trim()) {
    const fontPx = Math.round(tile.textSize * PW);
    ctx.font = `700 ${fontPx}px Montserrat, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = fontPx * 0.25;
    ctx.fillStyle = tile.textColor;
    ctx.fillText(tile.text.trim(), tile.textX * PW, tile.textY * PH, PW * 0.94);
  }

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Render failed"))), "image/jpeg", 0.92));
}
