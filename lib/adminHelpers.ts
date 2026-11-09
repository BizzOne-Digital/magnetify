import "server-only";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { PageContent, Product } from "@/models";
import { collectUploadUrls } from "@/lib/deleteStoredUpload";

/** Refresh every public page after content/pricing changes. */
export function revalidateSite() {
  revalidatePath("/", "layout");
}

/** All upload URLs currently referenced by products or CMS content. */
export async function getReferencedUploadUrls(): Promise<Set<string>> {
  await connectDB();
  const [products, pages] = await Promise.all([
    Product.find({}, { image: 1, gallery: 1 }).lean(),
    PageContent.find({}, { data: 1 }).lean(),
  ]);
  return new Set([...collectUploadUrls(products), ...collectUploadUrls(pages)]);
}
