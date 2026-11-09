import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, DollarSign, Images, Mail, Package, ShoppingBag } from "lucide-react";
import { safeDb } from "@/lib/db";
import { ContactMessage, Order, Product } from "@/models";
import StoredUpload from "@/models/StoredUpload";
import { money } from "@/lib/pricing";
import { AdminPageTitle } from "@/components/admin/AdminHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";

export default async function AdminDashboard() {
  const stats = await safeDb(
    async () => {
      const [total, pending, completed, revenueAgg, products, messages, unread, uploads, recent] = await Promise.all([
        Order.countDocuments(),
        Order.countDocuments({ status: { $in: ["pending", "processing", "printing"] } }),
        Order.countDocuments({ status: { $in: ["completed", "shipped"] } }),
        Order.aggregate<{ sum: number }>([{ $match: { paymentStatus: "paid" } }, { $group: { _id: null, sum: { $sum: "$totals.total" } } }]),
        Product.countDocuments(),
        ContactMessage.countDocuments(),
        ContactMessage.countDocuments({ read: false }),
        StoredUpload.countDocuments({ folder: { $ne: "orders" } }),
        Order.find().sort({ createdAt: -1 }).limit(8).lean(),
      ]);
      return { total, pending, completed, revenue: revenueAgg[0]?.sum ?? 0, products, messages, unread, uploads, recent, ok: true };
    },
    { total: 0, pending: 0, completed: 0, revenue: 0, products: 0, messages: 0, unread: 0, uploads: 0, recent: [], ok: false }
  );

  const cards = [
    { label: "Total orders", value: stats.total, icon: ShoppingBag, href: "/admin/orders" },
    { label: "Pending orders", value: stats.pending, icon: Clock, href: "/admin/orders?status=pending", warn: stats.pending > 0 },
    { label: "Completed orders", value: stats.completed, icon: CheckCircle2, href: "/admin/orders?status=completed" },
    { label: "Revenue (paid)", value: money(stats.revenue), icon: DollarSign, href: "/admin/orders" },
    { label: "Products", value: stats.products, icon: Package, href: "/admin/products" },
    { label: "Contact messages", value: `${stats.messages}${stats.unread ? ` (${stats.unread} new)` : ""}`, icon: Mail, href: "/admin/messages", warn: stats.unread > 0 },
    { label: "Uploaded images", value: stats.uploads, icon: Images, href: "/admin/media" },
  ];

  return (
    <>
      <AdminPageTitle title="Dashboard" description="Overview of orders, products and messages." />
      {!stats.ok ? (
        <p className="mb-6 flex items-center gap-2 rounded-lg border border-promo/60 bg-promo/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-promo" aria-hidden="true" /> Could not load statistics from the database.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, href, warn }) => (
          <Link key={label} href={href} className="card-gold flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${warn ? "bg-promo/20 text-promo" : "bg-gold/10 text-gold"}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-xs uppercase tracking-wider text-muted">{label}</span>
              <span className="font-display text-2xl font-extrabold text-cream">{value}</span>
            </span>
          </Link>
        ))}
      </div>

      <section className="card-dark mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gold/20 p-4">
          <h2 className="font-display font-bold text-gold-light">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-gold-light hover:underline">
            View all
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <p className="p-6 text-sm text-muted">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2">Order</th>
                  <th className="px-4 py-2">Customer</th>
                  <th className="px-4 py-2">Magnets</th>
                  <th className="px-4 py-2">Total</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.recent.map((o) => (
                  <tr key={String(o._id)} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o._id}`} className="font-semibold text-gold-light hover:underline">
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{o.customer?.name}</td>
                    <td className="px-4 py-3">{o.totals?.totalMagnets}</td>
                    <td className="px-4 py-3">{money(o.totals?.total ?? 0)}</td>
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
          </div>
        )}
      </section>
    </>
  );
}
