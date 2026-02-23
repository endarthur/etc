// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — API tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Shim DOM for keyboard listeners (api.js calls document.addEventListener)
if (!globalThis.document) {
  const listeners = {};
  globalThis.document = {
    addEventListener(type, fn) {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
    },
    _fire(type, detail) {
      for (const fn of (listeners[type] || [])) fn(detail);
    },
  };
}

const api = await import('../src/runtime/api.js');

// ── Color resolution ────────────────────────────────────────────────────────

describe('resolveRGB', () => {
  it('palette index 0 returns correct RGB', () => {
    const rgb = api.resolveRGB(0);
    assert.deepEqual(rgb, [0x1a, 0x1c, 0x2c]);
  });

  it('palette index 12 (white) returns correct RGB', () => {
    const rgb = api.resolveRGB(12);
    assert.deepEqual(rgb, [0xf4, 0xf4, 0xf4]);
  });

  it('palette index 15 returns correct RGB', () => {
    const rgb = api.resolveRGB(15);
    assert.deepEqual(rgb, [0x33, 0x3c, 0x57]);
  });

  it('>255 treated as 0xRRGGBB', () => {
    const rgb = api.resolveRGB(0xff8800);
    assert.deepEqual(rgb, [0xff, 0x88, 0x00]);
  });

  it('out of range falls back to palette 0', () => {
    const rgb = api.resolveRGB(200);
    assert.deepEqual(rgb, [0x1a, 0x1c, 0x2c]);
  });
});

describe('resolveColor', () => {
  it('undefined falls back to pen color', () => {
    api.api_color(5); // set pen to light green
    const rgb = api.resolveColor(undefined);
    assert.deepEqual(rgb, api.resolveRGB(5));
  });

  it('null falls back to pen color', () => {
    api.api_color(3);
    const rgb = api.resolveColor(null);
    assert.deepEqual(rgb, api.resolveRGB(3));
  });

  it('explicit index used directly', () => {
    api.api_color(3);
    const rgb = api.resolveColor(9);
    assert.deepEqual(rgb, api.resolveRGB(9));
  });
});

// ── Pixel buffer ────────────────────────────────────────────────────────────

describe('initGfx', () => {
  let gfx;

  beforeEach(() => {
    // Minimal canvas shim
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 16, 16);
  });

  it('creates correct-size buffer', () => {
    assert.equal(gfx.buf.length, 16 * 16 * 4);
  });

  it('sets screenInfo', () => {
    assert.equal(api.screenInfo.w, 16);
    assert.equal(api.screenInfo.h, 16);
  });
});

// ── Drawing: pix ────────────────────────────────────────────────────────────

describe('pix', () => {
  let gfx;

  beforeEach(() => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 8, 8);
    api.api_cls(0);
  });

  it('writes RGBA at correct offset', () => {
    api.api_pix(2, 3, 12); // white
    const i = (3 * 8 + 2) * 4;
    assert.equal(gfx.buf[i],     0xf4);
    assert.equal(gfx.buf[i + 1], 0xf4);
    assert.equal(gfx.buf[i + 2], 0xf4);
    assert.equal(gfx.buf[i + 3], 255);
  });

  it('out-of-bounds is a no-op', () => {
    const before = gfx.buf.slice();
    api.api_pix(-1, 0, 12);
    api.api_pix(0, -1, 12);
    api.api_pix(8, 0, 12);
    api.api_pix(0, 8, 12);
    assert.deepEqual(gfx.buf, before);
  });
});

// ── Drawing: line (Bresenham) ───────────────────────────────────────────────

