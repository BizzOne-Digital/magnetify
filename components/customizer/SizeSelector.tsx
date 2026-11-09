"use client";

import type { PricedProduct } from "@/lib/pricing";

export function SizeSelector({
  products,
  value,
  onChange,
}: {
  products: PricedProduct[];
  value: string;
  onChange: (slug: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-3 font-display text-lg font-bold text-gold-light">Select Size</legend>
      {products.map((p) => {
        const checked = p.slug === value;
        return (
          <label
            key={p.slug}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
              checked ? "border-gold bg-gold/10 shadow-[0_0_18px_rgba(212,175,55,0.15)]" : "border-white/10 bg-[#121212] hover:border-gold/50"
            }`}
          >
            <input
              type="radio"
              name="magnet-size"
              value={p.slug}
              checked={checked}
              onChange={() => onChange(p.slug)}
              className="mt-1 h-4 w-4 accent-[#D71920]"
            />
            <span>
              <span className="block font-display font-semibold text-cream">
                {p.size} ({p.size === "2x2" ? "Square" : "Rectangle"})
              </span>
              <span className="block text-xs text-muted">Minimum: {p.minOrder} magnets</span>
              <span className="mt-1 block text-sm font-semibold text-gold-light">${p.salePrice.toFixed(2)} each</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
