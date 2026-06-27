// Generates PWA icons as PNGs without any image dependencies.
// Draws a green rounded background with a white circle and a "$" glyph.
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const GREEN = [22, 163, 74]; // #16a34a
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // rest are 0 (compression, filter, interlace)

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter byte
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * (size * 4 + 1) + 1 + x * 4;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }
  const idat = deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function setPx(pixels, size, x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
  pixels[i + 3] = a;
}

function makeIcon(size, maskable) {
  const pixels = Buffer.alloc(size * size * 4);
  const radius = maskable ? size : size * 0.22; // maskable = full bleed square
  const cx = size / 2;
  const cy = size / 2;

  // Background (rounded rect for `any`, full square for maskable)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let inside = true;
      if (!maskable) {
        const rx = Math.min(x, size - 1 - x);
        const ry = Math.min(y, size - 1 - y);
        if (rx < radius && ry < radius) {
          const dx = radius - rx;
          const dy = radius - ry;
          inside = dx * dx + dy * dy <= radius * radius;
        }
      }
      if (inside) setPx(pixels, size, x, y, GREEN);
    }
  }

  // White coin circle
  const coinR = size * (maskable ? 0.3 : 0.34);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= coinR * coinR) setPx(pixels, size, x, y, WHITE);
    }
  }

  // "$" glyph drawn as a vertical bar + two horizontal-ish strokes (simple, legible)
  const gw = Math.max(2, Math.round(size * 0.05)); // stroke width
  const top = cy - coinR * 0.55;
  const bot = cy + coinR * 0.55;
  // vertical bar
  for (let y = Math.round(top - gw); y <= Math.round(bot + gw); y++) {
    for (let x = Math.round(cx - gw / 2); x <= Math.round(cx + gw / 2); x++) {
      setPx(pixels, size, x, y, GREEN);
    }
  }
  // S-curve approximated with three horizontal bars
  const barW = coinR * 0.5;
  const rows = [top, cy, bot];
  for (const ry of rows) {
    for (let x = Math.round(cx - barW); x <= Math.round(cx + barW); x++) {
      for (let y = Math.round(ry - gw / 2); y <= Math.round(ry + gw / 2); y++) {
        setPx(pixels, size, x, y, GREEN);
      }
    }
  }

  return encodePng(size, pixels);
}

writeFileSync(join(outDir, "icon-192.png"), makeIcon(192, false));
writeFileSync(join(outDir, "icon-512.png"), makeIcon(512, false));
writeFileSync(join(outDir, "icon-maskable-512.png"), makeIcon(512, true));
writeFileSync(join(outDir, "apple-touch-icon.png"), makeIcon(180, false));

console.log("Icons generated in public/icons/");
