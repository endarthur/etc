// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Face serialization tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { encodeFace, decodeFace, SCREEN_ENUM, SCREEN_ENUM_REV } =
  await import('../src/faceplate/serialize.js');

// ── Screen enum ─────────────────────────────────────────────────────────────

describe('SCREEN_ENUM', () => {
  it('has 8 screens mapped to 1-8', () => {
    assert.equal(Object.keys(SCREEN_ENUM).length, 8);
    const vals = Object.values(SCREEN_ENUM);
    assert.deepEqual(vals.sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('reverse map inverts correctly', () => {
    for (const [id, byte] of Object.entries(SCREEN_ENUM)) {
      assert.equal(SCREEN_ENUM_REV[byte], id);
    }
  });
});

// ── Round-trip ───────────────────────────────────────────────────────────────

describe('encodeFace / decodeFace', () => {
  it('round-trips a typical face spec', () => {
    const spec = {
      screen: 'ST7789sq',
      rotation: 90,
      shellColor: [30, 30, 30],
      components: [
        { type: 'dpad', id: 'dpad', x: 20, y: 100, size: 'md' },
        { type: 'button', id: 'a', x: 180, y: 120, size: 'lg' },
        { type: 'button', id: 'b', x: 160, y: 140, size: 'lg' },
        { type: 'meta', id: 'start', x: 100, y: 180, size: 'sm' },
        { type: 'meta', id: 'select', x: 80, y: 180, size: 'sm' },
      ],
    };
    const bytes = encodeFace(spec);
    const { spec: decoded, bytesRead } = decodeFace(bytes);

    assert.equal(decoded.screen, 'ST7789sq');
    assert.equal(decoded.rotation, 90);
    assert.deepEqual(decoded.shellColor, [30, 30, 30]);
    assert.equal(decoded.components.length, 5);

    assert.equal(decoded.components[0].type, 'dpad');
    assert.equal(decoded.components[0].id, 'dpad');
    assert.equal(decoded.components[0].x, 20);
    assert.equal(decoded.components[0].y, 100);
    assert.equal(decoded.components[0].size, 'md');

    assert.equal(decoded.components[1].type, 'button');
    assert.equal(decoded.components[1].id, 'a');
    assert.equal(decoded.components[1].size, 'lg');

    assert.equal(bytesRead, bytes.length);
  });

  it('round-trips empty components', () => {
    const spec = { screen: 'SSD1306', rotation: 0, shellColor: [0, 0, 0], components: [] };
    const bytes = encodeFace(spec);
    assert.equal(bytes.length, 6, '6-byte header only');
    const { spec: decoded } = decodeFace(bytes);
    assert.equal(decoded.screen, 'SSD1306');
    assert.equal(decoded.components.length, 0);
  });

  it('handles all rotation values', () => {
    for (const rot of [0, 90, 180, 270]) {
      const bytes = encodeFace({ screen: 'GC9A01', rotation: rot, shellColor: [0, 0, 0], components: [] });
      const { spec } = decodeFace(bytes);
      assert.equal(spec.rotation, rot, `rotation ${rot}`);
    }
  });

  it('handles all 8 screens', () => {
    for (const id of Object.keys(SCREEN_ENUM)) {
      const bytes = encodeFace({ screen: id, rotation: 0, shellColor: [0, 0, 0], components: [] });
      const { spec } = decodeFace(bytes);
      assert.equal(spec.screen, id, `screen ${id}`);
    }
  });

  it('handles large x/y coordinates (uint16)', () => {
    const spec = {
      screen: 'ILI9341',
      rotation: 0,
      shellColor: [255, 128, 0],
      components: [{ type: 'button', id: 'a', x: 300, y: 500, size: 'md' }],
    };
    const bytes = encodeFace(spec);
    const { spec: decoded } = decodeFace(bytes);
    assert.equal(decoded.components[0].x, 300);
    assert.equal(decoded.components[0].y, 500);
  });

  it('defaults to ST7789sq for unknown screen', () => {
    // Manually craft bytes with screen enum 0 (invalid)
    const bytes = new Uint8Array([0, 0, 0, 0, 0, 0]);
    const { spec } = decodeFace(bytes);
    assert.equal(spec.screen, 'ST7789sq');
  });

  it('defaults shellColor to [40,40,40] if omitted', () => {
    const bytes = encodeFace({ screen: 'SSD1306', components: [] });
    const { spec } = decodeFace(bytes);
    assert.deepEqual(spec.shellColor, [40, 40, 40]);
  });
});
