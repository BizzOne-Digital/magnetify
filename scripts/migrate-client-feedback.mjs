/**
 * One-off data update for the Nov 2026 client feedback (safe to re-run).
 * Usage: node --env-file=.env.local scripts/migrate-client-feedback.mjs
 */
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;

// Bulk tier badges: "OVER 50 MAGNETS" -> "50+ MAGNETS"
let relabeled = 0;
for (const p of await db.collection("products").find({}).toArray()) {
  const tiers = (p.bulkTiers ?? []).map((t) => ({ ...t, label: `${t.minQty}+ MAGNETS` }));
  const r = await db.collection("products").updateOne({ _id: p._id }, { $set: { bulkTiers: tiers } });
  relabeled += r.modifiedCount;
}

// Shipping: free at $100+, BC only
const ship = await db.collection("shippingsettings").updateOne(
  { key: "shipping" },
  { $set: { freeShippingThreshold: 100, allowedProvinces: ["BC"], shippingNotice: "Currently shipping within BC only", updatedAt: new Date() } },
  { upsert: true }
);

// TikTok handle
const site = await db.collection("sitesettings").updateOne({ key: "site" }, { $set: { tiktokHandle: "Magnetify1", updatedAt: new Date() } }, { upsert: true });

console.log(`products relabeled: ${relabeled}, shipping updated: ${ship.modifiedCount + ship.upsertedCount}, site settings updated: ${site.modifiedCount + site.upsertedCount}`);
await mongoose.disconnect();
