import { clientIp, fail, handleError, ok, rateLimit } from "@/lib/api";
import { isDbConfigured } from "@/lib/db";
import { storeImageUpload, UploadError } from "@/lib/upload";
import { MAX_ORDER_UPLOAD_BYTES } from "@/lib/uploadConstants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public endpoint used at checkout to store each rendered, print-ready magnet image.
 * Writes only to the private "orders" folder (viewable by admins only). Rate limited.
 */
export async function POST(req: Request) {
  if (!isDbConfigured()) return fail("Ordering is temporarily unavailable.", 503);
  if (!rateLimit(`order-upload:${clientIp(req)}`, 400, 60 * 60 * 1000)) {
    return fail("Too many uploads. Please wait a moment and try again.", 429);
  }
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return fail("Invalid upload request.", 400);
    const result = await storeImageUpload(form.get("file"), "orders", MAX_ORDER_UPLOAD_BYTES);
    return ok({ url: result.url }, 201);
  } catch (err) {
    if (err instanceof UploadError) return fail(err.message, err.status);
    return handleError(err);
  }
}
