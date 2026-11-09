import { connectDB, isDbConfigured } from "@/lib/db";
import StoredUpload from "@/models/StoredUpload";
import { isSafeFilename, isUploadFolder } from "@/lib/uploadConstants";
import { getAdminSession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function notFound() {
  return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
}

export async function GET(_req: Request, ctx: RouteContext<"/api/uploads/[folder]/[filename]">) {
  const { folder, filename } = await ctx.params;

  // Strict validation: exact folder whitelist, safe filename, no traversal or separators.
  if (!isUploadFolder(folder)) return notFound();
  if (!isSafeFilename(filename)) return notFound();

  // Customer order artwork is private: only admins can view it.
  if (folder === "orders" && !(await getAdminSession())) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!isDbConfigured()) return notFound();

  try {
    await connectDB();
    // Hydrated (non-lean) document so `data` is a Node Buffer.
    const doc = await StoredUpload.findOne({ folder: String(folder), filename: String(filename) });
    if (!doc?.data) return notFound();
    const bytes = new Uint8Array(doc.data as Buffer);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": folder === "orders" ? "private, no-store" : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("[uploads] serve failed", err);
    return new Response("Error", { status: 500 });
  }
}
