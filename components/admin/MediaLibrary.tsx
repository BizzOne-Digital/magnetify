"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { adminFetch } from "@/components/admin/adminFetch";
import { AdminImageField } from "@/components/admin/AdminImageField";

type Item = { id: string; folder: string; filename: string; size: number; mimeType: string; createdAt: string; url: string; inUse: boolean };
const FILTERS = ["all", "products", "gallery", "pages", "misc", "orders"] as const;

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

export function MediaLibrary() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [items, setItems] = useState<Item[] | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");

  const load = useCallback(async () => {
    setItems(null);
    try {
      const r = await adminFetch<{ items: Item[] }>(`/api/media${filter === "all" ? "" : `?folder=${filter}`}`);
      setItems(r.items);
    } catch (err) {
      toast.error((err as Error).message);
      setItems([]);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function remove(item: Item) {
    const warning = item.inUse
      ? `"${item.filename}" is still used on the website. Deleting it will show a placeholder there. Delete anyway?`
      : item.folder === "orders"
        ? `"${item.filename}" may belong to a customer order. Delete anyway?`
        : `Delete "${item.filename}"?`;
    if (!confirm(warning)) return;
    try {
      await adminFetch("/api/media", { method: "DELETE", json: { url: item.url, force: true } });
      setItems((xs) => xs?.filter((x) => x.id !== item.id) ?? null);
      toast.success("Image deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-dark max-w-xl p-4">
        <AdminImageField
          label="Quick upload to Misc"
          folder="misc"
          value={uploadUrl}
          onChange={(u) => {
            setUploadUrl(u);
            if (u) load();
          }}
          help="Uploads appear below. Copy the URL to use it anywhere."
        />
      </div>
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by folder">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${filter === f ? "bg-gold-metal font-semibold text-ink" : "bg-white/5 text-cream/80 hover:bg-white/10"}`}
          >
            {f}
          </button>
        ))}
      </div>
      {items === null ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
        </p>
      ) : items.length === 0 ? (
        <p className="card-dark p-6 text-sm text-muted">No images in this folder.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((it) => (
            <li key={it.id} className="card-dark overflow-hidden">
              <div className="relative aspect-square bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.url} alt={it.filename} loading="lazy" className="h-full w-full object-cover" />
                {it.inUse ? <span className="absolute left-2 top-2 rounded bg-gold px-1.5 py-0.5 text-[10px] font-bold text-ink">IN USE</span> : null}
              </div>
              <div className="space-y-1 p-3 text-xs">
                <p className="truncate font-semibold text-cream" title={it.filename}>
                  {it.filename}
                </p>
                <p className="text-muted">
                  {it.folder} · {kb(it.size)} · {new Date(it.createdAt).toLocaleDateString("en-CA")}
                </p>
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm flex-1 px-2"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(it.url);
                        toast.success("URL copied");
                      } catch {
                        toast.error("Could not copy. URL: " + it.url);
                      }
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy URL
                  </button>
                  <button type="button" className="btn btn-danger btn-sm px-2" onClick={() => remove(it)} aria-label={`Delete ${it.filename}`}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
