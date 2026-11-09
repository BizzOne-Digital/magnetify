"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Save, Trash2 } from "lucide-react";
import { adminFetch } from "@/components/admin/adminFetch";

const STATUSES = ["pending", "processing", "printing", "shipped", "completed", "cancelled"];
const PAYMENTS = ["unpaid", "awaiting_payment", "paid", "failed", "refunded"];

export function OrderActions({ id, status, paymentStatus }: { id: string; status: string; paymentStatus: string }) {
  const router = useRouter();
  const [s, setS] = useState(status);
  const [p, setP] = useState(paymentStatus);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminFetch(`/api/orders/${id}`, { method: "PATCH", json: { status: s, paymentStatus: p } });
      toast.success("Order updated");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this order and all of its artwork permanently? This cannot be undone.")) return;
    try {
      await adminFetch(`/api/orders/${id}`, { method: "DELETE" });
      toast.success("Order deleted");
      router.replace("/admin/orders");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <section className="card-gold space-y-4 p-5">
      <h2 className="font-display font-bold text-gold-light">Update order</h2>
      <div>
        <label htmlFor="o-status" className="label">
          Order status
        </label>
        <select id="o-status" className="input capitalize" value={s} onChange={(e) => setS(e.target.value)}>
          {STATUSES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="o-pay" className="label">
          Payment status
        </label>
        <select id="o-pay" className="input" value={p} onChange={(e) => setP(e.target.value)}>
          {PAYMENTS.map((x) => (
            <option key={x} value={x}>
              {x.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted">Only mark as paid after confirming payment was received.</p>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-gold btn-sm flex-1" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="btn btn-danger btn-sm" onClick={remove} aria-label="Delete order">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
