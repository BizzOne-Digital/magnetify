"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { contactSchema } from "@/lib/validation";

type Errors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

export function ContactForm({ title }: { title: string }) {
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      const errs: Errors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof Errors;
        if (k && !errs[k]) errs[k] = i.message;
      });
      setErrors(errs);
      toast.error("Please check the highlighted fields.");
      return;
    }
    setErrors({});
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Could not send your message.");
      toast.success("Message sent. We will be in touch soon.");
      form.reset();
      setSent(true);
    } catch (err) {
      toast.error((err as Error).message || "Network error. Please try again.");
    } finally {
      setSending(false);
    }
  }

  const field = (name: keyof Errors, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`c-${name}`} className="label">
        {label}
      </label>
      <input
        id={`c-${name}`}
        name={name}
        className="input"
        aria-invalid={Boolean(errors[name])}
        aria-describedby={errors[name] ? `c-${name}-err` : undefined}
        {...props}
      />
      {errors[name] ? (
        <p id={`c-${name}-err`} className="mt-1 text-sm text-promo">
          {errors[name]}
        </p>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="card-gold space-y-4 p-6 sm:p-8">
      <h2 className="section-title text-gold-metal text-2xl">{title}</h2>
      {sent ? <p className="rounded-lg border border-gold/40 bg-gold/10 p-3 text-sm text-gold-light">Thank you — your message was received.</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Name", { autoComplete: "name", required: true })}
        {field("email", "Email", { type: "email", autoComplete: "email", required: true })}
      </div>
      {field("subject", "Subject", { required: true })}
      <div>
        <label htmlFor="c-message" className="label">
          Message
        </label>
        <textarea
          id="c-message"
          name="message"
          rows={6}
          className="input resize-y"
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "c-message-err" : undefined}
          required
        />
        {errors.message ? (
          <p id="c-message-err" className="mt-1 text-sm text-promo">
            {errors.message}
          </p>
        ) : null}
      </div>
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={sending}>
        <Send className="h-4 w-4" aria-hidden="true" /> {sending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
