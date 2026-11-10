import type { Metadata } from "next";
import { MapPin, Truck } from "lucide-react";
import { getPageContent, getShippingConfig } from "@/lib/data";
import { PROVINCE_NAMES, freeShippingText } from "@/lib/shipping";
import { PolicyBody, type PolicyContent } from "@/components/site/PolicyPage";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shipping",
  description: "Magnetify shipping rates, free shipping on orders of $100 or more, and where we currently ship (BC only).",
  alternates: { canonical: "/shipping" },
};

export default async function ShippingPage() {
  const [content, cfg] = await Promise.all([getPageContent<PolicyContent>("shipping-info"), getShippingConfig()]);
  const areas = cfg.allowedProvinces.length ? cfg.allowedProvinces.map((p) => PROVINCE_NAMES[p] ?? p).join(", ") : "All of Canada";
  return (
    <PolicyBody content={content}>
      <div className="card-gold grid gap-4 p-6 sm:grid-cols-2">
        <div className="flex gap-3">
          <MapPin className="mt-1 h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-champagne">We ship to</p>
            <p className="font-display text-lg font-bold text-cream">{areas}</p>
            {cfg.shippingNotice ? <p className="text-sm text-muted">{cfg.shippingNotice}</p> : null}
          </div>
        </div>
        <div className="flex gap-3">
          <Truck className="mt-1 h-6 w-6 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-champagne">Rates</p>
            <p className="font-display text-lg font-bold text-cream">${cfg.flatShippingRate.toFixed(2)} flat rate</p>
            {freeShippingText(cfg) ? <p className="text-sm text-gold-light">{freeShippingText(cfg)}</p> : null}
          </div>
        </div>
      </div>
    </PolicyBody>
  );
}
