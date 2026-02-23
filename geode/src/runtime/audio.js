// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Audio Engine
// Web Audio oscillator: sfx, beep, note. No imports.
// ─────────────────────────────────────────────────────────────────────────────

let audioCtx = null;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

const WAVE_TYPES = ['square', 'sawtooth', 'triangle'];

export function sfx(freq, dur, wave) {
  const ctx = ensureAudio();
  freq = freq || 440;
  dur = dur || 0.1;
  const type = (wave === 3) ? 'square' : (WAVE_TYPES[wave || 0] || 'square');
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  if (wave === 3) {
    // noise approximation: rapid frequency modulation
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    for (let t = 0; t < dur; t += 0.005) {
      osc.frequency.setValueAtTime(freq * (0.5 + Math.random()), ctx.currentTime + t);
    }
  } else {
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
  }
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + dur);
}

export function beep(freq, dur) {
  sfx(freq || 440, dur || 0.1, 0);
}

// Note name → frequency
const NOTE_NAMES = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };

export function parseNote(name) {
  if (!name || typeof name !== 'string') return null;
  const match = name.match(/^([A-Ga-g])(#|b)?(\d)$/);
  if (!match) return null;
  let semitone = NOTE_NAMES[match[1].toUpperCase()];
  if (match[2] === '#') semitone++;
  if (match[2] === 'b') semitone--;
  const octave = parseInt(match[3]);
  const midi = semitone + (octave + 1) * 12;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  return freq;
}

export function note(name, dur) {
  const freq = parseNote(name);
  if (freq === null) return;
  sfx(freq, dur || 0.2, 0);
}
