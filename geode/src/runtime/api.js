// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Runtime API
// Drawing, input, math, palette, font — everything the Lua game code calls.
// ─────────────────────────────────────────────────────────────────────────────

// ── Sweetie-16 palette (CC0 public domain) ──────────────────────────────────
// https://lospec.com/palette-list/sweetie-16
export const PALETTE = [
  0x1a1c2c, // 0  black
  0x5d275d, // 1  dark purple
  0xb13e53, // 2  dark red
  0xef7d57, // 3  orange
  0xffcd75, // 4  yellow
  0xa7f070, // 5  light green
  0x38b764, // 6  green
  0x257179, // 7  dark teal
  0x29366f, // 8  dark blue
  0x3b5dc9, // 9  blue
  0x41a6f6, // 10 light blue
  0x73eff7, // 11 cyan
  0xf4f4f4, // 12 white
  0x94b0c2, // 13 light gray
  0x566c86, // 14 gray
  0x333c57, // 15 dark gray
];

// ── 5x7 pixel font ─────────────────────────────────────────────────────────
// Covers printable ASCII 0x20..0x7E (space..tilde). Each char is 5 wide,
// 7 tall, packed as 5 bytes (one per column, LSB = top row).
// Glyph spacing: 1px between chars → 6px per character cell.
export const FONT_W = 5, FONT_H = 7, FONT_SPACE = 1;
export const FONT = [
  // space ! " # $ % & ' ( ) * + , - . /
  [0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x5f,0x00,0x00],[0x00,0x07,0x00,0x07,0x00],
  [0x14,0x7f,0x14,0x7f,0x14],[0x24,0x2a,0x7f,0x2a,0x12],[0x23,0x13,0x08,0x64,0x62],
  [0x36,0x49,0x55,0x22,0x50],[0x00,0x00,0x07,0x00,0x00],[0x00,0x1c,0x22,0x41,0x00],
  [0x00,0x41,0x22,0x1c,0x00],[0x14,0x08,0x3e,0x08,0x14],[0x08,0x08,0x3e,0x08,0x08],
  [0x00,0x50,0x30,0x00,0x00],[0x08,0x08,0x08,0x08,0x08],[0x00,0x60,0x60,0x00,0x00],
  [0x20,0x10,0x08,0x04,0x02],
  // 0-9
  [0x3e,0x51,0x49,0x45,0x3e],[0x00,0x42,0x7f,0x40,0x00],[0x42,0x61,0x51,0x49,0x46],
  [0x21,0x41,0x45,0x4b,0x31],[0x18,0x14,0x12,0x7f,0x10],[0x27,0x45,0x45,0x45,0x39],
  [0x3c,0x4a,0x49,0x49,0x30],[0x01,0x71,0x09,0x05,0x03],[0x36,0x49,0x49,0x49,0x36],
  [0x06,0x49,0x49,0x29,0x1e],
  // : ; < = > ? @
  [0x00,0x36,0x36,0x00,0x00],[0x00,0x56,0x36,0x00,0x00],[0x08,0x14,0x22,0x41,0x00],
  [0x14,0x14,0x14,0x14,0x14],[0x00,0x41,0x22,0x14,0x08],[0x02,0x01,0x51,0x09,0x06],
  [0x3e,0x41,0x5d,0x55,0x1e],
  // A-Z
  [0x7e,0x09,0x09,0x09,0x7e],[0x7f,0x49,0x49,0x49,0x36],[0x3e,0x41,0x41,0x41,0x22],
  [0x7f,0x41,0x41,0x22,0x1c],[0x7f,0x49,0x49,0x49,0x41],[0x7f,0x09,0x09,0x09,0x01],
  [0x3e,0x41,0x49,0x49,0x7a],[0x7f,0x08,0x08,0x08,0x7f],[0x00,0x41,0x7f,0x41,0x00],
  [0x20,0x40,0x41,0x3f,0x01],[0x7f,0x08,0x14,0x22,0x41],[0x7f,0x40,0x40,0x40,0x40],
  [0x7f,0x02,0x0c,0x02,0x7f],[0x7f,0x04,0x08,0x10,0x7f],[0x3e,0x41,0x41,0x41,0x3e],
  [0x7f,0x09,0x09,0x09,0x06],[0x3e,0x41,0x51,0x21,0x5e],[0x7f,0x09,0x19,0x29,0x46],
  [0x26,0x49,0x49,0x49,0x32],[0x01,0x01,0x7f,0x01,0x01],[0x3f,0x40,0x40,0x40,0x3f],
  [0x1f,0x20,0x40,0x20,0x1f],[0x3f,0x40,0x38,0x40,0x3f],[0x63,0x14,0x08,0x14,0x63],
  [0x07,0x08,0x70,0x08,0x07],[0x61,0x51,0x49,0x45,0x43],
  // [ \ ] ^ _ `
  [0x00,0x7f,0x41,0x41,0x00],[0x02,0x04,0x08,0x10,0x20],[0x00,0x41,0x41,0x7f,0x00],
  [0x04,0x02,0x01,0x02,0x04],[0x40,0x40,0x40,0x40,0x40],[0x00,0x01,0x02,0x04,0x00],
  // a-z
  [0x20,0x54,0x54,0x54,0x78],[0x7f,0x48,0x44,0x44,0x38],[0x38,0x44,0x44,0x44,0x20],
  [0x38,0x44,0x44,0x48,0x7f],[0x38,0x54,0x54,0x54,0x18],[0x08,0x7e,0x09,0x01,0x02],
  [0x0c,0x52,0x52,0x52,0x3e],[0x7f,0x08,0x04,0x04,0x78],[0x00,0x44,0x7d,0x40,0x00],
  [0x20,0x40,0x44,0x3d,0x00],[0x7f,0x10,0x28,0x44,0x00],[0x00,0x41,0x7f,0x40,0x00],
  [0x7c,0x04,0x18,0x04,0x78],[0x7c,0x08,0x04,0x04,0x78],[0x38,0x44,0x44,0x44,0x38],
  [0x7c,0x14,0x14,0x14,0x08],[0x08,0x14,0x14,0x18,0x7c],[0x7c,0x08,0x04,0x04,0x08],
  [0x48,0x54,0x54,0x54,0x20],[0x04,0x3f,0x44,0x40,0x20],[0x3c,0x40,0x40,0x20,0x7c],
  [0x1c,0x20,0x40,0x20,0x1c],[0x3c,0x40,0x30,0x40,0x3c],[0x44,0x28,0x10,0x28,0x44],
  [0x0c,0x50,0x50,0x50,0x3c],[0x44,0x64,0x54,0x4c,0x44],
  // { | } ~
  [0x00,0x08,0x36,0x41,0x00],[0x00,0x00,0x7f,0x00,0x00],[0x00,0x41,0x36,0x08,0x00],
  [0x08,0x04,0x08,0x10,0x08],
];

