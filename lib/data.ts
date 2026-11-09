import "server-only";
import { cache } from "react";
import { safeDb } from "@/lib/db";
import { PageContent, Product, ShippingSettings, SiteSettings, type ProductDoc } from "@/models";
import { DEFAULT_CONTENT, DEFAULT_PRODUCTS, DEFAULT_SITE } from "@/lib/contentSchema";
import { DEFAULT_SHIPPING, type ShippingConfig } from "@/lib/shipping";
import type { PricedProduct } from "@/lib/pricing";

export type PublicProduct = PricedProduct & {
  id: string;
  description: string;
  image: string;
  gallery: string[];
  status: string;
};

function serializeProduct(p: Partial<ProductDoc> & { _id?: unknown }): PublicProduct {
  return {
    id: String(p._id ?? p.slug),
    slug: p.slug!,
    name: p.name!,
    shortName: p.shortName!,
    kind: p.kind ?? "photo",
    size: p.size!,
    regularPrice: p.regularPrice!,
    salePrice: p.salePrice!,
    minOrder: p.minOrder!,
    description: p.description ?? "",
    image: p.image ?? "",
    gallery: p.gallery ?? [],
    status: p.status ?? "active",
    bulkTiers: (p.bulkTiers ?? []).map((t) => ({ minQty: t.minQty, price: t.price, label: t.label ?? "" })),
  };
}

const defaultProducts = DEFAULT_PRODUCTS.map((p) => serializeProduct(p));

/** Active products from MongoDB; falls back to the default catalog when the DB is empty/unavailable. */
export const getProducts = cache(async (opts: { includeInactive?: boolean } = {}): Promise<PublicProduct[]> => {
  return safeDb(async () => {
    const filter = opts.includeInactive ? {} : { status: "active" as const };
    const docs = await Product.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();
    if (docs.length === 0) {
      const any = await Product.estimatedDocumentCount();
      return any === 0 ? defaultProducts : [];
    }
    return docs.map((d) => serializeProduct(d as ProductDoc));
  }, defaultProducts);
});

export async function getProductBySlug(slug: string) {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export const getPageContent = cache(async <T,>(key: string): Promise<T> => {
  const defaults = (DEFAULT_CONTENT[key] ?? {}) as T;
  return safeDb(async () => {
    const doc = await PageContent.findOne({ key: String(key) }).lean();
    if (!doc?.data) return defaults;
    const merged: Record<string, unknown> = { ...(defaults as Record<string, unknown>) };
    for (const [k, v] of Object.entries(doc.data)) {
      if (v !== undefined && v !== null && !(typeof v === "string" && v.trim() === "" && k !== "heroImage")) merged[k] = v;
    }
    return merged as T;
  }, defaults);
});

export const getSiteSettings = cache(async () => {
  return safeDb(async () => {
    const doc = await SiteSettings.findOne({ key: "site" }).lean();
    return {
      contactEmail: doc?.contactEmail || DEFAULT_SITE.contactEmail,
      facebookHandle: doc?.facebookHandle || DEFAULT_SITE.facebookHandle,
      instagramHandle: doc?.instagramHandle || DEFAULT_SITE.instagramHandle,
      finalSaleNotice: doc?.finalSaleNotice || DEFAULT_SITE.finalSaleNotice,
      announcement: doc?.announcement ?? "",
    };
  }, DEFAULT_SITE);
});

export const getShippingConfig = cache(async (): Promise<ShippingConfig> => {
  return safeDb(async () => {
    const doc = await ShippingSettings.findOne({ key: "shipping" }).lean();
    if (!doc) return DEFAULT_SHIPPING;
    return {
      shippingEnabled: doc.shippingEnabled,
      mode: doc.mode,
      flatShippingRate: doc.flatShippingRate,
      freeShippingThreshold: doc.freeShippingThreshold,
      localPickupEnabled: doc.localPickupEnabled,
      localPickupNote: doc.localPickupNote ?? "",
      zones: (doc.zones ?? []).map((z) => ({ name: z.name, provinces: z.provinces, rate: z.rate })),
    };
  }, DEFAULT_SHIPPING);
});

/** Products as plain priced objects for client components. */
export function toPricedProducts(products: PublicProduct[]): PricedProduct[] {
  return products.map(({ slug, name, shortName, kind, size, regularPrice, salePrice, minOrder, bulkTiers }) => ({
    slug,
    name,
    shortName,
    kind,
    size,
    regularPrice,
    salePrice,
    minOrder,
    bulkTiers,
  }));
}
