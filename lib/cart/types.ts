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

export const TEXT_COLORS = ["#FFF8E7", "#F5D67B", "#111111", "#D71920", "#FFFFFF"];

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
    textColor: "#FFF8E7",
    textSize: 0.09,
  };
}

export function filledTiles(item: Pick<CartItem, "tiles">) {
  return item.tiles.filter((t) => t.imageKey);
}
