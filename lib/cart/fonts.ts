/**
 * Fonts customers can choose for magnet text. Each maps to a CSS variable set on <html>
 * by next/font (see app/layout.tsx), so the editor, previews and the print render all match.
 */
export const MAGNET_FONTS = [
  { id: "classic", label: "Classic", cssVar: "--font-montserrat", weight: 700 },
  { id: "elegant", label: "Elegant", cssVar: "--font-playfair", weight: 700 },
  { id: "script", label: "Script", cssVar: "--font-dancing", weight: 700 },
  { id: "bold", label: "Bold", cssVar: "--font-bebas", weight: 400 },
  { id: "fun", label: "Fun", cssVar: "--font-pacifico", weight: 400 },
] as const;

export type MagnetFontId = (typeof MAGNET_FONTS)[number]["id"];
export const MAGNET_FONT_IDS = MAGNET_FONTS.map((f) => f.id) as [MagnetFontId, ...MagnetFontId[]];

export function getMagnetFont(id: string | undefined) {
  return MAGNET_FONTS.find((f) => f.id === id) ?? MAGNET_FONTS[0];
}

/** Inline style for on-screen text. */
export function magnetFontStyle(id: string | undefined) {
  const f = getMagnetFont(id);
  return { fontFamily: `var(${f.cssVar}), sans-serif`, fontWeight: f.weight };
}
