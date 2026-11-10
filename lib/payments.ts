import "server-only";
import crypto from "node:crypto";

/**
 * Payment integration layer.
 * - If STRIPE_SECRET_KEY is set, orders are paid via Stripe Checkout (hosted page) and confirmed by webhook.
 * - If PAYPAL_CLIENT_ID + PAYPAL_CLIENT_SECRET are set, customers can pay with PayPal (Orders v2, server-side capture).
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

/* ---------------- PayPal (Orders v2) ---------------- */
export function isPayPalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

function paypalBase() {
  return process.env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

async function paypalToken() {
  const auth = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const json = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new Error(json.error_description || "PayPal authentication failed");
  return json.access_token;
}

const fmt = (n: number) => n.toFixed(2);

export async function createPayPalOrder(opts: {
  orderId: string;
  orderNumber: string;
  lines: CheckoutLine[];
  shipping: number;
  total: number;
  siteUrl: string;
}) {
  const token = await paypalToken();
  const itemTotal = opts.lines.reduce((s, l) => s + Math.round(l.unitAmount * 100) * l.quantity, 0) / 100;
  const body = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: opts.orderNumber,
        custom_id: opts.orderId,
        invoice_id: opts.orderNumber,
        description: `Magnetify order ${opts.orderNumber}`,
        amount: {
          currency_code: "CAD",
          value: fmt(itemTotal + opts.shipping),
          breakdown: { item_total: { currency_code: "CAD", value: fmt(itemTotal) }, shipping: { currency_code: "CAD", value: fmt(opts.shipping) } },
        },
        items: opts.lines.map((l) => ({
          name: l.name.slice(0, 120),
          quantity: String(l.quantity),
          unit_amount: { currency_code: "CAD", value: fmt(l.unitAmount) },
          category: "PHYSICAL_GOODS",
        })),
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: "Magnetify",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
          return_url: `${opts.siteUrl}/api/payments/paypal/return`,
          cancel_url: `${opts.siteUrl}/checkout?cancelled=1`,
        },
      },
    },
  };
  const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": `create-${opts.orderId}` },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { id?: string; links?: { rel: string; href: string }[]; message?: string };
  const approve = json.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!res.ok || !json.id || !approve) throw new Error(json.message || "Could not start PayPal checkout");
  return { id: json.id, url: approve };
}

/** Captures an approved PayPal order. Returns the captured amount for verification. */
export async function capturePayPalOrder(paypalOrderId: string) {
  const token = await paypalToken();
  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "PayPal-Request-Id": `capture-${paypalOrderId}` },
  });
  const json = (await res.json()) as {
    status?: string;
    details?: { issue?: string }[];
    purchase_units?: { custom_id?: string; payments?: { captures?: { id: string; status: string; amount: { currency_code: string; value: string } }[] } }[];
  };
  // Already captured (customer refreshed the return page) is fine.
  if (!res.ok && json.details?.[0]?.issue !== "ORDER_ALREADY_CAPTURED") throw new Error(`PayPal capture failed (${res.status})`);
  const capture = json.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    completed: json.status === "COMPLETED" || capture?.status === "COMPLETED",
    alreadyCaptured: json.details?.[0]?.issue === "ORDER_ALREADY_CAPTURED",
    captureId: capture?.id,
    amount: capture ? Number(capture.amount.value) : null,
    currency: capture?.amount.currency_code ?? null,
  };
}
