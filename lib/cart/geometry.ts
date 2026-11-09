import type { TileState } from "./types";

/** Size of the drawn image relative to the frame (fractions of frame width / height). */
export function drawSize(t: Pick<TileState, "imgW" | "imgH" | "scale">, frameRatio: number) {
  // frame is 1 x frameRatio (w x h) in normalized units
  const fw = 1;
  const fh = frameRatio;
  if (!t.imgW || !t.imgH) return { w: 1, h: 1 };
  const base = Math.max(fw / t.imgW, fh / t.imgH);
  const w = t.imgW * base * t.scale;
  const h = t.imgH * base * t.scale;
  return { w: w / fw, h: h / fh };
}

/** Clamp offsets so the photo always covers the frame (no empty edges). */
export function clampOffset(t: TileState, frameRatio: number): Pick<TileState, "x" | "y"> {
  const { w, h } = drawSize(t, frameRatio);
  const maxX = Math.max(0, (w - 1) / 2);
  const maxY = Math.max(0, (h - 1) / 2);
  return { x: Math.min(maxX, Math.max(-maxX, t.x)), y: Math.min(maxY, Math.max(-maxY, t.y)) };
}

/** CSS placement of the image inside a frame, in percentages. */
export function imageStyle(t: TileState, frameRatio: number) {
  const { w, h } = drawSize(t, frameRatio);
  const left = 0.5 + t.x - w / 2;
  const top = 0.5 + t.y - h / 2;
  return {
    width: `${w * 100}%`,
    height: `${h * 100}%`,
    left: `${left * 100}%`,
    top: `${top * 100}%`,
  };
}
