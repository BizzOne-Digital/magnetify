import { requireAdminApi } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { ShippingSettings } from "@/models";
import { shippingSchema } from "@/lib/validation";
import { revalidateSite } from "@/lib/adminHelpers";
import { getShippingConfig } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: current shipping configuration (used for estimates). */
export async function GET() {
  return ok({ shipping: await getShippingConfig() });
}

export async function PUT(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    const data = shippingSchema.parse(await req.json().catch(() => null));
    await connectDB();
    await ShippingSettings.updateOne({ key: "shipping" }, { $set: data }, { upsert: true });
    revalidateSite();
    return ok({ shipping: data });
  } catch (err) {
    return handleError(err);
  }
}