describe('line', () => {
  let gfx;

  function pixelSet(x, y) {
    const i = (y * 8 + x) * 4;
    return gfx.buf[i + 3] === 255 && gfx.buf[i] === 0xf4;
  }

  beforeEach(() => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 8, 8);
    // Clear to black (alpha=0 effectively) by zeroing
    gfx.buf.fill(0);
  });

  it('horizontal line', () => {
    api.api_line(1, 2, 5, 2, 12);
    for (let x = 1; x <= 5; x++) assert.ok(pixelSet(x, 2), `pixel at ${x},2`);
    assert.ok(!pixelSet(0, 2), 'pixel before line');
    assert.ok(!pixelSet(6, 2), 'pixel after line');
  });

  it('vertical line', () => {
    api.api_line(3, 1, 3, 6, 12);
    for (let y = 1; y <= 6; y++) assert.ok(pixelSet(3, y), `pixel at 3,${y}`);
  });

  it('diagonal line', () => {
    api.api_line(0, 0, 4, 4, 12);
    for (let i = 0; i <= 4; i++) assert.ok(pixelSet(i, i), `pixel at ${i},${i}`);
  });
});

// ── Drawing: rect / rectfill ────────────────────────────────────────────────

describe('rect', () => {
  let gfx;

  function pixelSet(x, y) {
    const i = (y * 16 + x) * 4;
    return gfx.buf[i + 3] === 255 && gfx.buf[i] === 0xf4;
  }

  beforeEach(() => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 16, 16);
    gfx.buf.fill(0);
  });

  it('outline rect has correct border pixels', () => {
    api.api_rect(2, 3, 4, 3, 12);
    // top edge
    for (let x = 2; x < 6; x++) assert.ok(pixelSet(x, 3), `top ${x},3`);
    // bottom edge
    for (let x = 2; x < 6; x++) assert.ok(pixelSet(x, 5), `bottom ${x},5`);
    // left edge
    for (let y = 3; y < 6; y++) assert.ok(pixelSet(2, y), `left 2,${y}`);
    // right edge
    for (let y = 3; y < 6; y++) assert.ok(pixelSet(5, y), `right 5,${y}`);
    // interior should be empty
    assert.ok(!pixelSet(3, 4), 'interior empty');
    assert.ok(!pixelSet(4, 4), 'interior empty');
  });

  it('rectfill fills interior', () => {
    api.api_rectfill(2, 3, 4, 3, 12);
    for (let y = 3; y < 6; y++) {
      for (let x = 2; x < 6; x++) {
        assert.ok(pixelSet(x, y), `filled ${x},${y}`);
      }
    }
  });
});

// ── Drawing: circ / circfill ────────────────────────────────────────────────

describe('circ', () => {
  let gfx;

  function pixelSet(x, y) {
    if (x < 0 || x >= 32 || y < 0 || y >= 32) return false;
    const i = (y * 32 + x) * 4;
    return gfx.buf[i + 3] === 255 && gfx.buf[i] === 0xf4;
  }

  beforeEach(() => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 32, 32);
    gfx.buf.fill(0);
  });

  it('radius 0 = single pixel', () => {
    api.api_circ(10, 10, 0, 12);
    assert.ok(pixelSet(10, 10));
  });

  it('symmetric on all quadrants', () => {
    api.api_circ(16, 16, 5, 12);
    // Check cardinal points
    assert.ok(pixelSet(21, 16), 'east');
    assert.ok(pixelSet(11, 16), 'west');
    assert.ok(pixelSet(16, 21), 'south');
    assert.ok(pixelSet(16, 11), 'north');
  });

  it('circfill fills the circle', () => {
    api.api_circfill(16, 16, 3, 12);
    // center should be filled
    assert.ok(pixelSet(16, 16));
    // edge points
    assert.ok(pixelSet(19, 16));
    assert.ok(pixelSet(13, 16));
  });
});

// ── Drawing: trifill ────────────────────────────────────────────────────────

describe('trifill', () => {
  let gfx;

  function pixelSet(x, y) {
    const i = (y * 32 + x) * 4;
    return gfx.buf[i + 3] === 255 && gfx.buf[i] === 0xf4;
  }

  beforeEach(() => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 32, 32);
    gfx.buf.fill(0);
  });

  it('flat-top triangle fills correctly', () => {
    api.api_trifill(5, 5, 15, 5, 10, 15, 12);
    assert.ok(pixelSet(10, 10), 'middle of triangle');
    assert.ok(pixelSet(10, 12), 'lower interior');
    // vertex pixel should be filled
    assert.ok(pixelSet(10, 15), 'bottom vertex');
  });

  it('degenerate (all same point) fills one pixel', () => {
    api.api_trifill(10, 10, 10, 10, 10, 10, 12);
    assert.ok(pixelSet(10, 10));
  });
});

