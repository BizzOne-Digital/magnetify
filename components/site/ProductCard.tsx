import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { getSafeImageUrl } from "@/lib/imageUrl";
import type { PublicProduct } from "@/lib/data";
import { Price } from "@/components/site/ui";

/** Stacked-magnet product card from the reference design. */
export function ProductCard({ product, cta }: { product: PublicProduct; cta?: string }) {
  const portrait = product.size === "2x3";
  const img = getSafeImageUrl(product.image);
  return (
    <article className="card-gold group flex flex-col gap-5 overflow-hidden p-5 sm:flex-row sm:items-center sm:p-6">
      <div className="relative mx-auto h-48 w-56 shrink-0 sm:h-52 sm:w-60" aria-hidden="true">
        {/* stack */}
        {[3, 2, 1].map((n) => (
          <div
            key={n}
            className={`absolute rounded-xl border border-white/20 bg-[linear-gradient(135deg,#3b3b3b,#1a1a1a)] shadow-lg ${
              portrait ? "h-[85%] w-[58%]" : "h-[70%] w-[70%]"
            }`}
            style={{ left: `${4 + n * 5}%`, bottom: `${2 + n * 3}%`, transform: `rotate(${-10 + n * 2}deg)` }}
          />
        ))}
        <div
          className={`magnet-tile absolute overflow-hidden transition-transform duration-300 group-hover:-translate-y-1 ${
            portrait ? "h-[92%] w-[62%]" : "h-[76%] w-[76%]"
          }`}
          style={{ left: "26%", bottom: "16%", transform: "rotate(6deg)" }}
        >
          <Image src={img} alt="" fill sizes="240px" className="object-cover" />
        </div>
      </div>
      <div className="flex-1 space-y-3 text-center sm:text-left">
        <h3 className="section-title text-gold-metal text-3xl sm:text-[2rem]">{product.shortName}</h3>
        <Price regular={product.regularPrice} sale={product.salePrice} />
        <p className="flex items-center justify-center gap-2 text-sm text-cream/85 sm:justify-start">
          <LayoutGrid className="h-6 w-6 text-gold" strokeWidth={1.5} aria-hidden="true" />
          <span>
            Minimum order:
            <br />
            <strong className="text-cream">{product.minOrder} magnets</strong>
          </span>
        </p>
        <Link
          href={`/customize?product=${product.slug}`}
          className="btn btn-secondary btn-sm mt-1"
          aria-label={`${cta ?? "Customize"} ${product.shortName}`}
        >
          {cta ?? "Customize"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
