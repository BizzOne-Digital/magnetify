"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, Trash2, X } from "lucide-react";
import { AdminImageField } from "@/components/admin/AdminImageField";
import { adminFetch } from "@/components/admin/adminFetch";
import { productSchema } from "@/lib/validation";

export interface ProductFormValues {
  slug: string;
  name: string;
  shortName: string;
  kind: "photo" | "business";
  size: "2x2" | "2x3";
  regularPrice: number;
  salePrice: number;
  minOrder: number;
  description: string;
  image: string;
  gallery: string[];
  status: "active" | "draft" | "archived";
  bulkTiers: { minQty: number; price: number; label: string }[];
  sortOrder: number;
}

export function ProductForm({ id, initial }: { id: string | null; initial: ProductFormValues }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const parsed = productSchema.safeParse({ ...v, gallery: v.gallery.filter(Boolean) });
    if (!parsed.success) {
      const i = parsed.error.issues[0];
      toast.error(`${i.path.join(".")}: ${i.message}`);
      return;
    }
    if (parsed.data.salePrice > parsed.data.regularPrice) {
      toast.error("Sale price should not be higher than the regular price.");
      return;
    }
    setSaving(true);
    try {
      const res = await adminFetch<{ product: { _id: string } }>(id ? `/api/products/${id}` : "/api/products", {
        method: id ? "PUT" : "POST",
        json: parsed.data,
      });
      toast.success("Product saved");
      if (!id) router.replace(`/admin/products/${res.product._id}`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!id || !confirm(`Delete "${v.name}"? Its images will also be deleted.`)) return;
    try {
      await adminFetch(`/api/products/${id}`, { method: "DELETE" });
      toast.success("Product deleted");
      router.replace("/admin/products");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const num = (k: "regularPrice" | "salePrice" | "minOrder" | "sortOrder", label: string, step = "0.01") => (
    <div>
      <label htmlFor={`p-${k}`} className="label">
        {label}
      </label>
      <input id={`p-${k}`} type="number" step={step} min={0} className="input" value={v[k]} onChange={(e) => set(k, Number(e.target.value))} />
    </div>
  );

  return (
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="card-dark grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="p-name" className="label">
              Product name
            </label>
            <input id="p-name" className="input" value={v.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <label htmlFor="p-short" className="label">
              Short name (cards)
            </label>
            <input id="p-short" className="input" value={v.shortName} onChange={(e) => set("shortName", e.target.value)} required />
          </div>
          <div>
            <label htmlFor="p-slug" className="label">
              URL slug
            </label>
            <input id="p-slug" className="input" value={v.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} required />
          </div>
          <div>
            <label htmlFor="p-kind" className="label">
              Type
            </label>
            <select id="p-kind" className="input" value={v.kind} onChange={(e) => set("kind", e.target.value as ProductFormValues["kind"])}>
              <option value="photo">Photo magnets</option>
              <option value="business">Business magnets</option>
            </select>
          </div>
          <div>
            <label htmlFor="p-size" className="label">
              Size
            </label>
            <select id="p-size" className="input" value={v.size} onChange={(e) => set("size", e.target.value as ProductFormValues["size"])}>
              <option value="2x2">2x2 (square)</option>
              <option value="2x3">2x3 (rectangle)</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="p-desc" className="label">
              Description
            </label>
            <textarea id="p-desc" rows={4} className="input" value={v.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </section>

        <section className="card-dark grid gap-4 p-5 sm:grid-cols-4">
          <h2 className="font-display font-bold text-gold-light sm:col-span-4">Pricing</h2>
          {num("regularPrice", "Regular price ($)")}
          {num("salePrice", "Sale price ($)")}
          {num("minOrder", "Minimum order", "1")}
          {num("sortOrder", "Sort order", "1")}
          <div className="space-y-2 sm:col-span-4">
            <p className="label">Bulk tiers (apply to total magnets in cart)</p>
            {v.bulkTiers.map((t, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] items-end gap-2">
                <input aria-label="Minimum quantity" type="number" className="input" value={t.minQty} onChange={(e) => set("bulkTiers", v.bulkTiers.map((x, j) => (j === i ? { ...x, minQty: Number(e.target.value) } : x)))} />
                <input aria-label="Price each" type="number" step="0.01" className="input" value={t.price} onChange={(e) => set("bulkTiers", v.bulkTiers.map((x, j) => (j === i ? { ...x, price: Number(e.target.value) } : x)))} />
                <input aria-label="Label" className="input" value={t.label} onChange={(e) => set("bulkTiers", v.bulkTiers.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                <button type="button" className="btn btn-danger btn-sm h-[46px]" aria-label="Remove tier" onClick={() => set("bulkTiers", v.bulkTiers.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("bulkTiers", [...v.bulkTiers, { minQty: 200, price: v.salePrice, label: "" }])}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add tier
            </button>
          </div>
        </section>

        <section className="card-dark space-y-4 p-5">
          <h2 className="font-display font-bold text-gold-light">Gallery</h2>
          {v.gallery.map((g, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="flex-1">
                <AdminImageField label={`Gallery image ${i + 1}`} folder="products" value={g} onChange={(url) => set("gallery", url ? v.gallery.map((x, j) => (j === i ? url : x)) : v.gallery.filter((_, j) => j !== i))} />
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("gallery", [...v.gallery, ""])} disabled={v.gallery.some((g) => !g)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add gallery image
          </button>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="card-gold space-y-4 p-5">
          <div>
            <label htmlFor="p-status" className="label">
              Status
            </label>
            <select id="p-status" className="input" value={v.status} onChange={(e) => set("status", e.target.value as ProductFormValues["status"])}>
              <option value="active">Active (visible)</option>
              <option value="draft">Draft (hidden)</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <AdminImageField label="Main product image" folder="products" value={v.image} onChange={(url) => set("image", url)} />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-gold flex-1" disabled={saving}>
              <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Saving…" : "Save product"}
            </button>
            {id ? (
              <button type="button" className="btn btn-danger" onClick={remove} aria-label="Delete product">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted">Replaced or removed images are deleted from storage after you save.</p>
        </section>
      </aside>
    </form>
  );
}