// ── Text: print ─────────────────────────────────────────────────────────────

describe('print', () => {
  let gfx;

  function pixelSet(x, y) {
    const i = (y * 64 + x) * 4;
    return gfx.buf[i + 3] === 255 && gfx.buf[i] === 0xf4;
  }

  beforeEach(() => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 64, 16);
    gfx.buf.fill(0);
  });

  it('renders text (A has pixels)', () => {
    api.api_print('A', 0, 0, 12);
    // 'A' glyph has pixels — check that at least some are set
    let count = 0;
    for (let x = 0; x < 5; x++) {
      for (let y = 0; y < 7; y++) {
        if (pixelSet(x, y)) count++;
      }
    }
    assert.ok(count > 0, 'A should have pixels');
  });

  it('spacing between characters is correct', () => {
    api.api_print('AB', 0, 0, 12);
    // second char 'B' starts at x=6 (5+1 space)
    let countB = 0;
    for (let x = 6; x < 11; x++) {
      for (let y = 0; y < 7; y++) {
        if (pixelSet(x, y)) countB++;
      }
    }
    assert.ok(countB > 0, 'B should have pixels at offset 6');
  });

  it('undefined/null text is no-op', () => {
    const before = gfx.buf.slice();
    api.api_print(undefined, 0, 0, 12);
    api.api_print(null, 0, 0, 12);
    assert.deepEqual(gfx.buf, before);
  });
});

// ── Math ────────────────────────────────────────────────────────────────────

describe('math', () => {
  it('mid(1,5,3) = 3', () => assert.equal(api.api_mid(1, 5, 3), 3));
  it('mid(5,1,3) = 3', () => assert.equal(api.api_mid(5, 1, 3), 3));
  it('mid(3,5,1) = 3', () => assert.equal(api.api_mid(3, 5, 1), 3));
  it('sgn(-5) = -1', () => assert.equal(api.api_sgn(-5), -1));
  it('sgn(0) = 0', () => assert.equal(api.api_sgn(0), 0));
  it('sgn(10) = 1', () => assert.equal(api.api_sgn(10), 1));
  it('flr(3.7) = 3', () => assert.equal(api.api_flr(3.7), 3));
  it('ceil(3.2) = 4', () => assert.equal(api.api_ceil(3.2), 4));
  it('abs(-7) = 7', () => assert.equal(api.api_abs(-7), 7));
  it('min(4,9) = 4', () => assert.equal(api.api_min(4, 9), 4));
  it('max(4,9) = 9', () => assert.equal(api.api_max(4, 9), 9));
  it('rnd() returns [0,1)', () => {
    for (let i = 0; i < 20; i++) {
      const v = api.api_rnd();
      assert.ok(v >= 0 && v < 1, `rnd() = ${v}`);
    }
  });
  it('rnd(10) returns [0,10)', () => {
    for (let i = 0; i < 20; i++) {
      const v = api.api_rnd(10);
      assert.ok(v >= 0 && v < 10, `rnd(10) = ${v}`);
    }
  });
});

// ── Input ───────────────────────────────────────────────────────────────────

describe('input', () => {
  it('btn returns false for unpressed key', () => {
    assert.equal(api.api_btn('a'), false);
  });

  it('btn/btnp respond to keydown/keyup', () => {
    // Simulate pressing 'z' (mapped to 'a')
    document._fire('keydown', { key: 'z', preventDefault() {} });
    api.tickInput();
    assert.equal(api.api_btn('a'), true);
    assert.equal(api.api_btnp('a'), true);

    // Next frame: still held, but not just-pressed
    api.tickInput();
    assert.equal(api.api_btn('a'), true);
    assert.equal(api.api_btnp('a'), false);

    // Release
    document._fire('keyup', { key: 'z', preventDefault() {} });
    api.tickInput();
    assert.equal(api.api_btn('a'), false);
    assert.equal(api.api_btnp('a'), false);
  });

  it('dpad returns correct dx/dy', () => {
    document._fire('keydown', { key: 'ArrowLeft', preventDefault() {} });
    document._fire('keydown', { key: 'ArrowDown', preventDefault() {} });
    const [dx, dy] = api.api_dpad();
    assert.equal(dx, -1);
    assert.equal(dy, 1);
    // cleanup
    document._fire('keyup', { key: 'ArrowLeft', preventDefault() {} });
    document._fire('keyup', { key: 'ArrowDown', preventDefault() {} });
  });
});

