/**
 * Create or reset the admin account.
 * Usage: npm run seed:admin   (reads MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD from .env.local)
 * The password is stored only as a bcrypt hash.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

if (!uri || !email || !password) {
  console.error("Missing MONGODB_URI, ADMIN_EMAIL or ADMIN_PASSWORD.");
  process.exit(1);
}

await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
const admins = mongoose.connection.collection("admins");
const passwordHash = await bcrypt.hash(password, 12);
const now = new Date();
const res = await admins.updateOne(
  { email },
  {
    $set: { passwordHash, updatedAt: now },
    $setOnInsert: { email, name: "Owner", role: "owner", createdAt: now },
  },
  { upsert: true }
);
console.log(res.upsertedCount ? `Created admin ${email}` : `Updated password for ${email}`);
await mongoose.disconnect();
