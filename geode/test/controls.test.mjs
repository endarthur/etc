// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Controls catalog tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const {
  CTRL_TYPES, CTRL_IDS, CTRL_SIZES,
  CTRL_TYPES_REV, CTRL_IDS_REV, CTRL_SIZES_REV,
  CONTROLS, resolveControl,
} = await import('../src/faceplate/controls.js');

describe('CTRL_TYPES', () => {
  it('has 4 types', () => {
    assert.equal(Object.keys(CTRL_TYPES).length, 4);
  });

  it('all values are unique positive integers', () => {
    const vals = Object.values(CTRL_TYPES);
    assert.equal(new Set(vals).size, vals.length, 'unique');
    for (const v of vals) assert.ok(Number.isInteger(v) && v > 0);
  });
});

describe('CTRL_IDS', () => {
  it('has 11 IDs', () => {
    assert.equal(Object.keys(CTRL_IDS).length, 11);
  });

  it('all values are unique', () => {
    const vals = Object.values(CTRL_IDS);
    assert.equal(new Set(vals).size, vals.length);
  });
});

describe('CTRL_SIZES', () => {
  it('has sm/md/lg', () => {
    assert.equal(CTRL_SIZES.sm, 0);
    assert.equal(CTRL_SIZES.md, 1);
    assert.equal(CTRL_SIZES.lg, 2);
  });
});

describe('reverse maps', () => {
  it('CTRL_TYPES_REV inverts CTRL_TYPES', () => {
    for (const [k, v] of Object.entries(CTRL_TYPES)) {
      assert.equal(CTRL_TYPES_REV[v], k);
    }
  });

  it('CTRL_IDS_REV inverts CTRL_IDS', () => {
    for (const [k, v] of Object.entries(CTRL_IDS)) {
      assert.equal(CTRL_IDS_REV[v], k);
    }
  });

  it('CTRL_SIZES_REV inverts CTRL_SIZES', () => {
    for (const [k, v] of Object.entries(CTRL_SIZES)) {
      assert.equal(CTRL_SIZES_REV[v], k);
    }
  });
});

describe('CONTROLS dimensions', () => {
  it('every type has sm/md/lg with w and h', () => {
    for (const type of Object.keys(CTRL_TYPES)) {
      const spec = CONTROLS[type];
      assert.ok(spec, `${type} in CONTROLS`);
      for (const sz of ['sm', 'md', 'lg']) {
        assert.ok(spec[sz], `${type}.${sz}`);
        assert.ok(spec[sz].w > 0, `${type}.${sz}.w`);
        assert.ok(spec[sz].h > 0, `${type}.${sz}.h`);
      }
    }
  });
});

describe('resolveControl', () => {
  it('returns md by default', () => {
    const d = resolveControl('dpad');
    assert.deepEqual(d, CONTROLS.dpad.md);
  });

  it('returns specific size', () => {
    const d = resolveControl('button', 'lg');
    assert.deepEqual(d, CONTROLS.button.lg);
  });

  it('returns null for unknown type', () => {
    assert.equal(resolveControl('knob'), null);
  });

  it('falls back to md for unknown size', () => {
    const d = resolveControl('stick', 'xl');
    assert.deepEqual(d, CONTROLS.stick.md);
  });
});
