# GCU Geode — Design Document

> "Crack it open and find something interesting."

GCU Geode is a browser-based fantasy console where you **design a virtual handheld** (screen + buttons + face layout) and **write Lua games** for it. The console design and game code are serialized together into a QR code on a printable card. Scan the card, and your phone becomes that custom console running that game.

Each card is a **geode** — plain on the outside, a whole console inside.

---

## Concept

Unlike fixed-spec fantasy consoles (PICO-8, TIC-80), Geode lets the creator choose their hardware:

- Pick a screen module (real display chips: ST7789, SSD1306, etc.)
- Place controls on the face (d-pad, buttons, analog sticks, etc.)
- Write a Lua game that runs on that hardware
- Print the card, trade it, scan it, play it

When someone scans a Geode card, their phone renders the custom console face with touch controls and runs the game at the chosen resolution.

### Ecosystem

```
Stockwerk        → designs the physical console (enclosure, wiring, pins)
     ↓
GCU Blueschist   → the actual hardware (RP2040 + display + buttons)
     ↓
GCU Geode        → the software that runs ON it (Lua games from QR cards)
```

Geode on a phone is the emulator/dev-kit. Games written in the workshop run identically on real hardware because both use the same Lua C implementation (Wasmoon compiles official Lua 5.4 C to WASM; an MCU runs the same C source compiled to ARM).

### Prior Art

| Console   | Language    | Resolution     | Cart size | Mobile-first | QR distribution |
|-----------|-------------|----------------|-----------|--------------|-----------------|
| PICO-8    | Lua         | 128x128, 16col | 32KB PNG  | No           | No              |
| TIC-80    | Lua + others| 240x136, 16col | ~64KB     | Partial      | No              |
| WASM-4    | Any→WASM    | 160x160, 4col  | 64KB WASM | Web          | No              |
| QRGame    | JS (custom) | Variable       | QR-sized  | Android only | Yes             |
| **Geode** | Lua 5.4     | Variable       | QR-sized  | PWA (any)    | Yes             |

No existing project combines: Lua fantasy console + QR card distribution + mobile-first PWA + variable hardware + touch gamepad + workshop.

---

## Architecture

### Folder Structure

```
etc/geode/
├── lib/                     ← vendored deps (shared)
│   ├── lua-vm.js            ← Wasmoon (index.js + glue.wasm, base64-inlined)
│   ├── qrcodegen.js         ← QR generation (from GCUES)
│   └── jsQR.js              ← QR scanning (from GCUES)
│
├── src/
│   ├── runtime/             ← the Geode runtime (shared core)
│   │   ├── vm.js            ← Lua VM wrapper, game loop (_update/_draw)
│   │   ├── api.js           ← cls(), btn(), spr(), line(), print(), etc.
│   │   ├── audio.js         ← Web Audio oscillator sfx
│   │   └── gamepad.js       ← touch d-pad/buttons/sticks renderer
│   │
│   ├── face/                ← face designer (shared: press + workshop)
│   │   ├── designer.js      ← 2D drag-and-drop face editor
│   │   ├── screens.js       ← screen module catalog
│   │   ├── controls.js      ← button/dpad/stick/knob catalog
│   │   └── serialize.js     ← face spec ↔ compact binary
│   │
│   ├── console/             ← the player
│   │   ├── template.html
│   │   ├── styles.css
│   │   ├── scanner.js       ← QR scan + paste + import
│   │   ├── library.js       ← IndexedDB cartridge library
│   │   ├── trust.js         ← trust prompt + hash art
│   │   └── build.js
│   │
│   ├── press/               ← the authoring tool
│   │   ├── template.html
│   │   ├── styles.css
│   │   ├── editor.js        ← Lua code editor
│   │   ├── sprites.js       ← sprite sheet editor
│   │   ├── mapeditor.js     ← tilemap editor
│   │   ├── card.js          ← card preview + PDF export
│   │   ├── qr.js            ← QR rendering + best-mask
│   │   └── build.js
│   │
│   └── workshop/            ← the learning experience
│       ├── template.html
│       ├── styles.css
│       ├── chapters.js      ← chapter content + progression
│       ├── sandbox.js       ← inline try-it panels (embeds runtime + face designer)
│       └── build.js
│
├── index.html               ← BUILT console
├── press/
│   └── index.html           ← BUILT press
└── workshop/
    └── index.html           ← BUILT workshop
```

