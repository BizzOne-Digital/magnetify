import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { safeDb } from "@/lib/db";
import { Order, ProductCustomization } from "@/models";
import { money } from "@/lib/pricing";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { OrderActions } from "@/components/admin/OrderActions";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function AdminOrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  const data = await safeDb(async () => {
    const order = await Order.findById(id).lean();
    if (!order) return null;
    const customizations = await ProductCustomization.find({ order: order._id }).lean();
    return { order, customizations };
  }, null);
  if (!data) notFound();
  const { order: o, customizations } = data;
  const custById = new Map(customizations.map((c) => [String(c._id), c]));

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gold-light hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All orders
      </Link>
      <AdminPageTitle title={`Order ${o.orderNumber}`} description={o.createdAt ? new Date(o.createdAt).toLocaleString("en-CA") : undefined}>
        <StatusBadge value={o.status} />
        <StatusBadge value={o.paymentStatus} />
      </AdminPageTitle>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {o.items.map((item, idx) => {
            const c = custById.get(String(item.customization));
            return (
              <section key={idx} className="card-dark p-5">
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-bold text-cream">
                    {item.productName} <span className="text-sm text-muted">({item.size}, {item.kind})</span>
                  </h2>
                  <p className="text-sm">
                    {item.quantity} × {money(item.unitPrice)} = <strong className="text-gold-light">{money(item.lineTotal)}</strong>
                  </p>
                </div>
                <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
                  {(c?.tiles ?? item.previewUrls.map((u) => ({ printUrl: u, text: "" }))).map((t, i) => (
                    <li key={i} className="space-y-1">
                      <a href={t.printUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-md border border-white/10 hover:border-gold">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.printUrl} alt={`Magnet ${i + 1} artwork`} className="w-full" loading="lazy" />
                      </a>
                      <a href={t.printUrl} download className="flex items-center gap-1 text-[11px] text-muted hover:text-gold-light">
                        <Download className="h-3 w-3" aria-hidden="true" /> #{i + 1}
                        {t.text ? ` · “${t.text}”` : ""}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <aside className="space-y-6">
          <OrderActions id={String(o._id)} status={o.status} paymentStatus={o.paymentStatus} />
          <section className="card-dark space-y-2 p-5 text-sm">
            <h2 className="font-display font-bold text-gold-light">Customer</h2>
            <p>{o.customer.name}</p>
            <p>
              <a className="text-gold-light hover:underline" href={`mailto:${o.customer.email}`}>
                {o.customer.email}
              </a>
            </p>
            {o.customer.phone ? <p className="text-cream/80">{o.customer.phone}</p> : null}
            <h2 className="pt-3 font-display font-bold text-gold-light">Delivery</h2>
            {o.fulfillment === "pickup" ? (
              <p>Local pickup</p>
            ) : (
              <address className="not-italic text-cream/85">
                {o.shippingAddress?.line1}
                {o.shippingAddress?.line2 ? <>, {o.shippingAddress.line2}</> : null}
                <br />
                {o.shippingAddress?.city}, {o.shippingAddress?.province} {o.shippingAddress?.postalCode}
                <br />
                {o.shippingAddress?.country}
              </address>
            )}
            <h2 className="pt-3 font-display font-bold text-gold-light">Social media consent</h2>
            <p className={o.socialConsent === "agree" ? "text-emerald-300" : "text-[#ff8a8f]"}>
              {o.socialConsent === "agree" ? "Agreed to be featured" : "Did NOT agree to be featured"}
            </p>
            {o.notes ? (
              <>
                <h2 className="pt-3 font-display font-bold text-gold-light">Notes</h2>
                <p className="whitespace-pre-wrap text-cream/85">{o.notes}</p>
              </>
            ) : null}
          </section>
          <section className="card-dark space-y-1.5 p-5 text-sm">
            <h2 className="mb-2 font-display font-bold text-gold-light">Totals</h2>
            <p className="flex justify-between"><span>Magnets</span><span>{o.totals.totalMagnets}</span></p>
            <p className="flex justify-between"><span>Subtotal</span><span>{money(o.totals.subtotal)}</span></p>
            <p className="flex justify-between"><span>Savings</span><span>-{money(o.totals.discount)}</span></p>
            <p className="flex justify-between"><span>Shipping</span><span>{money(o.totals.shipping)}</span></p>
            <p className="flex justify-between border-t border-white/10 pt-2 font-bold"><span>Total</span><span className="text-gold-light">{money(o.totals.total)}</span></p>
            {o.totals.tierLabel ? <p className="text-xs text-muted">{o.totals.tierLabel}</p> : null}
            <p className="pt-2 text-xs text-muted">Payment: {o.paymentProvider}{o.paymentRef ? ` · ${o.paymentRef}` : ""}</p>
          </section>
        </aside>
      </div>
    </>
  );
}
