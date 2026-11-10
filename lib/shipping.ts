/**
 * Modular shipping calculator. Today: flat rate + free threshold + optional pickup + simple zones.
 * To plug in a carrier API (Canada Post, Shippo, etc.) implement ShippingProvider and swap it in getShippingProvider().
 */
import { round2 } from "@/lib/pricing";

export interface ShippingConfig {
  shippingEnabled: boolean;
  mode: "flat" | "zone";
  flatShippingRate: number;
  freeShippingThreshold: number;
  localPickupEnabled: boolean;
  localPickupNote: string;
  zones: { name: string; provinces: string[]; rate: number }[];
  /** Province codes we ship to. Empty = all of Canada. */
  allowedProvinces: string[];
  /** Short public notice, e.g. "Currently shipping within BC only". */
  shippingNotice: string;
}

export const PROVINCE_NAMES: Record<string, string> = {
  AB: "Alberta", BC: "British Columbia", MB: "Manitoba", NB: "New Brunswick", NL: "Newfoundland and Labrador",
  NS: "Nova Scotia", NT: "Northwest Territories", NU: "Nunavut", ON: "Ontario", PE: "Prince Edward Island",
  QC: "Quebec", SK: "Saskatchewan", YT: "Yukon",
};

export const DEFAULT_SHIPPING: ShippingConfig = {
  shippingEnabled: true,
  mode: "flat",
  flatShippingRate: 4.99,
  freeShippingThreshold: 100,
  localPickupEnabled: false,
  localPickupNote: "",
  zones: [],
  allowedProvinces: ["BC"],
  shippingNotice: "Currently shipping within BC only",
};

export function shipsTo(config: ShippingConfig, province?: string) {
  if (!config.allowedProvinces.length) return true;
  return Boolean(province) && config.allowedProvinces.includes(province!.toUpperCase());
}

/** e.g. "Free shipping on orders of $100 or more" */
export function freeShippingText(config: ShippingConfig) {
  if (config.freeShippingThreshold <= 0) return "";
  const t = config.freeShippingThreshold;
  return `Free shipping on orders of $${Number.isInteger(t) ? t.toFixed(0) : t.toFixed(2)} or more`;
}

export interface ShippingQuoteInput {
  subtotal: number;
  fulfillment: "shipping" | "pickup";
  province?: string;
  totalMagnets: number;
}

export interface ShippingQuote {
  amount: number;
  label: string;
  available: boolean;
  freeShippingRemaining: number | null;
}

export interface ShippingProvider {
  quote(input: ShippingQuoteInput, config: ShippingConfig): ShippingQuote;
}

export const configShippingProvider: ShippingProvider = {
  quote(input, c) {
    if (input.fulfillment === "pickup") {
      return c.localPickupEnabled
        ? { amount: 0, label: "Local pickup", available: true, freeShippingRemaining: null }
        : { amount: 0, label: "Local pickup unavailable", available: false, freeShippingRemaining: null };
    }
    if (!c.shippingEnabled) {
      return { amount: 0, label: "Shipping currently unavailable", available: false, freeShippingRemaining: null };
    }
    if (input.province && !shipsTo(c, input.province)) {
      return { amount: 0, label: c.shippingNotice || "We do not ship to this province yet", available: false, freeShippingRemaining: null };
    }
    const threshold = c.freeShippingThreshold > 0 ? c.freeShippingThreshold : null;
    if (threshold !== null && input.subtotal >= threshold) {
      return { amount: 0, label: "Free shipping", available: true, freeShippingRemaining: 0 };
    }
    let rate = c.flatShippingRate;
    let label = "Flat-rate shipping";
    if (c.mode === "zone" && input.province) {
      const zone = c.zones.find((z) => z.provinces.map((p) => p.toUpperCase()).includes(input.province!.toUpperCase()));
      if (zone) {
        rate = zone.rate;
        label = `${zone.name} shipping`;
      }
    }
    return {
      amount: round2(rate),
      label,
      available: true,
      freeShippingRemaining: threshold !== null ? round2(threshold - input.subtotal) : null,
    };
  },
};

export function getShippingProvider(): ShippingProvider {
  return configShippingProvider;
}

export function quoteShipping(input: ShippingQuoteInput, config: ShippingConfig) {
  return getShippingProvider().quote(input, config);
}
