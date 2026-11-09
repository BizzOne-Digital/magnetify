/** Pure pricing logic shared by cart UI and the server (server always recalculates). */
export interface PricedProduct {
  slug: string;
  name: string;
  shortName: string;
  kind: "photo" | "business";
  size: "2x2" | "2x3";
  regularPrice: number;
  salePrice: number;
  minOrder: number;
  bulkTiers: { minQty: number; price: number; label?: string }[];
}

export interface PricingLineInput {
  productSlug: string;
  quantity: number;
}

export interface PricedLine {
  productSlug: string;
  name: string;
  size: "2x2" | "2x3";
  kind: "photo" | "business";
  quantity: number;
  unitPrice: number;
  regularUnitPrice: number;
  baseUnitPrice: number;
  lineTotal: number;
  belowMinimum: boolean;
  minOrder: number;
}

export interface PricingResult {
  lines: PricedLine[];
  totalMagnets: number;
  regularTotal: number;
  subtotal: number;
  /** Savings vs. regular price (sale + bulk). */
  discount: number;
  bulkSavings: number;
  tierLabel: string | null;
  nextTier: { minQty: number; label: string; remaining: number } | null;
  errors: string[];
}

export const round2 = (n: number) => Math.round(n * 100) / 100;
export const money = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(n).replace("CA", "");

/**
 * Bulk tiers apply to the total number of magnets across the whole cart.
 * Each product's own bulkTiers define its tier price; the highest tier reached wins.
 */
export function calculatePricing(products: PricedProduct[], input: PricingLineInput[]): PricingResult {
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const errors: string[] = [];
  const valid = input.filter((l) => {
    if (!bySlug.has(l.productSlug)) {
      errors.push(`Product "${l.productSlug}" is no longer available.`);
      return false;
    }
    return Number.isInteger(l.quantity) && l.quantity > 0;
  });
  const totalMagnets = valid.reduce((s, l) => s + l.quantity, 0);

  const allTierQtys = Array.from(new Set(products.flatMap((p) => p.bulkTiers.map((t) => t.minQty)))).sort((a, b) => a - b);
  const reached = allTierQtys.filter((q) => totalMagnets >= q).pop() ?? null;
  const upcoming = allTierQtys.find((q) => totalMagnets < q) ?? null;

  const lines: PricedLine[] = valid.map((l) => {
    const p = bySlug.get(l.productSlug)!;
    const tier = p.bulkTiers
      .filter((t) => totalMagnets >= t.minQty)
      .sort((a, b) => b.minQty - a.minQty)[0];
    const unitPrice = tier ? Math.min(tier.price, p.salePrice) : p.salePrice;
    const belowMinimum = l.quantity < p.minOrder;
    if (belowMinimum) errors.push(`${p.shortName}: minimum order is ${p.minOrder} magnets.`);
    return {
      productSlug: p.slug,
      name: p.name,
      size: p.size,
      kind: p.kind,
      quantity: l.quantity,
      unitPrice,
      regularUnitPrice: p.regularPrice,
      baseUnitPrice: p.salePrice,
      lineTotal: round2(unitPrice * l.quantity),
      belowMinimum,
      minOrder: p.minOrder,
    };
  });

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const regularTotal = round2(lines.reduce((s, l) => s + l.regularUnitPrice * l.quantity, 0));
  const saleTotal = round2(lines.reduce((s, l) => s + l.baseUnitPrice * l.quantity, 0));

  return {
    lines,
    totalMagnets,
    regularTotal,
    subtotal,
    discount: round2(regularTotal - subtotal),
    bulkSavings: round2(saleTotal - subtotal),
    tierLabel: reached ? `${reached}+ magnets bulk pricing` : null,
    nextTier: upcoming
      ? { minQty: upcoming, label: `${upcoming}+ magnets`, remaining: upcoming - totalMagnets }
      : null,
    errors,
  };
}
