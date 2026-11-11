import mongoose, { Schema, type Model } from "mongoose";

// Schema literals are intentionally untyped (typed Schema<T> definitions explode TS inference);
// the document interfaces below are applied to each Model instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function model<T>(name: string, schema: Schema<any>): Model<T> {
  return (mongoose.models[name] as Model<T>) || (mongoose.model(name, schema) as unknown as Model<T>);
}

/* ---------------- Admin ---------------- */
export interface AdminDoc {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: "owner" | "admin";
  lastLoginAt?: Date;
}
const AdminSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "Admin" },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "admin"], default: "admin" },
    lastLoginAt: Date,
  },
  { timestamps: true }
);
export const Admin = model<AdminDoc>("Admin", AdminSchema);

/* ---------------- Product ---------------- */
export interface BulkTier {
  minQty: number;
  price: number;
  label?: string;
}
export interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  shortName: string;
  kind: "photo" | "business";
  size: "2x2" | "2x3";
  regularPrice: number;
  salePrice: number;
  minOrder: number;
  description: string;
  image: string;
  gallery: string[];
  status: "active" | "draft" | "archived";
  bulkTiers: BulkTier[];
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}
const ProductSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
    name: { type: String, required: true, maxlength: 120 },
    shortName: { type: String, required: true, maxlength: 60 },
    kind: { type: String, enum: ["photo", "business"], default: "photo" },
    size: { type: String, enum: ["2x2", "2x3"], required: true },
    regularPrice: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    minOrder: { type: Number, required: true, min: 1 },
    description: { type: String, default: "" },
    image: { type: String, default: "" },
    gallery: { type: [String], default: [] },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active" },
    bulkTiers: {
      type: [{ minQty: Number, price: Number, label: String, _id: false }],
      default: [],
    },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);
export const Product = model<ProductDoc>("Product", ProductSchema);

/* ---------------- ProductCustomization (one per ordered item) ---------------- */
export interface TileConfig {
  id: string;
  printUrl: string;
  x: number;
  y: number;
  scale: number;
  text: string;
  textX: number;
  textY: number;
  textColor: string;
  textSize: number;
  textFont?: string;
}
const TileSchema = new Schema(
  {
    id: String,
    printUrl: String,
    x: Number,
    y: Number,
    scale: Number,
    text: { type: String, maxlength: 60 },
    textX: Number,
    textY: Number,
    textColor: String,
    textSize: Number,
    textFont: { type: String, default: "classic" },
  },
  { _id: false }
);
export interface ProductCustomizationDoc {
  _id: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;
  productSlug: string;
  size: "2x2" | "2x3";
  tiles: TileConfig[];
}
const ProductCustomizationSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", index: true },
    productSlug: String,
    size: { type: String, enum: ["2x2", "2x3"] },
    tiles: [TileSchema],
  },
  { timestamps: true }
);
export const ProductCustomization = model<ProductCustomizationDoc>("ProductCustomization", ProductCustomizationSchema);

/* ---------------- Cart (server snapshot of a checkout attempt) ---------------- */
export interface CartDoc {
  _id: mongoose.Types.ObjectId;
  items: { productSlug: string; size: string; quantity: number }[];
  email?: string;
  status: "open" | "converted";
}
const CartSchema = new Schema(
  {
    items: [{ productSlug: String, size: String, quantity: Number, _id: false }],
    email: String,
    status: { type: String, enum: ["open", "converted"], default: "open" },
  },
  { timestamps: true }
);
export const Cart = model<CartDoc>("Cart", CartSchema);

