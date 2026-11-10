import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { LoginForm } from "@/components/admin/LoginForm";
import { Logo } from "@/components/site/Logo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin Login", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(70%_70%_at_50%_0%,#2a2210_0%,#090909_70%)] px-4">
      <div className="card-gold w-full max-w-md p-8">
        <div className="mb-6 flex justify-center">
          <Logo className="h-14" />
        </div>
        <h1 className="section-title text-center text-2xl text-cream">Admin Portal</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted">Sign in to manage orders, products and content.</p>
        <LoginForm />
      </div>
    </main>
  );
}
