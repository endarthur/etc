// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Gamepad tests
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// ── DOM shim ────────────────────────────────────────────────────────────────
// Minimal DOM to support gamepad.js createElement, appendChild, etc.

if (!globalThis.document) {
  // Already shimmed by api.test.mjs if running in the same process,
  // but we need a richer shim for gamepad DOM creation.
}

// Replace document with a richer shim for this test file
const _listeners = {};
const _allElements = [];

function makeElement(tag) {
  const _children = [];
  const _classList = new Set();
  const _eventListeners = {};
  const el = {
    tagName: tag.toUpperCase(),
    dataset: {},
    className: '',
    id: '',
    textContent: '',
    style: {},
    children: _children,
    parentNode: null,
    classList: {
      add(c) { _classList.add(c); el.className = [..._classList].join(' '); },
      remove(c) { _classList.delete(c); el.className = [..._classList].join(' '); },
      toggle(c, force) {
        if (force === undefined) force = !_classList.has(c);
        if (force) _classList.add(c); else _classList.delete(c);
        el.className = [..._classList].join(' ');
      },
      contains(c) { return _classList.has(c); },
    },
    appendChild(child) {
      _children.push(child);
      child.parentNode = el;
      return child;
    },
    remove() {
      if (el.parentNode) {
        const idx = el.parentNode.children.indexOf(el);
        if (idx >= 0) el.parentNode.children.splice(idx, 1);
        el.parentNode = null;
      }
    },
    addEventListener(type, fn, opts) {
      if (!_eventListeners[type]) _eventListeners[type] = [];
      _eventListeners[type].push(fn);
    },
    removeEventListener(type, fn) {
      if (_eventListeners[type]) {
        _eventListeners[type] = _eventListeners[type].filter(f => f !== fn);
      }
    },
    querySelectorAll(sel) {
      // Minimal: support [data-key]
      const results = [];
      function walk(node) {
        if (node.dataset && node.dataset.key) results.push(node);
        for (const child of (node.children || [])) walk(child);
      }
      walk(el);
      return results;
    },
  };
  _allElements.push(el);
  return el;
}

const headEl = makeElement('head');
const bodyEl = makeElement('body');

globalThis.document = {
  addEventListener(type, fn) {
    if (!_listeners[type]) _listeners[type] = [];
    _listeners[type].push(fn);
  },
  _fire(type, detail) {
    for (const fn of (_listeners[type] || [])) fn(detail);
  },
  createElement(tag) { return makeElement(tag); },
  head: headEl,
  body: bodyEl,
  getElementById(id) { return null; },
  elementFromPoint() { return null; },
};

if (!globalThis.window) {
  Object.defineProperty(globalThis, 'window', { value: {}, writable: true, configurable: true });
}
// navigator may be getter-only in Node — use defineProperty to override
try { globalThis.navigator = globalThis.navigator || { maxTouchPoints: 0 }; } catch {
  Object.defineProperty(globalThis, 'navigator', {
    value: { maxTouchPoints: 0 },
    writable: true,
    configurable: true,
  });
}

// ── Import modules after shim ───────────────────────────────────────────────

const { setKey, api_btn } = await import('../src/runtime/api.js');
const { initGamepad, destroyGamepad } = await import('../src/runtime/gamepad.js');

// ── Tests ───────────────────────────────────────────────────────────────────

describe('initGamepad', () => {
  let container;

  beforeEach(() => {
    container = makeElement('div');
  });

  afterEach(() => {
    destroyGamepad();
  });

  it('creates dpad, meta, and action buttons', () => {
    initGamepad(container);
    const gp = container.children[0];
    assert.ok(gp, 'gamepad element created');
    // Should have 3 groups: dpad, meta, buttons
    assert.equal(gp.children.length, 3, '3 groups: dpad, meta, buttons');

    // Count data-key elements
    const keys = gp.querySelectorAll('[data-key]');
    // 4 dpad + 2 meta + 2 action = 8
    assert.equal(keys.length, 8, '8 total buttons');
  });

  it('respects custom controls', () => {
    initGamepad(container, { dpad: true, buttons: ['a'], meta: ['start'] });
    const gp = container.children[0];
    const keys = gp.querySelectorAll('[data-key]');
    // 4 dpad + 1 meta + 1 action = 6
    assert.equal(keys.length, 6, '6 buttons with custom controls');
  });

  it('omits dpad when disabled', () => {
    initGamepad(container, { dpad: false, buttons: ['a', 'b'], meta: [] });
    const gp = container.children[0];
    const keys = gp.querySelectorAll('[data-key]');
    // 0 dpad + 0 meta + 2 action = 2
    assert.equal(keys.length, 2, 'only action buttons');
  });
});

describe('setKey integration', () => {
  it('setKey(a, true) makes btn(a) return true', () => {
    setKey('a', true);
    assert.equal(api_btn('a'), true);
    setKey('a', false);
    assert.equal(api_btn('a'), false);
  });

  it('keyboard and touch coexist (OR merge)', () => {
    // Simulate keyboard holding 'a'
    document._fire('keydown', { key: 'z', preventDefault() {} });
    assert.equal(api_btn('a'), true, 'keyboard holds a');

    // Touch also presses 'a', then releases
    setKey('a', true);
    assert.equal(api_btn('a'), true, 'both hold a');

    setKey('a', false);
    // Keyboard still holding → should still be true
    assert.equal(api_btn('a'), true, 'keyboard still holds a after touch release');

    // Release keyboard
    document._fire('keyup', { key: 'z', preventDefault() {} });
    assert.equal(api_btn('a'), false, 'fully released');
  });
});

describe('destroyGamepad', () => {
  it('removes gamepad DOM from container', () => {
    const container = makeElement('div');
    initGamepad(container);
    assert.equal(container.children.length, 1, 'gamepad appended');
    destroyGamepad();
    assert.equal(container.children.length, 0, 'gamepad removed');
  });

  it('clears touch keys on destroy', () => {
    const container = makeElement('div');
    initGamepad(container);
    setKey('a', true);
    assert.equal(api_btn('a'), true);
    destroyGamepad();
    // After destroy, touch keys are cleared (keyboard state unchanged)
    assert.equal(api_btn('a'), false);
  });
});