// ── Color resolution ────────────────────────────────────────────────────────
export let penColor = 12; // default: white

export function resolveColor(c) {
  if (c === undefined || c === null) return resolveRGB(penColor);
  return resolveRGB(c);
}

export function resolveRGB(c) {
  if (c >= 0 && c <= 15) {
    const hex = PALETTE[c];
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
  }
  if (c > 255) {
    return [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff];
  }
  // fallback: palette 0
  const hex = PALETTE[0];
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

// ── Pixel buffer ────────────────────────────────────────────────────────────
// Graphics context — set by initGfx, used by all drawing functions.
let _W = 0, _H = 0;
let _buf = null;
let _ctx = null;
let _imgData = null;

export const screenInfo = { w: 0, h: 0, name: 'ST7789sq', shape: 'rect', color: '65k' };

export function initGfx(canvas, w, h, screenData) {
  _W = w; _H = h;
  _ctx = canvas.getContext('2d');
  _imgData = _ctx.createImageData(w, h);
  _buf = _imgData.data;
  screenInfo.w = w;
  screenInfo.h = h;
  if (screenData) {
    screenInfo.name = screenData.id;
    screenInfo.shape = screenData.shape;
    screenInfo.color = screenData.color;
  }
  // Precompute mono/round state
  _mono = screenInfo.color === 'mono';
  _round = screenInfo.shape === 'round';
  if (_round) {
    _cx = (w - 1) / 2;
    _cy = (h - 1) / 2;
    const rad = Math.min(w, h) / 2;
    _rSq = rad * rad;
  }
  return { ctx: _ctx, imgData: _imgData, buf: _buf, w: _W, h: _H };
}

export function flushGfx() {
  _ctx.putImageData(_imgData, 0, 0);
}

// Mono luminance threshold + round screen clipping helpers.
// Precomputed on initGfx to keep setPixel fast.
let _mono = false;
let _round = false;
let _cx = 0, _cy = 0, _rSq = 0;

function monoRGB(r, g, b) {
  // ITU BT.601 luminance, threshold at 50%
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  return lum >= 128 ? 255 : 0;
}

function setPixel(x, y, r, g, b) {
  x = x | 0; y = y | 0;
  if (x < 0 || x >= _W || y < 0 || y >= _H) return;
  if (_round) {
    const dx = x - _cx, dy = y - _cy;
    if (dx * dx + dy * dy > _rSq) return;
  }
  if (_mono) {
    const v = monoRGB(r, g, b);
    r = v; g = v; b = v;
  }
  const i = (y * _W + x) * 4;
  _buf[i] = r; _buf[i+1] = g; _buf[i+2] = b; _buf[i+3] = 255;
}

// ── Drawing API ─────────────────────────────────────────────────────────────
export function api_cls(c) {
  let [r, g, b] = resolveColor(c !== undefined ? c : 0);
  if (_mono) { const v = monoRGB(r, g, b); r = v; g = v; b = v; }
  for (let i = 0; i < _buf.length; i += 4) {
    _buf[i] = r; _buf[i+1] = g; _buf[i+2] = b; _buf[i+3] = 255;
  }
}

export function api_color(c) {
  if (c !== undefined && c !== null) penColor = c;
}

export function api_pix(x, y, c) {
  const [r, g, b] = resolveColor(c);
  setPixel(x, y, r, g, b);
}

export function api_line(x1, y1, x2, y2, c) {
  const [r, g, b] = resolveColor(c);
  x1 = Math.round(x1); y1 = Math.round(y1);
  x2 = Math.round(x2); y2 = Math.round(y2);
  let dx = Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1;
  let dy = -Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPixel(x1, y1, r, g, b);
    if (x1 === x2 && y1 === y2) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x1 += sx; }
    if (e2 <= dx) { err += dx; y1 += sy; }
  }
}

