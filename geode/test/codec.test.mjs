// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Cartridge codec tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const {
  encodeCart, decodeCart,
  encodeMeta, decodeMeta,
  packCart, unpackCart,
} = await import('../src/cartridge/codec.js');

// ── Helpers ──────────────────────────────────────────────────────────────────

function minimalCart() {
  return {
    face: { screen: 'ST7789sq', rotation: 0, shellColor: [40, 40, 40], components: [] },
    lua: 'function _draw() cls(0) end',
  };
}

function fullCart() {
  const sprSheet = new Uint8Array(256 * 64);
  // Paint sprite 0: checkerboard of palette 1 and 2
  for (let i = 0; i < 64; i++) sprSheet[i] = (i % 2 === 0) ? 1 : 2;
  // Paint sprite 5: all palette 7
  for (let i = 0; i < 64; i++) sprSheet[5 * 64 + i] = 7;

  const sprFlags = new Uint8Array(256);
  sprFlags[0] = 0b00000001; // solid
  sprFlags[5] = 0b00000100; // collectible

  const mapW = 4, mapH = 4;
  const mapData = new Uint8Array(mapW * mapH);
  mapData[0] = 5; mapData[3] = 1;

  return {
    face: {
      screen: 'GC9A01',
      rotation: 90,
      shellColor: [20, 20, 20],
      components: [
        { type: 'dpad', id: 'dpad', x: 10, y: 50, size: 'lg' },
        { type: 'button', id: 'a', x: 200, y: 100, size: 'md' },
      ],
    },
    palette: [
      0x1a1c2c, 0x5d275d, 0xb13e53, 0xef7d57,
      0xffcd75, 0xa7f070, 0x38b764, 0x257179,
      0x29366f, 0x3b5dc9, 0x41a6f6, 0x73eff7,
      0xf4f4f4, 0x94b0c2, 0x566c86, 0x333c57,
    ],
    sprSheet,
    sprFlags,
    map: { w: mapW, h: mapH, data: mapData },
    lua: 'function _init()\n  x = 0\nend\nfunction _draw()\n  cls(0)\n  spr(0, x, 0)\nend',
  };
}

// ── Binary encode/decode ────────────────────────────────────────────────────

describe('encodeCart / decodeCart', () => {
  it('round-trips a minimal cart (face + lua only)', () => {
    const cart = minimalCart();
    const bytes = encodeCart(cart);
    // Check magic header
    assert.equal(bytes[0], 0x47); // 'G'
    assert.equal(bytes[1], 0x44); // 'D'
    assert.equal(bytes[2], 1);    // version

    const decoded = decodeCart(bytes);
    assert.ok(decoded);
    assert.equal(decoded.face.screen, 'ST7789sq');
    assert.equal(decoded.lua, cart.lua);
    assert.equal(decoded.palette, null);
    assert.equal(decoded.sprSheet, null);
    assert.equal(decoded.sprFlags, null);
    assert.equal(decoded.map, null);
  });

  it('round-trips a full cart with all sections', () => {
    const cart = fullCart();
    const bytes = encodeCart(cart);
    const decoded = decodeCart(bytes);

    // Face
    assert.equal(decoded.face.screen, 'GC9A01');
    assert.equal(decoded.face.rotation, 90);
    assert.equal(decoded.face.components.length, 2);
    assert.equal(decoded.face.components[0].type, 'dpad');

    // Palette
    assert.deepEqual(decoded.palette, cart.palette);

    // Sprites (4-bit packed round-trip)
    assert.ok(decoded.sprSheet);
    // Sprite 0 pixels should match
    for (let i = 0; i < 64; i++) {
      assert.equal(decoded.sprSheet[i], cart.sprSheet[i], `sprite 0, pixel ${i}`);
    }
    // Sprite 5 pixels should match
    for (let i = 0; i < 64; i++) {
      assert.equal(decoded.sprSheet[5 * 64 + i], 7, `sprite 5, pixel ${i}`);
    }
    // Sprites beyond last used should be zero
    assert.equal(decoded.sprSheet[6 * 64], 0);

    // Flags
    assert.ok(decoded.sprFlags);
    assert.equal(decoded.sprFlags[0], 0b00000001);
    assert.equal(decoded.sprFlags[5], 0b00000100);
    assert.equal(decoded.sprFlags[10], 0);

    // Map
    assert.ok(decoded.map);
    assert.equal(decoded.map.w, 4);
    assert.equal(decoded.map.h, 4);
    assert.equal(decoded.map.data[0], 5);
    assert.equal(decoded.map.data[3], 1);
    assert.equal(decoded.map.data[1], 0);

    // Lua
    assert.equal(decoded.lua, cart.lua);
  });

  it('omits empty sprite sheet', () => {
    const cart = minimalCart();
    cart.sprSheet = new Uint8Array(256 * 64); // all zeros
    const bytes = encodeCart(cart);
    const decoded = decodeCart(bytes);
    assert.equal(decoded.sprSheet, null);
  });

  it('omits empty sprite flags', () => {
    const cart = minimalCart();
    cart.sprFlags = new Uint8Array(256); // all zeros
    const bytes = encodeCart(cart);
    const decoded = decodeCart(bytes);
    assert.equal(decoded.sprFlags, null);
  });

  it('omits empty map', () => {
    const cart = minimalCart();
    cart.map = { w: 8, h: 8, data: new Uint8Array(64) }; // all zeros
    const bytes = encodeCart(cart);
    const decoded = decodeCart(bytes);
    assert.equal(decoded.map, null);
  });

  it('returns null for invalid magic', () => {
    assert.equal(decodeCart(new Uint8Array([0, 0, 1])), null);
  });

  it('returns null for wrong version', () => {
    assert.equal(decodeCart(new Uint8Array([0x47, 0x44, 99])), null);
  });

  it('returns null for empty/short input', () => {
    assert.equal(decodeCart(new Uint8Array([])), null);
    assert.equal(decodeCart(new Uint8Array([0x47])), null);
    assert.equal(decodeCart(null), null);
  });
});

