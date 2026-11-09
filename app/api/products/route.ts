import { requireAdminApi } from "@/lib/auth";
import { handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";
import { productSchema } from "@/lib/validation";
import { revalidateSite } from "@/lib/adminHelpers";
import { getProducts } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: active products (falls back to defaults if the catalog is empty). */
export async function GET() {
  const products = await getProducts();
  return ok({ products });
}

/** Admin: create a product. */
export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    const data = productSchema.parse(await req.json().catch(() => null));
    await connectDB();
    const product = await Product.create(data);
    revalidateSite();
    return ok({ product }, 201);
  } catch (err) {
    return handleError(err);
  }
}
