export type MagnetSize = "2x2" | "2x3";

/** Editing state for one magnet. Positions are fractions so they are resolution independent. */
export interface TileState {
  id: string;
  /** IndexedDB key of the customer's (downscaled) source photo. */
  imageKey: string | null;
  imgW: number;
  imgH: number;
  /** Offset of the image centre from the frame centre, as a fraction of frame width/height. */
  x: number;
  y: number;
  /** Zoom (1 = cover). */
  scale: number;
  text: string;
  /** Text centre position, 0..1 of frame. */
  textX: number;
  textY: number;
  textColor: string;
  /** Font size as a fraction of frame width. */
  textSize: number;
  /** Font id from lib/cart/fonts.ts (older saved tiles may not have it). */
  textFont?: string;
}

export interface CartItem {
  id: string;
  productSlug: string;
  size: MagnetSize;
  kind: "photo" | "business";
  tiles: TileState[];
  createdAt: number;
}

export const FRAME_RATIO: Record<MagnetSize, number> = { "2x2": 1, "2x3": 3 / 2 }; // height / width
export const PRINT_PX: Record<MagnetSize, { w: number; h: number }> = {
  "2x2": { w: 600, h: 600 },
  "2x3": { w: 600, h: 900 },
};
/** Fold-behind flap on each side of the cut sheet: (2.75" - 2") / 2 = 0.375" at 300 DPI. */
export const PRINT_FLAP_PX = 113;

export const TEXT_COLORS = ["#1E6FD9", "#F5D67B", "#111111", "#D71920", "#FFFFFF"];

export function newTile(): TileState {
  return {
    id: Math.random().toString(36).slice(2, 10),
    imageKey: null,
    imgW: 0,
    imgH: 0,
    x: 0,
    y: 0,
    scale: 1,
    text: "",
    textX: 0.5,
    textY: 0.85,
    textColor: "#FFFFFF",
    textSize: 0.09,
    textFont: "classic",
  };
}

export function filledTiles(item: Pick<CartItem, "tiles">) {
  return item.tiles.filter((t) => t.imageKey);
}
