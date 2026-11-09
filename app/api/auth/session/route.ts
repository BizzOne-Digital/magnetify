import { getAdminSession } from "@/lib/auth";
import { fail, ok } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return fail("Unauthorized", 401);
  return ok({ user: { email: session.email, name: session.name } });
}