export function api_rect(x, y, w, h, c) {
  const [r, g, b] = resolveColor(c);
  x = Math.round(x); y = Math.round(y);
  w = Math.round(w); h = Math.round(h);
  for (let i = 0; i < w; i++) {
    setPixel(x + i, y, r, g, b);
    setPixel(x + i, y + h - 1, r, g, b);
  }
  for (let j = 0; j < h; j++) {
    setPixel(x, y + j, r, g, b);
    setPixel(x + w - 1, y + j, r, g, b);
  }
}

export function api_rectfill(x, y, w, h, c) {
  const [r, g, b] = resolveColor(c);
  x = Math.round(x); y = Math.round(y);
  w = Math.round(w); h = Math.round(h);
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      setPixel(x + i, y + j, r, g, b);
    }
  }
}

export function api_circ(cx, cy, rad, c) {
  const [r, g, b] = resolveColor(c);
  cx = Math.round(cx); cy = Math.round(cy); rad = Math.round(rad);
  let x = rad, y = 0, err = 1 - rad;
  while (x >= y) {
    setPixel(cx + x, cy + y, r, g, b);
    setPixel(cx + y, cy + x, r, g, b);
    setPixel(cx - y, cy + x, r, g, b);
    setPixel(cx - x, cy + y, r, g, b);
    setPixel(cx - x, cy - y, r, g, b);
    setPixel(cx - y, cy - x, r, g, b);
    setPixel(cx + y, cy - x, r, g, b);
    setPixel(cx + x, cy - y, r, g, b);
    y++;
    if (err < 0) {
      err += 2 * y + 1;
    } else {
      x--;
      err += 2 * (y - x) + 1;
    }
  }
}

