import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { verifyStripeSignature } from "@/lib/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe webhook: the only place an order is marked paid. */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });
  const payload = await req.text();
  if (!verifyStripeSignature(payload, req.headers.get("stripe-signature"), secret)) {
    return new Response("Invalid signature", { status: 400 });
  }
  try {
    const event = JSON.parse(payload) as {
      type: string;
      data: { object: { id: string; payment_status?: string; metadata?: { orderId?: string } } };
    };
    const obj = event.data.object;
    const orderId = obj.metadata?.orderId;
    if (orderId && /^[a-f0-9]{24}$/i.test(orderId)) {
      await connectDB();
      if (event.type === "checkout.session.completed" && obj.payment_status === "paid") {
        await Order.updateOne({ _id: orderId }, { $set: { paymentStatus: "paid", status: "processing", paymentRef: obj.id } });
      } else if (event.type === "checkout.session.async_payment_succeeded") {
        await Order.updateOne({ _id: orderId }, { $set: { paymentStatus: "paid", status: "processing" } });
      } else if (event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") {
        await Order.updateOne({ _id: orderId, paymentStatus: { $ne: "paid" } }, { $set: { paymentStatus: "failed" } });
      }
    }
    return new Response("ok");
  } catch (err) {
    console.error("[stripe webhook]", err);
    return new Response("Error", { status: 500 });
  }
}
