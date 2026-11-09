import type { Metadata } from "next";
import { getProducts, getShippingConfig, getSiteSettings, toPricedProducts } from "@/lib/data";
import { isStripeConfigured } from "@/lib/payments";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { SectionHeading } from "@/components/site/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your personalized magnet order.",
  robots: { index: false },
};

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const sp = await searchParams;
  const [products, shipping, site] = await Promise.all([getProducts(), getShippingConfig(), getSiteSettings()]);
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading as="h1" title="Checkout" className="mb-8" />
      {sp.cancelled ? (
        <p className="mb-6 rounded-xl border border-promo/60 bg-promo/10 p-4 text-sm text-cream">
          Payment was cancelled. Your order has been saved as unpaid — you can try again below or contact us for help.
        </p>
      ) : null}
      <CheckoutForm
        products={toPricedProducts(products)}
        shipping={shipping}
        stripeEnabled={isStripeConfigured()}
        finalSaleNotice={site.finalSaleNotice}
      />
    </div>
  );
}
