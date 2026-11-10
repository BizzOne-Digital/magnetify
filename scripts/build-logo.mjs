/**
 * Builds web-ready logo assets from the client's master logo (gold on black).
 * Usage: node scripts/build-logo.mjs [source.png]
 * Outputs (public/brand/): logo.png (full, transparent), logo-mark.png (camera only),
 * and app/icon.png + app/apple-icon.png (favicon / home-screen icon).
 */
import sharp from "sharp";
import fs from "node:fs";

const src = process.argv[2] || "public/brand/logo-master.png";
fs.mkdirSync("public/brand", { recursive: true });

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

// Black -> transparent: alpha from brightness, colour un-premultiplied so the gold stays rich.
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const m = Math.max(r, g, b);
  const a = m < 24 ? 0 : Math.min(255, Math.round(((m - 24) / (200 - 24)) * 255));
  const k = a ? 255 / Math.max(a, 1) : 0;
  rgba[j] = Math.min(255, Math.round(r * Math.min(k, 255 / Math.max(m, 1))));
  rgba[j + 1] = Math.min(255, Math.round(g * Math.min(k, 255 / Math.max(m, 1))));
  rgba[j + 2] = Math.min(255, Math.round(b * Math.min(k, 255 / Math.max(m, 1))));
  rgba[j + 3] = a;
}

// Bounding box of visible pixels (optionally within an x-range)
function bbox(x0 = 0, x1 = W) {
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++)
    for (let x = x0; x < x1; x++)
      if (rgba[(y * W + x) * 4 + 3] > 40) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

const img = () => sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
const pad = 8;
const withPad = (b) => ({
  left: Math.max(0, b.left - pad),
  top: Math.max(0, b.top - pad),
  width: Math.min(W - Math.max(0, b.left - pad), b.width + pad * 2),
  height: Math.min(H - Math.max(0, b.top - pad), b.height + pad * 2),
});

// Full logo
const full = withPad(bbox());
await img().extract(full).resize({ height: 240 }).png({ compressionLevel: 9 }).toFile("public/brand/logo.png");

// Camera mark: the camera body ends where the wave runs into the wordmark (~35% of the width).
// Find the first mostly-empty column gap after the camera's right edge to separate it from the wave tail.
const camRight = Math.round(W * 0.35);
const mark = withPad(bbox(Math.round(W * 0.1), camRight));
await img().extract(mark).resize({ height: 240 }).png({ compressionLevel: 9 }).toFile("public/brand/logo-mark.png");

// Favicon / app icons: mark centred on brand black
const markBuf = await img().extract(mark).png().toBuffer();
for (const [file, size] of [["app/icon.png", 512], ["app/apple-icon.png", 180]]) {
  const inner = Math.round(size * 0.8);
  const fitted = await sharp(markBuf).resize({ width: inner, height: inner, fit: "inside" }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: "#090909" } })
    .composite([{ input: fitted, gravity: "center" }])
    .png()
    .toFile(file);
}

// Social preview (Open Graph)
const fullBuf = await img().extract(full).png().toBuffer();
const ogLogo = await sharp(fullBuf).resize({ width: 900 }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#090909" } })
  .composite([{ input: ogLogo, gravity: "center" }])
  .png()
  .toFile("app/opengraph-image.png");

const meta = { full: await sharp("public/brand/logo.png").metadata(), mark: await sharp("public/brand/logo-mark.png").metadata() };
console.log("logo.png", meta.full.width + "x" + meta.full.height, "| logo-mark.png", meta.mark.width + "x" + meta.mark.height);
