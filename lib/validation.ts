import { ORDER_NUMBER_RE } from "./orderNumber";
import { z } from "zod";
import { MAGNET_FONT_IDS } from "@/lib/cart/fonts";

const trimmed = (max: number) => z.string().trim().max(max);

export const contactSchema = z.object({
  name: trimmed(100).min(2, "Please enter your name"),
  email: z.string().trim().email("Please enter a valid email").max(200),
  subject: trimmed(200).min(2, "Please add a subject"),
  message: trimmed(5000).min(10, "Message should be at least 10 characters"),
  website: z.string().max(0).optional(), // honeypot
});
export type ContactInput = z.infer<typeof contactSchema>;

const uploadUrl = z.string().regex(/^\/api\/uploads\/orders\/[a-zA-Z0-9._-]+$/, "Invalid artwork reference");

export const tileSchema = z.object({
  id: z.string().max(40),
  printUrl: uploadUrl,
  x: z.number().finite().min(-10).max(10),
  y: z.number().finite().min(-10).max(10),
  scale: z.number().finite().min(1).max(4),
  text: trimmed(60).default(""),
  textX: z.number().finite().min(0).max(1),
  textY: z.number().finite().min(0).max(1),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textSize: z.number().finite().min(0.01).max(0.3),
  textFont: z.enum(MAGNET_FONT_IDS).default("classic"),
});

export const orderSchema = z
  .object({
    orderNumber: z.string().regex(ORDER_NUMBER_RE).optional(),
    customer: z.object({
      name: trimmed(100).min(2, "Please enter your full name"),
      email: z.string().trim().email("Please enter a valid email").max(200),
      phone: trimmed(30).optional().or(z.literal("")),
    }),
    fulfillment: z.enum(["shipping", "pickup"]),
    shippingAddress: z.object({
      line1: trimmed(200),
      line2: trimmed(200).optional().or(z.literal("")),
      city: trimmed(100),
      province: trimmed(50),
      postalCode: trimmed(12),
      country: trimmed(60).default("Canada"),
    }),
    items: z
      .array(
        z.object({
          productSlug: z.string().regex(/^[a-z0-9-]+$/),
          tiles: z.array(tileSchema).min(1).max(200),
        })
      )
      .min(1, "Your cart is empty")
      .max(30),
    socialConsent: z.enum(["agree", "disagree"], { message: "Please choose a social media consent option" }),
    paymentMethod: z.enum(["card", "paypal", "manual"]).optional(),
    notes: trimmed(1000).optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    if (v.fulfillment === "shipping") {
      const a = v.shippingAddress;
      if (a.line1.length < 3) ctx.addIssue({ code: "custom", path: ["shippingAddress", "line1"], message: "Street address is required" });
      if (a.city.length < 2) ctx.addIssue({ code: "custom", path: ["shippingAddress", "city"], message: "City is required" });
      if (a.province.length < 2) ctx.addIssue({ code: "custom", path: ["shippingAddress", "province"], message: "Province is required" });
      if (a.postalCode.length < 3) ctx.addIssue({ code: "custom", path: ["shippingAddress", "postalCode"], message: "Postal code is required" });
    }
  });
export type OrderInput = z.infer<typeof orderSchema>;

export const bulkTierSchema = z.object({
  minQty: z.coerce.number().int().min(2).max(100000),
  price: z.coerce.number().min(0).max(1000),
  label: trimmed(60).optional().default(""),
});

const imageUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || v.startsWith("/api/uploads/") || v.startsWith("https://images.unsplash.com/") || v.startsWith("/"), "Invalid image URL");

export const productSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Slug may only contain a-z, 0-9 and dashes").min(2).max(80),
  name: trimmed(120).min(2),
  shortName: trimmed(60).min(1),
  kind: z.enum(["photo", "business"]),
  size: z.enum(["2x2", "2x3"]),
  regularPrice: z.coerce.number().min(0).max(1000),
  salePrice: z.coerce.number().min(0).max(1000),
  minOrder: z.coerce.number().int().min(1).max(1000),
  description: trimmed(2000).default(""),
  image: imageUrl.default(""),
  gallery: z.array(imageUrl).max(20).default([]),
  status: z.enum(["active", "draft", "archived"]),
  bulkTiers: z.array(bulkTierSchema).max(10).default([]),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
});

export const shippingSchema = z.object({
  shippingEnabled: z.boolean(),
  mode: z.enum(["flat", "zone"]),
  flatShippingRate: z.coerce.number().min(0).max(1000),
  freeShippingThreshold: z.coerce.number().min(0).max(100000),
  localPickupEnabled: z.boolean(),
  localPickupNote: trimmed(300).default(""),
  zones: z
    .array(
      z.object({
        name: trimmed(60).min(1),
        provinces: z.array(trimmed(4)).max(20),
        rate: z.coerce.number().min(0).max(1000),
      })
    )
    .max(20)
    .default([]),
  allowedProvinces: z.array(z.enum(["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"])).max(13).default([]),
  shippingNotice: trimmed(200).default(""),
});

export const siteSettingsSchema = z.object({
  contactEmail: z.string().trim().email(),
  facebookHandle: trimmed(80).regex(/^[a-zA-Z0-9._-]*$/, "Handle may only contain letters, numbers, dots, dashes"),
  instagramHandle: trimmed(80).regex(/^[a-zA-Z0-9._-]*$/, "Handle may only contain letters, numbers, dots, dashes"),
  tiktokHandle: trimmed(80).regex(/^[a-zA-Z0-9._-]*$/, "Handle may only contain letters, numbers, dots, dashes").default(""),
  finalSaleNotice: trimmed(300),
  announcement: trimmed(300).default(""),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});
