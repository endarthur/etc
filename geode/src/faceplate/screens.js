// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Screen Catalog
// Display chip specs for the 8 supported real modules.
// Pure data — no imports, no side effects.
// ─────────────────────────────────────────────────────────────────────────────

export const SCREENS = {
  SSD1306:  { id: 'SSD1306',  w: 128, h: 64,  color: 'mono', shape: 'rect',  size: 0.96 },
  SSD1306L: { id: 'SSD1306L', w: 128, h: 32,  color: 'mono', shape: 'rect',  size: 0.91 },
  ST7735s:  { id: 'ST7735s',  w: 128, h: 128, color: '65k',  shape: 'rect',  size: 1.44 },
  ST7735r:  { id: 'ST7735r',  w: 160, h: 80,  color: '65k',  shape: 'rect',  size: 0.96 },
  ST7789sq: { id: 'ST7789sq', w: 240, h: 240, color: '65k',  shape: 'rect',  size: 1.3  },
  ST7789t:  { id: 'ST7789t',  w: 135, h: 240, color: '65k',  shape: 'rect',  size: 1.14 },
  GC9A01:   { id: 'GC9A01',   w: 240, h: 240, color: '65k',  shape: 'round', size: 1.28 },
  ILI9341:  { id: 'ILI9341',  w: 320, h: 240, color: '65k',  shape: 'rect',  size: 2.4  },
};

export const DEFAULT_SCREEN = 'ST7789sq';

export function resolveScreen(id, rotation) {
  const entry = SCREENS[id] || SCREENS[DEFAULT_SCREEN];
  if (!entry) return null;

  const rot = (rotation || 0) % 360;
  const swap = (rot === 90 || rot === 270);
  return {
    id: entry.id,
    w: swap ? entry.h : entry.w,
    h: swap ? entry.w : entry.h,
    color: entry.color,
    shape: entry.shape,
    size: entry.size,
    rotation: rot,
  };
}
