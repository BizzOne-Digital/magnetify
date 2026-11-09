const STYLES: Record<string, string> = {
  pending: "bg-promo/15 text-[#ff8a8f] ring-promo/40",
  processing: "bg-gold/15 text-gold-light ring-gold/40",
  printing: "bg-gold/15 text-gold-light ring-gold/40",
  shipped: "bg-sky-500/10 text-sky-300 ring-sky-500/30",
  completed: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  cancelled: "bg-white/5 text-cream/60 ring-white/10",
  paid: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  awaiting_payment: "bg-gold/10 text-champagne ring-gold/30",
  unpaid: "bg-promo/15 text-[#ff8a8f] ring-promo/40",
  failed: "bg-promo/15 text-[#ff8a8f] ring-promo/40",
  refunded: "bg-white/5 text-cream/60 ring-white/10",
  active: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30",
  draft: "bg-gold/10 text-champagne ring-gold/30",
  archived: "bg-white/5 text-cream/60 ring-white/10",
};

export function StatusBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ${STYLES[value] ?? "bg-white/5 ring-white/10"}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}
