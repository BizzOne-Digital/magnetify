"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Save, X } from "lucide-react";
import { adminFetch } from "@/components/admin/adminFetch";
import { PROVINCE_NAMES, type ShippingConfig } from "@/lib/shipping";

export function ShippingForm({ initial }: { initial: ShippingConfig }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ShippingConfig>(k: K, val: ShippingConfig[K]) => setV((p) => ({ ...p, [k]: val }));

  async function save() {
    setSaving(true);
    try {
      await adminFetch("/api/shipping", { method: "PUT", json: v });
      toast.success("Shipping settings saved");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const toggle = (k: "shippingEnabled" | "localPickupEnabled", label: string) => (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 p-4">
      <span className="font-semibold text-cream">{label}</span>
      <input type="checkbox" className="h-5 w-5 accent-[#D4AF37]" checked={v[k]} onChange={(e) => set(k, e.target.checked)} />
    </label>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <section className="card-dark space-y-4 p-5">
        {toggle("shippingEnabled", "Shipping enabled")}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="s-mode" className="label">
              Rate mode
            </label>
            <select id="s-mode" className="input" value={v.mode} onChange={(e) => set("mode", e.target.value as ShippingConfig["mode"])}>
              <option value="flat">Flat rate</option>
              <option value="zone">Province zones (fallback: flat)</option>
            </select>
          </div>
          <div>
            <label htmlFor="s-flat" className="label">
              Flat shipping rate ($)
            </label>
            <input id="s-flat" type="number" step="0.01" min={0} className="input" value={v.flatShippingRate} onChange={(e) => set("flatShippingRate", Number(e.target.value))} />
          </div>
          <div>
            <label htmlFor="s-free" className="label">
              Free shipping threshold ($)
            </label>
            <input id="s-free" type="number" step="0.01" min={0} className="input" value={v.freeShippingThreshold} onChange={(e) => set("freeShippingThreshold", Number(e.target.value))} />
            <p className="mt-1 text-xs text-muted">0 = no free shipping</p>
          </div>
        </div>
      </section>

      <section className="card-dark space-y-4 p-5">
        {toggle("localPickupEnabled", "Local pickup available")}
        <div>
          <label htmlFor="s-note" className="label">
            Pickup note shown at checkout
          </label>
          <input id="s-note" className="input" value={v.localPickupNote} onChange={(e) => set("localPickupNote", e.target.value)} placeholder="e.g. Pickup in Mississauga, details by email" />
        </div>
      </section>

      <section className="card-dark space-y-4 p-5">
        <div>
          <h2 className="font-display font-bold text-gold-light">Where we ship</h2>
          <p className="text-xs text-muted">Customers can only check out with these provinces. Untick all to ship Canada-wide.</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(PROVINCE_NAMES).map(([code, name]) => (
            <label key={code} className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#D4AF37]"
                checked={v.allowedProvinces.includes(code)}
                onChange={(e) =>
                  set("allowedProvinces", e.target.checked ? [...v.allowedProvinces, code] : v.allowedProvinces.filter((p) => p !== code))
                }
              />
              {name}
            </label>
          ))}
        </div>
        <div>
          <label htmlFor="s-notice" className="label">
            Shipping notice shown on the website
          </label>
          <input id="s-notice" className="input" value={v.shippingNotice} onChange={(e) => set("shippingNotice", e.target.value)} placeholder="Currently shipping within BC only" />
        </div>
      </section>

      {v.mode === "zone" ? (
        <section className="card-dark space-y-3 p-5">
          <h2 className="font-display font-bold text-gold-light">Province zones</h2>
          {v.zones.map((z, i) => (
            <div key={i} className="grid grid-cols-[1fr_1.5fr_0.8fr_auto] gap-2">
              <input aria-label="Zone name" className="input" value={z.name} onChange={(e) => set("zones", v.zones.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <input
                aria-label="Provinces (comma separated)"
                className="input"
                value={z.provinces.join(", ")}
                placeholder="ON, QC"
                onChange={(e) => set("zones", v.zones.map((x, j) => (j === i ? { ...x, provinces: e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) } : x)))}
              />
              <input aria-label="Rate" type="number" step="0.01" className="input" value={z.rate} onChange={(e) => set("zones", v.zones.map((x, j) => (j === i ? { ...x, rate: Number(e.target.value) } : x)))} />
              <button type="button" className="btn btn-danger btn-sm" aria-label="Remove zone" onClick={() => set("zones", v.zones.filter((_, j) => j !== i))}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => set("zones", [...v.zones, { name: "Zone", provinces: [], rate: v.flatShippingRate }])}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add zone
          </button>
        </section>
      ) : null}

      <button type="button" className="btn btn-gold" onClick={save} disabled={saving}>
        <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Saving…" : "Save shipping"}
      </button>
    </div>
  );
}
