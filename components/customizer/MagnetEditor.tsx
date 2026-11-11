"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ImageIcon, Move, RefreshCw, RotateCcw, Trash2, Type, ZoomIn, ZoomOut } from "lucide-react";
import { usePhotoUrl } from "@/components/customizer/TileView";
import { clampOffset, imageStyle } from "@/lib/cart/geometry";
import { TEXT_COLORS, type TileState } from "@/lib/cart/types";
import { MAGNET_FONTS, getMagnetFont, magnetFontStyle } from "@/lib/cart/fonts";

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
  type Gesture = {
    mode: "image" | "text";
    startX: number;
    startY: number;
    tileX: number;
    tileY: number;
    startDist?: number;
    startScale?: number;
  };
  const gesture = useRef<Gesture | null>(null);
  /** What a drag on the magnet moves. Text mode lets the customer place text anywhere. */
  const [dragTarget, setDragTarget] = useState<"photo" | "text">("photo");
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

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const textMode = dragTarget === "text" && Boolean(tile.text);

  /** Put the text centre exactly under the pointer. */
  const placeTextAt = (clientX: number, clientY: number) => {
    const r = rect();
    onChange({
      textX: clamp((clientX - r.left) / r.width, 0.02, 0.98),
      textY: clamp((clientY - r.top) / r.height, 0.03, 0.97),
    });
  };

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const mode = e.currentTarget.dataset.mode === "text" || textMode ? "text" : "image";
    e.stopPropagation();
    e.preventDefault();
    frameRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (mode === "text") {
      gesture.current = { mode, startX: e.clientX, startY: e.clientY, tileX: tile.x, tileY: tile.y };
      placeTextAt(e.clientX, e.clientY);
      return;
    }
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { mode, startX: 0, startY: 0, tileX: tile.x, tileY: tile.y, startDist: Math.hypot(a.x - b.x, a.y - b.y), startScale: tile.scale };
    } else {
      gesture.current = { mode, startX: e.clientX, startY: e.clientY, tileX: tile.x, tileY: tile.y };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (g.mode === "text") {
      placeTextAt(e.clientX, e.clientY);
      return;
    }
    if (pointers.current.size === 2 && g.startDist) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      apply({ scale: clamp((g.startScale ?? 1) * (dist / g.startDist), MIN_SCALE, MAX_SCALE) });
      return;
    }
    const r = rect();
    // Offsets are measured from where the drag started, so fast moves never drift or stick.
    apply({ x: g.tileX + (e.clientX - g.startX) / r.width, y: g.tileY + (e.clientY - g.startY) / r.height });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) {
      gesture.current = null;
    } else if (gesture.current) {
      // Pinch ended with one finger still down: continue dragging from here.
      const [rest] = [...pointers.current.values()];
      gesture.current = { mode: gesture.current.mode, startX: rest.x, startY: rest.y, tileX: tile.x, tileY: tile.y };
    }
  };

  const nudgeText = (dx: number, dy: number) =>
    onChange({ textX: clamp(tile.textX + dx, 0.02, 0.98), textY: clamp(tile.textY + dy, 0.03, 0.97) });

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.05 : 0.01;
    if (textMode && e.key.startsWith("Arrow")) {
      e.preventDefault();
      const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      nudgeText(...d[e.key]);
      return;
    }
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
          className={`relative touch-none select-none overflow-hidden rounded-lg border-2 bg-black shadow-[0_0_24px_rgba(212,175,55,0.2)] ${
            textMode ? "cursor-crosshair border-promo" : "cursor-grab border-gold/80 active:cursor-grabbing"
          }`}
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
          {!textMode ? (
            <Move className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 text-cream/80 drop-shadow" aria-hidden="true" />
          ) : null}
          {tile.text ? (
            <span
              data-mode="text"
              onPointerDown={(e) => {
                setDragTarget("text");
                onPointerDown(e);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-move whitespace-nowrap rounded border border-dashed px-1.5 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)] ${
                textMode ? "border-promo bg-black/20" : "border-cream/70"
              }`}
              style={{ left: `${tile.textX * 100}%`, top: `${tile.textY * 100}%`, color: tile.textColor, fontSize: `${tile.textSize * 100}cqw`, ...magnetFontStyle(tile.textFont) }}
            >
              {tile.text}
            </span>
          ) : null}
        </div>
      </div>

      {tile.text ? (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/50 p-1" role="radiogroup" aria-label="What dragging moves">
          {(
            [
              ["photo", "Move photo", ImageIcon],
              ["text", "Move text", Type],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={dragTarget === k}
              onClick={() => setDragTarget(k)}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
                dragTarget === k ? "bg-gold-metal text-ink" : "text-cream/80 hover:text-gold-light"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      ) : null}
      {textMode ? <p className="-mt-2 text-center text-xs text-gold-light">Drag or tap anywhere on the magnet to place your text.</p> : null}

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
          onChange={(e) => {
            if (!tile.text && e.target.value) setDragTarget("text");
            onChange({ text: e.target.value });
          }}
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
            <div>
              <p className="mb-1.5 text-xs text-muted">Font</p>
              <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Text font">
                {MAGNET_FONTS.map((f) => {
                  const active = getMagnetFont(tile.textFont).id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={`${f.label} font`}
                      title={f.label}
                      onClick={() => onChange({ textFont: f.id })}
                      className={`flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition ${
                        active ? "border-gold bg-gold/15 text-gold-light" : "border-white/10 text-cream hover:border-gold/50"
                      }`}
                    >
                      <span className="text-lg leading-none" style={magnetFontStyle(f.id)}>
                        Aa
                      </span>
                      <span className="text-[10px] leading-none text-muted">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted">Nudge text</span>
              <div className="flex gap-1.5">
                {(
                  [
                    ["Move text left", ArrowLeft, -0.02, 0],
                    ["Move text up", ArrowUp, 0, -0.02],
                    ["Move text down", ArrowDown, 0, 0.02],
                    ["Move text right", ArrowRight, 0.02, 0],
                  ] as const
                ).map(([label, Icon, dx, dy]) => (
                  <button key={label} type="button" className="btn btn-ghost btn-sm px-2.5" aria-label={label} onClick={() => nudgeText(dx, dy)}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted">Tip: choose “Move text”, then drag the text anywhere on the magnet.</p>
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
