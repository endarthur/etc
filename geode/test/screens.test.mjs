// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Screen catalog tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const { SCREENS, DEFAULT_SCREEN, resolveScreen } = await import('../src/faceplate/screens.js');

// ── Catalog completeness ────────────────────────────────────────────────────

describe('SCREENS catalog', () => {
  it('has 8 entries', () => {
    assert.equal(Object.keys(SCREENS).length, 8);
  });

  it('every entry has required fields', () => {
    for (const [key, s] of Object.entries(SCREENS)) {
      assert.equal(s.id, key, `${key}.id`);
      assert.ok(Number.isInteger(s.w) && s.w > 0, `${key}.w positive int`);
      assert.ok(Number.isInteger(s.h) && s.h > 0, `${key}.h positive int`);
      assert.ok(s.color === 'mono' || s.color === '65k', `${key}.color`);
      assert.ok(s.shape === 'rect' || s.shape === 'round', `${key}.shape`);
      assert.ok(typeof s.size === 'number' && s.size > 0, `${key}.size`);
    }
  });

  it('DEFAULT_SCREEN exists in catalog', () => {
    assert.ok(SCREENS[DEFAULT_SCREEN], 'default screen in catalog');
  });
});

// ── resolveScreen ───────────────────────────────────────────────────────────

describe('resolveScreen', () => {
  it('returns correct dims for known ID', () => {
    const s = resolveScreen('ILI9341');
    assert.equal(s.w, 320);
    assert.equal(s.h, 240);
    assert.equal(s.id, 'ILI9341');
    assert.equal(s.rotation, 0);
  });

  it('swaps w/h on 90 rotation', () => {
    const s = resolveScreen('ILI9341', 90);
    assert.equal(s.w, 240);
    assert.equal(s.h, 320);
    assert.equal(s.rotation, 90);
  });

  it('swaps w/h on 270 rotation', () => {
    const s = resolveScreen('ST7735r', 270);
    assert.equal(s.w, 80);
    assert.equal(s.h, 160);
  });

  it('no swap on 0 or 180 rotation', () => {
    const s0 = resolveScreen('ST7735r', 0);
    assert.equal(s0.w, 160);
    assert.equal(s0.h, 80);

    const s180 = resolveScreen('ST7735r', 180);
    assert.equal(s180.w, 160);
    assert.equal(s180.h, 80);
  });

  it('falls back to default for unknown ID', () => {
    const s = resolveScreen('UNKNOWN_CHIP');
    assert.equal(s.id, DEFAULT_SCREEN);
  });

  it('falls back to default for undefined ID', () => {
    const s = resolveScreen(undefined);
    assert.equal(s.id, DEFAULT_SCREEN);
  });

  it('carries shape and color', () => {
    const s = resolveScreen('GC9A01');
    assert.equal(s.shape, 'round');
    assert.equal(s.color, '65k');
  });

  it('mono screens have color=mono', () => {
    const s = resolveScreen('SSD1306');
    assert.equal(s.color, 'mono');
  });
});
