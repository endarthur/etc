// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Cartridge Codec
// Encode/decode a full cartridge (face + palette + sprites + flags + map + lua)
// to/from a section-based binary format, with optional deflate + base64 for
// QR delivery.
// ─────────────────────────────────────────────────────────────────────────────

import { encodeFace, decodeFace } from '../faceplate/serialize.js';

// ── Binary format ────────────────────────────────────────────────────────────
// Header: 'GD' (2 bytes) + version (1 byte)
// Sections (repeated): id (1 byte) + length (uint16 LE) + data (length bytes)

const MAGIC_0 = 0x47; // 'G'
const MAGIC_1 = 0x44; // 'D'
const VERSION = 1;

const SEC_FACE    = 0x01;
const SEC_PALETTE = 0x02;
const SEC_SPRITES = 0x03;
const SEC_FLAGS   = 0x04;
const SEC_MAP     = 0x05;
const SEC_LUA     = 0x06;

// ── Sprite sheet packing (4-bit) ─────────────────────────────────────────────
// Runtime: 1 byte per pixel (0-15). Packed: 2 pixels per byte (hi | lo nibble).

function packSprites(sheet, count) {
  const ppSprite = 64;  // pixels per sprite (8x8)
  const bpSprite = 32;  // packed bytes per sprite
  const buf = new Uint8Array(count * bpSprite);
  for (let s = 0; s < count; s++) {
    const src = s * ppSprite;
    const dst = s * bpSprite;
    for (let i = 0; i < bpSprite; i++) {
      buf[dst + i] = ((sheet[src + i * 2] & 0x0f) << 4)
                   |  (sheet[src + i * 2 + 1] & 0x0f);
    }
  }
  return buf;
}

function unpackSprites(packed, count) {
  const ppSprite = 64;
  const bpSprite = 32;
  const sheet = new Uint8Array(256 * ppSprite);
  for (let s = 0; s < count; s++) {
    const src = s * bpSprite;
    const dst = s * ppSprite;
    for (let i = 0; i < bpSprite; i++) {
      const byte = packed[src + i];
      sheet[dst + i * 2]     = (byte >> 4) & 0x0f;
      sheet[dst + i * 2 + 1] = byte & 0x0f;
    }
  }
  return sheet;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function lastUsedSprite(sheet) {
  for (let s = 255; s >= 0; s--) {
    const base = s * 64;
    for (let i = 0; i < 64; i++) {
      if (sheet[base + i] !== 0) return s;
    }
  }
  return -1;
}

function lastUsedFlag(flags) {
  for (let i = 255; i >= 0; i--) {
    if (flags[i] !== 0) return i;
  }
  return -1;
}

function hasData(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== 0) return true;
  }
  return false;
}

// ── Encode (binary) ──────────────────────────────────────────────────────────

export function encodeCart(cart) {
  const sections = [];

  // Face spec (required)
  sections.push({ id: SEC_FACE, data: encodeFace(cart.face) });

  // Palette (optional — only if provided)
  if (cart.palette) {
    const buf = new Uint8Array(48);
    for (let i = 0; i < 16; i++) {
      const c = cart.palette[i] || 0;
      buf[i * 3]     = (c >> 16) & 0xff;
      buf[i * 3 + 1] = (c >> 8) & 0xff;
      buf[i * 3 + 2] = c & 0xff;
    }
    sections.push({ id: SEC_PALETTE, data: buf });
  }

  // Sprites (optional — trimmed to last non-empty)
  if (cart.sprSheet) {
    const last = lastUsedSprite(cart.sprSheet);
    if (last >= 0) {
      const count = last + 1;
      const packed = packSprites(cart.sprSheet, count);
      const buf = new Uint8Array(2 + packed.length);
      buf[0] = count & 0xff;
      buf[1] = (count >> 8) & 0xff;
      buf.set(packed, 2);
      sections.push({ id: SEC_SPRITES, data: buf });
    }
  }

  // Sprite flags (optional — trimmed to last non-zero)
  if (cart.sprFlags) {
    const last = lastUsedFlag(cart.sprFlags);
    if (last >= 0) {
      const count = last + 1;
      const buf = new Uint8Array(1 + count);
      buf[0] = count;
      buf.set(cart.sprFlags.subarray(0, count), 1);
      sections.push({ id: SEC_FLAGS, data: buf });
    }
  }

  // Map (optional — only if has non-zero tiles)
  if (cart.map && cart.map.data && hasData(cart.map.data)) {
    const buf = new Uint8Array(2 + cart.map.data.length);
    buf[0] = cart.map.w & 0xff;
    buf[1] = cart.map.h & 0xff;
    buf.set(cart.map.data, 2);
    sections.push({ id: SEC_MAP, data: buf });
  }

  // Lua code (required)
  sections.push({ id: SEC_LUA, data: new TextEncoder().encode(cart.lua) });

  // Assemble
  let totalSize = 3;
  for (const s of sections) totalSize += 3 + s.data.length;

  const out = new Uint8Array(totalSize);
  out[0] = MAGIC_0; out[1] = MAGIC_1; out[2] = VERSION;

  let off = 3;
  for (const s of sections) {
    out[off]     = s.id;
    out[off + 1] = s.data.length & 0xff;
    out[off + 2] = (s.data.length >> 8) & 0xff;
    out.set(s.data, off + 3);
    off += 3 + s.data.length;
  }

  return out;
}

