// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Audio tests (note parsing only, no AudioContext needed)
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseNote } from '../src/runtime/audio.js';

describe('parseNote', () => {
  it('A4 → 440 Hz', () => {
    const freq = parseNote('A4');
    assert.ok(Math.abs(freq - 440) < 0.01, `expected ~440, got ${freq}`);
  });

  it('C4 → ~261.63 Hz (middle C)', () => {
    const freq = parseNote('C4');
    assert.ok(Math.abs(freq - 261.63) < 0.1, `expected ~261.63, got ${freq}`);
  });

  it('C#4 → higher than C4', () => {
    const c4 = parseNote('C4');
    const cs4 = parseNote('C#4');
    assert.ok(cs4 > c4, 'C#4 should be higher than C4');
  });

  it('Bb3 → lower than B3', () => {
    const bb3 = parseNote('Bb3');
    const b3 = parseNote('B3');
    assert.ok(bb3 < b3, 'Bb3 should be lower than B3');
  });

  it('a4 (lowercase) → 440 Hz', () => {
    const freq = parseNote('a4');
    assert.ok(Math.abs(freq - 440) < 0.01, `expected ~440, got ${freq}`);
  });

  it('invalid input returns null', () => {
    assert.equal(parseNote(null), null);
    assert.equal(parseNote(''), null);
    assert.equal(parseNote('X5'), null);
    assert.equal(parseNote('nope'), null);
  });

  it('no crash on undefined', () => {
    assert.equal(parseNote(undefined), null);
  });

  it('no crash on number', () => {
    assert.equal(parseNote(42), null);
  });
});
