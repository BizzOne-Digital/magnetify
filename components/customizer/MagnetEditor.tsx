"use client";

import { useRef } from "react";
import { Move, RefreshCw, RotateCcw, Trash2, Type, ZoomIn, ZoomOut } from "lucide-react";
import { usePhotoUrl } from "@/components/customizer/TileView";
import { clampOffset, imageStyle } from "@/lib/cart/geometry";
import { TEXT_COLORS, type TileState } from "@/lib/cart/types";

const MIN_SCALE = 1;
const MAX_SCALE = 4;

export function MagnetEditor({
  tile,
  ratio,
  index,
  onChange,
  onReplace,
  onRemove,
}: {
  tile: TileState | null;
  ratio: number;
  index: number;
  onChange: (patch: Partial<TileState>) => void;
  onReplace: () => void;
  onRemove: () => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ mode: "image" | "text"; startDist?: number; startScale?: number } | null>(null);
  const { url } = usePhotoUrl(tile?.imageKey ?? null);

  if (!tile || !tile.imageKey) {
    return (
      <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-gold/30 p-6 text-center text-sm text-muted">
        <Move className="mb-3 h-8 w-8 text-gold/70" aria-hidden="true" />
        Upload a photo, then tap it to reposition, zoom and add text.
      </div>
    );
  }

  const apply = (patch: Partial<TileState>) => {
    const next = { ...tile, ...patch };
    onChange({ ...patch, ...clampOffset(next, ratio) });
  };

  const rect = () => frameRef.current!.getBoundingClientRect();

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const mode = e.currentTarget.dataset.mode === "text" ? "text" : "image";
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && mode === "image") {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { mode, startDist: Math.hypot(a.x - b.x, a.y - b.y), startScale: tile.scale };
    } else {
      gesture.current = { mode };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = rect();
    if (gesture.current.mode === "image" && pointers.current.size === 2 && gesture.current.startDist) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (gesture.current.startScale ?? 1) * (dist / gesture.current.startDist)));
      apply({ scale });
      return;
    }
    const dx = (e.clientX - prev.x) / r.width;
    const dy = (e.clientY - prev.y) / r.height;
    if (gesture.current.mode === "image") {
      apply({ x: tile.x + dx, y: tile.y + dy });
    } else {
      onChange({
        textX: Math.min(0.95, Math.max(0.05, tile.textX + dx)),
        textY: Math.min(0.95, Math.max(0.05, tile.textY + dy)),
      });
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) gesture.current = null;
    else if (gesture.current) gesture.current = { mode: gesture.current.mode };
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    const map: Record<string, Partial<TileState>> = {
      ArrowLeft: { x: tile.x - step },
      ArrowRight: { x: tile.x + step },
      ArrowUp: { y: tile.y - step },
      ArrowDown: { y: tile.y + step },
      "+": { scale: Math.min(MAX_SCALE, tile.scale + 0.1) },
      "=": { scale: Math.min(MAX_SCALE, tile.scale + 0.1) },
      "-": { scale: Math.max(MIN_SCALE, tile.scale - 0.1) },
    };
    if (map[e.key]) {
      e.preventDefault();
      apply(map[e.key]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-[260px]">
        <div
          ref={frameRef}
          role="application"
          aria-label={`Magnet ${index + 1} editor. Drag to move the photo, pinch or use plus and minus to zoom, arrow keys to nudge.`}
          tabIndex={0}
          onKeyDown={onKeyDown}
          data-mode="image"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => apply({ scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, tile.scale - e.deltaY * 0.0015)) })}
          className="relative cursor-grab touch-none select-none overflow-hidden rounded-lg border-2 border-gold/80 bg-black shadow-[0_0_24px_rgba(212,175,55,0.2)] active:cursor-grabbing"
          style={{ aspectRatio: `1 / ${ratio}`, containerType: "inline-size" }}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" draggable={false} className="pointer-events-none absolute max-w-none" style={imageStyle(tile, ratio)} />
          ) : null}
          {/* corner handles (visual) */}
          {["left-0 top-0", "right-0 top-0", "left-0 bottom-0", "right-0 bottom-0"].map((p) => (
            <span key={p} className={`pointer-events-none absolute ${p} m-1 h-2.5 w-2.5 rounded-full border border-ink bg-cream`} aria-hidden="true" />
          ))}
          <Move className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-cream/80 drop-shadow" aria-hidden="true" />
          {tile.text ? (
            <span
              data-mode="text"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap rounded border border-dashed border-cream/70 px-1.5 font-display font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]"
              style={{ left: `${tile.textX * 100}%`, top: `${tile.textY * 100}%`, color: tile.textColor, fontSize: `${tile.textSize * 100}cqw` }}
            >
              {tile.text}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-ghost btn-sm px-2.5" onClick={() => apply({ scale: Math.max(MIN_SCALE, tile.scale - 0.15) })} aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" aria-hidden="true" />
        </button>
        <label className="sr-only" htmlFor="zoom">
          Zoom
        </label>
        <input
          id="zoom"
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          value={tile.scale}
          onChange={(e) => apply({ scale: Number(e.target.value) })}
          className="h-2 flex-1 accent-[#D4AF37]"
        />
        <button type="button" className="btn btn-ghost btn-sm px-2.5" onClick={() => apply({ scale: Math.min(MAX_SCALE, tile.scale + 0.15) })} aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div>
        <label htmlFor="tile-text" className="label flex items-center gap-1.5">
          <Type className="h-4 w-4" aria-hidden="true" /> Custom text (optional)
        </label>
        <input
          id="tile-text"
          className="input"
          maxLength={40}
          placeholder="e.g. My Buddy, names, dates"
          value={tile.text}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        {tile.text ? (
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Text color">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={tile.textColor === c}
                  aria-label={`Text color ${c}`}
                  onClick={() => onChange({ textColor: c })}
                  className={`h-7 w-7 rounded-full border-2 ${tile.textColor === c ? "border-gold ring-2 ring-gold/40" : "border-white/20"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label htmlFor="text-size" className="text-xs text-muted">
                Size
              </label>
              <input
                id="text-size"
                type="range"
                min={0.05}
                max={0.16}
                step={0.005}
                value={tile.textSize}
                onChange={(e) => onChange({ textSize: Number(e.target.value) })}
                className="h-2 flex-1 accent-[#D4AF37]"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                ["Top", 0.14],
                ["Middle", 0.5],
                ["Bottom", 0.86],
              ].map(([l, y]) => (
                <button key={l} type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({ textX: 0.5, textY: y as number })}>
                  {l}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">Tip: drag the text on the magnet to place it exactly.</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onReplace}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" /> Replace
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange({ x: 0, y: 0, scale: 1 })}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
        </button>
      </div>
      <ul className="space-y-1.5 text-xs text-muted">
        <li className="flex gap-2">
          <Move className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" /> Move your photo around to get the perfect look.
        </li>
        <li className="flex gap-2">
          <Type className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" /> Add custom text (names, dates, messages, or business name).
        </li>
      </ul>
    </div>
  );
}
