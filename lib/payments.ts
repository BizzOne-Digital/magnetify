import "server-only";
import crypto from "node:crypto";

/**
 * Payment integration layer.
 * - If STRIPE_SECRET_KEY is set, orders are paid via Stripe Checkout (hosted page) and confirmed by webhook.
 * - Otherwise the order is saved as "awaiting_payment" and the customer is told we will email a payment link.
 *   Nothing is ever marked as paid without a verified provider confirmation.
 */
export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export interface CheckoutLine {
  name: string;
  unitAmount: number; // dollars
  quantity: number;
}

export async function createStripeCheckoutSession(opts: {
  orderId: string;
  orderNumber: string;
  email: string;
  lines: CheckoutLine[];
  shipping: number;
  siteUrl: string;
}) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe is not configured");

  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("customer_email", opts.email);
  p.set("client_reference_id", opts.orderId);
  p.set("metadata[orderId]", opts.orderId);
  p.set("metadata[orderNumber]", opts.orderNumber);
  p.set("success_url", `${opts.siteUrl}/checkout/success?order=${opts.orderNumber}&session_id={CHECKOUT_SESSION_ID}`);
  p.set("cancel_url", `${opts.siteUrl}/checkout?cancelled=1`);
  opts.lines.forEach((l, i) => {
    p.set(`line_items[${i}][quantity]`, String(l.quantity));
    p.set(`line_items[${i}][price_data][currency]`, "cad");
    p.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(l.unitAmount * 100)));
    p.set(`line_items[${i}][price_data][product_data][name]`, l.name);
  });
  if (opts.shipping > 0) {
    const i = opts.lines.length;
    p.set(`line_items[${i}][quantity]`, "1");
    p.set(`line_items[${i}][price_data][currency]`, "cad");
    p.set(`line_items[${i}][price_data][unit_amount]`, String(Math.round(opts.shipping * 100)));
    p.set(`line_items[${i}][price_data][product_data][name]`, "Shipping");
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: p,
  });
  const json = (await res.json()) as { id?: string; url?: string; error?: { message: string } };
  if (!res.ok || !json.url) throw new Error(json.error?.message || "Could not start Stripe checkout");
  return { id: json.id!, url: json.url };
}

/** Verifies a Stripe webhook signature (Stripe-Signature header, v1 scheme). */
export function verifyStripeSignature(payload: string, header: string | null, secret: string, toleranceSec = 300) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts.t;
  const sigs = header
    .split(",")
    .filter((kv) => kv.startsWith("v1="))
    .map((kv) => kv.slice(3));
  if (!t || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > toleranceSec) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  return sigs.some((s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}
