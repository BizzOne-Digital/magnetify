import bcrypt from "bcryptjs";
import { clientIp, fail, handleError, ok, rateLimit } from "@/lib/api";
import { connectDB, isDbConfigured } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { Admin } from "@/models";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let DUMMY_HASH: string | undefined;

/**
 * First-run bootstrap: if there are no admin users yet and ADMIN_EMAIL + ADMIN_PASSWORD are set,
 * the owner account is created (bcrypt-hashed) on first successful login with those credentials.
 */
async function bootstrapOwner(email: string, password: string) {
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envEmail || !envPassword || envPassword.length < 10) return null;
  if ((await Admin.estimatedDocumentCount()) > 0) return null;
  if (email !== envEmail || password !== envPassword) return null;
  return Admin.create({ email: envEmail, name: "Owner", role: "owner", passwordHash: await bcrypt.hash(envPassword, 12) });
}

export async function POST(req: Request) {
  if (!rateLimit(`login:${clientIp(req)}`, 8, 15 * 60 * 1000)) {
    return fail("Too many login attempts. Please wait 15 minutes.", 429);
  }
  if (!isDbConfigured()) return fail("Database is not configured.", 503);
  try {
    const { email, password } = loginSchema.parse(await req.json().catch(() => null));
    const normalized = email.toLowerCase();
    await connectDB();

    let admin = await Admin.findOne({ email: String(normalized) });
    if (!admin) admin = await bootstrapOwner(normalized, password);

    // Constant-ish time: always run a bcrypt compare.
    const hash = admin?.passwordHash ?? (DUMMY_HASH ??= await bcrypt.hash("not-a-real-password", 12));
    const valid = await bcrypt.compare(password, hash);
    if (!admin || !valid) return fail("Invalid email or password.", 401);

    admin.lastLoginAt = new Date();
    await admin.save();
    await setSessionCookie({ sub: String(admin._id), email: admin.email, name: admin.name });
    return ok({ name: admin.name });
  } catch (err) {
    return handleError(err);
  }
}
