import Link from "next/link";
import { safeDb } from "@/lib/db";
import { Order, type OrderStatus } from "@/models";
import { money } from "@/lib/pricing";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";

const STATUSES = ["all", "pending", "processing", "printing", "shipped", "completed", "cancelled"] as const;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" && STATUSES.includes(sp.status as (typeof STATUSES)[number]) ? sp.status : "all";
  const orders = await safeDb(
    () => Order.find(status === "all" ? {} : { status: status as OrderStatus }).sort({ createdAt: -1 }).limit(300).lean(),
    []
  );

  return (
    <>
      <AdminPageTitle title="Orders" description="Every order with customization, consent and payment status." />
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter orders">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            role="tab"
            aria-selected={status === s}
            className={`rounded-full px-3 py-1.5 text-sm capitalize ${status === s ? "bg-gold-metal font-semibold text-ink" : "bg-white/5 text-cream/80 hover:bg-white/10"}`}
          >
            {s}
          </Link>
        ))}
      </div>
      <div className="card-dark overflow-x-auto">
        {orders.length === 0 ? (
          <p className="p-6 text-sm text-muted">No orders found.</p>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Magnets</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Social</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((o) => (
                <tr key={String(o._id)} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o._id}`} className="font-semibold text-gold-light hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-cream/70">{o.createdAt ? new Date(o.createdAt).toLocaleDateString("en-CA") : "—"}</td>
                  <td className="px-4 py-3">
                    {o.customer?.name}
                    <span className="block text-xs text-muted">{o.customer?.email}</span>
                  </td>
                  <td className="px-4 py-3">{o.totals?.totalMagnets}</td>
                  <td className="px-4 py-3 font-semibold">{money(o.totals?.total ?? 0)}</td>
                  <td className="px-4 py-3 capitalize">{o.fulfillment}</td>
                  <td className="px-4 py-3">{o.socialConsent === "agree" ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <StatusBadge value={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge value={o.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
