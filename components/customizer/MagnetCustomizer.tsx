"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Briefcase, Camera, ImagePlus, Plus, ShoppingCart } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { SizeSelector } from "@/components/customizer/SizeSelector";
import { PhotoUploadGrid, openFilePicker } from "@/components/customizer/PhotoUploadGrid";
import { MagnetEditor } from "@/components/customizer/MagnetEditor";
import { StepBar } from "@/components/customizer/StepBar";
import { ingestPhoto } from "@/lib/cart/imageStore";
import { clampOffset } from "@/lib/cart/geometry";
import { FRAME_RATIO, filledTiles, newTile, type CartItem, type TileState } from "@/lib/cart/types";
import { money, type PricedProduct } from "@/lib/pricing";

const DRAFT_KEY = "magnetify-draft-v1";
const MAX_TILES = 200;

interface Draft {
  slug: string;
  tiles: TileState[];
}

function padTiles(tiles: TileState[], min: number) {
  const out = [...tiles];
  while (out.length < min) out.push(newTile());
  return out;
}

export function MagnetCustomizer({
  products,
  initialSlug,
  editId,
  variant = "page",
  showSteps = false,
}: {
  products: PricedProduct[];
  initialSlug?: string;
  editId?: string;
  variant?: "page" | "home";
  showSteps?: boolean;
}) {
  const router = useRouter();
  const cart = useCart();
  const initialProduct = products.find((p) => p.slug === initialSlug) ?? products.find((p) => p.kind === "photo") ?? products[0];

  const [kind, setKind] = useState<"photo" | "business">(initialProduct?.kind ?? "photo");
  const [slug, setSlug] = useState(initialProduct?.slug ?? "");
  const [tiles, setTiles] = useState<TileState[]>(() =>
    // Deterministic ids for the server render (random ids would break hydration).
    Array.from({ length: initialProduct?.minOrder ?? 9 }, (_, i) => ({ ...newTile(), id: `slot-${i}` }))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const [sizeConfirmed, setSizeConfirmed] = useState(false);
  const [edited, setEdited] = useState(false);

  const product = products.find((p) => p.slug === slug) ?? initialProduct;
  const ratio = product ? FRAME_RATIO[product.size] : 1;
  const sizeOptions = products.filter((p) => p.kind === kind);
  const hasBusiness = products.some((p) => p.kind === "business");

  // Hydrate: editing an existing cart item, or restore an unsaved draft.
  useEffect(() => {
    if (!cart.ready || hydrated) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editId) {
      const item = cart.getItem(editId);
      const p = item && products.find((x) => x.slug === item.productSlug);
      if (item && p) {
        setKind(p.kind);
        setSlug(p.slug);
        setTiles(padTiles(item.tiles, p.minOrder));
        setEditingItemId(item.id);
        setSelectedId(item.tiles[0]?.id ?? null);
      } else {
        toast.error("That cart item could not be found.");
      }
    } else if (variant === "page") {
      try {
        const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null") as Draft | null;
        const p = d && products.find((x) => x.slug === d.slug);
        if (d && p && d.tiles.some((t) => t.imageKey) && (!initialSlug || initialSlug === d.slug)) {
          setKind(p.kind);
          setSlug(p.slug);
          setTiles(padTiles(d.tiles, p.minOrder));
          toast.message("We restored your unsaved design.");
        }
      } catch {
        /* ignore bad draft */
      }
    }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [cart, cart.ready, editId, hydrated, initialSlug, products, variant]);

  // Autosave draft (configuration only — photos already live in IndexedDB).
  useEffect(() => {
    if (!hydrated || editingItemId || variant !== "page") return;
    try {
      if (tiles.some((t) => t.imageKey)) localStorage.setItem(DRAFT_KEY, JSON.stringify({ slug, tiles } satisfies Draft));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, [tiles, slug, hydrated, editingItemId, variant]);

  const filled = tiles.filter((t) => t.imageKey).length;
  const min = product?.minOrder ?? 1;
  const selected = tiles.find((t) => t.id === selectedId) ?? null;
  const selectedIndex = tiles.findIndex((t) => t.id === selectedId);

  const estimate = useMemo(() => {
    if (!product) return 0;
    return Math.max(filled, min) * product.salePrice;
  }, [product, filled, min]);

  const changeProduct = (nextSlug: string) => {
    const p = products.find((x) => x.slug === nextSlug);
    if (!p) return;
    const r = FRAME_RATIO[p.size];
    setSlug(nextSlug);
    setSizeConfirmed(true);
    setTiles((prev) => {
      const kept = prev.filter((t) => t.imageKey).map((t) => ({ ...t, ...clampOffset({ ...t, scale: t.scale }, r) }));
      return padTiles(kept, p.minOrder);
    });
  };

  const changeKind = (k: "photo" | "business") => {
    setKind(k);
    const p = products.find((x) => x.kind === k && x.size === product?.size) ?? products.find((x) => x.kind === k);
    if (p) changeProduct(p.slug);
  };

  const patchTile = useCallback((id: string, patch: Partial<TileState>) => {
    setTiles((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const onFiles = async (startId: string, files: FileList) => {
    const list = Array.from(files);
    // Target: the clicked tile, then following empty tiles; add new slots if needed.
    let working = [...tiles];
    const startIdx = working.findIndex((t) => t.id === startId);
    const targets: string[] = [startId];
    for (let i = 0; targets.length < list.length && i < working.length; i++) {
      const t = working[(startIdx + 1 + i) % working.length];
      if (!t.imageKey && !targets.includes(t.id)) targets.push(t.id);
    }
    while (targets.length < list.length && working.length < MAX_TILES) {
      const t = newTile();
      working = [...working, t];
      targets.push(t.id);
    }
    setTiles(working);
    setBusy(new Set(targets));

    let firstOk: string | null = null;
    let failures = 0;
    await Promise.all(
      list.slice(0, targets.length).map(async (file, i) => {
        const id = targets[i];
        try {
          const { key, w, h } = await ingestPhoto(file);
          patchTile(id, { imageKey: key, imgW: w, imgH: h, x: 0, y: 0, scale: 1 });
          if (i === 0) firstOk = id;
        } catch (err) {
          failures++;
          toast.error((err as Error).message || "Could not load that photo.");
        } finally {
          setBusy((b) => {
            const n = new Set(b);
            n.delete(id);
            return n;
          });
        }
      })
    );
    const ok = list.length - failures;
    if (ok > 0) {
      toast.success(ok === 1 ? "Photo added" : `${ok} photos added`);
      setSelectedId(firstOk ?? targets[0]);
      if (window.innerWidth < 1024) setTimeout(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }
  };

  const removeTile = (id: string) => {
    setTiles((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      // Extra slots beyond the minimum are removed entirely; minimum slots are just emptied.
      if (prev.length > min) return prev.filter((t) => t.id !== id);
      return prev.map((t, i) => (i === idx ? { ...newTile(), id: t.id } : t));
    });
    if (selectedId === id) setSelectedId(null);
  };

  const addSlot = () => {
    if (tiles.length >= MAX_TILES) return toast.error("Maximum reached for one design set.");
    setTiles((prev) => [...prev, newTile()]);
  };

  const addToCart = () => {
    if (!product) return;
    if (busy.size > 0) return toast.error("Please wait for your photos to finish loading.");
    const done = filledTiles({ tiles });
    if (done.length < product.minOrder) {
      return toast.error(`Please upload at least ${product.minOrder} photos for ${product.shortName}. You have ${done.length}.`);
    }
    const item: CartItem = {
      id: editingItemId ?? `ci_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      productSlug: product.slug,
      size: product.size,
      kind: product.kind,
      tiles: done,
      createdAt: Date.now(),
    };
    cart.upsertItem(item);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
    toast.success(editingItemId ? "Cart updated" : `${done.length} magnets added to your cart`);
    router.push("/cart");
  };

  if (!product) {
    return <p className="card-dark p-6 text-center text-muted">Products are currently unavailable. Please check back soon.</p>;
  }

  const stepDone = [sizeConfirmed || filled > 0, filled >= min, filled >= min && edited, false];
  const currentStep = stepDone.findIndex((d) => !d);
  const stepHints = [
    `${product.size} ${product.size === "2x2" ? "square" : "rectangle"} selected`,
    `${filled} of ${min} added`,
    filled === 0 ? "Upload first" : edited ? "Looks great" : "Tap a magnet to edit",
    filled >= min ? "Ready — add to cart" : `Needs ${min - filled} more`,
  ];
  const scrollTo = (el: HTMLElement | null) => el?.scrollIntoView({ behavior: "smooth", block: "center" });
  const goToStep = (i: number) => {
    if (i === 0) {
      setSizeConfirmed(true);
      scrollTo(sizeRef.current);
      sizeRef.current?.querySelector<HTMLInputElement>("input:checked")?.focus();
    } else if (i === 1) {
      const firstEmpty = tiles.find((t) => !t.imageKey);
      if (firstEmpty) openFilePicker(firstEmpty.id);
      else toast.success(`All ${min} photos added. Use “Add another magnet” for more.`);
    } else if (i === 2) {
      const first = tiles.find((t) => t.imageKey);
      if (!first) return toast.error("Upload a photo first, then you can reposition it and add text.");
      setSelectedId((cur) => (cur && tiles.some((t) => t.id === cur && t.imageKey) ? cur : first.id));
      scrollTo(editorRef.current);
    } else {
      addToCart();
    }
  };

  const gridTitle = `Upload ${product.kind === "business" ? "Designs" : "Photos"} – ${product.size} Magnets (${min} ${
    product.kind === "business" ? "designs" : "photos"
  } minimum)`;

  return (
    <>
    {showSteps ? <StepBar done={stepDone} current={currentStep} hints={stepHints} onStep={goToStep} /> : null}
    <div className="card-gold p-3 sm:p-5">
      <div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)_310px]">
        {/* Left: size + type */}
        <div ref={sizeRef} className="scroll-mt-24 space-y-5 rounded-xl border border-gold/30 bg-black/30 p-4">
          {hasBusiness ? (
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-black/50 p-1" role="tablist" aria-label="Magnet type">
              {(
                [
                  ["photo", "Photo", Camera],
                  ["business", "Business", Briefcase],
                ] as const
              ).map(([k, label, Icon]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={kind === k}
                  onClick={() => changeKind(k)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold transition ${
                    kind === k ? "bg-gold-metal text-ink" : "text-cream/80 hover:text-gold-light"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          ) : null}
          <SizeSelector products={sizeOptions} value={slug} onChange={changeProduct} />
          {kind === "business" ? (
            <p className="text-xs text-muted">Upload your logo, business card design or promotional artwork as an image (PNG or JPG).</p>
          ) : null}
        </div>

        {/* Middle: grid */}
        <div className="rounded-xl border border-gold/20 bg-black/20 p-3 sm:p-4">
          <PhotoUploadGrid
            tiles={tiles}
            ratio={ratio}
            selectedId={selectedId}
            busyIds={busy}
            title={gridTitle}
            onSelect={(id) => {
              setSelectedId(id);
              if (window.innerWidth < 1024) editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            onFiles={onFiles}
            onRemove={removeTile}
          />
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={addSlot} className="btn btn-ghost btn-sm">
              <Plus className="h-4 w-4" aria-hidden="true" /> Add another magnet
            </button>
            <button
              type="button"
              onClick={() => {
                const firstEmpty = tiles.find((t) => !t.imageKey);
                if (firstEmpty) openFilePicker(firstEmpty.id);
                else {
                  const t = newTile();
                  setTiles((p) => [...p, t]);
                  setTimeout(() => openFilePicker(t.id), 50);
                }
              }}
              className="btn btn-secondary btn-sm"
            >
              <ImagePlus className="h-4 w-4" aria-hidden="true" /> Upload multiple
            </button>
            <span className="ml-auto text-xs text-muted">Tip: select several photos at once.</span>
          </div>
        </div>

        {/* Right: editor */}
        <div ref={editorRef} className="scroll-mt-24 rounded-xl border border-gold/30 bg-black/30 p-4">
          <h3 className="mb-3 font-display text-base font-bold text-gold-light">
            Reposition & Add Text{selectedIndex >= 0 ? ` — Magnet ${selectedIndex + 1}` : ""}
          </h3>
          <MagnetEditor
            tile={selected}
            ratio={ratio}
            index={selectedIndex}
            onChange={(patch) => {
              if (!selected) return;
              patchTile(selected.id, patch);
              setEdited(true);
            }}
            onReplace={() => selected && openFilePicker(selected.id)}
            onRemove={() => selected && removeTile(selected.id)}
          />
        </div>
      </div>

      {/* Summary bar */}
      <div className="mt-5 flex flex-col gap-4 rounded-xl border border-gold/30 bg-black/40 p-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <div className="flex items-baseline justify-between gap-3 sm:justify-start">
            <p className="font-display font-bold text-cream">
              {filled} / {min} {product.kind === "business" ? "designs" : "photos"} added
            </p>
            <p className="text-sm text-muted">
              {product.shortName} · {money(product.salePrice)} each
            </p>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={min}
            aria-valuenow={Math.min(filled, min)}
            aria-label="Minimum order progress"
          >
            <div className="h-full bg-gold-metal transition-all" style={{ width: `${Math.min(100, (filled / min) * 100)}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            Estimated: <strong className="text-gold-light">{money(estimate)}</strong> · Bulk pricing applies automatically at 50+ magnets in your cart.
          </p>
        </div>
        <button type="button" onClick={addToCart} className="btn btn-primary w-full px-6 py-3.5 sm:w-auto" disabled={busy.size > 0}>
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {editingItemId ? "Update Cart" : "Add to Cart"}
        </button>
      </div>
    </div>
    </>
  );
}
