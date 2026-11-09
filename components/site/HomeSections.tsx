import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, DollarSign, ShieldCheck, Smartphone, WandSparkles } from "lucide-react";
import { getSafeImageUrl } from "@/lib/imageUrl";
import { SectionHeading } from "@/components/site/ui";

export function Occasions({ title, subtitle, items }: { title: string; subtitle: string; items: { title: string; text: string; image: string }[] }) {
  if (!items?.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6" aria-label={title}>
      <SectionHeading title={title} subtitle={subtitle} />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {items.map((o) => (
          <li key={o.title}>
            <Link
              href="/customize"
              className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-gold/40 shadow-[0_18px_40px_rgba(0,0,0,0.5)]"
            >
              <Image
                src={getSafeImageUrl(o.image)}
                alt={o.title}
                fill
                sizes="(max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" aria-hidden="true" />
              <span className="absolute inset-x-0 bottom-0 p-3 sm:p-5">
                <span className="block font-display text-base font-bold text-cream sm:text-xl">{o.title}</span>
                <span className="mt-0.5 hidden text-sm text-cream/80 sm:block">{o.text}</span>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-light opacity-90 transition group-hover:gap-2 sm:text-sm">
                  Create yours <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

const WHY_ICONS = [BadgeCheck, Smartphone, ShieldCheck, DollarSign];

export function WhyMagnetify({ title, items }: { title: string; items: { title: string; text?: string }[] }) {
  if (!items?.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6" aria-label={title}>
      <SectionHeading title={title} />
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((w, i) => {
          const Icon = WHY_ICONS[i % WHY_ICONS.length];
          return (
            <li key={w.title} className="card-gold p-6 transition hover:-translate-y-1">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 ring-1 ring-gold/40">
                <Icon className="h-6 w-6 text-gold" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg font-bold text-cream">{w.title}</h3>
              {w.text ? <p className="mt-2 text-sm leading-relaxed text-cream/75">{w.text}</p> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function HomeFaq({ title, faqs }: { title: string; faqs: { q: string; a: string }[] }) {
  if (!faqs?.length) return null;
  return (
    <section className="mx-auto max-w-4xl px-4 pt-14 sm:px-6" aria-label={title}>
      <SectionHeading title={title} />
      <div className="mt-8 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="card-dark group p-5 open:border-gold/50">
            <summary className="cursor-pointer list-none font-display font-bold text-cream [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                {f.q}
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold transition-transform group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-cream/80">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export function CtaBanner({ title, text, button, image }: { title: string; text: string; button: string; image: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-14 sm:px-6" aria-label={title}>
      <div className="card-gold relative overflow-hidden">
        <Image src={getSafeImageUrl(image)} alt="" fill sizes="100vw" className="object-cover opacity-25" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" aria-hidden="true" />
        <div className="relative max-w-2xl p-8 sm:p-12">
          <h2 className="section-title text-gold-metal text-3xl leading-tight sm:text-4xl">{title}</h2>
          <span className="mt-4 block h-1 w-28 rounded-full bg-promo" aria-hidden="true" />
          <p className="mt-4 text-lg text-cream/85">{text}</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="#customize" className="btn btn-primary px-7 py-3.5 text-base">
              <WandSparkles className="h-5 w-5" aria-hidden="true" /> {button}
            </Link>
            <Link href="/pricing" className="btn btn-secondary px-7 py-3.5 text-base">
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
