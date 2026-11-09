"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function AdminHeader({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-4 border-b border-gold/20 bg-ink/90 px-4 pl-16 backdrop-blur sm:px-6 lg:pl-6">
      <div className="text-right text-sm leading-tight">
        <p className="font-semibold text-cream">{name}</p>
        <p className="text-xs text-muted">{email}</p>
      </div>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
          toast.success("Signed out");
          router.replace("/admin/login");
          router.refresh();
        }}
      >
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </button>
    </header>
  );
}

export function AdminPageTitle({ title, description, children }: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="section-title text-gold-metal text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}
