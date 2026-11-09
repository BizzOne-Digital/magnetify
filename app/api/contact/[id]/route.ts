import { requireAdminApi } from "@/lib/auth";
import { fail, handleError, isValidObjectId, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ContactMessage } from "@/models";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: RouteContext<"/api/contact/[id]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail("Invalid id", 400);
  try {
    const body = await req.json().catch(() => ({}));
    await connectDB();
    const msg = await ContactMessage.findByIdAndUpdate(id, { read: Boolean(body.read) }, { new: true }).lean();
    if (!msg) return fail("Not found", 404);
    return ok({ message: msg });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/contact/[id]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { id } = await ctx.params;
  if (!isValidObjectId(id)) return fail("Invalid id", 400);
  try {
    await connectDB();
    const res = await ContactMessage.deleteOne({ _id: id });
    if (!res.deletedCount) return fail("Not found", 404);
    return ok({});
  } catch (err) {
    return handleError(err);
  }
}
