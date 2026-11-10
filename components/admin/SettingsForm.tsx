"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, KeyRound, Save, XCircle } from "lucide-react";
import { adminFetch } from "@/components/admin/adminFetch";

type Settings = { contactEmail: string; facebookHandle: string; instagramHandle: string; tiktokHandle: string; finalSaleNotice: string; announcement: string };

export function SettingsForm({
  initial,
  stripe,
  webhook,
  paypal,
  paypalLive,
  email,
}: {
  initial: Settings;
  stripe: boolean;
  webhook: boolean;
  paypal: boolean;
  paypalLive: boolean;
  email: "resend" | "smtp" | null;
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await adminFetch("/api/settings", { method: "PUT", json: v });
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (fd.get("newPassword") !== fd.get("confirm")) return toast.error("New passwords do not match");
    try {
      await adminFetch("/api/auth/password", { method: "POST", json: { currentPassword: fd.get("currentPassword"), newPassword: fd.get("newPassword") } });
      toast.success("Password updated");
      form.reset();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const field = (k: keyof Settings, label: string, help?: string) => (
    <div>
      <label htmlFor={`st-${k}`} className="label">
        {label}
      </label>
      <input id={`st-${k}`} className="input" value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} />
      {help ? <p className="mt-1 text-xs text-muted">{help}</p> : null}
    </div>
  );

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <section className="card-dark space-y-4 p-5">
        <h2 className="font-display font-bold text-gold-light">Website</h2>
        {field("contactEmail", "Public contact email", "The only contact detail shown publicly. Phone numbers are never displayed.")}
        {field("facebookHandle", "Facebook handle")}
        {field("instagramHandle", "Instagram handle")}
        {field("tiktokHandle", "TikTok handle")}
        {field("finalSaleNotice", "Final sale notice")}
        <button type="button" className="btn btn-gold" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" aria-hidden="true" /> {saving ? "Saving…" : "Save settings"}
        </button>
      </section>

      <div className="space-y-6">
        <section className="card-dark space-y-3 p-5 text-sm">
          <h2 className="font-display font-bold text-gold-light">Payments</h2>
          <Status ok={stripe} label="Credit/debit card (Stripe) — STRIPE_SECRET_KEY" />
          <Status ok={webhook} label="Stripe webhook — STRIPE_WEBHOOK_SECRET" />
          <Status ok={paypal} label={`PayPal — PAYPAL_CLIENT_ID / SECRET${paypal ? (paypalLive ? " (live)" : " (sandbox / test mode)") : ""}`} />
          <p className="text-xs text-muted">
            Without Stripe keys, orders are saved as &quot;awaiting payment&quot; and customers are told you will email a payment request. Set the keys in
            your Vercel environment variables and point a Stripe webhook to <code className="text-cream">/api/payments/stripe/webhook</code>.
          </p>
        </section>

        <section className="card-dark space-y-3 p-5 text-sm">
          <h2 className="font-display font-bold text-gold-light">Email notifications</h2>
          <Status ok={Boolean(email)} label={email ? `Sending via ${email === "resend" ? "Resend" : "SMTP"}` : "Not configured — contact messages and orders are saved but not emailed"} />
          <p className="text-xs text-muted">
            Set <code className="text-cream">RESEND_API_KEY</code> + <code className="text-cream">EMAIL_FROM</code> (or SMTP_HOST/PORT/USER/PASS) in Vercel. Notifications go to{" "}
            <code className="text-cream">NOTIFY_EMAIL</code> or the contact email above.
          </p>
        </section>

        <form onSubmit={changePassword} className="card-dark space-y-3 p-5">
          <h2 className="font-display font-bold text-gold-light">Change password</h2>
          <div>
            <label htmlFor="pw-cur" className="label">
              Current password
            </label>
            <input id="pw-cur" name="currentPassword" type="password" autoComplete="current-password" className="input" required />
          </div>
          <div>
            <label htmlFor="pw-new" className="label">
              New password (10+ characters)
            </label>
            <input id="pw-new" name="newPassword" type="password" autoComplete="new-password" minLength={10} className="input" required />
          </div>
          <div>
            <label htmlFor="pw-confirm" className="label">
              Confirm new password
            </label>
            <input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" className="input" required />
          </div>
          <button type="submit" className="btn btn-secondary">
            <KeyRound className="h-4 w-4" aria-hidden="true" /> Update password
          </button>
        </form>
      </div>
    </div>
  );
}

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <p className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" /> : <XCircle className="h-4 w-4 text-promo" aria-hidden="true" />}
      {label}
    </p>
  );
}
