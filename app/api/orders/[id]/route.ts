import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { fail, handleError, isValidObjectId, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Order, ProductCustomization } from "@/models";
import { deleteStoredUploadByUrl } from "@/lib/deleteStoredUpload";

export const runtime = "nodejs";

const patchSchema = z.object({
  status: z.enum(["pending", "processing", "printing", "shipped", "completed", "cancelled"]).optional(),
  paymentStatus: z.enum(["unpaid", "awaiting_payment", "paid", "failed", "refunded"]).optional(),
});

export async function GET(_req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail("Invalid id", 400);
  try {
    await connectDB();
    const order = await Order.findById(id).lean();
    if (!order) return fail("Not found", 404);
    const customizations = await ProductCustomization.find({ order: order._id }).lean();
    return ok({ order, customizations });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail("Invalid id", 400);
  try {
    const patch = patchSchema.parse(await req.json().catch(() => ({})));
    await connectDB();
    const order = await Order.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean();
    if (!order) return fail("Not found", 404);
    return ok({ order });
  } catch (err) {
    return handleError(err);
  }
}

/** Deletes an order, its customization records and its private artwork. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail("Invalid id", 400);
  try {
    await connectDB();
    const order = await Order.findById(id);
    if (!order) return fail("Not found", 404);
    const urls = order.items.flatMap((i) => i.previewUrls ?? []);
    await ProductCustomization.deleteMany({ order: order._id });
    await order.deleteOne();
    await Promise.all(urls.map((u) => deleteStoredUploadByUrl(u)));
    return ok({});
  } catch (err) {
    return handleError(err);
  }
}