// ── setKey / merged input ──────────────────────────────────────────────────

describe('setKey', () => {
  it('setKey sets button state', () => {
    api.setKey('b', true);
    assert.equal(api.api_btn('b'), true);
    api.setKey('b', false);
    assert.equal(api.api_btn('b'), false);
  });

  it('keyboard + touch OR merge: release touch, keyboard still held', () => {
    // keyboard holds 'b'
    document._fire('keydown', { key: 'x', preventDefault() {} });
    assert.equal(api.api_btn('b'), true);

    // touch also presses 'b'
    api.setKey('b', true);
    assert.equal(api.api_btn('b'), true);

    // touch releases — keyboard still held
    api.setKey('b', false);
    assert.equal(api.api_btn('b'), true);

    // keyboard releases
    document._fire('keyup', { key: 'x', preventDefault() {} });
    assert.equal(api.api_btn('b'), false);
  });

  it('touch holds while keyboard releases', () => {
    api.setKey('up', true);
    document._fire('keydown', { key: 'ArrowUp', preventDefault() {} });
    assert.equal(api.api_btn('up'), true);

    document._fire('keyup', { key: 'ArrowUp', preventDefault() {} });
    // touch still holding
    assert.equal(api.api_btn('up'), true);

    api.setKey('up', false);
    assert.equal(api.api_btn('up'), false);
  });
});

// ── screenInfo extended fields ─────────────────────────────────────────────

describe('screenInfo extended', () => {
  it('has shape and color fields', () => {
    assert.ok('shape' in api.screenInfo, 'shape field exists');
    assert.ok('color' in api.screenInfo, 'color field exists');
  });

  it('initGfx with screenData sets shape/color/name', () => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    api.initGfx(fakeCanvas, 128, 64, { id: 'SSD1306', shape: 'rect', color: 'mono' });
    assert.equal(api.screenInfo.name, 'SSD1306');
    assert.equal(api.screenInfo.shape, 'rect');
    assert.equal(api.screenInfo.color, 'mono');
  });
});

// ── Sprites ──────────────────────────────────────────────────────────────────

// Helper: init a fresh 65k rect canvas for sprite tests
function sprCanvas(w, h) {
  const fakeCanvas = {
    getContext() {
      return {
        createImageData(w, h) {
          return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
        },
        putImageData() {},
      };
    },
  };
  return api.initGfx(fakeCanvas, w || 32, h || 32, { id: 'ST7789sq', shape: 'rect', color: '65k' });
}

