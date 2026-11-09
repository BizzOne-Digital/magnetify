import { requireAdminApi } from "@/lib/auth";
import { clientIp, fail, handleError, ok, rateLimit } from "@/lib/api";
import { connectDB, isDbConfigured } from "@/lib/db";
import { ContactMessage } from "@/models";
import { contactSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return fail("Too many messages. Please try again in a few minutes.", 429);
  }
  if (!isDbConfigured()) return fail("Messaging is temporarily unavailable. Please email us directly.", 503);
  try {
    const body = await req.json().catch(() => null);
    const data = contactSchema.parse(body);
    if (data.website) return ok({}); // honeypot hit: pretend success
    await connectDB();
    await ContactMessage.create({ name: data.name, email: data.email, subject: data.subject, message: data.message });
    return ok({}, 201);
  } catch (err) {
    return handleError(err);
  }
}

/** Admin: list messages. */
export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    await connectDB();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(500).lean();
    return ok({ messages });
  } catch (err) {
    return handleError(err);
  }
}