export function api_circfill(cx, cy, rad, c) {
  const [r, g, b] = resolveColor(c);
  cx = Math.round(cx); cy = Math.round(cy); rad = Math.round(rad);
  let x = rad, y = 0, err = 1 - rad;
  function hline(lx, rx, py) {
    for (let i = lx; i <= rx; i++) setPixel(i, py, r, g, b);
  }
  while (x >= y) {
    hline(cx - x, cx + x, cy + y);
    hline(cx - x, cx + x, cy - y);
    hline(cx - y, cx + y, cy + x);
    hline(cx - y, cx + y, cy - x);
    y++;
    if (err < 0) {
      err += 2 * y + 1;
    } else {
      x--;
      err += 2 * (y - x) + 1;
    }
  }
}

export function api_tri(x1, y1, x2, y2, x3, y3, c) {
  api_line(x1, y1, x2, y2, c);
  api_line(x2, y2, x3, y3, c);
  api_line(x3, y3, x1, y1, c);
}

export function api_trifill(x1, y1, x2, y2, x3, y3, c) {
  const [r, g, b] = resolveColor(c);
  let verts = [{x: Math.round(x1), y: Math.round(y1)},
               {x: Math.round(x2), y: Math.round(y2)},
               {x: Math.round(x3), y: Math.round(y3)}];
  verts.sort((a, b) => a.y - b.y);
  const [v0, v1, v2] = verts;
  // Upper half
  for (let y = v0.y; y <= v1.y; y++) {
    const dy01 = v1.y - v0.y || 1;
    const dy02 = v2.y - v0.y || 1;
    const t1 = (y - v0.y) / dy01;
    const t2 = (y - v0.y) / dy02;
    let lx = Math.round(v0.x + t1 * (v1.x - v0.x));
    let rx = Math.round(v0.x + t2 * (v2.x - v0.x));
    if (lx > rx) { let tmp = lx; lx = rx; rx = tmp; }
    for (let x = lx; x <= rx; x++) setPixel(x, y, r, g, b);
  }
  // Lower half
  for (let y = v1.y + 1; y <= v2.y; y++) {
    const dy12 = v2.y - v1.y || 1;
    const dy02 = v2.y - v0.y || 1;
    const t1 = (y - v1.y) / dy12;
    const t2 = (y - v0.y) / dy02;
    let lx = Math.round(v1.x + t1 * (v2.x - v1.x));
    let rx = Math.round(v0.x + t2 * (v2.x - v0.x));
    if (lx > rx) { let tmp = lx; lx = rx; rx = tmp; }
    for (let x = lx; x <= rx; x++) setPixel(x, y, r, g, b);
  }
}

// ── Text ────────────────────────────────────────────────────────────────────
export function api_print(text, x, y, c) {
  if (text === undefined || text === null) return;
  text = String(text);
  const [r, g, b] = resolveColor(c);
  x = Math.round(x || 0);
  y = Math.round(y || 0);
  for (let ci = 0; ci < text.length; ci++) {
    const code = text.charCodeAt(ci) - 0x20;
    if (code < 0 || code >= FONT.length) { x += FONT_W + FONT_SPACE; continue; }
    const glyph = FONT[code];
    for (let col = 0; col < FONT_W; col++) {
      const bits = glyph[col];
      for (let row = 0; row < FONT_H; row++) {
        if (bits & (1 << row)) {
          setPixel(x + col, y + row, r, g, b);
        }
      }
    }
    x += FONT_W + FONT_SPACE;
  }
}

