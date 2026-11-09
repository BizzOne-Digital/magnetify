"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DatabaseZap } from "lucide-react";
import { adminFetch } from "@/components/admin/adminFetch";

export function SeedProductsButton({ empty }: { empty: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-sm ${empty ? "btn-primary" : "btn-ghost"}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await adminFetch<{ created: number }>("/api/products/seed", { method: "POST" });
          toast.success(r.created ? `Imported ${r.created} products` : "Default products already exist");
          router.refresh();
        } catch (err) {
          toast.error((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <DatabaseZap className="h-4 w-4" aria-hidden="true" /> Import default catalog
    </button>
  );
}
