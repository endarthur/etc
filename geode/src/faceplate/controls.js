// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Controls Catalog
// Component types, IDs, size variants, and physical dimensions for the
// faceplate designer. Pure data — no imports, no side effects.
// ─────────────────────────────────────────────────────────────────────────────

// ── Type enums (serialized as 1 byte) ────────────────────────────────────────
export const CTRL_TYPES = { dpad: 1, button: 2, stick: 3, meta: 4 };

// ── ID/label enums (serialized as 1 byte) ────────────────────────────────────
export const CTRL_IDS = {
  a: 1, b: 2, x: 3, y: 4, l: 5, r: 6,
  start: 7, select: 8,
  dpad: 9,
  stick0: 10, stick1: 11,
};

// ── Size variant enums ───────────────────────────────────────────────────────
export const CTRL_SIZES = { sm: 0, md: 1, lg: 2 };

// ── Reverse lookup maps ──────────────────────────────────────────────────────
export const CTRL_TYPES_REV = /* @__PURE__ */ Object.fromEntries(
  Object.entries(CTRL_TYPES).map(([k, v]) => [v, k])
);
export const CTRL_IDS_REV = /* @__PURE__ */ Object.fromEntries(
  Object.entries(CTRL_IDS).map(([k, v]) => [v, k])
);
export const CTRL_SIZES_REV = /* @__PURE__ */ Object.fromEntries(
  Object.entries(CTRL_SIZES).map(([k, v]) => [v, k])
);

// ── Physical dimensions (mm) per type + size variant ─────────────────────────
// Used by the faceplate designer for placement and hit-testing.
export const CONTROLS = {
  dpad: {
    sm: { w: 28, h: 28 },
    md: { w: 36, h: 36 },
    lg: { w: 44, h: 44 },
  },
  button: {
    sm: { w: 8,  h: 8  },
    md: { w: 12, h: 12 },
    lg: { w: 16, h: 16 },
  },
  stick: {
    sm: { w: 20, h: 20 },
    md: { w: 28, h: 28 },
    lg: { w: 36, h: 36 },
  },
  meta: {
    sm: { w: 12, h: 6  },
    md: { w: 16, h: 8  },
    lg: { w: 20, h: 10 },
  },
};

export function resolveControl(type, size) {
  const spec = CONTROLS[type];
  if (!spec) return null;
  return spec[size || 'md'] || spec.md;
}
