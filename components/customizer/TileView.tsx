"use client";

import { useEffect, useState } from "react";
import { getPhotoUrl } from "@/lib/cart/imageStore";
import { imageStyle } from "@/lib/cart/geometry";
import type { TileState } from "@/lib/cart/types";
import { magnetFontStyle } from "@/lib/cart/fonts";

export function usePhotoUrl(key: string | null) {
  const [state, setState] = useState<{ key: string | null; url: string | null; missing: boolean }>({
    key: null,
    url: null,
    missing: false,
  });
  useEffect(() => {
    let alive = true;
    if (!key) return;
    getPhotoUrl(key)
      .then((u) => alive && setState({ key, url: u, missing: !u }))
      .catch(() => alive && setState({ key, url: null, missing: true }));
    return () => {
      alive = false;
    };
  }, [key]);
  if (!key || state.key !== key) return { url: null, missing: false };
  return { url: state.url, missing: state.missing };
}

/** Read-only rendering of a magnet (used for thumbnails, cart and checkout). */
export function TileView({
  tile,
  ratio,
  className = "",
  showText = true,
}: {
  tile: TileState;
  ratio: number;
  className?: string;
  showText?: boolean;
}) {
  const { url, missing } = usePhotoUrl(tile.imageKey);
  return (
    <div
      className={`relative overflow-hidden bg-[#0d0d0d] ${className}`}
      style={{ aspectRatio: `1 / ${ratio}`, containerType: "inline-size" }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" draggable={false} className="pointer-events-none absolute max-w-none select-none" style={imageStyle(tile, ratio)} />
      ) : missing ? (
        <span className="absolute inset-0 flex items-center justify-center p-1 text-center text-[10px] text-promo">Photo missing</span>
      ) : null}
      {showText && tile.text ? (
        <span
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]"
          style={{
            left: `${tile.textX * 100}%`,
            top: `${tile.textY * 100}%`,
            color: tile.textColor,
            fontSize: `${tile.textSize * 100}cqw`,
            ...magnetFontStyle(tile.textFont),
          }}
        >
          {tile.text}
        </span>
      ) : null}
    </div>
  );
}