describe('sprites', () => {
  let gfx;

  function pixelAt(x, y) {
    const i = (y * 32 + x) * 4;
    return [gfx.buf[i], gfx.buf[i+1], gfx.buf[i+2], gfx.buf[i+3]];
  }

  beforeEach(() => {
    gfx = sprCanvas(32, 32);
    gfx.buf.fill(0);
    api.sprSheet.fill(0);
    api.sprFlags.fill(0);
  });

  it('spr draws a simple sprite', () => {
    // Paint sprite 0: top-left pixel = palette 12 (white)
    api.sprSheet[0] = 12;
    api.api_spr(0, 4, 4);
    const [r, g, b, a] = pixelAt(4, 4);
    assert.equal(r, 0xf4);
    assert.equal(a, 255);
  });

  it('spr skips transparent pixels (color 0)', () => {
    // Sprite 0 is all zeros → should not draw anything
    api.api_spr(0, 0, 0);
    const [r, g, b, a] = pixelAt(0, 0);
    assert.equal(a, 0, 'transparent pixel not drawn');
  });

  it('spr flips horizontally', () => {
    // Paint only the left column (px=0) of sprite 0
    for (let y = 0; y < 8; y++) api.sprSheet[y * 8 + 0] = 5;
    api.api_spr(0, 0, 0, true, false);
    // Flipped: left column should be at x=7
    const [r1] = pixelAt(7, 0);
    assert.ok(r1 > 0, 'flipped pixel at x=7');
    const [r2] = pixelAt(0, 0);
    assert.equal(r2, 0, 'no pixel at original x=0');
  });

  it('spr flips vertically', () => {
    // Paint only the top row (py=0) of sprite 0
    for (let x = 0; x < 8; x++) api.sprSheet[x] = 5;
    api.api_spr(0, 0, 0, false, true);
    // Flipped: top row should be at y=7
    const [r1] = pixelAt(0, 7);
    assert.ok(r1 > 0, 'flipped pixel at y=7');
    const [r2] = pixelAt(0, 0);
    assert.equal(r2, 0, 'no pixel at original y=0');
  });

  it('sspr draws a 2x1 block', () => {
    // Sprite 0: pixel at (0,0) = 2
    api.sprSheet[0] = 2;
    // Sprite 1: pixel at (0,0) = 3
    api.sprSheet[64 + 0] = 3;
    api.api_sspr(0, 0, 0, 2, 1);
    const [r0] = pixelAt(0, 0);
    const [r1] = pixelAt(8, 0);
    assert.ok(r0 > 0, 'sprite 0 drawn');
    assert.ok(r1 > 0, 'sprite 1 drawn at offset');
  });

  it('out-of-bounds sprite index is no-op', () => {
    const before = gfx.buf.slice();
    api.api_spr(-1, 0, 0);
    api.api_spr(256, 0, 0);
    assert.deepEqual(gfx.buf, before);
  });
});

describe('sprite flags', () => {
  beforeEach(() => {
    api.sprFlags.fill(0);
  });

  it('fset/fget individual bits', () => {
    api.api_fset(0, 0, true);
    assert.equal(api.api_fget(0, 0), true);
    assert.equal(api.api_fget(0, 1), false);

    api.api_fset(0, 3, true);
    assert.equal(api.api_fget(0, 3), true);
    assert.equal(api.api_fget(0, 0), true);  // still set
  });

  it('fset entire byte', () => {
    api.api_fset(5, 0b10101010);
    assert.equal(api.api_fget(5, 1), true);
    assert.equal(api.api_fget(5, 0), false);
    assert.equal(api.api_fget(5), 0b10101010);
  });

  it('fget with no flag returns whole byte', () => {
    api.api_fset(10, 0xff);
    assert.equal(api.api_fget(10), 0xff);
  });

  it('fset can clear a bit', () => {
    api.api_fset(0, 0, true);
    api.api_fset(0, 0, false);
    assert.equal(api.api_fget(0, 0), false);
  });

  it('out-of-bounds returns false', () => {
    assert.equal(api.api_fget(-1, 0), false);
    assert.equal(api.api_fget(256, 0), false);
  });
});

// ── Tilemap ─────────────────────────────────────────────────────────────────

