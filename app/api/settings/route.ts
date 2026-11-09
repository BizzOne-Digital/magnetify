import { requireAdminApi } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models";
import { siteSettingsSchema } from "@/lib/validation";
import { revalidateSite } from "@/lib/adminHelpers";
import { getSiteSettings } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return ok({ settings: await getSiteSettings() });
}

export async function PUT(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    const data = siteSettingsSchema.parse(await req.json().catch(() => null));
    await connectDB();
    await SiteSettings.updateOne({ key: "site" }, { $set: data }, { upsert: true });
    revalidateSite();
    return ok({ settings: data });
  } catch (err) {
    return handleError(err);
  }
}
