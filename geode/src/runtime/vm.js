// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — VM (Wasmoon lifecycle + game loop)
// ─────────────────────────────────────────────────────────────────────────────

import {
  initGfx, flushGfx, tickInput, screenInfo,
  resolveRGB, FONT, FONT_W, FONT_H, FONT_SPACE,
  api_cls, api_color, api_pix, api_line,
  api_rect, api_rectfill, api_circ, api_circfill,
  api_tri, api_trifill, api_print,
  api_spr, api_sspr, api_fget, api_fset,
  api_map, api_mget, api_mset, initMap,
  api_btn, api_btnp, api_dpad, api_stick,
  api_rnd, api_flr, api_ceil, api_abs,
  api_sin, api_cos, api_atan2,
  api_min, api_max, api_mid, api_sgn,
} from './api.js';

import { sfx, beep, note } from './audio.js';
import { resolveScreen } from '../faceplate/screens.js';
import { initGamepad } from './gamepad.js';

let _rafId = null;

export async function bootGeode(canvas, luaCode, opts) {
  opts = opts || {};
  const wasmPath = opts.wasmPath || 'lib/wasmoon/glue.wasm';

  // Resolve screen from catalog (backward-compatible with opts.width/height)
  const screenData = opts.screen ? resolveScreen(opts.screen, opts.rotation) : null;
  const w = screenData ? screenData.w : (opts.width || 240);
  const h = screenData ? screenData.h : (opts.height || 240);
  canvas.width = w;
  canvas.height = h;

  const gfx = initGfx(canvas, w, h, screenData);

  // Init touch gamepad if container provided
  if (opts.gamepadContainer) initGamepad(opts.gamepadContainer, opts.controls);

  // Wasmoon boot
  const factory = new wasmoon.LuaFactory(wasmPath);
  const lua = await factory.createEngine();
  const G = lua.global;

  // Screen table
  G.set('screen', screenInfo);

  // Drawing
  G.set('cls',      api_cls);
  G.set('color',    api_color);
  G.set('pix',      api_pix);
  G.set('line',     api_line);
  G.set('rect',     api_rect);
  G.set('rectfill', api_rectfill);
  G.set('circ',     api_circ);
  G.set('circfill', api_circfill);
  G.set('tri',      api_tri);
  G.set('trifill',  api_trifill);
  G.set('print',    api_print);

  // Sprites
  G.set('spr',  api_spr);
  G.set('sspr', api_sspr);
  G.set('fget', api_fget);
  G.set('fset', api_fset);

  // Map
  G.set('map',  api_map);
  G.set('mget', api_mget);
  G.set('mset', api_mset);

  // Input
  G.set('btn',  api_btn);
  G.set('btnp', api_btnp);
  G.set('_js_dpad',  api_dpad);
  G.set('_js_stick', api_stick);

  // Math
  G.set('rnd',   api_rnd);
  G.set('flr',   api_flr);
  G.set('ceil',  api_ceil);
  G.set('abs',   api_abs);
  G.set('sin',   api_sin);
  G.set('cos',   api_cos);
  G.set('atan2', api_atan2);
  G.set('min',   api_min);
  G.set('max',   api_max);
  G.set('mid',   api_mid);
  G.set('sgn',   api_sgn);

  // Audio
  G.set('sfx',  sfx);
  G.set('beep', beep);
  G.set('note', note);

  // Lua wrappers for multi-return functions
  await lua.doString(`
    function dpad()
      local r = _js_dpad()
      return r[1], r[2]
    end
    function stick(n)
      local r = _js_stick(n)
      return r[1], r[2]
    end
  `);

  // Run game code
  try {
    await lua.doString(luaCode);
  } catch (e) {
    if (opts.onError) opts.onError(e.message || String(e));
    return;
  }

  // Get lifecycle callbacks
  let fn_init, fn_update, fn_draw;
  try {
    fn_init   = G.get('_init');
    fn_update = G.get('_update');
    fn_draw   = G.get('_draw');
  } catch (e) {
    if (opts.onError) opts.onError('Failed to get callbacks: ' + (e.message || e));
    return;
  }

  // Call _init
  if (typeof fn_init === 'function') {
    try { fn_init(); } catch (e) {
      if (opts.onError) opts.onError('_init error:\n' + (e.message || e));
      return;
    }
  }

  if (opts.onReady) opts.onReady();

  // Game loop
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsTime = 0;
  let fps = 0;

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    frameCount++;
    fpsTime += dt;
    if (fpsTime >= 1) {
      fps = frameCount;
      frameCount = 0;
      fpsTime -= 1;
    }

    tickInput();

    try {
      if (typeof fn_update === 'function') fn_update(dt);
      if (typeof fn_draw === 'function') fn_draw();
    } catch (e) {
      if (opts.onError) opts.onError(e.message || String(e));
      return;
    }

    // FPS overlay
    const fpsStr = fps + ' fps';
    const fpsColor = resolveRGB(14);
    for (let ci = 0; ci < fpsStr.length; ci++) {
      const code = fpsStr.charCodeAt(ci) - 0x20;
      if (code < 0 || code >= FONT.length) continue;
      const glyph = FONT[code];
      const ox = gfx.w - (fpsStr.length - ci) * (FONT_W + FONT_SPACE);
      for (let col = 0; col < FONT_W; col++) {
        const bits = glyph[col];
        for (let row = 0; row < FONT_H; row++) {
          if (bits & (1 << row)) {
            const px = ox + col;
            const py = gfx.h - FONT_H - 2 + row;
            if (px >= 0 && px < gfx.w && py >= 0 && py < gfx.h) {
              const idx = (py * gfx.w + px) * 4;
              gfx.buf[idx] = fpsColor[0]; gfx.buf[idx+1] = fpsColor[1];
              gfx.buf[idx+2] = fpsColor[2]; gfx.buf[idx+3] = 255;
            }
          }
        }
      }
    }

    flushGfx();
    _rafId = requestAnimationFrame(gameLoop);
  }

  _rafId = requestAnimationFrame(gameLoop);
}

export function stopGeode() {
  if (_rafId !== null) {
    cancelAnimationFrame(_rafId);
    _rafId = null;
  }
}
