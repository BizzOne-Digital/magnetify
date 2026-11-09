import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession, type SessionPayload } from "@/lib/session";

export async function getAdminSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** For server components/pages under /admin. */
export async function requireAdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}

/** For route handlers. Returns a 401 response when not authenticated. */
export async function requireAdminApi(): Promise<{ session: SessionPayload; error: null } | { session: null; error: NextResponse }> {
  const session = await getAdminSession();
  if (!session) {
    return { session: null, error: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

export async function setSessionCookie(payload: Omit<SessionPayload, "exp">) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}
