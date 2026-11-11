"use client";
import { drawSize } from "./geometry";
import { getPhotoUrl, loadImage } from "./imageStore";
import { getMagnetFont } from "./fonts";
import { FRAME_RATIO, PRINT_FLAP_PX, PRINT_PX, type MagnetSize, type TileState } from "./types";

const BLEED = 18; // ~0.06" of photo wraps onto the magnet edge
const WEBSITE = "magnetify.ca";

/**
 * Renders the print-ready cut sheet for one magnet at 300 DPI:
 * an octagon (2.75" x 2.75" for 2x2) with the finished face in the middle (dotted line),
 * and the website + order number on the flaps that fold behind the magnet.
 */
export async function renderTile(tile: TileState, size: MagnetSize, orderNumber: string): Promise<Blob> {
  if (!tile.imageKey) throw new Error("Tile has no photo");
  const url = await getPhotoUrl(tile.imageKey);
  if (!url) throw new Error("A photo is missing from this device. Please re-upload it.");
  const img = await loadImage(url);
  const { w: PW, h: PH } = PRINT_PX[size]; // finished face
  const M = PRINT_FLAP_PX; // flap width on each side
  const SW = PW + 2 * M;
  const SH = PH + 2 * M;
  const canvas = document.createElement("canvas");
  canvas.width = SW;
  canvas.height = SH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SW, SH);

  // Octagon cut line: corners cut at 45 degrees through the face corners.
  const C = 2 * M;
  const octagon = () => {
    ctx.beginPath();
    ctx.moveTo(C, 0);
    ctx.lineTo(SW - C, 0);
    ctx.lineTo(SW, C);
    ctx.lineTo(SW, SH - C);
    ctx.lineTo(SW - C, SH);
    ctx.lineTo(C, SH);
    ctx.lineTo(0, SH - C);
    ctx.lineTo(0, C);
    ctx.closePath();
  };

  // Photo: face plus a small bleed so the magnet edge is covered.
  const ratio = FRAME_RATIO[size];
  const { w, h } = drawSize(tile, ratio);
  const dw = w * PW;
  const dh = h * PH;
  const cx = M + (0.5 + tile.x) * PW;
  const cy = M + (0.5 + tile.y) * PH;
  ctx.save();
  ctx.beginPath();
  ctx.rect(M - BLEED, M - BLEED, PW + 2 * BLEED, PH + 2 * BLEED);
  ctx.clip();
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();

  if (tile.text.trim()) {
    const fontPx = Math.round(tile.textSize * PW);
    const f = getMagnetFont(tile.textFont);
    const family = getComputedStyle(document.documentElement).getPropertyValue(f.cssVar).trim() || "Arial";
    const font = `${f.weight} ${fontPx}px ${family}, Arial, sans-serif`;
    try {
      await document.fonts.load(font, tile.text);
    } catch {
      /* falls back to Arial */
    }
    ctx.save();
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = fontPx * 0.25;
    ctx.fillStyle = tile.textColor;
    ctx.fillText(tile.text.trim(), M + tile.textX * PW, M + tile.textY * PH, PW * 0.94);
    ctx.restore();
  }

  // Dotted line = finished magnet face.
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.strokeRect(M, M, PW, PH);
  ctx.restore();

  // Flap labels (fold behind the magnet).
  const labelFamily = getComputedStyle(document.documentElement).getPropertyValue("--font-montserrat").trim() || "Arial";
  ctx.save();
  ctx.fillStyle = "#222";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 34px ${labelFamily}, Arial, sans-serif`;
  ctx.fillText(WEBSITE, SW / 2, M / 2, PW - 40);
  ctx.translate(M / 2, SH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `600 30px ${labelFamily}, Arial, sans-serif`;
  ctx.fillText(`Order # ${orderNumber}`, 0, 0, PH - 40);
  ctx.restore();

  // Cut line on top.
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#555";
  octagon();
  ctx.stroke();
  ctx.restore();

  // Everything outside the octagon stays white (trimmed off).
  ctx.save();
  ctx.globalCompositeOperation = "destination-over";
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SW, SH);
  ctx.restore();

  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("Render failed"))), "image/jpeg", 0.92));
}
