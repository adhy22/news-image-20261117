// News image for make.fun competition news-image-20261117:
// "Sum up 17 November's world news in one image".
// Node 22, standard library only. Draws a newspaper front page for
// Tuesday, 17 November 2026 into a 1024x1024 PNG and writes it to
// $MAKEFUN_OUTPUT_DIR/entry.png (or /output/entry.png).
// No network at runtime: all news is baked into this file.
// Deterministic: fixed layout, fixed colours, no timestamps, no randomness,
// zlib level 9 with a single IDAT stream -> byte-identical output every run.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// 5x7 bitmap font (uppercase, digits, punctuation). Each glyph is 7 rows of
// 5 bits, most-significant bit on the left. All copy is rendered in caps.
// ---------------------------------------------------------------------------
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  '0': [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  '1': [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  '2': [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  '3': [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  '4': [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  '5': [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  '6': [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  '7': [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  '9': [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  ' ': [0, 0, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ',': [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ':': [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  ';': [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  '?': [0x0e, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  '-': [0, 0, 0, 0x1f, 0, 0, 0],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '/': [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  '%': [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  '&': [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  '+': [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  '=': [0, 0, 0x1f, 0, 0x1f, 0, 0],
  '\u2022': [0, 0, 0x0e, 0x0e, 0, 0, 0],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  '#': [0x0a, 0x0a, 0x1f, 0x0a, 0x1f, 0x0a, 0x0a],
  '*': [0, 0x04, 0x15, 0x0e, 0x15, 0x04, 0],
  '@': [0x0e, 0x11, 0x17, 0x15, 0x16, 0x10, 0x0e],
  _: [0, 0, 0, 0, 0, 0, 0x1f],
  '[': [0x0e, 0x08, 0x08, 0x08, 0x08, 0x08, 0x0e],
  ']': [0x0e, 0x02, 0x02, 0x02, 0x02, 0x02, 0x0e],
  '<': [0x02, 0x04, 0x08, 0x10, 0x08, 0x04, 0x02],
  '>': [0x08, 0x04, 0x02, 0x01, 0x02, 0x04, 0x08],
};

type RGB = [number, number, number];

// ---------------------------------------------------------------------------
// Canvas: an RGB pixel buffer with tiny vector primitives.
// ---------------------------------------------------------------------------
class Canvas {
  w: number;
  h: number;
  px: Uint8Array;
  constructor(w: number, h: number, bg: RGB) {
    this.w = w;
    this.h = h;
    this.px = new Uint8Array(w * h * 3);
    this.fillRect(0, 0, w, h, bg);
  }
  set(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 3;
    this.px[i] = c[0];
    this.px[i + 1] = c[1];
    this.px[i + 2] = c[2];
  }
  fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
    const x0 = Math.max(0, Math.floor(x));
    const y0 = Math.max(0, Math.floor(y));
    const x1 = Math.min(this.w, Math.ceil(x + w));
    const y1 = Math.min(this.h, Math.ceil(y + h));
    for (let yy = y0; yy < y1; yy++) {
      for (let xx = x0; xx < x1; xx++) this.set(xx, yy, c);
    }
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.fillRect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  fillCircle(cx: number, cy: number, r: number, c: RGB): void {
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.floor(Math.sqrt(r * r - dy * dy));
      this.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1, c);
    }
  }
  ring(cx: number, cy: number, r: number, c: RGB, t = 2): void {
    for (let a = 0; a < 360; a += 2) {
      const rad = (a * Math.PI) / 180;
      this.fillRect(
        Math.round(cx + r * Math.cos(rad)) - Math.floor(t / 2),
        Math.round(cy + r * Math.sin(rad)) - Math.floor(t / 2),
        t,
        t,
        c,
      );
    }
  }
  // Scanline-filled triangle.
  fillTri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      const xs: number[] = [];
      const edges: Array<[number, number, number, number]> = [
        [x0, y0, x1, y1],
        [x1, y1, x2, y2],
        [x2, y2, x0, y0],
      ];
      for (const [ax, ay, bx, by] of edges) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.min(...xs);
        const hi = Math.max(...xs);
        this.fillRect(Math.floor(lo), y, Math.ceil(hi) - Math.floor(lo) + 1, 1, c);
      }
    }
  }
  // -- text ---------------------------------------------------------------
  charWidth(scale: number): number {
    return 6 * scale;
  }
  textWidth(s: string, scale: number): number {
    return s.length * 6 * scale - scale; // no trailing gap
  }
  drawChar(ch: string, x: number, y: number, scale: number, c: RGB): void {
    const g = FONT[ch] ?? FONT['?'];
    for (let row = 0; row < 7; row++) {
      const bits = g[row];
      for (let col = 0; col < 5; col++) {
        if (bits & (1 << (4 - col))) {
          this.fillRect(x + col * scale, y + row * scale, scale, scale, c);
        }
      }
    }
  }
  drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
    let cx = x;
    for (const ch of s.toUpperCase()) {
      this.drawChar(ch, cx, y, scale, c);
      cx += 6 * scale;
    }
  }
  drawTextCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
    const w = this.textWidth(s.toUpperCase(), scale);
    this.drawText(s, Math.round(cx - w / 2), y, scale, c);
  }
  // Word-wrap into lines of at most maxWidth px. Returns the drawn lines.
  drawWrapped(s: string, x: number, y: number, maxWidth: number, scale: number, c: RGB, leading: number): string[] {
    const words = s.toUpperCase().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = '';
    for (const w of words) {
      const next = cur ? cur + ' ' + w : w;
      if (this.textWidth(next, scale) <= maxWidth || !cur) {
        cur = next;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    lines.forEach((ln, i) => this.drawText(ln, x, y + i * leading, scale, c));
    return lines;
  }
}

// ---------------------------------------------------------------------------
// PNG encoder: RGB8, filter 0 per row, one IDAT, no ancillary chunks.
// ---------------------------------------------------------------------------
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(cv.w, 0);
  ihdr.writeUInt32BE(cv.h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(cv.h * (1 + cv.w * 3));
  for (let y = 0; y < cv.h; y++) {
    raw[y * (1 + cv.w * 3)] = 0; // filter: none
    raw.set(cv.px.subarray(y * cv.w * 3, (y + 1) * cv.w * 3), y * (1 + cv.w * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------
const PAPER: RGB = [245, 239, 227];
const INK: RGB = [24, 28, 38];
const NAVY: RGB = [22, 35, 63];
const GOLD: RGB = [217, 164, 65];
const RED: RGB = [192, 57, 43];
const WHITE: RGB = [255, 255, 255];
const CARD: RGB = [255, 255, 255];
const BORDER: RGB = [203, 196, 178];
const GREY: RGB = [92, 96, 110];
const SKY: RGB = [186, 214, 235];
const SEA: RGB = [58, 110, 165];
const TEAL: RGB = [14, 124, 123];
const ORANGE: RGB = [192, 86, 33];
const PURPLE: RGB = [108, 74, 176];
const GREEN: RGB = [46, 125, 50];

// ---------------------------------------------------------------------------
// The news of Tuesday 17 November 2026 (as reported that day).
// ---------------------------------------------------------------------------
interface Story {
  kicker: string;
  color: RGB;
  headline: string[]; // pre-split lines
  summary: string;
}

const HERO: Story = {
  kicker: 'UKRAINE  •  WAR',
  color: RED,
  headline: ['KERCH BRIDGE', 'ARCH FALLS'],
  summary:
    'Ukrainian missiles and drones bring down the road arch of the bridge linking Russia to Crimea. The road is closed; rail runs on one track.',
};

const PANELS: Story[] = [
  {
    kicker: 'MIDDLE EAST  •  CONFLICT',
    color: ORANGE,
    headline: ['TANKERS HIT', 'BY MINES'],
    summary:
      'A fourth tanker hits a mine in the Strait of Hormuz as the US strikes an IRGC launch site.',
  },
  {
    kicker: 'ASIA  •  SECURITY',
    color: TEAL,
    headline: ['JETS', 'SCRAMBLED'],
    summary:
      'Japan scrambles jets as Russian planes enter its airspace. Seoul and Taipei respond.',
  },
  {
    kicker: 'EUROPE  •  JUSTICE',
    color: PURPLE,
    headline: ['DEPARDIEU', 'DROPS APPEAL'],
    summary:
      'Depardieu accepts his conviction for assaulting two women on set. Sentence stands.',
  },
  {
    kicker: 'HEALTH',
    color: GREEN,
    headline: ['MEASLES', 'BACK IN US'],
    summary:
      'The US loses its measles elimination status as the disease becomes endemic again.',
  },
];

const TICKER =
  'ALSO TODAY:  XI, TRUMP AND PUTIN TO MEET THURSDAY IN SHENZHEN  •  HOUTHI ADVANCE IN YEMEN  •  WEST URGES ISRAEL TO OPEN GAZA AID CROSSINGS';

// ---------------------------------------------------------------------------
// Illustrations (simple vector drawings, no images needed)
// ---------------------------------------------------------------------------
function drawBridge(cv: Canvas, x: number, y: number, w: number, h: number): void {
  // sky + sea
  cv.fillRect(x, y, w, h, SKY);
  cv.fillCircle(x + w - 52, y + 34, 20, [255, 214, 120]); // sun
  const seaY = y + h - 52;
  cv.fillRect(x, seaY, w, h - (seaY - y), SEA);
  for (let i = 0; i < 5; i++) {
    cv.line(x + 14 + i * 52, seaY + 16 + (i % 2) * 14, x + 44 + i * 52, seaY + 16 + (i % 2) * 14, WHITE, 2);
  }
  // bridge deck: two segments with a gap in the middle
  const deckY = seaY - 46;
  const gapX0 = x + Math.floor(w * 0.46);
  const gapX1 = x + Math.floor(w * 0.62);
  cv.fillRect(x + 8, deckY, gapX0 - (x + 8), 10, INK);
  cv.fillRect(gapX1, deckY, x + w - 8 - gapX1, 10, INK);
  // supports
  cv.fillRect(x + 30, deckY + 10, 8, seaY - deckY - 10, INK);
  cv.fillRect(x + w - 60, deckY + 10, 8, seaY - deckY - 10, INK);
  // arch over the left segment (arc via short chords)
  const cx = x + Math.floor(w * 0.27);
  const cy = deckY;
  const r = 62;
  let px = cx - r;
  let py = cy;
  for (let a = 180; a <= 360; a += 6) {
    const rad = (a * Math.PI) / 180;
    const nx = Math.round(cx + r * Math.cos(rad));
    const ny = Math.round(cy - Math.abs(r * Math.sin(rad)) * 0.62);
    cv.line(px, py, nx, ny, INK, 4);
    px = nx;
    py = ny;
  }
  // broken arch stub on the right segment
  cv.line(gapX1 + 6, deckY, gapX1 + 26, deckY - 26, INK, 4);
  // debris falling into the gap
  cv.fillRect(gapX0 + 8, deckY + 16, 10, 6, INK);
  cv.fillRect(gapX0 + 26, deckY + 30, 8, 6, INK);
  cv.fillRect(gapX1 - 16, deckY + 22, 8, 6, INK);
  // explosion burst at the gap
  const bx = Math.floor((gapX0 + gapX1) / 2);
  const by = deckY - 8;
  cv.fillCircle(bx, by, 12, [255, 196, 66]);
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    cv.line(bx, by, Math.round(bx + 26 * Math.cos(rad)), Math.round(by + 26 * Math.sin(rad)), [255, 140, 40], 3);
  }
  cv.fillCircle(bx, by, 6, [255, 240, 180]);
}

function drawTankerIcon(cv: Canvas, x: number, y: number, s: number): void {
  // s = box size (square)
  const u = s / 72;
  // sea
  cv.fillRect(x, y + Math.round(52 * u), s, Math.round(20 * u), SEA);
  // hull
  cv.fillTri(x + Math.round(8 * u), y + Math.round(46 * u), x + Math.round(64 * u), y + Math.round(46 * u), x + Math.round(56 * u), y + Math.round(58 * u), INK);
  cv.fillRect(x + Math.round(8 * u), y + Math.round(46 * u), Math.round(48 * u), Math.round(12 * u), INK);
  // containers
  cv.fillRect(x + Math.round(14 * u), y + Math.round(34 * u), Math.round(12 * u), Math.round(12 * u), ORANGE);
  cv.fillRect(x + Math.round(28 * u), y + Math.round(34 * u), Math.round(12 * u), Math.round(12 * u), GOLD);
  cv.fillRect(x + Math.round(42 * u), y + Math.round(38 * u), Math.round(10 * u), Math.round(8 * u), WHITE);
  // mine with spikes
  const mx = x + Math.round(56 * u);
  const my = y + Math.round(18 * u);
  for (let a = 0; a < 360; a += 45) {
    const rad = (a * Math.PI) / 180;
    cv.line(mx, my, Math.round(mx + 12 * u * Math.cos(rad)), Math.round(my + 12 * u * Math.sin(rad)), INK, 2);
  }
  cv.fillCircle(mx, my, Math.round(7 * u), INK);
  // flame
  cv.fillTri(mx - Math.round(8 * u), my - Math.round(14 * u), mx + Math.round(8 * u), my - Math.round(14 * u), mx, my - Math.round(26 * u), [255, 140, 40]);
}

function drawJetIcon(cv: Canvas, x: number, y: number, s: number): void {
  const u = s / 72;
  // clouds
  cv.line(x + Math.round(8 * u), y + Math.round(56 * u), x + Math.round(26 * u), y + Math.round(56 * u), WHITE, 3);
  cv.line(x + Math.round(46 * u), y + Math.round(62 * u), x + Math.round(64 * u), y + Math.round(62 * u), WHITE, 3);
  // delta jet pointing up-right
  cv.fillTri(x + Math.round(36 * u), y + Math.round(8 * u), x + Math.round(14 * u), y + Math.round(52 * u), x + Math.round(36 * u), y + Math.round(40 * u), INK);
  cv.fillTri(x + Math.round(36 * u), y + Math.round(8 * u), x + Math.round(58 * u), y + Math.round(52 * u), x + Math.round(36 * u), y + Math.round(40 * u), INK);
  cv.fillTri(x + Math.round(36 * u), y + Math.round(34 * u), x + Math.round(24 * u), y + Math.round(52 * u), x + Math.round(36 * u), y + Math.round(48 * u), INK);
  cv.fillTri(x + Math.round(36 * u), y + Math.round(34 * u), x + Math.round(48 * u), y + Math.round(52 * u), x + Math.round(36 * u), y + Math.round(48 * u), INK);
  // exhaust
  cv.fillTri(x + Math.round(32 * u), y + Math.round(52 * u), x + Math.round(40 * u), y + Math.round(52 * u), x + Math.round(36 * u), y + Math.round(64 * u), [255, 140, 40]);
}

function drawScalesIcon(cv: Canvas, x: number, y: number, s: number): void {
  const u = s / 72;
  // pillar + beam
  cv.fillRect(x + Math.round(34 * u), y + Math.round(10 * u), Math.round(4 * u), Math.round(52 * u), INK);
  cv.line(x + Math.round(12 * u), y + Math.round(14 * u), x + Math.round(60 * u), y + Math.round(14 * u), INK, 3);
  cv.fillCircle(x + Math.round(36 * u), y + Math.round(10 * u), Math.round(4 * u), INK);
  cv.fillRect(x + Math.round(22 * u), y + Math.round(62 * u), Math.round(28 * u), Math.round(4 * u), INK);
  // left pan
  cv.line(x + Math.round(12 * u), y + Math.round(14 * u), x + Math.round(8 * u), y + Math.round(30 * u), INK, 2);
  cv.line(x + Math.round(12 * u), y + Math.round(14 * u), x + Math.round(16 * u), y + Math.round(30 * u), INK, 2);
  cv.fillTri(x + Math.round(4 * u), y + Math.round(30 * u), x + Math.round(20 * u), y + Math.round(30 * u), x + Math.round(12 * u), y + Math.round(40 * u), GOLD);
  // right pan
  cv.line(x + Math.round(60 * u), y + Math.round(14 * u), x + Math.round(56 * u), y + Math.round(30 * u), INK, 2);
  cv.line(x + Math.round(60 * u), y + Math.round(14 * u), x + Math.round(64 * u), y + Math.round(30 * u), INK, 2);
  cv.fillTri(x + Math.round(52 * u), y + Math.round(30 * u), x + Math.round(68 * u), y + Math.round(30 * u), x + Math.round(60 * u), y + Math.round(40 * u), GOLD);
}

function drawVirusIcon(cv: Canvas, x: number, y: number, s: number): void {
  const u = s / 72;
  const cx = x + Math.round(36 * u);
  const cy = y + Math.round(36 * u);
  // spikes
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    cv.line(
      Math.round(cx + 16 * u * Math.cos(rad)),
      Math.round(cy + 16 * u * Math.sin(rad)),
      Math.round(cx + 26 * u * Math.cos(rad)),
      Math.round(cy + 26 * u * Math.sin(rad)),
      INK,
      3,
    );
    cv.fillCircle(Math.round(cx + 28 * u * Math.cos(rad)), Math.round(cy + 28 * u * Math.sin(rad)), Math.round(3 * u), RED);
  }
  cv.fillCircle(cx, cy, Math.round(17 * u), GREEN);
  cv.fillCircle(cx - Math.round(6 * u), cy - Math.round(5 * u), Math.round(4 * u), WHITE);
  cv.fillCircle(cx + Math.round(6 * u), cy + Math.round(6 * u), Math.round(3 * u), WHITE);
}

const ICONS: Array<(cv: Canvas, x: number, y: number, s: number) => void> = [
  drawTankerIcon,
  drawJetIcon,
  drawScalesIcon,
  drawVirusIcon,
];

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
function draw(): Canvas {
  const W = 1024;
  const H = 1024;
  const cv = new Canvas(W, H, PAPER);

  // ---- masthead -----------------------------------------------------------
  cv.fillRect(0, 0, W, 120, NAVY);
  cv.drawTextCentered('THE WORLD IN ONE PICTURE', W / 2, 18, 2, GOLD);
  cv.drawTextCentered('TUESDAY 17 NOVEMBER 2026', W / 2, 46, 6, WHITE);
  cv.fillRect(212, 102, W - 424, 3, GOLD);

  // ---- hero: Kerch Bridge -------------------------------------------------
  const hx = 24;
  const hy = 132;
  const hw = W - 48;
  const hh = 252;
  cv.fillRect(hx, hy, hw, hh, CARD);
  cv.fillRect(hx, hy, hw, 8, HERO.color);
  // border
  cv.fillRect(hx, hy, hw, 2, BORDER);
  cv.fillRect(hx, hy + hh - 2, hw, 2, BORDER);
  cv.fillRect(hx, hy, 2, hh, BORDER);
  cv.fillRect(hx + hw - 2, hy, 2, hh, BORDER);
  const tx = hx + 24;
  cv.drawText(HERO.kicker, tx, hy + 24, 2, HERO.color);
  let y = hy + 52;
  for (const ln of HERO.headline) {
    cv.drawText(ln, tx, y, 5, INK);
    y += 38;
  }
  y += 6;
  cv.drawWrapped(HERO.summary, tx, y, 580, 3, [52, 56, 68], 22);
  drawBridge(cv, hx + hw - 330, hy + 24, 306, 212);

  // ---- 2x2 grid -----------------------------------------------------------
  const gx = 24;
  const gy = 396;
  const gw = (W - 48 - 16) / 2; // 480
  const gh = 240;
  PANELS.forEach((st, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const px = gx + col * (gw + 16);
    const py = gy + row * (gh + 12);
    cv.fillRect(px, py, gw, gh, CARD);
    cv.fillRect(px, py, gw, 2, BORDER);
    cv.fillRect(px, py + gh - 2, gw, 2, BORDER);
    cv.fillRect(px, py, 2, gh, BORDER);
    cv.fillRect(px + gw - 2, py, 2, gh, BORDER);
    // kicker strip
    cv.fillRect(px, py, gw, 32, st.color);
    cv.drawText(st.kicker, px + 14, py + 9, 2, WHITE);
    // icon box (left)
    const ix = px + 14;
    const iy = py + 46;
    const isz = 76;
    cv.fillRect(ix, iy, isz, isz, [238, 240, 244]);
    cv.fillRect(ix, iy, isz, 2, BORDER);
    cv.fillRect(ix, iy + isz - 2, isz, 2, BORDER);
    cv.fillRect(ix, iy, 2, isz, BORDER);
    cv.fillRect(ix + isz - 2, iy, 2, isz, BORDER);
    ICONS[i](cv, ix + 2, iy + 2, isz - 4);
    // headline + summary (right of icon)
    const txx = ix + isz + 14;
    const tw = px + gw - 16 - txx;
    let yy = py + 48;
    for (const ln of st.headline) {
      cv.drawText(ln, txx, yy, 4, INK);
      yy += 30;
    }
    yy += 8;
    const lines = cv.drawWrapped(st.summary, txx, yy, tw, 3, [52, 56, 68], 21);
    void lines;
  });

  // ---- ticker -------------------------------------------------------------
  const ty = 896;
  cv.fillRect(0, ty, W, 76, NAVY);
  cv.drawText('ALSO TODAY:', 24, ty + 12, 2, GOLD);
  cv.drawWrapped(
    'XI, TRUMP AND PUTIN TO MEET THURSDAY IN SHENZHEN  •  HOUTHI ADVANCE IN YEMEN  •  WEST URGES ISRAEL TO OPEN GAZA AID CROSSINGS',
    24,
    ty + 34,
    W - 48,
    2,
    WHITE,
    16,
  );

  // ---- footer -------------------------------------------------------------
  cv.drawTextCentered('ALL EVENTS REPORTED ON TUESDAY, 17 NOVEMBER 2026', W / 2, 984, 2, GREY);

  return cv;
}

// ---------------------------------------------------------------------------
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const png = encodePNG(draw());
writeFileSync(join(outDir, 'entry.png'), png);