describe('tilemap', () => {
  let gfx;

  function pixelAt(x, y) {
    const i = (y * 32 + x) * 4;
    return [gfx.buf[i], gfx.buf[i+1], gfx.buf[i+2], gfx.buf[i+3]];
  }

  beforeEach(() => {
    gfx = sprCanvas(32, 32);
    gfx.buf.fill(0);
    api.sprSheet.fill(0);
    api.initMap(4, 4);
  });

  it('mset/mget round-trip', () => {
    api.api_mset(1, 2, 42);
    assert.equal(api.api_mget(1, 2), 42);
  });

  it('mget out-of-bounds returns 0', () => {
    assert.equal(api.api_mget(-1, 0), 0);
    assert.equal(api.api_mget(0, -1), 0);
    assert.equal(api.api_mget(100, 0), 0);
  });

  it('mset out-of-bounds is no-op', () => {
    api.api_mset(-1, 0, 5);
    api.api_mset(100, 0, 5);
    // Should not throw, just silently ignore
  });

  it('map draws tiles using sprites', () => {
    // Setup sprite 1 with a visible pixel at (0,0)
    api.sprSheet[1 * 64 + 0] = 12; // sprite 1, pixel (0,0) = white
    // Put sprite 1 at map tile (0,0)
    api.api_mset(0, 0, 1);
    api.api_map(0, 0, 1, 1, 0, 0);
    const [r, g, b, a] = pixelAt(0, 0);
    assert.equal(r, 0xf4, 'tile drawn');
    assert.equal(a, 255);
  });

  it('map skips tile index 0 (empty)', () => {
    // Tile 0 at (0,0) — should not draw
    api.api_map(0, 0, 1, 1, 0, 0);
    const [r, g, b, a] = pixelAt(0, 0);
    assert.equal(a, 0, 'empty tile not drawn');
  });

  it('initMap sets up custom-sized map', () => {
    api.initMap(8, 8);
    api.api_mset(7, 7, 99);
    assert.equal(api.api_mget(7, 7), 99);
    // Old coordinates that are now in-range at (4,4) should be 0
    assert.equal(api.api_mget(4, 4), 0);
  });
});

// ── Mono threshold ──────────────────────────────────────────────────────────

describe('mono threshold', () => {
  let gfx;

  function pixelAt(x, y, w) {
    const i = (y * w + x) * 4;
    return [gfx.buf[i], gfx.buf[i+1], gfx.buf[i+2]];
  }

  it('bright colors become white on mono screen', () => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 16, 16, { id: 'SSD1306', shape: 'rect', color: 'mono' });
    gfx.buf.fill(0);
    api.api_pix(0, 0, 12); // palette 12 = white → luminance high → mono white
    const [r, g, b] = pixelAt(0, 0, 16);
    assert.equal(r, 255);
    assert.equal(g, 255);
    assert.equal(b, 255);
  });

  it('dark colors become black on mono screen', () => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 16, 16, { id: 'SSD1306', shape: 'rect', color: 'mono' });
    gfx.buf.fill(0);
    api.api_pix(0, 0, 0); // palette 0 = dark → mono black
    const [r, g, b] = pixelAt(0, 0, 16);
    assert.equal(r, 0);
    assert.equal(g, 0);
    assert.equal(b, 0);
  });

  it('cls thresholds on mono screen', () => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 8, 8, { id: 'SSD1306', shape: 'rect', color: 'mono' });
    api.api_cls(12); // white → mono 255
    assert.equal(gfx.buf[0], 255);
    assert.equal(gfx.buf[1], 255);
    assert.equal(gfx.buf[2], 255);
  });
});

// ── Round clipping ──────────────────────────────────────────────────────────

describe('round clipping', () => {
  let gfx;

  it('clips pixels outside inscribed circle', () => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 16, 16, { id: 'GC9A01', shape: 'round', color: '65k' });
    gfx.buf.fill(0);
    // Corner pixel (0,0) should be clipped — far from center
    api.api_pix(0, 0, 12);
    const i = 0;
    assert.equal(gfx.buf[i + 3], 0, 'corner pixel clipped');
    // Center pixel (8,8) should work — inside circle
    api.api_pix(8, 8, 12);
    const j = (8 * 16 + 8) * 4;
    assert.equal(gfx.buf[j + 3], 255, 'center pixel drawn');
  });

  it('does not clip on rect screens', () => {
    const fakeCanvas = {
      getContext() {
        return {
          createImageData(w, h) {
            return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
          },
          putImageData() {},
        };
      },
    };
    gfx = api.initGfx(fakeCanvas, 16, 16, { id: 'ST7789sq', shape: 'rect', color: '65k' });
    gfx.buf.fill(0);
    api.api_pix(0, 0, 12);
    assert.equal(gfx.buf[3], 255, 'corner pixel drawn on rect');
  });
});
