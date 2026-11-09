import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth";
import { fail, handleError, ok } from "@/lib/api";
import { connectDB } from "@/lib/db";
import { Admin } from "@/models";

export const runtime = "nodejs";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10, "New password must be at least 10 characters").max(200),
});

export async function POST(req: Request) {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;
  try {
    const { currentPassword, newPassword } = schema.parse(await req.json().catch(() => null));
    await connectDB();
    const admin = await Admin.findById(auth.session.sub);
    if (!admin || !(await bcrypt.compare(currentPassword, admin.passwordHash))) return fail("Current password is incorrect.", 400);
    admin.passwordHash = await bcrypt.hash(newPassword, 12);
    await admin.save();
    return ok({});
  } catch (err) {
    return handleError(err);
  }
}
