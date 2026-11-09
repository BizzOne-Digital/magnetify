import type { Metadata } from "next";
import { requireAdminPage } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { isDbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage(); // server-side check (proxy is only the first gate)
  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader name={session.name} email={session.email} />
        {!isDbConfigured() ? (
          <p className="m-4 rounded-lg border border-promo/60 bg-promo/10 p-3 text-sm">MONGODB_URI is not configured. Changes cannot be saved.</p>
        ) : null}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
