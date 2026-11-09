import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";
import { getPageContent, getProducts, getShippingConfig, getSiteSettings } from "@/lib/data";
import { PageHero, SectionHeading } from "@/components/site/ui";
import { BulkPricing } from "@/components/site/BulkPricing";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Pricing",
  description: "Personalized magnet pricing: 2x2 from $4.99 and 2x3 from $5.99 each, with bulk pricing for 50+ and 100+ magnets.",
  alternates: { canonical: "/pricing" },
};

type PricingContent = { heroTitle: string; heroText: string; faqs: { q: string; a: string }[] };

export default async function PricingPage() {
  const [c, products, site, shipping] = await Promise.all([
    getPageContent<PricingContent>("pricing"),
    getProducts(),
    getSiteSettings(),
    getShippingConfig(),
  ]);
  const photo = products.filter((p) => p.kind === "photo");

  return (
    <>
      <PageHero eyebrow="PRICING" title={c.heroTitle} text={c.heroText} />

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-label="Standard pricing">
        <SectionHeading title="Standard Pricing" />
        <div className="mt-8 overflow-hidden rounded-2xl border border-gold/50">
          <table className="w-full text-left">
            <caption className="sr-only">Standard magnet pricing</caption>
            <thead className="bg-gold/10 font-display text-sm text-champagne">
              <tr>
                <th scope="col" className="px-4 py-3 sm:px-6">Size</th>
                <th scope="col" className="px-4 py-3 sm:px-6">Regular</th>
                <th scope="col" className="px-4 py-3 sm:px-6">Sale</th>
                <th scope="col" className="px-4 py-3 sm:px-6">Minimum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/20 bg-card">
              {photo.map((p) => (
                <tr key={p.slug}>
                  <th scope="row" className="px-4 py-4 font-display text-lg font-bold text-cream sm:px-6">{p.size}</th>
                  <td className="px-4 py-4 sm:px-6">
                    <s className="text-cream/70 decoration-promo decoration-2">${p.regularPrice.toFixed(2)}</s>
                  </td>
                  <td className="px-4 py-4 sm:px-6">
                    <span className="badge-sale px-2.5 py-1 text-base">${p.salePrice.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-4 text-cream sm:px-6">{p.minOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="-mt-14">
        <BulkPricing title="Bulk Orders" products={products} />
      </div>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <p className="flex items-center justify-center gap-2 text-center font-semibold text-cream">
          <Info className="h-5 w-5 text-gold" aria-hidden="true" /> {site.finalSaleNotice}
        </p>
        {shipping.shippingEnabled ? (
          <p className="mt-2 text-center text-sm text-muted">
            Shipping: ${shipping.flatShippingRate.toFixed(2)} flat rate
            {shipping.freeShippingThreshold > 0 ? ` · Free shipping on orders over $${shipping.freeShippingThreshold.toFixed(2)}` : ""}
            {shipping.localPickupEnabled ? " · Local pickup available" : ""}
          </p>
        ) : null}

        {c.faqs?.length ? (
          <div className="mt-10 space-y-3">
            {c.faqs.map((f) => (
              <details key={f.q} className="card-dark group p-5 open:border-gold/50">
                <summary className="cursor-pointer list-none font-display font-bold text-cream marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-gold transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-cream/80">{f.a}</p>
              </details>
            ))}
          </div>
        ) : null}

        <div className="mt-10 text-center">
          <Link href="/customize" className="btn btn-primary px-8 py-3.5">
            Start Customizing
          </Link>
        </div>
      </section>
    </>
  );
}
