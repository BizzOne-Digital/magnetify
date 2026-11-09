import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, WandSparkles } from "lucide-react";
import { getSafeImageUrl } from "@/lib/imageUrl";

export interface HeroContent {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroDescription: string;
  heroImage?: string;
  ctaPrimary: string;
  ctaSecondary: string;
  businessMagnetText: string;
}

const TILTS = ["-rotate-3", "rotate-2", "-rotate-1", "rotate-1", "-rotate-2", "rotate-3"];

export function Hero({ content, gallery }: { content: HeroContent; gallery: { image: string; alt: string }[] }) {
  const lines = content.heroTitle.split("\n");
  const photos = gallery.slice(0, 5);
  const bg = content.heroImage ? getSafeImageUrl(content.heroImage, "") : "";

  return (
    <section className="relative overflow-hidden border-b border-gold/40" aria-labelledby="hero-title">
      {/* warm backdrop */}
      <div
        className="absolute inset-0 bg-[radial-gradient(70%_90%_at_15%_30%,#3a2a0e_0%,#16110a_40%,#090909_75%)]"
        aria-hidden="true"
      />
      {bg ? (
        <Image src={bg} alt="" fill priority className="object-cover opacity-25" sizes="100vw" aria-hidden="true" />
      ) : null}

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[1.02fr_1fr] lg:gap-6 lg:py-14">
        <div className="animate-fade-up">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-black/40 px-4 py-1.5 font-display text-[11px] font-bold tracking-[0.25em] text-champagne sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-promo" aria-hidden="true" />
            {content.heroEyebrow}
          </p>
          <h1 id="hero-title" className="relative font-display text-[2.9rem] font-black leading-[0.95] tracking-tight sm:text-7xl xl:text-[5.4rem]">
            {lines.map((l, i) => (
              <span key={i} className="text-gold-metal block drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
                {l}
              </span>
            ))}
            <svg
              viewBox="0 0 420 22"
              className="mt-2 h-4 w-[78%] max-w-[420px] sm:h-5"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <path d="M4 15 C 120 4, 280 4, 416 10" stroke="#D71920" strokeWidth="6" fill="none" strokeLinecap="round" />
            </svg>
          </h1>
          <p className="mt-5 font-display text-2xl font-bold text-cream sm:text-[2rem]">{content.heroSubtitle}</p>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-cream/85 sm:text-lg">{content.heroDescription}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link href="/products" className="btn btn-primary px-7 py-3.5 text-base">
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              {content.ctaPrimary}
            </Link>
            <Link href="/customize" className="btn btn-secondary px-7 py-3.5 text-base">
              <WandSparkles className="h-5 w-5" aria-hidden="true" />
              {content.ctaSecondary}
            </Link>
          </div>
        </div>

        {/* Fridge display */}
        <div className="relative animate-fade-up [animation-delay:120ms]">
          <div className="fridge-surface relative overflow-hidden rounded-[1.4rem] border border-white/15 p-5 pl-12 shadow-[0_30px_60px_rgba(0,0,0,0.6)] sm:p-8 sm:pl-16">
            {/* fridge handle */}
            <div
              className="absolute left-3 top-6 bottom-6 w-4 rounded-full bg-[linear-gradient(90deg,#3f4144,#d9dbde_40%,#8a8c90_70%,#4a4c50)] shadow-[4px_0_10px_rgba(0,0,0,0.45)] sm:left-5 sm:w-5"
              aria-hidden="true"
            />
            <div className="grid grid-cols-3 gap-3 sm:gap-5">
              {photos.map((p, i) => (
                <div key={i} className={`magnet-tile relative aspect-square bg-card transition-transform duration-300 hover:rotate-0 hover:scale-[1.04] ${TILTS[i]}`}>
                  <Image
                    src={getSafeImageUrl(p.image)}
                    alt={p.alt || "Personalized photo magnet"}
                    fill
                    sizes="(max-width: 640px) 30vw, 180px"
                    className="object-cover"
                    priority
                  />
                </div>
              ))}
              <div
                className={`magnet-tile relative flex aspect-square flex-col items-center justify-center bg-[linear-gradient(160deg,#1e1e1e,#0b0b0b)] p-2 text-center ${TILTS[5]}`}
                style={{ borderColor: "#2b2b2b" }}
              >
                <span className="font-display text-sm font-extrabold leading-tight text-cream sm:text-xl">
                  {content.businessMagnetText}
                </span>
                <span className="mt-1.5 h-1 w-3/5 rounded-full bg-promo" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
