import { NextResponse, after } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { capturePayPalOrder } from "@/lib/payments";
import { sendOrderEmails } from "@/lib/orderEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PayPal redirects the customer here after approval. We capture server-side and verify the amount. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;
  const token = url.searchParams.get("token");
  const fail = (reason: string) => NextResponse.redirect(`${siteUrl}/checkout?payment_failed=${encodeURIComponent(reason)}`);
  if (!token || !/^[A-Z0-9]{5,40}$/i.test(token)) return fail("invalid");

  try {
    await connectDB();
    const order = await Order.findOne({ paymentProvider: "paypal", paymentRef: String(token) });
    if (!order) return fail("not_found");
    if (order.paymentStatus === "paid") return NextResponse.redirect(`${siteUrl}/checkout/success?order=${order.orderNumber}&paid=1`);

    const cap = await capturePayPalOrder(token);
    const amountOk = cap.alreadyCaptured || (cap.currency === "CAD" && cap.amount !== null && Math.abs(cap.amount - order.totals.total) < 0.01);
    if (!cap.completed && !cap.alreadyCaptured) {
      order.paymentStatus = "failed";
      await order.save();
      return fail("not_completed");
    }
    if (!amountOk) {
      console.error("[paypal] amount mismatch", order.orderNumber, cap.amount, order.totals.total);
      order.notes = `${order.notes ?? ""}\n[PayPal] Captured amount ${cap.amount} ${cap.currency} does not match order total.`.trim();
      await order.save();
      return fail("amount_mismatch");
    }
    order.paymentStatus = "paid";
    order.status = "processing";
    if (cap.captureId) order.notes = `${order.notes ?? ""}\n[PayPal] Capture ${cap.captureId}`.trim();
    await order.save();
    after(() => sendOrderEmails(String(order._id), "Payment received via PayPal. We will email you when your magnets ship.", siteUrl));
    return NextResponse.redirect(`${siteUrl}/checkout/success?order=${order.orderNumber}&paid=1`);
  } catch (err) {
    console.error("[paypal return]", err);
    return fail("error");
  }
}
