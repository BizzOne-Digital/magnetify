import { requireAdminApi } from "@/lib/auth";
import { fail, handleError, isValidObjectId, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { productSchema } from "@/lib/validation";
import { revalidateSite } from "@/lib/adminHelpers";
import { deleteReplacedUploads, deleteStoredUploadByUrl } from "@/lib/deleteStoredUpload";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: RouteContext<"/api/products/[id]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail("Invalid id", 400);
  try {
    await connectDB();
    const product = await Product.findById(id).lean();
    if (!product) return fail("Not found", 404);
    return ok({ product });
  } catch (err) {
    return handleError(err);
  }
}

/** Update a product. Old images are deleted only AFTER the new values are saved. */
export async function PUT(req: Request, ctx: RouteContext<"/api/products/[id]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail("Invalid id", 400);
  try {
    const data = productSchema.parse(await req.json().catch(() => null));
    await connectDB();
    const existing = await Product.findById(id);
    if (!existing) return fail("Not found", 404);
    const previous = [existing.image, ...(existing.gallery ?? [])];
    existing.set(data);
    await existing.save();
    await deleteReplacedUploads(previous, [data.image, ...data.gallery]);
    revalidateSite();
    return ok({ product: existing.toObject() });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/products/[id]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail("Invalid id", 400);
  try {
    await connectDB();
    const product = await Product.findById(id);
    if (!product) return fail("Not found", 404);
    const images = [product.image, ...(product.gallery ?? [])];
    await product.deleteOne();
    await Promise.all(images.map((u) => deleteStoredUploadByUrl(u)));
    revalidateSite();
    return ok({});
  } catch (err) {
    return handleError(err);
  }
}