// ── Sprite 4-bit packing ────────────────────────────────────────────────────

describe('sprite packing', () => {
  it('preserves all 16 palette values through pack/unpack', () => {
    const cart = minimalCart();
    cart.sprSheet = new Uint8Array(256 * 64);
    // Sprite 0: pixels 0-15 have values 0-15
    for (let i = 0; i < 16; i++) cart.sprSheet[i] = i;

    const bytes = encodeCart(cart);
    const decoded = decodeCart(bytes);
    for (let i = 0; i < 16; i++) {
      assert.equal(decoded.sprSheet[i], i, `palette value ${i}`);
    }
  });

  it('trims to last non-empty sprite', () => {
    const cart = minimalCart();
    cart.sprSheet = new Uint8Array(256 * 64);
    // Only sprite 3 has data
    cart.sprSheet[3 * 64] = 5;

    const bytes = encodeCart(cart);
    const decoded = decodeCart(bytes);
    // Sprites 0-3 should exist (4 sprites packed)
    assert.equal(decoded.sprSheet[3 * 64], 5);
    // Sprite 4+ should be zero
    assert.equal(decoded.sprSheet[4 * 64], 0);
  });
});

// ── Metadata ─────────────────────────────────────────────────────────────────

describe('metadata', () => {
  it('encodeMeta produces correct comment', () => {
    const str = encodeMeta({ screen: 'GC9A01', title: 'My Game', author: 'Alice' });
    assert.ok(str.startsWith('<!-- geode '));
    assert.ok(str.includes('screen:GC9A01'));
    assert.ok(str.includes('title:My Game'));
    assert.ok(str.includes('author:Alice'));
    assert.ok(str.endsWith(' -->\n'));
  });

  it('encodeMeta returns empty string for null/no fields', () => {
    assert.equal(encodeMeta(null), '');
    assert.equal(encodeMeta({}), '');
  });

  it('decodeMeta parses comment and separates payload', () => {
    const input = '<!-- geode screen:ST7789sq; title:Test Game -->\nSOMEBASE64DATA';
    const { meta, payload } = decodeMeta(input);
    assert.equal(meta.screen, 'ST7789sq');
    assert.equal(meta.title, 'Test Game');
    assert.equal(payload, 'SOMEBASE64DATA');
  });

  it('decodeMeta handles no comment', () => {
    const input = 'JUSTBASE64';
    const { meta, payload } = decodeMeta(input);
    assert.equal(meta, null);
    assert.equal(payload, 'JUSTBASE64');
  });

  it('decodeMeta handles values with colons', () => {
    const input = '<!-- geode desc:time: 3:00 -->\nDATA';
    const { meta } = decodeMeta(input);
    assert.equal(meta.desc, 'time: 3:00');
  });
});

// ── Pack / Unpack (deflate + base64) ─────────────────────────────────────────

describe('packCart / unpackCart', () => {
  it('round-trips a minimal cart through compression', async () => {
    const cart = minimalCart();
    const packed = await packCart(cart);
    assert.equal(typeof packed, 'string');
    assert.ok(packed.length > 0);

    const { cart: decoded, meta } = await unpackCart(packed);
    assert.equal(meta, null);
    assert.equal(decoded.face.screen, 'ST7789sq');
    assert.equal(decoded.lua, cart.lua);
  });

  it('round-trips with metadata', async () => {
    const cart = minimalCart();
    const meta = { screen: 'ST7789sq', title: 'Hello', author: 'Bob' };
    const packed = await packCart(cart, meta);
    assert.ok(packed.startsWith('<!-- geode '));

    const { cart: decoded, meta: decodedMeta } = await unpackCart(packed);
    assert.equal(decodedMeta.title, 'Hello');
    assert.equal(decodedMeta.author, 'Bob');
    assert.equal(decoded.lua, cart.lua);
  });

  it('round-trips a full cart through compression', async () => {
    const cart = fullCart();
    const packed = await packCart(cart);
    const { cart: decoded } = await unpackCart(packed);

    assert.equal(decoded.face.screen, 'GC9A01');
    assert.deepEqual(decoded.palette, cart.palette);
    assert.equal(decoded.sprSheet[0], 1);
    assert.equal(decoded.sprFlags[5], 0b00000100);
    assert.equal(decoded.map.data[0], 5);
    assert.equal(decoded.lua, cart.lua);
  });
});
