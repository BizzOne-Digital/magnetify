"use client";

/** JSON fetch for admin screens: throws a readable error and sends expired sessions to login. */
export async function adminFetch<T = Record<string, unknown>>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard reload clears client state after session expiry
    window.location.href = "/admin/login";
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    const err = new Error(body.error || `Request failed (${res.status})`) as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body as T;
}