/* ---------------- Order ---------------- */
export type OrderStatus = "pending" | "processing" | "printing" | "shipped" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "awaiting_payment" | "paid" | "failed" | "refunded";
export interface OrderItem {
  productSlug: string;
  productName: string;
  size: "2x2" | "2x3";
  kind: "photo" | "business";
  quantity: number;
  unitPrice: number;
  regularUnitPrice: number;
  lineTotal: number;
  customization: mongoose.Types.ObjectId;
  previewUrls: string[];
}
export interface OrderDoc {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  customer: { name: string; email: string; phone?: string };
  shippingAddress: { line1: string; line2?: string; city: string; province: string; postalCode: string; country: string };
  fulfillment: "shipping" | "pickup";
  items: OrderItem[];
  totals: { subtotal: number; discount: number; shipping: number; total: number; totalMagnets: number; tierLabel?: string };
  socialConsent: "agree" | "disagree";
  notes?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentProvider: "stripe" | "paypal" | "manual";
  paymentRef?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { name: String, email: String, phone: String },
    shippingAddress: { line1: String, line2: String, city: String, province: String, postalCode: String, country: String },
    fulfillment: { type: String, enum: ["shipping", "pickup"], default: "shipping" },
    items: [
      {
        productSlug: String,
        productName: String,
        size: String,
        kind: String,
        quantity: Number,
        unitPrice: Number,
        regularUnitPrice: Number,
        lineTotal: Number,
        customization: { type: Schema.Types.ObjectId, ref: "ProductCustomization" },
        previewUrls: [String],
        _id: false,
      },
    ],
    totals: { subtotal: Number, discount: Number, shipping: Number, total: Number, totalMagnets: Number, tierLabel: String },
    socialConsent: { type: String, enum: ["agree", "disagree"], required: true },
    notes: String,
    status: {
      type: String,
      enum: ["pending", "processing", "printing", "shipped", "completed", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "awaiting_payment", "paid", "failed", "refunded"],
      default: "unpaid",
    },
    paymentProvider: { type: String, enum: ["stripe", "paypal", "manual"], default: "manual" },
    paymentRef: String,
  },
  { timestamps: true }
);
export const Order = model<OrderDoc>("Order", OrderSchema);

/* ---------------- ContactMessage ---------------- */
export interface ContactMessageDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt?: Date;
}
const ContactMessageSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    email: { type: String, required: true, maxlength: 200 },
    subject: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 5000 },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
export const ContactMessage = model<ContactMessageDoc>("ContactMessage", ContactMessageSchema);

/* ---------------- PageContent (CMS key/value per page) ---------------- */
export interface PageContentDoc {
  _id: mongoose.Types.ObjectId;
  key: string;
  data: Record<string, unknown>;
  updatedAt?: Date;
}
const PageContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, match: /^[a-z0-9-]+$/ },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, minimize: false }
);
export const PageContent = model<PageContentDoc>("PageContent", PageContentSchema);

/* ---------------- SiteSettings (singleton) ---------------- */
export interface SiteSettingsDoc {
  _id: mongoose.Types.ObjectId;
  key: "site";
  contactEmail: string;
  facebookHandle: string;
  instagramHandle: string;
  tiktokHandle: string;
  bulkTiers: { minQty: number; label: string }[];
  finalSaleNotice: string;
  announcement: string;
}
const SiteSettingsSchema = new Schema(
  {
    key: { type: String, default: "site", unique: true },
    contactEmail: { type: String, default: "magnetify1@hotmail.com" },
    facebookHandle: { type: String, default: "shop.magnetify" },
    instagramHandle: { type: String, default: "shop.magnetify" },
    tiktokHandle: { type: String, default: "Magnetify1" },
    bulkTiers: { type: [{ minQty: Number, label: String, _id: false }], default: undefined },
    finalSaleNotice: { type: String, default: "Custom magnets are final sale and non-refundable." },
    announcement: { type: String, default: "" },
  },
  { timestamps: true }
);
export const SiteSettings = model<SiteSettingsDoc>("SiteSettings", SiteSettingsSchema);

/* ---------------- ShippingSettings (singleton) ---------------- */
export interface ShippingSettingsDoc {
  _id: mongoose.Types.ObjectId;
  key: "shipping";
  shippingEnabled: boolean;
  mode: "flat" | "zone";
  flatShippingRate: number;
  freeShippingThreshold: number;
  localPickupEnabled: boolean;
  localPickupNote: string;
  zones: { name: string; provinces: string[]; rate: number }[];
  allowedProvinces: string[];
  shippingNotice: string;
}
const ShippingSettingsSchema = new Schema(
  {
    key: { type: String, default: "shipping", unique: true },
    shippingEnabled: { type: Boolean, default: true },
    mode: { type: String, enum: ["flat", "zone"], default: "flat" },
    flatShippingRate: { type: Number, default: 4.99, min: 0 },
    freeShippingThreshold: { type: Number, default: 100, min: 0 },
    localPickupEnabled: { type: Boolean, default: false },
    localPickupNote: { type: String, default: "" },
    zones: { type: [{ name: String, provinces: [String], rate: Number, _id: false }], default: [] },
    allowedProvinces: { type: [String], default: ["BC"] },
    shippingNotice: { type: String, default: "Currently shipping within BC only" },
  },
  { timestamps: true }
);
export const ShippingSettings = model<ShippingSettingsDoc>("ShippingSettings", ShippingSettingsSchema);
