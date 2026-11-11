"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Lock, Mail, Package, Store, Truck, Wallet } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { useCartPricing } from "@/components/cart/CartView";
import { TileView } from "@/components/customizer/TileView";
import { renderTile } from "@/lib/cart/render";
import { FRAME_RATIO, filledTiles, type TileState } from "@/lib/cart/types";
import { money, type PricedProduct } from "@/lib/pricing";
import { PROVINCE_NAMES, freeShippingText, quoteShipping, shipsTo, type ShippingConfig } from "@/lib/shipping";

const PROVINCES = Object.keys(PROVINCE_NAMES);

type FieldErrors = Record<string, string>;

async function uploadArtwork(blob: Blob): Promise<string> {
  const fd = new FormData();
  fd.append("file", new File([blob], "magnet.jpg", { type: "image/jpeg" }));
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("/api/order-uploads", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.url) return json.url as string;
      if (res.status < 500 && res.status !== 429) throw new Error(json.error || "Upload rejected");
    } catch (err) {
      if (attempt === 2) throw err;
    }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
  }
  throw new Error("Upload failed");
}

export function CheckoutForm({
  products,
  shipping,
  stripeEnabled,
  paypalEnabled,
  finalSaleNotice,
}: {
  products: PricedProduct[];
  shipping: ShippingConfig;
  stripeEnabled: boolean;
  paypalEnabled: boolean;
  finalSaleNotice: string;
}) {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  const pricing = useCartPricing(products);
  const [fulfillment, setFulfillment] = useState<"shipping" | "pickup">(shipping.shippingEnabled ? "shipping" : "pickup");
  const provinceOptions = shipping.allowedProvinces.length ? PROVINCES.filter((p) => shipping.allowedProvinces.includes(p)) : PROVINCES;
  const [province, setProvince] = useState(provinceOptions.length === 1 ? provinceOptions[0] : "");
  const [consent, setConsent] = useState<"" | "agree" | "disagree">("");
  const onlinePayment = stripeEnabled || paypalEnabled;
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal" | "manual">(stripeEnabled ? "card" : paypalEnabled ? "paypal" : "manual");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ship = quoteShipping({ subtotal: pricing.subtotal, fulfillment, province, totalMagnets: pricing.totalMagnets }, shipping);
  const total = pricing.subtotal + (ship.available ? ship.amount : 0);

  if (!ready) return <div className="card-dark h-96 animate-pulse" aria-busy="true" />;
  if (items.length === 0) {
    return (
      <div className="card-gold mx-auto max-w-xl p-10 text-center">
        <p className="text-cream">Your cart is empty.</p>
        <Link href="/customize" className="btn btn-primary mt-6">
          Start Customizing
        </Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    const fd = new FormData(e.currentTarget);
    const get = (k: string) => String(fd.get(k) ?? "").trim();
    const errs: FieldErrors = {};
    if (get("name").length < 2) errs.name = "Please enter your full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) errs.email = "Please enter a valid email";
    if (fulfillment === "shipping") {
      if (get("line1").length < 3) errs.line1 = "Street address is required";
      if (get("city").length < 2) errs.city = "City is required";
      if (!get("province")) errs.province = "Province is required";
      else if (!shipsTo(shipping, get("province"))) errs.province = shipping.shippingNotice || "We do not ship to this province yet";
      if (!/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(get("postalCode"))) errs.postalCode = "Enter a valid Canadian postal code";
    }
    if (!consent) errs.consent = "Please choose one social media consent option";
    if (!ship.available) errs.fulfillment = "This delivery option is not available";
    if (pricing.errors.length) errs.cart = pricing.errors[0];
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error(Object.values(errs)[0]);
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      // 1) Render and upload print-ready artwork for each magnet.
      const all: { itemIdx: number; tile: TileState }[] = [];
      items.forEach((it, itemIdx) => filledTiles(it).forEach((tile) => all.push({ itemIdx, tile })));
      setProgress({ done: 0, total: all.length });
      const urls = new Map<string, string>();
      let done = 0;
      const queue = [...all];
      const worker = async () => {
        while (queue.length) {
          const job = queue.shift()!;
          const blob = await renderTile(job.tile, items[job.itemIdx].size);
          urls.set(job.tile.id, await uploadArtwork(blob));
          done++;
          setProgress({ done, total: all.length });
        }
      };
      await Promise.all([worker(), worker(), worker()]);

      // 2) Create the order (server recalculates all prices).
      const payload = {
        customer: { name: get("name"), email: get("email"), phone: get("phone") },
        fulfillment,
        shippingAddress: {
          line1: get("line1"),
          line2: get("line2"),
          city: get("city"),
          province: get("province"),
          postalCode: get("postalCode").toUpperCase(),
          country: "Canada",
        },
        items: items.map((it) => ({
          productSlug: it.productSlug,
          tiles: filledTiles(it).map((t) => ({
            id: t.id,
            printUrl: urls.get(t.id)!,
            x: t.x,
            y: t.y,
            scale: t.scale,
            text: t.text,
            textX: t.textX,
            textY: t.textY,
            textColor: t.textColor,
            textSize: t.textSize,
            textFont: t.textFont ?? "classic",
          })),
        })),
        socialConsent: consent,
        paymentMethod,
        notes: get("notes"),
      };
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "We could not place your order. Please try again.");

      if (json.paymentError) toast.message(json.paymentError);
      if (json.checkoutUrl) {
        toast.success(paymentMethod === "paypal" ? "Redirecting to PayPal…" : "Redirecting to secure card payment…");
        window.location.href = json.checkoutUrl as string;
        return;
      }
      clear();
      router.push(`/checkout/success?order=${encodeURIComponent(json.orderNumber)}`);
    } catch (err) {
      toast.error((err as Error).message || "Network error. Please check your connection and try again.");
      setSubmitting(false);
      setProgress(null);
    }
  }

  const input = (name: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={props.className}>
      <label htmlFor={`f-${name}`} className="label">
        {label}
      </label>
      <input
        id={`f-${name}`}
        name={name}
        {...props}
        className="input"
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `f-${name}-err` : undefined}
      />
      {errors[name] ? (
        <p id={`f-${name}-err`} className="mt-1 text-sm text-promo">
          {errors[name]}
        </p>
      ) : null}
    </div>
  );

  const productName = new Map(products.map((p) => [p.slug, p.name]));

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <fieldset className="card-gold space-y-4 p-5 sm:p-6">
          <legend className="sr-only">Customer information</legend>
          <h2 className="section-title text-gold-metal text-xl">1. Customer Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {input("name", "Full name", { autoComplete: "name", required: true })}
            {input("email", "Email", { type: "email", autoComplete: "email", required: true })}
          </div>
          {input("phone", "Phone (optional, for delivery questions)", { type: "tel", autoComplete: "tel" })}
        </fieldset>

        <fieldset className="card-gold space-y-4 p-5 sm:p-6">
          <legend className="sr-only">Delivery</legend>
          <h2 className="section-title text-gold-metal text-xl">2. Delivery</h2>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery method" id="f-fulfillment" tabIndex={-1}>
            {shipping.shippingEnabled ? (
              <ChoiceCard checked={fulfillment === "shipping"} onSelect={() => setFulfillment("shipping")} name="fulfillment" value="shipping" icon={<Truck className="h-5 w-5" />}>
                Ship to me
                <span className="block text-xs font-normal text-muted">
                  {money(shipping.flatShippingRate)} flat{freeShippingText(shipping) ? ` · ${freeShippingText(shipping).toLowerCase()}` : ""}
                </span>
                {shipping.shippingNotice ? <span className="mt-1 block text-xs font-semibold text-champagne">{shipping.shippingNotice}</span> : null}
              </ChoiceCard>
            ) : null}
            {shipping.localPickupEnabled ? (
              <ChoiceCard checked={fulfillment === "pickup"} onSelect={() => setFulfillment("pickup")} name="fulfillment" value="pickup" icon={<Store className="h-5 w-5" />}>
                Local pickup
                <span className="block text-xs font-normal text-muted">{shipping.localPickupNote || "Free · we will email pickup details"}</span>
              </ChoiceCard>
            ) : null}
          </div>
          {!shipping.shippingEnabled && !shipping.localPickupEnabled ? (
            <p className="text-sm text-promo">Delivery is temporarily unavailable. Please contact us to place your order.</p>
          ) : null}
          {fulfillment === "shipping" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {input("line1", "Street address", { autoComplete: "address-line1", className: "sm:col-span-2" })}
              {input("line2", "Apartment, suite (optional)", { autoComplete: "address-line2", className: "sm:col-span-2" })}
              {input("city", "City", { autoComplete: "address-level2" })}
              <div>
                <label htmlFor="f-province" className="label">
                  Province
                </label>
                <select
                  id="f-province"
                  name="province"
                  className="input"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  aria-invalid={Boolean(errors.province)}
                  autoComplete="address-level1"
                >
                  <option value="">Select…</option>
                  {provinceOptions.map((p) => (
                    <option key={p} value={p}>
                      {PROVINCE_NAMES[p]} ({p})
                    </option>
                  ))}
                </select>
                {errors.province ? <p className="mt-1 text-sm text-promo">{errors.province}</p> : null}
              </div>
              {input("postalCode", "Postal code", { autoComplete: "postal-code", placeholder: "A1A 1A1" })}
              <div>
                <span className="label">Country</span>
                <p className="input text-cream/70">Canada</p>
              </div>
            </div>
          ) : null}
          <div>
            <label htmlFor="f-notes" className="label">
              Order notes (optional)
            </label>
            <textarea id="f-notes" name="notes" rows={3} maxLength={1000} className="input" placeholder="Anything we should know?" />
          </div>
        </fieldset>

        <fieldset className="card-gold space-y-3 p-5 sm:p-6" aria-describedby={errors.consent ? "consent-err" : undefined}>
          <legend className="sr-only">Social Media Feature Consent</legend>
          <h2 className="section-title text-gold-metal text-xl">3. Social Media Feature Consent</h2>
          <p className="text-sm text-muted">Please choose one option. This is required.</p>
          <div className="space-y-2" id="f-consent" tabIndex={-1}>
            <ChoiceCard checked={consent === "agree"} onSelect={() => setConsent("agree")} name="socialConsent" value="agree">
              I agree to have my order featured in your social media content.
            </ChoiceCard>
            <ChoiceCard checked={consent === "disagree"} onSelect={() => setConsent("disagree")} name="socialConsent" value="disagree">
              I do not agree to have my order featured in your social media content.
            </ChoiceCard>
          </div>
          {errors.consent ? (
            <p id="consent-err" className="text-sm text-promo">
              {errors.consent}
            </p>
          ) : null}
        </fieldset>

        <section className="card-gold space-y-3 p-5 sm:p-6" aria-label="Payment">
          <h2 className="section-title text-gold-metal text-xl">4. Payment</h2>
          {onlinePayment ? (
            <div className="space-y-2" role="radiogroup" aria-label="Payment method">
              {stripeEnabled ? (
                <ChoiceCard checked={paymentMethod === "card"} onSelect={() => setPaymentMethod("card")} name="paymentMethod" value="card" icon={<CreditCard className="h-5 w-5" />}>
                  Credit / Debit card
                  <span className="block text-xs font-normal text-muted">Visa, Mastercard, Amex and more — secure checkout by Stripe</span>
                </ChoiceCard>
              ) : null}
              {paypalEnabled ? (
                <ChoiceCard checked={paymentMethod === "paypal"} onSelect={() => setPaymentMethod("paypal")} name="paymentMethod" value="paypal" icon={<Wallet className="h-5 w-5" />}>
                  PayPal
                  <span className="block text-xs font-normal text-muted">Pay with your PayPal balance, bank or card through PayPal</span>
                </ChoiceCard>
              ) : null}
              <p className="text-xs text-muted">After you place your order you will be taken to the secure payment page to complete payment.</p>
            </div>
          ) : (
            <p className="flex items-start gap-3 text-cream/85">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
              Online card payment is being set up. Place your order now and we will email you a secure payment request. Your magnets go
              to print once payment is received.
            </p>
          )}
          <p className="flex items-center gap-2 text-xs text-muted">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Your photos are only used to make your order.
          </p>
        </section>
      </div>

      <aside className="card-gold h-fit space-y-4 p-5 sm:p-6 lg:sticky lg:top-24" aria-label="Order review">
        <h2 className="section-title text-gold-metal text-xl">Order Review</h2>
        <ul className="space-y-3">
          {items.map((it) => {
            const line = pricing.lines.find((l) => l.productSlug === it.productSlug && l.quantity === filledTiles(it).length);
            return (
              <li key={it.id} className="flex gap-3">
                <div className="w-14 shrink-0 overflow-hidden rounded-md border border-white/10">
                  {it.tiles[0] ? <TileView tile={it.tiles[0]} ratio={FRAME_RATIO[it.size]} /> : null}
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-cream">{productName.get(it.productSlug) ?? it.productSlug}</p>
                  <p className="text-muted">
                    {filledTiles(it).length} × {line ? money(line.unitPrice) : "—"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-cream">{line ? money(line.lineTotal) : "—"}</p>
              </li>
            );
          })}
        </ul>
        <div className="gold-divider" />
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-cream/80">Subtotal ({pricing.totalMagnets} magnets)</dt>
            <dd>{money(pricing.subtotal)}</dd>
          </div>
          {pricing.discount > 0 ? (
            <div className="flex justify-between text-gold-light">
              <dt>You save</dt>
              <dd>-{money(pricing.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt className="text-cream/80">{ship.label}</dt>
            <dd>{ship.available ? (ship.amount ? money(ship.amount) : "Free") : "—"}</dd>
          </div>
          {ship.available && ship.freeShippingRemaining !== null && ship.freeShippingRemaining > 0 ? (
            <p className="rounded-lg bg-gold/10 px-3 py-2 text-xs text-gold-light">
              Add {money(ship.freeShippingRemaining)} more for free shipping ({freeShippingText(shipping).toLowerCase()}).
            </p>
          ) : null}
          <div className="flex items-baseline justify-between pt-2">
            <dt className="font-display font-bold text-cream">Total (CAD)</dt>
            <dd className="font-display text-2xl font-extrabold text-gold-light">{money(total)}</dd>
          </div>
        </dl>
        {errors.cart ? <p className="text-sm text-promo">{errors.cart}</p> : null}
        <button type="submit" className="btn btn-primary w-full py-3.5 text-base" disabled={submitting}>
          <Package className="h-5 w-5" aria-hidden="true" />
          {submitting
            ? progress && progress.done < progress.total
              ? `Preparing magnets ${progress.done}/${progress.total}…`
              : "Placing order…"
            : paymentMethod === "paypal"
              ? "Place Order & Pay with PayPal"
              : paymentMethod === "card"
                ? "Place Order & Pay by Card"
                : "Place Order"}
        </button>
        {progress ? (
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full bg-gold-metal transition-all" style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }} />
          </div>
        ) : null}
        <p className="text-center text-xs italic text-muted">{finalSaleNotice}</p>
      </aside>
    </form>
  );
}

function ChoiceCard({
  checked,
  onSelect,
  name,
  value,
  icon,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  name: string;
  value: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm font-semibold transition ${
        checked ? "border-gold bg-gold/10 text-cream" : "border-white/10 bg-[#121212] text-cream/85 hover:border-gold/50"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onSelect} className="mt-0.5 h-4 w-4 shrink-0 accent-[#D4AF37]" />
      {icon ? <span className="text-gold" aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </label>
  );
}
