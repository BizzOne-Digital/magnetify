import { requireAdminApi } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { storeImageUpload, UploadError } from "@/lib/upload";
import { ADMIN_UPLOAD_FOLDERS, MAX_ADMIN_UPLOAD_BYTES, isAdminUploadFolder } from "@/lib/uploadConstants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin-only image upload. Bytes are stored in MongoDB (StoredUpload); nothing touches the filesystem. */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_ADMIN_UPLOAD_BYTES + 512 * 1024) return fail("File is too large. Maximum size is 8MB.", 413);

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return fail("Invalid upload request.", 400);
    }
    const folder = form.get("folder");
    if (!isAdminUploadFolder(folder)) {
      return fail(`Invalid folder. Allowed: ${ADMIN_UPLOAD_FOLDERS.join(", ")}`, 400);
    }
    const result = await storeImageUpload(form.get("file"), folder, MAX_ADMIN_UPLOAD_BYTES);
    return ok(result, 201);
  } catch (err) {
    if (err instanceof UploadError) return fail(err.message, err.status);
    return handleError(err);
  }
}
