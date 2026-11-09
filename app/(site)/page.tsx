import type { Metadata } from "next";
import { Info } from "lucide-react";
import { Hero, type HeroContent } from "@/components/site/Hero";
import { ProductCard } from "@/components/site/ProductCard";
import { HowItWorks } from "@/components/site/HowItWorks";
import { FeatureStrip } from "@/components/site/FeatureStrip";
import { BulkPricing } from "@/components/site/BulkPricing";
import { AboutStrip, EmailBar } from "@/components/site/AboutStrip";
import { SectionHeading } from "@/components/site/ui";
import { CtaBanner, HomeFaq, Occasions, WhyMagnetify } from "@/components/site/HomeSections";
import { MagnetCustomizer } from "@/components/customizer/MagnetCustomizer";
import { getPageContent, getProducts, getSiteSettings, toPricedProducts } from "@/lib/data";

export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Magnetify | Personalized Photo Magnets" },
  description:
    "Turn your favorite photos into personalized magnets for families, couples, pets, gifts and businesses. Small magnets, big memories.",
  alternates: { canonical: "/" },
};

type HomeContent = HeroContent & {
  featuredTitle: string;
  stepsTitle: string;
  stepsSubtitle: string;
  features: { title: string; text?: string }[];
  bulkTitle: string;
  aboutTitle: string;
  aboutText: string;
  occasionsTitle: string;
  occasionsSubtitle: string;
  occasions: { title: string; text: string; image: string }[];
  whyTitle: string;
  whyItems: { title: string; text?: string }[];
  faqTitle: string;
  faqs: { q: string; a: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
};

export default async function HomePage() {
  const [home, gallery, products, site] = await Promise.all([
    getPageContent<HomeContent>("home"),
    getPageContent<{ items: { image: string; alt: string }[] }>("gallery"),
    getProducts(),
    getSiteSettings(),
  ]);
  const featured = products.filter((p) => p.kind === "photo").slice(0, 2);

  return (
    <>
      <Hero content={home} gallery={gallery.items ?? []} />

      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6" aria-label={home.featuredTitle}>
        <SectionHeading title={home.featuredTitle} />
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {featured.map((p) => (
            <ProductCard key={p.slug} product={p} cta={`Customize ${p.size}`} />
          ))}
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-center text-sm italic text-cream/80">
          <Info className="h-4 w-4 shrink-0 text-cream/70" aria-hidden="true" />
          {site.finalSaleNotice}
        </p>
      </section>

      <div className="gold-divider mx-auto mt-10 max-w-7xl" />

      <HowItWorks title={home.stepsTitle} subtitle={home.stepsSubtitle} />

      <section id="customize" className="mx-auto mt-8 max-w-7xl scroll-mt-24 px-4 sm:px-6" aria-label="How to Customize Your Magnets">
        <MagnetCustomizer products={toPricedProducts(products)} variant="home" showSteps />
      </section>

      <FeatureStrip features={home.features ?? []} />
      <Occasions title={home.occasionsTitle} subtitle={home.occasionsSubtitle} items={home.occasions ?? []} />
      <BulkPricing title={home.bulkTitle} products={products} />
      <WhyMagnetify title={home.whyTitle} items={home.whyItems ?? []} />
      <AboutStrip title={home.aboutTitle} text={home.aboutText} />
      <HomeFaq title={home.faqTitle} faqs={home.faqs ?? []} />
      <CtaBanner title={home.ctaTitle} text={home.ctaText} button={home.ctaButton} image={gallery.items?.[0]?.image ?? ""} />
      <EmailBar email={site.contactEmail} />
    </>
  );
}
