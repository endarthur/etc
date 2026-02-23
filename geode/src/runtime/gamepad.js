// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Touch Gamepad
// Injects a virtual d-pad + buttons overlay for touch devices.
// Self-contained: creates its own <style> and DOM elements on init.
// ─────────────────────────────────────────────────────────────────────────────

import { setKey } from './api.js';

let _container = null;
let _styleEl = null;
let _gamepadEl = null;
let _allButtons = [];

const CSS = `
.gamepad {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200px;
  pointer-events: none;
  z-index: 1000;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}
.gamepad.active { display: flex; justify-content: space-between; align-items: flex-end; padding: 16px; }

/* ── D-pad ────────────────────────────────────────────── */
.gp-dpad {
  display: grid;
  grid-template-columns: repeat(3, 56px);
  grid-template-rows: repeat(3, 56px);
  gap: 4px;
  pointer-events: auto;
}
.gp-dpad-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.6);
  font-size: 20px;
  font-family: sans-serif;
}
.gp-dpad-btn.pressed { background: rgba(255,255,255,0.35); }
.gp-dpad-spacer { visibility: hidden; }

/* ── Meta (start / select) ────────────────────────────── */
.gp-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: flex-end;
  margin-bottom: 8px;
  pointer-events: auto;
}
.gp-meta-btn {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 12px;
  padding: 6px 16px;
  color: rgba(255,255,255,0.5);
  font-size: 10px;
  font-family: sans-serif;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
}
.gp-meta-btn.pressed { background: rgba(255,255,255,0.3); }

/* ── Action buttons (A / B) ───────────────────────────── */
.gp-buttons {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  pointer-events: auto;
}
.gp-action-btn {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(255,255,255,0.18);
  border: 2px solid rgba(255,255,255,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.7);
  font-size: 18px;
  font-weight: bold;
  font-family: sans-serif;
}
.gp-action-btn.pressed { background: rgba(255,255,255,0.4); }
.gp-action-btn[data-key="a"] { margin-bottom: 24px; }
`;

function el(tag, cls, attrs) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'text') e.textContent = v;
      else e.dataset[k] = v;
    }
  }
  return e;
}

function buildDpad() {
  const dpad = el('div', 'gp-dpad');
  // Row 1: _ up _
  dpad.appendChild(el('div', 'gp-dpad-spacer'));
  const up = el('div', 'gp-dpad-btn', { key: 'up', text: '\u25B2' });
  dpad.appendChild(up);
  dpad.appendChild(el('div', 'gp-dpad-spacer'));
  // Row 2: left _ right
  const left = el('div', 'gp-dpad-btn', { key: 'left', text: '\u25C0' });
  dpad.appendChild(left);
  dpad.appendChild(el('div', 'gp-dpad-spacer'));
  const right = el('div', 'gp-dpad-btn', { key: 'right', text: '\u25B6' });
  dpad.appendChild(right);
  // Row 3: _ down _
  dpad.appendChild(el('div', 'gp-dpad-spacer'));
  const down = el('div', 'gp-dpad-btn', { key: 'down', text: '\u25BC' });
  dpad.appendChild(down);
  dpad.appendChild(el('div', 'gp-dpad-spacer'));
  return { dpad, buttons: [up, down, left, right] };
}

function buildMeta(metaKeys) {
  const wrap = el('div', 'gp-meta');
  const btns = [];
  for (const id of metaKeys) {
    const b = el('div', 'gp-meta-btn', { key: id, text: id });
    wrap.appendChild(b);
    btns.push(b);
  }
  return { meta: wrap, buttons: btns };
}

function buildActions(actionKeys) {
  const wrap = el('div', 'gp-buttons');
  const btns = [];
  for (const id of actionKeys) {
    const b = el('div', 'gp-action-btn', { key: id, text: id.toUpperCase() });
    wrap.appendChild(b);
    btns.push(b);
  }
  return { actions: wrap, buttons: btns };
}

function handleTouches(e) {
  e.preventDefault();

  // Build set of currently-touched keys
  const touched = new Set();
  for (let i = 0; i < e.touches.length; i++) {
    const t = e.touches[i];
    const target = document.elementFromPoint(t.clientX, t.clientY);
    if (target && target.dataset && target.dataset.key) {
      touched.add(target.dataset.key);
    }
  }

  // Update all tracked buttons
  for (const btn of _allButtons) {
    const id = btn.dataset.key;
    const isDown = touched.has(id);
    setKey(id, isDown);
    btn.classList.toggle('pressed', isDown);
  }
}

export function initGamepad(container, controls) {
  controls = controls || { dpad: true, buttons: ['a', 'b'], meta: ['start', 'select'] };

  // Inject CSS
  _styleEl = document.createElement('style');
  _styleEl.textContent = CSS;
  document.head.appendChild(_styleEl);

  _container = container;
  _gamepadEl = el('div', 'gamepad');
  _gamepadEl.id = 'gamepad';
  _allButtons = [];

  if (controls.dpad !== false) {
    const { dpad, buttons } = buildDpad();
    _gamepadEl.appendChild(dpad);
    _allButtons.push(...buttons);
  }

  if (controls.meta && controls.meta.length) {
    const { meta, buttons } = buildMeta(controls.meta);
    _gamepadEl.appendChild(meta);
    _allButtons.push(...buttons);
  }

  if (controls.buttons && controls.buttons.length) {
    const { actions, buttons } = buildActions(controls.buttons);
    _gamepadEl.appendChild(actions);
    _allButtons.push(...buttons);
  }

  _container.appendChild(_gamepadEl);

  // Attach touch listeners on the gamepad element
  _gamepadEl.addEventListener('touchstart',  handleTouches, { passive: false });
  _gamepadEl.addEventListener('touchmove',   handleTouches, { passive: false });
  _gamepadEl.addEventListener('touchend',    handleTouches, { passive: false });
  _gamepadEl.addEventListener('touchcancel', handleTouches, { passive: false });

  // Auto-show on touch-capable devices
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    _gamepadEl.classList.add('active');
  }
}

export function destroyGamepad() {
  if (_gamepadEl) {
    _gamepadEl.removeEventListener('touchstart',  handleTouches);
    _gamepadEl.removeEventListener('touchmove',   handleTouches);
    _gamepadEl.removeEventListener('touchend',    handleTouches);
    _gamepadEl.removeEventListener('touchcancel', handleTouches);
    // Clear all touch keys
    for (const btn of _allButtons) setKey(btn.dataset.key, false);
    _gamepadEl.remove();
    _gamepadEl = null;
  }
  if (_styleEl) {
    _styleEl.remove();
    _styleEl = null;
  }
  _allButtons = [];
  _container = null;
}
