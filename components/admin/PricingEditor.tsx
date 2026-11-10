"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { adminFetch } from "@/components/admin/adminFetch";

type P = {
  _id: string;
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
  bulkTiers: { minQty: number; price: number; label?: string }[];
  sortOrder: number;
};

export function PricingEditor({ products }: { products: P[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(products);
  const [saving, setSaving] = useState(false);
  const tierQtys = Array.from(new Set(rows.flatMap((r) => r.bulkTiers.map((t) => t.minQty)))).sort((a, b) => a - b);

  const update = (id: string, patch: Partial<P>) => setRows((rs) => rs.map((r) => (r._id === id ? { ...r, ...patch } : r)));
  const setTier = (r: P, qty: number, price: number) => {
    const exists = r.bulkTiers.some((t) => t.minQty === qty);
    const tiers = exists ? r.bulkTiers.map((t) => (t.minQty === qty ? { ...t, price } : t)) : [...r.bulkTiers, { minQty: qty, price, label: `${qty}+ MAGNETS` }];
    update(r._id, { bulkTiers: tiers });
  };

  async function saveAll() {
    setSaving(true);
    try {
      for (const r of rows) {
        const { _id, ...rest } = r;
        await adminFetch(`/api/products/${_id}`, {
          method: "PUT",
          json: { ...rest, bulkTiers: rest.bulkTiers.map((t) => ({ minQty: t.minQty, price: t.price, label: t.label ?? "" })) },
        });
      }
      toast.success("Prices updated across the website");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const cell = "input w-24 px-2 py-1.5 text-sm";

  return (
    <div className="space-y-4">
      <div className="card-dark overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Regular</th>
              <th className="px-4 py-3">Sale</th>
              <th className="px-4 py-3">Minimum</th>
              {tierQtys.map((q) => (
                <th key={q} className="px-4 py-3">
                  {q}+ price
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r._id}>
                <th scope="row" className="px-4 py-3 text-left font-semibold text-cream">
                  {r.name}
                  <span className="block text-xs font-normal text-muted">{r.status}</span>
                </th>
                <td className="px-4 py-2">
                  <input aria-label={`${r.name} regular price`} type="number" step="0.01" className={cell} value={r.regularPrice} onChange={(e) => update(r._id, { regularPrice: Number(e.target.value) })} />
                </td>
                <td className="px-4 py-2">
                  <input aria-label={`${r.name} sale price`} type="number" step="0.01" className={cell} value={r.salePrice} onChange={(e) => update(r._id, { salePrice: Number(e.target.value) })} />
                </td>
                <td className="px-4 py-2">
                  <input aria-label={`${r.name} minimum`} type="number" className={cell} value={r.minOrder} onChange={(e) => update(r._id, { minOrder: Number(e.target.value) })} />
                </td>
                {tierQtys.map((q) => (
                  <td key={q} className="px-4 py-2">
                    <input
                      aria-label={`${r.name} ${q}+ price`}
                      type="number"
                      step="0.01"
                      className={cell}
                      value={r.bulkTiers.find((t) => t.minQty === q)?.price ?? ""}
                      onChange={(e) => setTier(r, q, Number(e.target.value))}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">Bulk tiers apply to the total number of magnets in a customer&apos;s cart. Add or rename tiers on each product&apos;s edit page.</p>
      <button type="button" className="btn btn-gold" onClick={saveAll} disabled={saving}>
        <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Saving…" : "Save all prices"}
      </button>
    </div>
  );
}
