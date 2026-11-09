"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { allPhotoKeys, deletePhoto } from "@/lib/cart/imageStore";
import { filledTiles, type CartItem } from "@/lib/cart/types";

const STORAGE_KEY = "magnetify-cart-v1";

interface CartContextValue {
  items: CartItem[];
  ready: boolean;
  count: number;
  upsertItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  getItem: (id: string) => CartItem | undefined;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate from localStorage after mount (avoids SSR mismatch).
    const initial = readStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(initial);
    setReady(true);
    // Remove device-stored photos no longer used by the cart or an unsaved draft.
    // Keys younger than 1 hour are kept so an open customizer tab never loses photos.
    try {
      const keep = new Set<string>();
      initial.forEach((i) => i.tiles.forEach((t) => t.imageKey && keep.add(t.imageKey)));
      const draft = JSON.parse(localStorage.getItem("magnetify-draft-v1") || "null") as { tiles?: { imageKey: string | null }[] } | null;
      draft?.tiles?.forEach((t) => t.imageKey && keep.add(t.imageKey));
      allPhotoKeys()
        .then((keys) =>
          keys.forEach((k) => {
            const key = String(k);
            const ts = Number(key.split("_")[1]);
            if (!keep.has(key) && Number.isFinite(ts) && Date.now() - ts > 3600_000) deletePhoto(key).catch(() => {});
          })
        )
        .catch(() => {});
    } catch {
      /* ignore */
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full or blocked; cart still works for this session */
    }
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + filledTiles(i).length, 0),
      upsertItem: (item) => {
        const exists = items.some((i) => i.id === item.id);
        persist(exists ? items.map((i) => (i.id === item.id ? item : i)) : [...items, item]);
      },
      removeItem: (id) => {
        const item = items.find((i) => i.id === id);
        persist(items.filter((i) => i.id !== id));
        item?.tiles.forEach((t) => t.imageKey && deletePhoto(t.imageKey).catch(() => {}));
      },
      clear: () => {
        items.forEach((i) => i.tiles.forEach((t) => t.imageKey && deletePhoto(t.imageKey).catch(() => {})));
        persist([]);
      },
      getItem: (id) => items.find((i) => i.id === id),
    }),
    [items, ready, persist]
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
