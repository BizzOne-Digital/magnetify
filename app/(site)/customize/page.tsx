import type { Metadata } from "next";
import { getProducts, toPricedProducts } from "@/lib/data";
import { MagnetCustomizer } from "@/components/customizer/MagnetCustomizer";
import { SectionHeading } from "@/components/site/ui";

export const metadata: Metadata = {
  title: "Customize Your Magnets",
  description: "Upload your photos, reposition, zoom and add text to create personalized 2x2 or 2x3 magnets right from your phone or computer.",
  alternates: { canonical: "/customize" },
};

export default async function CustomizePage({ searchParams }: PageProps<"/customize">) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const products = toPricedProducts(await getProducts());
  let slug = one(sp.product);
  const size = one(sp.size);
  if (!slug && size) slug = products.find((p) => p.kind === "photo" && p.size === size)?.slug;

  return (
    <div className="mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" title="Customize Your Magnets" subtitle="Select a size, upload your photos, then tap any magnet to reposition it and add text." />
      <div className="mt-8">
        <MagnetCustomizer key={`${slug}-${one(sp.edit)}`} products={products} initialSlug={slug} editId={one(sp.edit)} showSteps />
      </div>
    </div>
  );
}
