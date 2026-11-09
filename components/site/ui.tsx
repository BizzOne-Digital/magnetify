import type { ReactNode } from "react";

/** Section heading with thin gold lines either side, as in the reference design. */
export function SectionHeading({
  title,
  subtitle,
  as: Tag = "h2",
  className = "",
}: {
  title: string;
  subtitle?: string;
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <span className="gold-divider hidden h-px flex-1 max-w-[180px] sm:block" aria-hidden="true" />
        <Tag className="section-title text-gold-metal text-[1.65rem] leading-tight sm:text-4xl">{title}</Tag>
        <span className="gold-divider hidden h-px flex-1 max-w-[180px] sm:block" aria-hidden="true" />
      </div>
      {subtitle ? <p className="mx-auto mt-3 max-w-2xl text-base text-cream/80 sm:text-lg">{subtitle}</p> : null}
    </div>
  );
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow?: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b border-gold/30 bg-[radial-gradient(90%_120%_at_20%_0%,#2a2210_0%,#0d0d0d_55%,#090909_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        {eyebrow ? (
          <p className="mb-3 font-display text-xs font-bold tracking-[0.25em] text-champagne sm:text-sm">{eyebrow}</p>
        ) : null}
        <h1 className="section-title text-gold-metal max-w-3xl text-4xl leading-[1.05] sm:text-6xl">{title}</h1>
        <span className="mt-4 block h-1 w-40 rounded-full bg-promo" aria-hidden="true" />
        {text ? <p className="mt-5 max-w-2xl text-lg text-cream/85">{text}</p> : null}
        {children}
      </div>
    </section>
  );
}

export function Price({ regular, sale, size = "md" }: { regular: number; sale: number; size?: "md" | "lg" }) {
  return (
    <div className="space-y-2">
      <p className={size === "lg" ? "text-lg text-cream/90" : "text-base text-cream/90"}>
        Regular: <s className="text-cream/70 decoration-promo decoration-2">${regular.toFixed(2)}</s> each
      </p>
      <p className={`badge-sale ${size === "lg" ? "px-4 py-2 text-2xl" : "px-3 py-1.5 text-xl"}`}>
        Sale: ${sale.toFixed(2)}
        <span className="ml-1 text-base font-semibold">each</span>
      </p>
    </div>
  );
}
