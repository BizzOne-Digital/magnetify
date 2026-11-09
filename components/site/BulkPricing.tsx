import type { PublicProduct } from "@/lib/data";
import { SectionHeading } from "@/components/site/ui";

/** Builds the bulk tier cards from product data so prices always match the admin settings. */
export function BulkPricing({ title, products }: { title: string; products: PublicProduct[] }) {
  const photo = products.filter((p) => p.kind === "photo");
  const tierQtys = Array.from(new Set(photo.flatMap((p) => p.bulkTiers.map((t) => t.minQty)))).sort((a, b) => a - b);
  if (tierQtys.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6" aria-label={title}>
      <SectionHeading title={title} />
      <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-8">
        {tierQtys.map((qty) => {
          const label = photo.flatMap((p) => p.bulkTiers).find((t) => t.minQty === qty)?.label || `OVER ${qty} MAGNETS`;
          return (
            <div key={qty} className="card-gold relative px-4 pb-5 pt-8 sm:px-6">
              <span className="badge-sale absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap px-6 py-1.5 text-sm sm:text-base">
                {label}
              </span>
              <div className="grid grid-cols-2 divide-x divide-gold/30">
                {photo.map((p) => {
                  const t = p.bulkTiers.find((b) => b.minQty === qty);
                  if (!t) return null;
                  return (
                    <div key={p.slug} className="px-2 text-center">
                      <p className="font-display text-base font-semibold text-cream sm:text-lg">{p.shortName}</p>
                      <p className="mt-1 font-display text-3xl font-extrabold text-gold-metal sm:text-4xl">
                        ${t.price.toFixed(2)}
                        <span className="ml-1 text-lg font-semibold text-champagne">each</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
