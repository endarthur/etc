// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Face Serialization
// Encode/decode a faceplate spec (screen + rotation + shell color + controls)
// to/from a compact binary format for cartridge embedding.
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_SCREEN } from './screens.js';
import {
  CTRL_TYPES, CTRL_IDS, CTRL_SIZES,
  CTRL_TYPES_REV, CTRL_IDS_REV, CTRL_SIZES_REV,
} from './controls.js';

// ── Screen ID ↔ byte enum ────────────────────────────────────────────────────
const SCREEN_LIST = [
  'SSD1306', 'SSD1306L', 'ST7735s', 'ST7735r',
  'ST7789sq', 'ST7789t', 'GC9A01', 'ILI9341',
];
export const SCREEN_ENUM = {};
export const SCREEN_ENUM_REV = {};
SCREEN_LIST.forEach((id, i) => {
  SCREEN_ENUM[id] = i + 1;
  SCREEN_ENUM_REV[i + 1] = id;
});

// ── Rotation ↔ byte ──────────────────────────────────────────────────────────
const ROT_MAP     = { 0: 0, 90: 1, 180: 2, 270: 3 };
const ROT_MAP_REV = { 0: 0, 1: 90, 2: 180, 3: 270 };

// ── Encode ───────────────────────────────────────────────────────────────────
// Binary layout:
//   [0]     screen enum (1 byte)
//   [1]     rotation (0-3)
//   [2-4]   shell color RGB
//   [5]     component count
//   per component (7 bytes):
//     [0]   type enum
//     [1]   id/label enum
//     [2-3] x (uint16 LE)
//     [4-5] y (uint16 LE)
//     [6]   size variant

export function encodeFace(spec) {
  const screenByte = SCREEN_ENUM[spec.screen] || SCREEN_ENUM[DEFAULT_SCREEN];
  const rotByte = ROT_MAP[spec.rotation || 0] || 0;
  const shell = spec.shellColor || [40, 40, 40];
  const comps = spec.components || [];

  const buf = new Uint8Array(6 + comps.length * 7);
  buf[0] = screenByte;
  buf[1] = rotByte;
  buf[2] = shell[0]; buf[3] = shell[1]; buf[4] = shell[2];
  buf[5] = comps.length;

  let off = 6;
  for (const c of comps) {
    buf[off]     = CTRL_TYPES[c.type] || 0;
    buf[off + 1] = CTRL_IDS[c.id] || 0;
    buf[off + 2] = c.x & 0xff;
    buf[off + 3] = (c.x >> 8) & 0xff;
    buf[off + 4] = c.y & 0xff;
    buf[off + 5] = (c.y >> 8) & 0xff;
    buf[off + 6] = CTRL_SIZES[c.size] != null ? CTRL_SIZES[c.size] : CTRL_SIZES.md;
    off += 7;
  }

  return buf;
}

// ── Decode ───────────────────────────────────────────────────────────────────

export function decodeFace(bytes, offset) {
  offset = offset || 0;

  const count = bytes[offset + 5];
  const components = [];
  let pos = offset + 6;
  for (let i = 0; i < count; i++) {
    components.push({
      type: CTRL_TYPES_REV[bytes[pos]]     || 'button',
      id:   CTRL_IDS_REV[bytes[pos + 1]]   || 'a',
      x: bytes[pos + 2] | (bytes[pos + 3] << 8),
      y: bytes[pos + 4] | (bytes[pos + 5] << 8),
      size: CTRL_SIZES_REV[bytes[pos + 6]] || 'md',
    });
    pos += 7;
  }

  return {
    spec: {
      screen:     SCREEN_ENUM_REV[bytes[offset]] || DEFAULT_SCREEN,
      rotation:   ROT_MAP_REV[bytes[offset + 1]] || 0,
      shellColor: [bytes[offset + 2], bytes[offset + 3], bytes[offset + 4]],
      components,
    },
    bytesRead: pos - offset,
  };
}
