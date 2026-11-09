import { requireAdminApi } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import StoredUpload from "@/models/StoredUpload";
import { isUploadFolder } from "@/lib/uploadConstants";
import { getReferencedUploadUrls } from "@/lib/adminHelpers";
import { deleteStoredUploadByUrl, parseStoredUploadUrl } from "@/lib/deleteStoredUpload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin: list stored uploads (metadata only, never binary). */
export async function GET(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    const folder = new URL(req.url).searchParams.get("folder");
    await connectDB();
    const filter = folder && isUploadFolder(folder) ? { folder: String(folder) } : {};
    const [items, referenced] = await Promise.all([
      StoredUpload.find(filter, { data: 0 }).sort({ createdAt: -1 }).limit(500).lean(),
      getReferencedUploadUrls(),
    ]);
    return ok({
      items: items.map((i) => {
        const url = `/api/uploads/${i.folder}/${i.filename}`;
        return { id: String(i._id), folder: i.folder, filename: i.filename, size: i.size, mimeType: i.mimeType, createdAt: i.createdAt, url, inUse: referenced.has(url) };
      }),
    });
  } catch (err) {
    return handleError(err);
  }
}

/** Admin: delete by URL. Refuses in-use images unless force=true. */
export async function DELETE(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    const body = await req.json().catch(() => ({}));
    const url = body?.url;
    if (!parseStoredUploadUrl(url)) return fail("Invalid upload URL", 400);
    const referenced = await getReferencedUploadUrls();
    if (referenced.has(url) && body.force !== true) {
      return fail("This image is still used on the website.", 409, { inUse: true });
    }
    const deleted = await deleteStoredUploadByUrl(url);
    if (!deleted) return fail("Image not found", 404);
    return ok({});
  } catch (err) {
    return handleError(err);
  }
}
