# Magnetify.ca

Personalized photo magnet store. Next.js 16 (App Router), TypeScript, Tailwind CSS v4, MongoDB Atlas + Mongoose. Deploys on Vercel.

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in MONGODB_URI, ADMIN_SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run dev
```

1. Open `/admin/login` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The first login creates the owner account with a bcrypt-hashed password. Change it in **Admin > Settings**.
2. Go to **Admin > Products** and click **Import default catalog**. Until you do, the site shows the built-in default catalog.
3. Edit content under **Homepage, Gallery, Pages, Pricing, Shipping, Settings**.

## Deploying to Vercel

Set these environment variables: `MONGODB_URI`, `ADMIN_SESSION_SECRET` (32+ chars), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL`. For Stripe, also set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. In Atlas, allow Vercel's IPs under Network Access (or use 0.0.0.0/0).

## How it works

| Area | Where |
| --- | --- |
| Public pages | `app/(site)/*`: CMS content from MongoDB, with fallback defaults in `lib/contentSchema.ts`, refreshed via ISR (60s) and `revalidatePath` on every admin save |
| Customizer | `components/customizer/*`: photos are downscaled and kept in the browser (IndexedDB) while editing. Drag, pinch or slider zoom, text, replace and remove all happen client-side. Nothing is uploaded until checkout. |
| Checkout | Each magnet is rendered to a 300 DPI JPEG (600×600 or 600×900), uploaded to the private `orders` folder, then `POST /api/orders` recalculates every price, bulk tier and shipping cost on the server |
| Pricing | `lib/pricing.ts`: bulk tiers apply to the total magnets in the cart |
| Shipping | `lib/shipping.ts`: flat rate, free-shipping threshold, local pickup and province zones. Swap `getShippingProvider()` to plug in a carrier API |
| Payments | `lib/payments.ts`: Stripe Checkout when keys are set, confirmed only by a signed webhook (`/api/payments/stripe/webhook`). Without keys, orders are saved as **awaiting payment** and the customer is told an invoice will be emailed. Nothing is ever marked paid without confirmation. |
| Auth | HMAC-signed HttpOnly cookie (`lib/session.ts`). `proxy.ts` redirects signed-out visitors, and every admin page and API also checks the session on the server. |

## Image storage (serverless-safe)

- `POST /api/upload` (admin only): whitelisted folders (`products|gallery|pages|misc`), PNG/JPEG/WebP/GIF only, magic bytes checked, 8MB max. Bytes are stored in the `StoredUpload` collection and the response returns only the URL.
- `GET /api/uploads/[folder]/[filename]`: strict folder and filename validation, served with long-lived immutable caching. Customer `orders` artwork is visible to admins only.
- Content documents store only the URL string. Replaced or removed images are deleted with `deleteStoredUploadByUrl` **after** the new value saves.
- Legacy `/uploads/...` paths render a placeholder (`getSafeImageUrl`).
- Vercel limits request bodies to about 4.5MB, so `AdminImageField` re-encodes still images larger than 4MB to WebP in the browser before uploading. GIFs over 4.5MB cannot be uploaded on Vercel.
- No code writes to the filesystem.

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npx tsc --noEmit`
