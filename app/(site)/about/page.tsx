import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPageContent } from "@/lib/data";
import { getSafeImageUrl } from "@/lib/imageUrl";
import { PageHero } from "@/components/site/ui";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Magnetify turns your photographs into personalized fridge magnets for families, couples, pet owners, gift givers and businesses.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About Magnetify", description: "Turning moments into memories with personalized photo magnets." },
};

type AboutContent = {
  heroTitle: string;
  heroText: string;
  heroImage: string;
  sections: { title: string; text: string; image: string }[];
};

export default async function AboutPage() {
  const c = await getPageContent<AboutContent>("about");
  return (
    <>
      <PageHero eyebrow="ABOUT MAGNETIFY" title={c.heroTitle} text={c.heroText}>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/customize" className="btn btn-primary">
            Start Customizing <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href="/products" className="btn btn-secondary">
            Browse Products
          </Link>
        </div>
      </PageHero>

      {c.heroImage ? (
        <div className="mx-auto -mt-2 max-w-7xl px-4 pt-10 sm:px-6">
          <div className="card-gold relative aspect-[21/8] overflow-hidden">
            <Image src={getSafeImageUrl(c.heroImage)} alt="Photo magnets displayed in a home kitchen" fill className="object-cover" sizes="(max-width: 1280px) 100vw, 1280px" priority />
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl space-y-12 px-4 py-14 sm:px-6 sm:space-y-16">
        {(c.sections ?? []).map((s, i) => (
          <section key={s.title + i} className={`grid items-center gap-8 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
            <div className="card-gold group relative aspect-[4/3] overflow-hidden">
              <Image
                src={getSafeImageUrl(s.image)}
                alt={s.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div>
              <p className="font-display text-xs font-bold tracking-[0.25em] text-champagne">0{i + 1}</p>
              <h2 className="section-title text-gold-metal mt-2 text-3xl sm:text-4xl">{s.title}</h2>
              <span className="mt-3 block h-0.5 w-20 rounded-full bg-gold" aria-hidden="true" />
              <p className="mt-4 text-lg leading-relaxed text-cream/85">{s.text}</p>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
