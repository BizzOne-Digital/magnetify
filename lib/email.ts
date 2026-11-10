import "server-only";

/**
 * Email delivery. Configure ONE of:
 *  - Resend (recommended on Vercel): RESEND_API_KEY + EMAIL_FROM (a sender on a domain verified in Resend)
 *  - SMTP (any provider, e.g. Gmail app password, Zoho, Outlook): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 * NOTIFY_EMAIL (optional) receives admin notifications; defaults to the public contact email in Settings.
 */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export function emailProvider(): "resend" | "smtp" | null {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  return null;
}

function fromAddress() {
  return process.env.EMAIL_FROM || process.env.SMTP_USER || "Magnetify <onboarding@resend.dev>";
}

export async function sendEmail(msg: EmailMessage): Promise<{ sent: boolean; error?: string }> {
  const provider = emailProvider();
  if (!provider) {
    console.warn("[email] not configured; skipped:", msg.subject);
    return { sent: false, error: "Email is not configured" };
  }
  try {
    if (provider === "resend") {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromAddress(),
          to: Array.isArray(msg.to) ? msg.to : [msg.to],
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
          reply_to: msg.replyTo,
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
    } else {
      const nodemailer = (await import("nodemailer")).default;
      const port = Number(process.env.SMTP_PORT || 587);
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      await transport.sendMail({ from: fromAddress(), to: msg.to, subject: msg.subject, html: msg.html, text: msg.text, replyTo: msg.replyTo });
    }
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", (err as Error).message);
    return { sent: false, error: (err as Error).message };
  }
}

/* ---------------- Templates ---------------- */
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#090909;font-family:Arial,Helvetica,sans-serif;color:#FFF8E7">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<p style="margin:0 0 18px;font-size:22px;font-weight:800;color:#D4AF37">Magnetify</p>
<div style="background:#151515;border:1px solid #6b5a22;border-radius:14px;padding:22px">
<h1 style="margin:0 0 14px;font-size:19px;color:#F5D67B">${esc(title)}</h1>${body}</div>
<p style="margin:16px 0 0;font-size:12px;color:#b9ae97">Small magnets, big memories.</p></div></body></html>`;
}

const row = (k: string, v: unknown) =>
  `<tr><td style="padding:4px 10px 4px 0;color:#b9ae97;font-size:13px;vertical-align:top">${esc(k)}</td><td style="padding:4px 0;font-size:14px">${esc(v)}</td></tr>`;

export function contactNotificationEmail(m: { name: string; email: string; subject: string; message: string }) {
  return {
    subject: `New website inquiry: ${m.subject}`,
    text: `New message from the Magnetify contact form\n\nName: ${m.name}\nEmail: ${m.email}\nSubject: ${m.subject}\n\n${m.message}\n\nReply directly to this email to answer ${m.name}.`,
    html: layout(
      "New website inquiry",
      `<table>${row("Name", m.name)}${row("Email", m.email)}${row("Subject", m.subject)}</table>
<p style="white-space:pre-wrap;font-size:14px;line-height:1.6;border-top:1px solid #333;margin-top:14px;padding-top:14px">${esc(m.message)}</p>
<p style="font-size:12px;color:#b9ae97">Reply directly to this email to answer ${esc(m.name)}.</p>`
    ),
  };
}

interface OrderEmailData {
  orderNumber: string;
  customer: { name: string; email: string };
  items: { productName: string; quantity: number; unitPrice: number; lineTotal: number }[];
  totals: { subtotal: number; shipping: number; total: number; totalMagnets: number };
  fulfillment: string;
  socialConsent: string;
  paymentNote: string;
}

const cad = (n: number) => `$${n.toFixed(2)}`;

function itemsTable(o: OrderEmailData) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${o.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.productName)} × ${i.quantity}</td><td style="padding:6px 0;text-align:right">${cad(i.lineTotal)}</td></tr>`)
    .join("")}
<tr><td style="padding:6px 0;border-top:1px solid #333;color:#b9ae97">Subtotal</td><td style="text-align:right;border-top:1px solid #333">${cad(o.totals.subtotal)}</td></tr>
<tr><td style="padding:6px 0;color:#b9ae97">Shipping</td><td style="text-align:right">${o.totals.shipping ? cad(o.totals.shipping) : "Free"}</td></tr>
<tr><td style="padding:6px 0;font-weight:bold">Total (CAD)</td><td style="text-align:right;font-weight:bold;color:#F5D67B">${cad(o.totals.total)}</td></tr></table>`;
}

export function orderAdminEmail(o: OrderEmailData, adminUrl: string) {
  return {
    subject: `New order ${o.orderNumber} — ${o.totals.totalMagnets} magnets, ${cad(o.totals.total)}`,
    text: `New order ${o.orderNumber}\nCustomer: ${o.customer.name} <${o.customer.email}>\nMagnets: ${o.totals.totalMagnets}\nTotal: ${cad(o.totals.total)}\nDelivery: ${o.fulfillment}\nSocial media consent: ${o.socialConsent}\nPayment: ${o.paymentNote}\n\nView: ${adminUrl}`,
    html: layout(
      `New order ${o.orderNumber}`,
      `<table>${row("Customer", `${o.customer.name} (${o.customer.email})`)}${row("Delivery", o.fulfillment)}${row("Social media consent", o.socialConsent === "agree" ? "Agreed" : "Did not agree")}${row("Payment", o.paymentNote)}</table>
${itemsTable(o)}<p style="margin-top:18px"><a href="${esc(adminUrl)}" style="background:#D71920;color:#FFF8E7;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">View order in admin</a></p>`
    ),
  };
}

export function orderCustomerEmail(o: OrderEmailData, contactEmail: string) {
  return {
    subject: `Your Magnetify order ${o.orderNumber}`,
    text: `Hi ${o.customer.name},\n\nThank you for your order ${o.orderNumber}. ${o.paymentNote}\n\nTotal: ${cad(o.totals.total)} (${o.totals.totalMagnets} magnets)\n\nQuestions? Email ${contactEmail}.\n\nMagnetify`,
    html: layout(
      "Thank you for your order!",
      `<p style="font-size:14px;line-height:1.6">Hi ${esc(o.customer.name)}, we received your order <strong style="color:#F5D67B">${esc(o.orderNumber)}</strong>.</p>
<p style="font-size:14px;line-height:1.6">${esc(o.paymentNote)}</p>${itemsTable(o)}
<p style="font-size:13px;color:#b9ae97;margin-top:16px">Custom magnets are final sale and non-refundable. Questions? Email <a style="color:#F5D67B" href="mailto:${esc(contactEmail)}">${esc(contactEmail)}</a>.</p>`
    ),
  };
}