// ── Decode (binary) ──────────────────────────────────────────────────────────

export function decodeCart(bytes) {
  if (!bytes || bytes.length < 3) return null;
  if (bytes[0] !== MAGIC_0 || bytes[1] !== MAGIC_1) return null;
  if (bytes[2] !== VERSION) return null;

  const cart = {
    face: null,
    palette: null,
    sprSheet: null,
    sprFlags: null,
    map: null,
    lua: '',
  };

  let off = 3;
  while (off + 2 < bytes.length) {
    const id  = bytes[off];
    const len = bytes[off + 1] | (bytes[off + 2] << 8);
    const data = bytes.subarray(off + 3, off + 3 + len);
    off += 3 + len;

    switch (id) {
      case SEC_FACE: {
        const { spec } = decodeFace(data, 0);
        cart.face = spec;
        break;
      }
      case SEC_PALETTE: {
        cart.palette = new Array(16);
        for (let i = 0; i < 16; i++) {
          cart.palette[i] = (data[i * 3] << 16) | (data[i * 3 + 1] << 8) | data[i * 3 + 2];
        }
        break;
      }
      case SEC_SPRITES: {
        const count = data[0] | (data[1] << 8);
        cart.sprSheet = unpackSprites(data.subarray(2), count);
        break;
      }
      case SEC_FLAGS: {
        const count = data[0];
        cart.sprFlags = new Uint8Array(256);
        cart.sprFlags.set(data.subarray(1, 1 + count));
        break;
      }
      case SEC_MAP: {
        const w = data[0], h = data[1];
        cart.map = { w, h, data: new Uint8Array(data.subarray(2, 2 + w * h)) };
        break;
      }
      case SEC_LUA: {
        cart.lua = new TextDecoder().decode(data);
        break;
      }
    }
  }

  return cart;
}

// ── Compression + Base64 ─────────────────────────────────────────────────────

function toBase64(bytes) {
  if (typeof Buffer !== 'undefined') return Buffer.from(bytes).toString('base64');
  let str = '';
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

function fromBase64(str) {
  if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(str, 'base64'));
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function streamPipe(data, transform) {
  const writer = transform.writable.getWriter();
  writer.write(data);
  writer.close();
  const reader = transform.readable.getReader();
  const chunks = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const result = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { result.set(c, pos); pos += c.length; }
  return result;
}

async function deflate(data) {
  return streamPipe(data, new CompressionStream('deflate'));
}

async function inflate(data) {
  return streamPipe(data, new DecompressionStream('deflate'));
}

// ── Metadata comment ─────────────────────────────────────────────────────────
// Prepended as text before the base64 payload so scanners can read
// screen type / title / author without decompressing.

export function encodeMeta(meta) {
  if (!meta) return '';
  const parts = [];
  if (meta.screen) parts.push('screen:' + meta.screen);
  if (meta.title)  parts.push('title:' + meta.title);
  if (meta.author) parts.push('author:' + meta.author);
  if (meta.desc)   parts.push('desc:' + meta.desc);
  if (parts.length === 0) return '';
  return '<!-- geode ' + parts.join('; ') + ' -->\n';
}

export function decodeMeta(str) {
  const match = str.match(/^<!--\s*geode\s+(.*?)\s*-->\n?/);
  if (!match) return { meta: null, payload: str };
  const meta = {};
  for (const part of match[1].split(';')) {
    const idx = part.indexOf(':');
    if (idx > 0) {
      meta[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
    }
  }
  return { meta, payload: str.slice(match[0].length) };
}

// ── Pack / Unpack (full pipeline) ────────────────────────────────────────────

export async function packCart(cart, meta) {
  const binary = encodeCart(cart);
  const compressed = await deflate(binary);
  return encodeMeta(meta) + toBase64(compressed);
}

export async function unpackCart(str) {
  const { meta, payload } = decodeMeta(str);
  const compressed = fromBase64(payload);
  const binary = await inflate(compressed);
  const cart = decodeCart(binary);
  return { cart, meta };
}
