import { newOrderNumber } from "@/lib/orderNumber";
import { requireAdminApi } from "@/lib/auth";
import { clientIp, fail, handleError, ok, rateLimit } from "@/lib/api";
import { connectDB, isDbConfigured } from "@/lib/db";
import { Cart, Order, ProductCustomization, type OrderDoc, type OrderStatus } from "@/models";
import StoredUpload from "@/models/StoredUpload";
import { orderSchema } from "@/lib/validation";
import { getProducts, getShippingConfig, toPricedProducts } from "@/lib/data";
import { calculatePricing, round2 } from "@/lib/pricing";
import { quoteShipping } from "@/lib/shipping";
import { createPayPalOrder, createStripeCheckoutSession, isPayPalConfigured, isStripeConfigured } from "@/lib/payments";
import { after } from "next/server";
import { sendOrderEmails } from "@/lib/orderEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


/** Public: create an order. All prices, discounts and shipping are recalculated on the server. */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail("Ordering is temporarily unavailable. Please email us to order.", 503);
  if (!rateLimit(`order:${clientIp(req)}`, 10, 60 * 60 * 1000)) return fail("Too many orders. Please try again later.", 429);

  try {
    const body = await req.json().catch(() => null);
    const input = orderSchema.parse(body);
    await connectDB();

    const products = toPricedProducts(await getProducts());
    const pricing = calculatePricing(
      products,
      input.items.map((i) => ({ productSlug: i.productSlug, quantity: i.tiles.length }))
    );
    if (pricing.errors.length) return fail(pricing.errors[0], 422);

    const shippingConfig = await getShippingConfig();
    const ship = quoteShipping(
      {
        subtotal: pricing.subtotal,
        fulfillment: input.fulfillment,
        province: input.shippingAddress.province,
        totalMagnets: pricing.totalMagnets,
      },
      shippingConfig
    );
    if (!ship.available) return fail(ship.label || "The selected delivery option is not available.", 422);

    // Every artwork reference must exist in the private orders folder.
    const filenames = input.items.flatMap((i) => i.tiles.map((t) => t.printUrl.split("/").pop()!));
    const found = await StoredUpload.countDocuments({ folder: "orders", filename: { $in: filenames.map(String) } });
    if (found !== new Set(filenames).size) return fail("Some magnet images did not upload correctly. Please try again.", 422);

    // Payment provider: the customer's choice if that provider is configured.
    const stripeOn = isStripeConfigured();
    const paypalOn = isPayPalConfigured();
    let provider: "stripe" | "paypal" | "manual" = "manual";
    if (input.paymentMethod === "paypal" && paypalOn) provider = "paypal";
    else if (input.paymentMethod === "card" && stripeOn) provider = "stripe";
    else if (!input.paymentMethod && stripeOn) provider = "stripe";
    else if (!input.paymentMethod && paypalOn) provider = "paypal";
    else if (input.paymentMethod && input.paymentMethod !== "manual" && (stripeOn || paypalOn)) {
      return fail("That payment method is not available. Please choose another.", 422);
    }

    // The browser picks the number so it can print it on the magnet flaps.
    const number = input.orderNumber ?? newOrderNumber();
    if (input.orderNumber && (await Order.exists({ orderNumber: number }))) return fail("Please try placing your order again.", 409);
    const order = new Order({
      orderNumber: number,
      customer: input.customer,
      shippingAddress: input.fulfillment === "shipping" ? input.shippingAddress : undefined,
      fulfillment: input.fulfillment,
      items: [],
      totals: {
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shipping: ship.amount,
        total: round2(pricing.subtotal + ship.amount),
        totalMagnets: pricing.totalMagnets,
        tierLabel: pricing.tierLabel ?? undefined,
      },
      socialConsent: input.socialConsent,
      notes: input.notes || undefined,
      status: "pending",
      paymentStatus: "awaiting_payment",
      paymentProvider: provider,
    });

    const customizations = input.items.map(
      (item) => new ProductCustomization({ order: order._id, productSlug: item.productSlug, size: pricing.lines.find((l) => l.productSlug === item.productSlug)?.size, tiles: item.tiles })
    );
    order.items = input.items.map((item, idx) => {
      const line = pricing.lines[idx];
      return {
        productSlug: line.productSlug,
        productName: line.name,
        size: line.size,
        kind: line.kind,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        regularUnitPrice: line.regularUnitPrice,
        lineTotal: line.lineTotal,
        customization: customizations[idx]._id,
        previewUrls: item.tiles.map((t) => t.printUrl),
      } as OrderDoc["items"][number];
    });

    await ProductCustomization.insertMany(customizations);
    await order.save();
    await Cart.create({
      items: pricing.lines.map((l) => ({ productSlug: l.productSlug, size: l.size, quantity: l.quantity })),
      email: input.customer.email,
      status: "converted",
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const lines = pricing.lines.map((l) => ({ name: `${l.name} (${l.size})`, unitAmount: l.unitPrice, quantity: l.quantity }));
    try {
      if (provider === "stripe") {
        const session = await createStripeCheckoutSession({ orderId: String(order._id), orderNumber: number, email: input.customer.email, lines, shipping: ship.amount, siteUrl });
        order.paymentRef = session.id;
        await order.save();
        return ok({ orderNumber: number, checkoutUrl: session.url }, 201);
      }
      if (provider === "paypal") {
        const pp = await createPayPalOrder({ orderId: String(order._id), orderNumber: number, lines, shipping: ship.amount, total: order.totals.total, siteUrl });
        order.paymentRef = pp.id;
        await order.save();
        return ok({ orderNumber: number, checkoutUrl: pp.url }, 201);
      }
    } catch (err) {
      console.error(`[orders] ${provider} start failed`, err);
      order.paymentProvider = "manual";
      await order.save();
      after(() => sendOrderEmails(String(order._id), "Online payment could not be started, so we will email you a secure payment request shortly.", siteUrl));
      return ok({ orderNumber: number, checkoutUrl: null, paymentError: "Online payment is unavailable right now; we will email you a payment request." }, 201);
    }

    after(() => sendOrderEmails(String(order._id), "We will email you a secure payment request shortly. Your magnets go to print once payment is received.", siteUrl));
    return ok({ orderNumber: number, checkoutUrl: null }, 201);
  } catch (err) {
    return handleError(err);
  }
}

/** Admin: list orders (optionally filtered by status). */
export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    const status = new URL(req.url).searchParams.get("status");
    const allowed = ["pending", "processing", "printing", "shipped", "completed", "cancelled"];
    await connectDB();
    const filter = status && allowed.includes(status) ? { status: status as OrderStatus } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    return ok({ orders });
  } catch (err) {
    return handleError(err);
  }
}
