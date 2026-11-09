"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, Pencil, ShoppingCart, Tag, Trash2, Truck } from "lucide-react";
import { useCart } from "@/components/cart/CartProvider";
import { TileView } from "@/components/customizer/TileView";
import { calculatePricing, money, type PricedProduct } from "@/lib/pricing";
import { quoteShipping, type ShippingConfig } from "@/lib/shipping";
import { FRAME_RATIO, filledTiles } from "@/lib/cart/types";

export function useCartPricing(products: PricedProduct[]) {
  const { items } = useCart();
  return useMemo(
    () => calculatePricing(products, items.map((i) => ({ productSlug: i.productSlug, quantity: filledTiles(i).length }))),
    [items, products]
  );
}

export function CartView({ products, shipping, finalSaleNotice }: { products: PricedProduct[]; shipping: ShippingConfig; finalSaleNotice: string }) {
  const { items, ready, removeItem } = useCart();
  const pricing = useCartPricing(products);
  const ship = quoteShipping({ subtotal: pricing.subtotal, fulfillment: "shipping", totalMagnets: pricing.totalMagnets }, shipping);
  const total = pricing.subtotal + (ship.available ? ship.amount : 0);
  const productBySlug = new Map(products.map((p) => [p.slug, p]));

  if (!ready) {
    return <div className="card-dark h-64 animate-pulse" aria-busy="true" aria-label="Loading cart" />;
  }

  if (items.length === 0) {
    return (
      <div className="card-gold mx-auto max-w-xl p-10 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-gold" aria-hidden="true" />
        <h2 className="section-title mt-4 text-2xl text-cream">Your cart is empty</h2>
        <p className="mt-2 text-muted">Upload a few favourite photos and turn them into magnets.</p>
        <Link href="/customize" className="btn btn-primary mt-6">
          Start Customizing
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <ul className="space-y-4" aria-label="Cart items">
        {items.map((item) => {
          const p = productBySlug.get(item.productSlug);
          const line = pricing.lines.find((l) => l.productSlug === item.productSlug && l.quantity === filledTiles(item).length);
          const qty = filledTiles(item).length;
          const ratio = FRAME_RATIO[item.size];
          return (
            <li key={item.id} className="card-gold p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="grid w-full shrink-0 grid-cols-4 gap-1.5 sm:w-44 sm:grid-cols-3">
                  {item.tiles.slice(0, 6).map((t) => (
                    <TileView key={t.id} tile={t} ratio={ratio} className="rounded-md border border-white/10" />
                  ))}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-display text-lg font-bold text-cream">{p?.name ?? "Unavailable product"}</h2>
                    <p className="font-display text-lg font-bold text-gold-light">{line ? money(line.lineTotal) : "—"}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-cream/80 sm:grid-cols-3">
                    <div>
                      <dt className="text-muted">Size</dt>
                      <dd>{item.size} {item.kind === "business" ? "Business" : "Photo"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Quantity</dt>
                      <dd>{qty} magnets</dd>
                    </div>
                    <div>
                      <dt className="text-muted">Unit price</dt>
                      <dd>
                        {line ? money(line.unitPrice) : "—"}
                        {line && line.unitPrice < line.baseUnitPrice ? <span className="ml-1 text-xs text-gold">bulk</span> : null}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted">Customized</dt>
                      <dd>{item.tiles.filter((t) => t.text).length} with text</dd>
                    </div>
                  </dl>
                  {!p ? (
                    <p className="flex items-center gap-1.5 text-sm text-promo">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" /> This product is no longer available. Please remove it.
                    </p>
                  ) : qty < p.minOrder ? (
                    <p className="flex items-center gap-1.5 text-sm text-promo">
                      <AlertTriangle className="h-4 w-4" aria-hidden="true" /> Minimum order is {p.minOrder}. Add {p.minOrder - qty} more.
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href={`/customize?edit=${item.id}`} className="btn btn-secondary btn-sm">
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Edit customization
                    </Link>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        removeItem(item.id);
                        toast.success("Item removed");
                      }}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="card-gold h-fit space-y-4 p-6 lg:sticky lg:top-24" aria-label="Order summary">
        <h2 className="section-title text-gold-metal text-2xl">Order Summary</h2>
        <dl className="space-y-2 text-sm">
          <Row label="Total magnets" value={String(pricing.totalMagnets)} />
          <Row label="Regular price" value={money(pricing.regularTotal)} muted />
          <Row label="Sale & bulk savings" value={`-${money(pricing.discount)}`} accent />
          {pricing.tierLabel ? (
            <p className="flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-2 text-gold-light">
              <Tag className="h-4 w-4" aria-hidden="true" /> {pricing.tierLabel} applied
            </p>
          ) : null}
          <Row label="Subtotal" value={money(pricing.subtotal)} />
          <Row
            label={
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4" aria-hidden="true" /> {ship.label} (est.)
              </span>
            }
            value={ship.available ? (ship.amount === 0 ? "Free" : money(ship.amount)) : "—"}
          />
        </dl>
        {ship.freeShippingRemaining && ship.freeShippingRemaining > 0 ? (
          <p className="text-xs text-muted">Add {money(ship.freeShippingRemaining)} more for free shipping.</p>
        ) : null}
        {pricing.nextTier ? (
          <p className="text-xs text-muted">
            Add {pricing.nextTier.remaining} more magnets to unlock {pricing.nextTier.label} pricing.
          </p>
        ) : null}
        <div className="gold-divider" />
        <div className="flex items-baseline justify-between">
          <span className="font-display font-bold text-cream">Estimated total</span>
          <span className="font-display text-2xl font-extrabold text-gold-light">{money(total)}</span>
        </div>
        {pricing.errors.length ? (
          <ul className="space-y-1 text-sm text-promo">
            {pricing.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        ) : null}
        <Link
          href={pricing.errors.length ? "#" : "/checkout"}
          aria-disabled={pricing.errors.length > 0}
          onClick={(e) => {
            if (pricing.errors.length) {
              e.preventDefault();
              toast.error(pricing.errors[0]);
            }
          }}
          className={`btn btn-primary w-full py-3.5 ${pricing.errors.length ? "opacity-55" : ""}`}
        >
          Proceed to Checkout <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <Link href="/customize" className="btn btn-ghost w-full">
          Add more magnets
        </Link>
        <p className="text-center text-xs italic text-muted">{finalSaleNotice}</p>
      </aside>
    </div>
  );
}

function Row({ label, value, muted, accent }: { label: React.ReactNode; value: string; muted?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-cream/80">{label}</dt>
      <dd className={accent ? "text-gold-light" : muted ? "text-cream/60 line-through" : "text-cream"}>{value}</dd>
    </div>
  );
}
