import { requireAdminApi } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { DEFAULT_PRODUCTS } from "@/lib/contentSchema";
import { revalidateSite } from "@/lib/adminHelpers";

export const runtime = "nodejs";

/** Admin: import the default Magnetify catalog (skips products whose slug already exists). */
export async function POST() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    await connectDB();
    let created = 0;
    for (const p of DEFAULT_PRODUCTS) {
      const res = await Product.updateOne({ slug: p.slug }, { $setOnInsert: p }, { upsert: true });
      if (res.upsertedCount) created++;
    }
    revalidateSite();
    return ok({ created });
  } catch (err) {
    return handleError(err);
  }
}