### Build System

Each app has its own `build.js` (zero-dep Node.js script) that concatenates shared modules + own modules into a single self-contained HTML file. Same pattern as GCUES and Stockwerk.

The Wasmoon `.wasm` binary is base64-inlined into the build (same technique Stockwerk uses for ManifoldCAD's 466KB WASM blob).

### Shared Module Graph

```
          ┌─────────┐
          │  lib/   │  Lua VM, qrcodegen, jsQR
          └────┬────┘
               │
     ┌─────────┼─────────┐
     │         │         │
 ┌───┴───┐ ┌──┴───┐ ┌───┴────┐
 │runtime│ │ face │ │  QR    │
 │vm+api │ │design│ │scan/gen│
 └───┬───┘ └──┬───┘ └───┬────┘
     │         │         │
     ├────┬────┼────┬────┤
     │    │    │    │    │
     ▼    ▼    ▼    ▼    ▼
  console   press   workshop
```

- **Console** = runtime + face/serialize + QR scan + library + trust
- **Press** = runtime + face (full) + QR gen + editors + card export
- **Workshop** = runtime + face (full) + QR gen + chapters + sandbox

### Tech Stack

- Vanilla HTML/CSS/JS, no framework
- Wasmoon (Lua 5.4 C → WASM) for game execution
- Canvas 2D API for game rendering + face designer
- Web Audio API for sound (oscillator-based)
- IndexedDB for cartridge library
- Vendored: qrcodegen (Nayuki), jsQR (cozmo), Wasmoon (ceifa)
- Build: Node.js concatenation scripts (no npm, no bundler)

---

## Lua VM: Wasmoon

**Choice:** [Wasmoon](https://github.com/ceifa/wasmoon) — official Lua 5.4 C source compiled to WASM.

**Why Wasmoon over alternatives:**

| | Fengari | Wasmoon | Moonshine |
|---|---|---|---|
| Implementation | Lua rewritten in JS | Official Lua C → WASM | Lua bytecode runner |
| Lua version | 5.3 | 5.4 | 5.1 |
| Size (plain) | ~214 KB | ~380 KB (JS + WASM) | ~19 KB gz |
| Performance | Slow | ~25x faster | Slow |
| License | MIT | MIT | MIT |
| Maintained | Core: 2025, web: 2021 | Active | Dead (~2014) |
| Source Lua | Yes | Yes | No (bytecode only) |

**Key reasons:**
1. **Performance** — 25x faster than Fengari on benchmarks. Matters for 60fps game loops.
2. **MCU parity** — Same C Lua implementation that runs on an RP2040. Games behave identically on phone and real hardware.
3. **Lua 5.4** — Proper integer types, important for MCU math with no FPU.
4. **Vendoring** — base64-inline the .wasm, same pattern as Stockwerk's ManifoldCAD.

**JS↔Lua bridge:**
```javascript
// Expose API to Lua
lua.global.set('cls', (c) => { /* clear canvas */ });
lua.global.set('btn', (id) => { /* read input */ });

// Run game code
await lua.doString(cartridgeLuaCode);
```

---

## API Surface

### Lifecycle

```lua
function _init()       -- called once at start
end

function _update(dt)   -- game logic; dt = seconds since last frame
end

function _draw()       -- render; called after _update
end
```

`dt` (delta time) instead of fixed-tick because different screen modules may run at different frame rates on real hardware. Teaches good game loop habits.

### Screen

```lua
screen.w       -- width in pixels (set by face design, e.g. 240)
screen.h       -- height in pixels
screen.name    -- module name, e.g. "ST7789" (informational)
```

### Colors (Option C — Palette + RGB)

Numbers 0–15 are palette lookups. Numbers > 255 are treated as 0xRRGGBB.

```lua
cls(0)                  -- palette color 0 (black)
line(0, 0, 50, 50, 8)  -- palette color 8 (red)
rect(10, 10, 20, 20, 0xff004d)  -- direct RGB
```

Default 16-color palette (customizable per cartridge). On monochrome screens, colors auto-threshold by luminance.

### Drawing

```lua
cls(c)                              -- clear screen to color
color(c)                            -- set pen color (default for subsequent calls)
pix(x, y, c)                       -- set pixel
line(x1, y1, x2, y2, c)            -- line
rect(x, y, w, h, c)                -- rectangle outline
rectfill(x, y, w, h, c)            -- filled rectangle
circ(x, y, r, c)                   -- circle outline
circfill(x, y, r, c)               -- filled circle
tri(x1, y1, x2, y2, x3, y3, c)    -- triangle outline
trifill(x1, y1, x2, y2, x3, y3, c) -- filled triangle
```

Color argument is always optional (last param). If omitted, uses current pen color from `color()`.

### Text

```lua
print(text, x, y, c)    -- draw text at position
```

Built-in pixel font (small enough for low-res screens, e.g. 4x6 or 5x7). One font, always available, no loading needed. Same font baked into MCU firmware.

### Sprites

```lua
spr(n, x, y)                    -- draw sprite N from sheet at x,y
spr(n, x, y, flip_x, flip_y)   -- with flipping
sspr(n, x, y, w, h)             -- draw scaled (w,h in sprites, e.g. 2x2)

fget(n, flag)       -- get sprite flag (bit index 0-7)
fset(n, flag, v)    -- set sprite flag at runtime
```

Sprite sheet: grid of 8x8 cells, 4-bit palette-indexed (16 colors per pixel). Up to 256 sprites. Edited visually in the Press sprite editor.

Sprite flags: 8 boolean flags per sprite (1 byte each). Used for collision categories — mark sprites as "solid", "deadly", "collectible", etc. Check with `fget(tile, 0)` during gameplay. Convention shared with PICO-8 and TIC-80 (MIT).

### Tilemap

```lua
map(mx, my, mw, mh, dx, dy)   -- draw map region (in tiles) at screen pos
mget(x, y)                     -- get tile index at map position
mset(x, y, n)                  -- set tile at runtime (destructible terrain, etc.)
```

Map: 2D grid of sprite indices (1 byte each, 0–255). Variable size. Edited in the Press map editor.

### Input

Inputs are named by what the face designer placed:

```lua
-- digital buttons (true/false)
btn("a")          -- is A held?
btn("b")          -- is B held?
btn("start")      -- start held?
btn("select")     -- select held?
btnp("a")         -- was A just pressed this frame?

-- d-pad
btn("up")         -- d-pad directions
btn("down")
btn("left")
btn("right")
dpad()            -- returns dx, dy (-1/0/1, -1/0/1)

-- analog sticks
stick(0)          -- returns x, y (-1.0 to 1.0) of first stick
stick(1)          -- second stick
```

If a game calls `btn("a")` but the face has no A button → `false`.
If a game calls `stick(0)` but no stick exists → `0, 0`.
Games gracefully degrade. The face design is a visual requirements spec.

### Audio

```lua
sfx(freq, dur, wave)   -- freq Hz, dur seconds, wave: 0=square 1=saw 2=tri 3=noise
beep(freq, dur)         -- shorthand: square wave
note("C4", 0.2)         -- musical note name → frequency
```

Web Audio oscillators on phone, PWM buzzer on MCU. No tracker/sequencer — just "make a beep." Advanced users chain calls with timers.

### Math

```lua
rnd(n)        -- random float 0 to n (0 to 1 if no arg)
flr(x)        -- math.floor
ceil(x)       -- math.ceil
abs(x)        -- math.abs
sin(x)        -- math.sin (radians)
cos(x)        -- math.cos
atan2(y, x)   -- y-first like PICO-8
min(a, b)     -- math.min
max(a, b)     -- math.max
mid(a, b, c)  -- clamp: middle value of three
sgn(x)        -- sign: -1, 0, or 1
```

Standard radians for trig (not PICO-8's 0–1 turns). Transferable to real math.

### Summary

| Category  | Functions | Count |
|-----------|-----------|-------|
| Lifecycle | `_init`, `_update`, `_draw` | 3 |
| Screen    | `screen.w`, `screen.h`, `screen.name` | 3 |
| Drawing   | `cls`, `color`, `pix`, `line`, `rect`, `rectfill`, `circ`, `circfill`, `tri`, `trifill` | 10 |
| Text      | `print` | 1 |
| Sprites   | `spr`, `sspr`, `fget`, `fset` | 4 |
| Map       | `map`, `mget`, `mset` | 3 |
| Input     | `btn`, `btnp`, `dpad`, `stick` | 4 |
| Audio     | `sfx`, `beep`, `note` | 3 |
| Math      | `rnd`, `flr`, `ceil`, `abs`, `sin`, `cos`, `atan2`, `min`, `max`, `mid`, `sgn` | 11 |
| **Total** | | **42** |

---

## Screen Modules

Screen modules are based on real display chips used in MCU projects. The face designer offers a catalog of modules with accurate resolutions and color capabilities.

| Module   | Resolution | Colors | Shape  | Size  | Vibe                      |
|----------|-----------|--------|--------|-------|---------------------------|
| SSD1306  | 128x64    | mono   | rect   | 0.96" | minimal, calculator       |
| SSD1306L | 128x32    | mono   | rect   | 0.91" | tiny ticker, minimal      |
| ST7735s  | 128x128   | 65K    | rect   | 1.44" | tiny color, Game Boy-ish  |
| ST7735r  | 160x80    | 65K    | rect   | 0.96" | slim band, status bar     |
| ST7789sq | 240x240   | 65K    | rect   | 1.3"  | the sweet spot            |
| ST7789t  | 135x240   | 65K    | rect   | 1.14" | phone-like, T-Display     |
| GC9A01   | 240x240   | 65K    | round  | 1.28" | smartwatch, unique        |
| ILI9341  | 320x240   | 65K    | rect   | 2.4"  | big, ambitious            |

### Properties

```javascript
screens = {
  SSD1306:  { w: 128, h: 64,  color: "mono", shape: "rect"  },
  SSD1306L: { w: 128, h: 32,  color: "mono", shape: "rect"  },
  ST7735s:  { w: 128, h: 128, color: "65k",  shape: "rect"  },
  ST7735r:  { w: 160, h: 80,  color: "65k",  shape: "rect"  },
  ST7789sq: { w: 240, h: 240, color: "65k",  shape: "rect"  },
  ST7789t:  { w: 135, h: 240, color: "65k",  shape: "rect"  },
  GC9A01:   { w: 240, h: 240, color: "65k",  shape: "round" },
  ILI9341:  { w: 320, h: 240, color: "65k",  shape: "rect"  },
};
```

### Rotation

Modules can be placed at 0/90/180/270 degrees in the face designer. A 160x80 ST7735r rotated 90 degrees becomes an 80x160 tall screen. `screen.w` and `screen.h` reflect the rotated dimensions — game code never needs to know about orientation.

### Monochrome Handling

On mono screens (SSD1306 variants), palette colors auto-threshold by luminance: below 50% → off pixel, above 50% → on pixel. High-contrast games (black bg + bright fg) look great. Subtle gradients won't work — that's a real hardware constraint and a design teaching moment.

### Round Screen (GC9A01)

`screen.shape == "round"` means pixels outside the inscribed circle are clipped. The runtime applies a circular mask. Games must account for missing corners — a fun creative constraint.

---

## Cartridge Format

A Geode cartridge contains all sections needed to reconstruct the console and run the game.

### Sections

```
┌─────────────────────────┐
│ face spec    (~100 B)   │  screen module + rotation + control layout
├─────────────────────────┤
│ palette      (48 B)     │  16 colors x RGB (3 bytes each)
├─────────────────────────┤
│ sprite sheet  (0-8 KB)  │  4-bit palette-indexed, 8x8 cells
├─────────────────────────┤
│ sprite flags  (0-256 B) │  1 byte per sprite (8 boolean flags)
├─────────────────────────┤
│ map data     (0-1 KB+)  │  tile indices, variable size
├─────────────────────────┤
│ lua code     (variable) │  the game logic
└─────────────────────────┘
```

All sections optional except face spec + Lua code.

### Compression

Same approach as GCUES: deflate-raw + base64 for QR delivery. Sprite sheets and tilemaps compress extremely well (repetitive palette indices, repeated tiles). Estimated compressed sizes:

| Section      | Raw        | Compressed     |
|-------------|------------|----------------|
| Face spec   | ~100 B     | ~60 B          |
| Palette     | 48 B       | ~30 B          |
| Sprite sheet| up to 8 KB | ~1-3 KB        |
| Sprite flags| up to 256 B| ~50 B          |
| Map data    | ~1 KB      | ~200-500 B     |
| Lua code    | ~2-3 KB    | ~1-2 KB        |
| **Total**   |            | **~3-6 KB**    |

QR budget (version 40, ECC-L, compressed + base64): ~4-5 KB usable.

Minimal games (no sprites, no map) fit easily. Full games with sprite sheets and maps push the limit but are viable with good compression. Games distributed via file import or paste have no size limit.

### Face Spec Detail

```
screen module:  1 byte (enum)
rotation:       1 byte (0/90/180/270)
shell color:    3 bytes (RGB)
component count: 1 byte

per component:
  type:         1 byte (enum: button, dpad, stick, etc.)
  id/label:     1 byte (enum: a, b, start, select, etc.)
  x, y:         2 bytes each (position on face)
  size variant:  1 byte (small/medium/large)
  = ~7 bytes per component

10 components x 7 bytes = ~76 bytes
total face spec: ~82 bytes
```

### Metadata Comment

Like GCUES, cartridges carry a metadata comment outside the compressed payload:

```
<!-- geode screen:ST7789sq; title:My Game; author:Alice; desc:A fun game -->
```

Readable by the scanner without inflating the payload.

---

## Face Designer

The face designer is a 2D drag-and-drop editor for designing the front panel of a virtual handheld. Shared between Press and Workshop.

### Components Catalog

**Screens:**
All modules from the screen catalog above.

**Controls:**
- D-pad (4-way directional)
- Button (labeled: A, B, X, Y, L, R, or custom)
- Start / Select buttons
- Analog stick (returns -1.0 to 1.0 per axis)
- Possibly: rotary encoder, slider, toggle switch

**Decorative:**
- Label text (console name, etc.)
- Shell color / shape

### Interaction on Phone

When a card is scanned, the phone renders the face design:
- Screen area shows the game canvas at the correct resolution
- Controls become touch targets (d-pad, buttons, sticks)
- The whole face fills the phone screen
- If the face is landscape-oriented, the player rotates their phone

### Retro Gadgets Inspiration

The face designer is conceptually similar to [Retro Gadgets](https://store.steampowered.com/app/1730260/Retro_Gadgets/) (Steam game where you build custom handhelds), but:
- 2D front-face only (not 3D)
- Output is a QR card (not a sim)
- Web-based, not desktop
- Tied to real hardware via Stockwerk

---

## Workshop

The workshop lives at `etc/geode/workshop/`, separate from Patchbay (which has LLM/bot/agent content not suited for a teen audience).

### Format

Self-contained single HTML file (built from src/workshop/). Interactive panels embed the Geode runtime and face designer for learn-by-doing exercises.

### Tentative Chapter Arc

1. **Choose Your Screen** — display modules, resolution, color depth, pixel density
2. **Design Your Console** — face designer: place screen, add d-pad + buttons
3. **Hello World** — `_draw()`, `cls()`, `print()`, see it on YOUR screen
4. **Drawing** — `line()`, `rect()`, `circ()`, colors, the palette
5. **The Game Loop** — `_update(dt)`, frame-by-frame thinking, movement
6. **Input** — `btn()`, `btnp()`, `dpad()`, controlling a character
7. **Paint Your Character** — sprite editor, `spr()`, animation frames
8. **Build a World** — map editor, `map()`, `mget()`, tile-based levels
9. **Collision** — sprite flags, `fget()`, solid tiles, pickups, hazards
10. **Sound** — `sfx()`, `beep()`, `note()`, juice and feedback
11. **Game State** — score, lives, win/lose, title screen, restart
12. **Polish** — screen shake, particles, difficulty curves
13. **Your Card** — use the Press to package as QR card, print it
14. **Trade** — scan someone else's card, play their console

### Take-Home Artifacts

Each chapter produces a playable cartridge. The final chapter produces a printed card.

---

## Open Questions

- [ ] Exact Wasmoon vendoring process (download dist, base64 the .wasm, glue code)
- [ ] Pixel font choice (4x6, 5x7, or other?) — needs to be legible at 128x64
- [ ] Default palette (PICO-8's 16 colors? DB16? Custom?)
- [ ] Sprite sheet max size — 256 sprites? Scale with screen module?
- [ ] Map max size — fixed? Variable? Per-cartridge?
- [ ] Face designer snap grid — mm-based (like Stockwerk) or pixel-based?
- [ ] Analog stick touch implementation — virtual stick circle? How big?
- [ ] Card visual design — GCUES-style TCG cards? Different format?
- [ ] PWA / service worker for offline play
- [ ] Cartridge binary format: exact byte layout and version field
- [ ] Workshop: bilingual EN/PT like the rest of the repo?
- [ ] Integration path: workshop as standalone → later part of a kid-friendly series?
- [ ] Bridge to Stockwerk: how explicit? Link? Shared components?