// ── Sprites ──────────────────────────────────────────────────────────────────
// 16x16 grid of 8x8 sprites = 256 sprites, byte-per-pixel (palette index).
// Color index 0 is transparent when drawing sprites.
const SPR_SIZE = 8;
const SHEET_COLS = 16;
const MAX_SPRITES = 256;

export const sprSheet = new Uint8Array(MAX_SPRITES * SPR_SIZE * SPR_SIZE);
export const sprFlags = new Uint8Array(MAX_SPRITES);

export function api_spr(n, x, y, flip_x, flip_y) {
  n = n | 0;
  if (n < 0 || n >= MAX_SPRITES) return;
  x = Math.round(x); y = Math.round(y);
  const base = n * SPR_SIZE * SPR_SIZE;
  for (let py = 0; py < SPR_SIZE; py++) {
    for (let px = 0; px < SPR_SIZE; px++) {
      const sx = flip_x ? (SPR_SIZE - 1 - px) : px;
      const sy = flip_y ? (SPR_SIZE - 1 - py) : py;
      const ci = sprSheet[base + sy * SPR_SIZE + sx];
      if (ci === 0) continue;
      const [r, g, b] = resolveRGB(ci);
      setPixel(x + px, y + py, r, g, b);
    }
  }
}

export function api_sspr(n, x, y, sw, sh) {
  n = n | 0; sw = sw | 0; sh = sh | 0;
  if (sw <= 0 || sh <= 0) return;
  const col0 = n % SHEET_COLS;
  const row0 = (n / SHEET_COLS) | 0;
  x = Math.round(x); y = Math.round(y);
  for (let sr = 0; sr < sh; sr++) {
    for (let sc = 0; sc < sw; sc++) {
      const col = col0 + sc;
      const row = row0 + sr;
      if (col >= SHEET_COLS || row >= (MAX_SPRITES / SHEET_COLS)) continue;
      const sn = row * SHEET_COLS + col;
      const base = sn * SPR_SIZE * SPR_SIZE;
      const dx = x + sc * SPR_SIZE;
      const dy = y + sr * SPR_SIZE;
      for (let py = 0; py < SPR_SIZE; py++) {
        for (let px = 0; px < SPR_SIZE; px++) {
          const ci = sprSheet[base + py * SPR_SIZE + px];
          if (ci === 0) continue;
          const [r, g, b] = resolveRGB(ci);
          setPixel(dx + px, dy + py, r, g, b);
        }
      }
    }
  }
}

export function api_fget(n, flag) {
  n = n | 0;
  if (n < 0 || n >= MAX_SPRITES) return false;
  if (flag === undefined || flag === null) return sprFlags[n];
  return !!(sprFlags[n] & (1 << (flag & 7)));
}

export function api_fset(n, flag, v) {
  n = n | 0;
  if (n < 0 || n >= MAX_SPRITES) return;
  if (v === undefined || v === null) {
    // fset(n, byte) — set entire flag byte
    sprFlags[n] = flag & 0xff;
  } else {
    // fset(n, bit, bool) — set/clear individual bit
    if (v) sprFlags[n] |= (1 << (flag & 7));
    else   sprFlags[n] &= ~(1 << (flag & 7));
  }
}

// ── Tilemap ──────────────────────────────────────────────────────────────────
// 2D grid of sprite indices (1 byte each). Default 128x64 tiles.
let _mapW = 128, _mapH = 64;
let _mapData = new Uint8Array(_mapW * _mapH);

export function initMap(w, h, data) {
  _mapW = w; _mapH = h;
  _mapData = data ? new Uint8Array(data) : new Uint8Array(w * h);
}

export function api_mget(mx, my) {
  mx = mx | 0; my = my | 0;
  if (mx < 0 || mx >= _mapW || my < 0 || my >= _mapH) return 0;
  return _mapData[my * _mapW + mx];
}

