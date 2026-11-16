"use client";

import { useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { TileView } from "@/components/customizer/TileView";
import type { TileState } from "@/lib/cart/types";

export function PhotoUploadGrid({
  tiles,
  ratio,
  selectedId,
  busyIds,
  title,
  onSelect,
  onFiles,
  onRemove,
}: {
  tiles: TileState[];
  ratio: number;
  selectedId: string | null;
  busyIds: Set<string>;
  title: string;
  onSelect: (id: string) => void;
  onFiles: (startTileId: string, files: FileList) => void;
  onRemove: (id: string) => void;
}) {
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const filled = tiles.filter((t) => t.imageKey).length;
  // Cut-sheet geometry in inches: finished face + 3/8" fold-behind flap on every side.
  const faceW = ratio < 1 ? 3 : 2; // 2x3 horizontal is 3" wide; 2x2 and 2x3 vertical are 2" wide
  const faceH = faceW * ratio;
  const sheetW = faceW + 0.75;
  const sheetH = faceH + 0.75;

  return (
    <div>
      <h3 className="mb-3 font-display text-base font-bold text-gold-light">{title}</h3>
      {/* Print-template sheet: white page with one box per magnet, like the shop's print layout */}
      <div className="rounded-xl bg-[#e9e7e1] p-2 shadow-inner sm:p-3">
        <div className="mb-2 flex items-center justify-between px-1 text-[11px] font-medium text-[#6b6b6b] sm:text-xs">
          <span>Page 1 – {ratio === 1 ? "2x2 Magnets" : "2x3 Magnets"}</span>
          <span>
            {filled} / {tiles.length} photos
          </span>
        </div>
        <p className="mb-2 px-1 text-[11px] text-[#6b6b6b] sm:text-xs">
          Keep your photo and text inside the dotted line. The outer edge folds behind the magnet for a clean finish.
        </p>
        <ul className={`grid ${ratio < 1 ? "grid-cols-2" : "grid-cols-3"} gap-1.5 rounded-lg bg-white p-3 shadow-[0_4px_18px_rgba(0,0,0,0.35)] sm:gap-3 sm:p-5`}>
          {tiles.map((t, i) => {
            const busy = busyIds.has(t.id);
            const selected = t.id === selectedId;
            return (
              <li key={t.id} className="relative" style={{ aspectRatio: `${sheetW} / ${sheetH}` }}>
                <OctagonGuide w={sheetW} h={sheetH} />
                <div
                  className="absolute"
                  style={{ left: `${(0.375 / sheetW) * 100}%`, top: `${(0.375 / sheetH) * 100}%`, width: `${(faceW / sheetW) * 100}%`, height: `${(faceH / sheetH) * 100}%` }}
                >
                <input
                  ref={(el) => {
                    inputs.current[t.id] = el;
                  }}
                  id={`file-${t.id}`}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
                  multiple={!t.imageKey}
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    if (e.target.files?.length) onFiles(t.id, e.target.files);
                    e.target.value = "";
                  }}
                />
                {t.imageKey ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelect(t.id)}
                      className={`block w-full overflow-hidden border transition ${
                        selected ? "border-gold ring-2 ring-gold shadow-[0_0_14px_rgba(212,175,55,0.55)]" : "border-[#d4d4d4] hover:ring-2 hover:ring-gold/60"
                      }`}
                      aria-label={`Edit magnet ${i + 1}`}
                      aria-pressed={selected}
                    >
                      <TileView tile={t} ratio={ratio} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(t.id)}
                      className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-md bg-promo text-cream shadow-md ring-2 ring-white hover:bg-promo-dark"
                      aria-label={`Remove photo from magnet ${i + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => inputs.current[t.id]?.click()}
                    disabled={busy}
                    className="group relative block w-full overflow-hidden border border-[#d4d4d4] transition hover:ring-2 hover:ring-gold"
                    style={{ aspectRatio: `1 / ${ratio}` }}
                    aria-label={`Upload photo for magnet ${i + 1}`}
                  >
                    <LandscapePlaceholder />
                    <span className="absolute inset-x-0 bottom-1.5 flex justify-center sm:bottom-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-cream transition group-hover:bg-promo sm:px-2.5 sm:py-1 sm:text-xs">
                        {busy ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-hidden="true" />
                        ) : (
                          <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.4} aria-hidden="true" />
                        )}
                        {busy ? "Loading" : "Upload"}
                      </span>
                    </span>
                  </button>
                )}
                <span className="pointer-events-none absolute inset-0 border-2 border-dashed border-black/60" aria-hidden="true" />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Octagon cut line with "magnetify.ca" upside down on the top flap, as on the printed sheet. */
function OctagonGuide({ w, h }: { w: number; h: number }) {
  const c = 0.75;
  const pts = `${c},0 ${w - c},0 ${w},${c} ${w},${h - c} ${w - c},${h} ${c},${h} 0,${h - c} 0,${c}`;
  return (
    <svg viewBox={`-0.02 -0.02 ${w + 0.04} ${h + 0.04}`} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <polygon points={pts} fill="#fff" stroke="#9a9a9a" strokeWidth="0.02" />
      <text
        x={w / 2}
        y={0.19}
        transform={`rotate(180 ${w / 2} 0.19)`}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="0.17"
        fontWeight="600"
        fill="#555"
        fontFamily="var(--font-montserrat), sans-serif"
      >
        magnetify.ca
      </text>
    </svg>
  );
}

/** Empty-slot placeholder: the Magnetify logo as a soft watermark. */
function LandscapePlaceholder() {
  return (
    <span className="absolute inset-0 flex items-center justify-center bg-[#f4f2ed]" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-mark.png" alt="" className="w-3/5 max-w-[140px] opacity-60" draggable={false} />
    </span>
  );
}

export function openFilePicker(tileId: string) {
  document.getElementById(`file-${tileId}`)?.click();
}
