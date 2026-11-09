import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getSiteSettings } from "@/lib/data";
import { ClearCartOnMount } from "@/components/cart/ClearCartOnMount";

export const metadata: Metadata = { title: "Order Received", robots: { index: false } };

export default async function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const sp = await searchParams;
  const order = typeof sp.order === "string" ? sp.order.replace(/[^A-Z0-9-]/gi, "").slice(0, 30) : "";
  const paidViaStripe = typeof sp.session_id === "string";
  const site = await getSiteSettings();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <ClearCartOnMount />
      <div className="card-gold p-8 sm:p-12">
        <CheckCircle2 className="mx-auto h-16 w-16 text-gold" aria-hidden="true" />
        <h1 className="section-title text-gold-metal mt-4 text-3xl sm:text-4xl">Thank you for your order!</h1>
        {order ? (
          <p className="mt-3 text-lg text-cream">
            Order number: <strong className="font-display text-gold-light">{order}</strong>
          </p>
        ) : null}
        <p className="mt-4 text-cream/80">
          {paidViaStripe
            ? "Your payment is being confirmed. We will email you once your magnets go to print."
            : "We have received your order and will email you a secure payment request shortly. Your magnets go to print once payment is received."}
        </p>
        <p className="mt-4 text-sm text-muted">
          Questions? Email{" "}
          <a className="text-gold-light hover:underline" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>
        </p>
        <Link href="/" className="btn btn-secondary mt-8">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
