import type { Metadata } from "next";
import { getProducts, getShippingConfig, getSiteSettings, toPricedProducts } from "@/lib/data";
import { CartView } from "@/components/cart/CartView";
import { SectionHeading } from "@/components/site/ui";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your personalized magnets, bulk discounts and shipping before checkout.",
  robots: { index: false },
};

export default async function CartPage() {
  const [products, shipping, site] = await Promise.all([getProducts(), getShippingConfig(), getSiteSettings()]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" title="Your Cart" className="mb-8" />
      <CartView products={toPricedProducts(products)} shipping={shipping} finalSaleNotice={site.finalSaleNotice} />
    </div>
  );
}
