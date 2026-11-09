"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MailOpen, Reply, Trash2 } from "lucide-react";
import { adminFetch } from "@/components/admin/adminFetch";

type Msg = { _id: string; name: string; email: string; subject: string; message: string; read: boolean; createdAt: string };

export function MessagesList({ initial }: { initial: Msg[] }) {
  const [items, setItems] = useState(initial);

  async function toggleRead(m: Msg) {
    try {
      await adminFetch(`/api/contact/${m._id}`, { method: "PATCH", json: { read: !m.read } });
      setItems((xs) => xs.map((x) => (x._id === m._id ? { ...x, read: !m.read } : x)));
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function remove(m: Msg) {
    if (!confirm(`Delete message from ${m.name}?`)) return;
    try {
      await adminFetch(`/api/contact/${m._id}`, { method: "DELETE" });
      setItems((xs) => xs.filter((x) => x._id !== m._id));
      toast.success("Message deleted");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (items.length === 0) return <p className="card-dark p-6 text-sm text-muted">No messages yet.</p>;

  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li key={m._id} className={`card-dark p-5 ${m.read ? "opacity-75" : "border-gold/50"}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display font-bold text-cream">
                {!m.read ? <span className="mr-2 inline-block h-2 w-2 rounded-full bg-promo align-middle" aria-label="Unread" /> : null}
                {m.subject}
              </p>
              <p className="text-sm text-muted">
                {m.name} · {m.email} · {new Date(m.createdAt).toLocaleString("en-CA")}
              </p>
            </div>
            <div className="flex gap-2">
              <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`} className="btn btn-secondary btn-sm">
                <Reply className="h-4 w-4" aria-hidden="true" /> Reply
              </a>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleRead(m)}>
                {m.read ? <Mail className="h-4 w-4" aria-hidden="true" /> : <MailOpen className="h-4 w-4" aria-hidden="true" />}
                {m.read ? "Mark unread" : "Mark read"}
              </button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(m)} aria-label="Delete message">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-cream/85">{m.message}</p>
        </li>
      ))}
    </ul>
  );
}
