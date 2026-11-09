import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T extends object>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function fail(error: string, status = 400, extra?: object) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

export function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return fail(err.issues[0]?.message || "Invalid input", 422, { issues: err.issues });
  }
  const e = err as { message?: string; code?: number };
  if (e?.code === 11000) return fail("A record with that value already exists.", 409);
  console.error("[api]", err);
  const message = e?.message?.includes("MONGODB_URI") ? "Database is not configured." : "Something went wrong. Please try again.";
  return fail(message, 500);
}

export function isValidObjectId(id: unknown): id is string {
  return typeof id === "string" && /^[a-f0-9]{24}$/i.test(id);
}

/** Very small in-memory rate limiter (best effort on serverless). */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count++;
  return b.count <= limit;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
