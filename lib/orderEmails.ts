import "server-only";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { getSiteSettings } from "@/lib/data";
import { orderAdminEmail, orderCustomerEmail, sendEmail } from "@/lib/email";

/** Sends the "new order" email to the shop and a confirmation to the customer. Never throws. */
export async function sendOrderEmails(orderId: string, paymentNote: string, siteUrl: string) {
  try {
    await connectDB();
    const o = await Order.findById(orderId).lean();
    if (!o) return;
    const site = await getSiteSettings();
    const data = {
      orderNumber: o.orderNumber,
      customer: { name: o.customer.name, email: o.customer.email },
      items: o.items.map((i) => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, lineTotal: i.lineTotal })),
      totals: o.totals,
      fulfillment: o.fulfillment === "pickup" ? "Local pickup" : `Ship to ${o.shippingAddress?.city ?? ""}, ${o.shippingAddress?.province ?? ""}`,
      socialConsent: o.socialConsent,
      paymentNote,
    };
    const admin = orderAdminEmail(data, `${siteUrl}/admin/orders/${o._id}`);
    const customer = orderCustomerEmail(data, site.contactEmail);
    await Promise.all([
      sendEmail({ to: process.env.NOTIFY_EMAIL || site.contactEmail, replyTo: o.customer.email, ...admin }),
      sendEmail({ to: o.customer.email, replyTo: site.contactEmail, ...customer }),
    ]);
  } catch (err) {
    console.error("[order emails]", err);
  }
}