export function api_mset(mx, my, n) {
  mx = mx | 0; my = my | 0;
  if (mx < 0 || mx >= _mapW || my < 0 || my >= _mapH) return;
  _mapData[my * _mapW + mx] = n & 0xff;
}

export function api_map(mx, my, mw, mh, dx, dy) {
  mx = mx | 0; my = my | 0;
  mw = mw | 0; mh = mh | 0;
  dx = Math.round(dx); dy = Math.round(dy);
  for (let ty = 0; ty < mh; ty++) {
    for (let tx = 0; tx < mw; tx++) {
      const tmx = mx + tx, tmy = my + ty;
      if (tmx < 0 || tmx >= _mapW || tmy < 0 || tmy >= _mapH) continue;
      const sn = _mapData[tmy * _mapW + tmx];
      if (sn === 0) continue;
      // Inline sprite draw for speed (no flip)
      const base = sn * SPR_SIZE * SPR_SIZE;
      const sx = dx + tx * SPR_SIZE;
      const sy = dy + ty * SPR_SIZE;
      for (let py = 0; py < SPR_SIZE; py++) {
        for (let px = 0; px < SPR_SIZE; px++) {
          const ci = sprSheet[base + py * SPR_SIZE + px];
          if (ci === 0) continue;
          const [r, g, b] = resolveRGB(ci);
          setPixel(sx + px, sy + py, r, g, b);
        }
      }
    }
  }
}

// ── Input ───────────────────────────────────────────────────────────────────
// Two independent layers merged with OR so that releasing touch
// doesn't cancel a held keyboard key (and vice versa).
const kbKeys = {};
const touchKeys = {};
const keys = {};
const keysPressed = {};
const keysPrev = {};

function mergeKey(id) {
  keys[id] = !!(kbKeys[id] || touchKeys[id]);
}

const KEY_MAP = {
  'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
  'z': 'a', 'Z': 'a', ' ': 'a',
  'x': 'b', 'X': 'b',
  'Enter': 'start',
  'Shift': 'select',
};

document.addEventListener('keydown', (e) => {
  const mapped = KEY_MAP[e.key];
  if (mapped) { kbKeys[mapped] = true; mergeKey(mapped); e.preventDefault(); }
});
document.addEventListener('keyup', (e) => {
  const mapped = KEY_MAP[e.key];
  if (mapped) { kbKeys[mapped] = false; mergeKey(mapped); e.preventDefault(); }
});

export function setKey(id, pressed) {
  touchKeys[id] = !!pressed;
  mergeKey(id);
}

export function tickInput() {
  for (const k in keys) {
    keysPressed[k] = keys[k] && !keysPrev[k];
    keysPrev[k] = keys[k];
  }
}

export function api_btn(id) {
  return !!keys[id];
}

export function api_btnp(id) {
  return !!keysPressed[id];
}

export function api_dpad() {
  let dx = 0, dy = 0;
  if (keys['left'])  dx -= 1;
  if (keys['right']) dx += 1;
  if (keys['up'])    dy -= 1;
  if (keys['down'])  dy += 1;
  return [dx, dy];
}

export function api_stick() {
  return [0, 0];
}

// ── Math aliases ────────────────────────────────────────────────────────────
export function api_rnd(n) {
  return Math.random() * (n === undefined ? 1 : n);
}
export function api_flr(x) { return Math.floor(x); }
export function api_ceil(x) { return Math.ceil(x); }
export function api_abs(x) { return Math.abs(x); }
export function api_sin(x) { return Math.sin(x); }
export function api_cos(x) { return Math.cos(x); }
export function api_atan2(y, x) { return Math.atan2(y, x); }
export function api_min(a, b) { return Math.min(a, b); }
export function api_max(a, b) { return Math.max(a, b); }
export function api_mid(a, b, c) {
  if (a > b) { let t = a; a = b; b = t; }
  if (b > c) { b = c; }
  if (a > b) { b = a; }
  return b;
}
export function api_sgn(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; }
