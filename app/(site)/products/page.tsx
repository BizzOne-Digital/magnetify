import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, FileImage, IdCard, Megaphone } from "lucide-react";
import { getPageContent, getProducts, getSiteSettings } from "@/lib/data";
import { getSafeImageUrl } from "@/lib/imageUrl";
import { PageHero, Price, SectionHeading } from "@/components/site/ui";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop Personalized Photo Magnets",
  description: "Shop 2x2 and 2x3 personalized photo magnets and custom business magnets. Grand opening sale pricing and bulk discounts.",
  alternates: { canonical: "/products" },
};

type ShopContent = { heroTitle: string; heroText: string; businessTitle: string; businessText: string; businessImage: string };

export default async function ProductsPage() {
  const [c, products, site] = await Promise.all([getPageContent<ShopContent>("shop"), getProducts(), getSiteSettings()]);
  const photo = products.filter((p) => p.kind === "photo");
  const business = products.filter((p) => p.kind === "business");

  return (
    <>
      <PageHero eyebrow="PRODUCTS / SHOP" title={c.heroTitle} text={c.heroText} />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6" aria-label="Photo magnets">
        <div className="grid gap-8 md:grid-cols-2">
          {photo.map((p) => (
            <article key={p.slug} className="card-gold group flex flex-col overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden border-b border-gold/30">
                <Image
                  src={getSafeImageUrl(p.image)}
                  alt={`${p.name} example`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="badge-sale absolute left-4 top-4 px-3 py-1 text-sm">SALE</span>
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <h2 className="section-title text-gold-metal text-2xl sm:text-3xl">{p.name}</h2>
                <p className="text-cream/80">{p.description}</p>
                <Price regular={p.regularPrice} sale={p.salePrice} />
                <p className="flex items-center gap-2 text-sm text-cream/85">
                  <BadgeCheck className="h-5 w-5 text-gold" aria-hidden="true" /> Minimum order: <strong>{p.minOrder} magnets</strong>
                </p>
                <Link href={`/customize?product=${p.slug}`} className="btn btn-primary mt-auto w-full sm:w-auto sm:self-start">
                  Customize {p.size} Magnets <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-center text-sm italic text-cream/75">{site.finalSaleNotice}</p>
      </section>

      {business.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6" aria-label={c.businessTitle}>
          <SectionHeading title={c.businessTitle} />
          <div className="card-gold mt-8 grid overflow-hidden md:grid-cols-2">
            <div className="relative min-h-64">
              <Image src={getSafeImageUrl(c.businessImage)} alt="Business branding magnets" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="space-y-5 p-6 sm:p-8">
              <p className="text-lg text-cream/85">{c.businessText}</p>
              <ul className="space-y-3">
                {[
                  [FileImage, "Logo"],
                  [IdCard, "Business card design"],
                  [Megaphone, "Promotional design"],
                ].map(([Icon, label]) => {
                  const I = Icon as typeof FileImage;
                  return (
                    <li key={label as string} className="flex items-center gap-3 text-cream">
                      <I className="h-5 w-5 text-gold" aria-hidden="true" /> {label as string}
                    </li>
                  );
                })}
              </ul>
              <div className="grid gap-3 sm:grid-cols-2">
                {business.map((p) => (
                  <Link key={p.slug} href={`/customize?product=${p.slug}`} className="btn btn-secondary w-full">
                    {p.shortName} · ${p.salePrice.toFixed(2)}
                  </Link>
                ))}
              </div>
              <p className="text-sm font-semibold text-champagne">Minimum order quantity applies.</p>
              <p className="text-xs text-muted">Same sizes, pricing and bulk discounts as photo magnets.</p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
