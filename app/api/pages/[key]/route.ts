import { requireAdminApi } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { PageContent } from "@/models";
import { DEFAULT_CONTENT, PAGE_DEFS, type FieldDef } from "@/lib/contentSchema";
import { revalidateSite } from "@/lib/adminHelpers";
import { collectUploadUrls, deleteReplacedUploads } from "@/lib/deleteStoredUpload";
import { getSafeImageUrl } from "@/lib/imageUrl";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Keep only fields declared in the page definition, coerced to strings/lists. */
function sanitize(fields: FieldDef[], input: unknown): Record<string, unknown> {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const v = src[f.name];
    if (f.type === "list") {
      const arr = Array.isArray(v) ? v.slice(0, f.max ?? 50) : [];
      out[f.name] = arr.map((item) => sanitize(f.fields, item));
    } else if (f.type === "image") {
      const s = typeof v === "string" ? v.trim().slice(0, 500) : "";
      out[f.name] = s && getSafeImageUrl(s, "") === s ? s : "";
    } else {
      out[f.name] = typeof v === "string" ? v.slice(0, f.type === "textarea" ? 5000 : 300) : "";
    }
  }
  return out;
}

export async function GET(_req: Request, ctx: RouteContext<"/api/pages/[key]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { key } = await ctx.params;
  const def = PAGE_DEFS.find((p) => p.key === key);
  if (!def) return fail("Unknown page", 404);
  try {
    await connectDB();
    const doc = await PageContent.findOne({ key: def.key }).lean();
    return ok({ data: { ...DEFAULT_CONTENT[def.key], ...(doc?.data ?? {}) }, updatedAt: doc?.updatedAt ?? null });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request, ctx: RouteContext<"/api/pages/[key]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { key } = await ctx.params;
  const def = PAGE_DEFS.find((p) => p.key === key);
  if (!def) return fail("Unknown page", 404);
  try {
    const body = await req.json().catch(() => null);
    const data = sanitize(def.fields, body?.data);
    await connectDB();
    const prev = await PageContent.findOne({ key: def.key }).lean();
    await PageContent.updateOne({ key: def.key }, { $set: { data } }, { upsert: true });
    // Remove images that were replaced/removed, only after the save succeeded.
    await deleteReplacedUploads(collectUploadUrls(prev?.data ?? {}), collectUploadUrls(data));
    revalidateSite();
    return ok({ data });
  } catch (err) {
    return handleError(err);
  }
}

/** Reset a page to its default content. */
export async function DELETE(_req: Request, ctx: RouteContext<"/api/pages/[key]">) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  const { key } = await ctx.params;
  const def = PAGE_DEFS.find((p) => p.key === key);
  if (!def) return fail("Unknown page", 404);
  try {
    await connectDB();
    const prev = await PageContent.findOneAndDelete({ key: def.key }).lean();
    await deleteReplacedUploads(collectUploadUrls(prev?.data ?? {}), []);
    revalidateSite();
    return ok({ data: DEFAULT_CONTENT[def.key] });
  } catch (err) {
    return handleError(err);
  }
}
