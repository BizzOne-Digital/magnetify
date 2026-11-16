/**
 * Sets the flat shipping rate to $6.99 (safe to re-run).
 * Usage: node --env-file=.env.local scripts/migrate-shipping-699.mjs
 */
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const r = await mongoose.connection.db
  .collection("shippingsettings")
  .updateOne({ key: "shipping" }, { $set: { flatShippingRate: 6.99, updatedAt: new Date() } }, { upsert: true });
console.log(`shipping updated: ${r.modifiedCount + r.upsertedCount} (flat rate $6.99)`);
await mongoose.disconnect();
