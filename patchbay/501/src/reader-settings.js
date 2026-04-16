// ═══════════════════════════════════════════
// READER TYPOGRAPHY SETTINGS
// Applied to both the Phone Preview and exported reader.
// ═══════════════════════════════════════════

const READER_FONT_STACKS = {
  serif: `Georgia, 'Times New Roman', serif`,
  garamond: `'EB Garamond', Garamond, Georgia, serif`,
  sans: `system-ui, -apple-system, 'Segoe UI', sans-serif`,
  helvetica: `'Helvetica Neue', Helvetica, Arial, sans-serif`,
  mono: `'IBM Plex Mono', 'Courier New', monospace`,
};

const READER_THEMES = {
  cream:  { bg: '#faf8f5', text: '#2a2520', darkBg: null,      darkText: null },
  white:  { bg: '#ffffff', text: '#1a1a1a', darkBg: null,      darkText: null },
  sepia:  { bg: '#f4ecd8', text: '#4a3a1f', darkBg: null,      darkText: null },
  dark:   { bg: '#1a1714', text: '#d8d4c8', darkBg: '#1a1714', darkText: '#d8d4c8' },
  black:  { bg: '#000000', text: '#c8c8c8', darkBg: '#000000', darkText: '#c8c8c8' },
};

const DEFAULT_READER_SETTINGS = {
  font: 'serif',
  size: 18,
  lineHeight: 1.8,
  theme: 'cream',
  maxWidth: 640,
};

function getReaderSettings() {
  return { ...DEFAULT_READER_SETTINGS, ...(STATE.readerSettings || {}) };
}

function setReaderSetting(key, value) {
  if (!STATE.readerSettings) STATE.readerSettings = {};
  // Coerce numeric values
  if (key === 'size' || key === 'maxWidth') value = parseInt(value);
  if (key === 'lineHeight') value = parseFloat(value);
  STATE.readerSettings[key] = value;
  saveState();
  // Re-render phone preview with new settings
  const novel = STATE.novels[STATE.currentNovel];
  if (novel && typeof renderPhoneReader === 'function') renderPhoneReader(novel);
}

function resetReaderSettings() {
  STATE.readerSettings = {};
  saveState();
  // Reset UI controls
  document.getElementById('reader-font').value = 'serif';
  document.getElementById('reader-size').value = '18';
  document.getElementById('reader-size-val').textContent = '18';
  document.getElementById('reader-lh').value = '1.8';
  document.getElementById('reader-lh-val').textContent = '1.8';
  document.getElementById('reader-theme').value = 'cream';
  document.getElementById('reader-width').value = '640';
  document.getElementById('reader-width-val').textContent = '640';
  // Re-render preview
  const novel = STATE.novels[STATE.currentNovel];
  if (novel && typeof renderPhoneReader === 'function') renderPhoneReader(novel);
}

// Populate controls from saved state on boot
function initReaderSettingsUI() {
  const s = getReaderSettings();
  const fontEl = document.getElementById('reader-font');
  if (fontEl) fontEl.value = s.font;
  const sizeEl = document.getElementById('reader-size');
  if (sizeEl) { sizeEl.value = s.size; document.getElementById('reader-size-val').textContent = s.size; }
  const lhEl = document.getElementById('reader-lh');
  if (lhEl) { lhEl.value = s.lineHeight; document.getElementById('reader-lh-val').textContent = s.lineHeight; }
  const themeEl = document.getElementById('reader-theme');
  if (themeEl) themeEl.value = s.theme;
  const widthEl = document.getElementById('reader-width');
  if (widthEl) { widthEl.value = s.maxWidth; document.getElementById('reader-width-val').textContent = s.maxWidth; }
}

// Build CSS overrides to inject into the reader iframe/export
function buildReaderSettingsCss() {
  const s = getReaderSettings();
  const fontStack = READER_FONT_STACKS[s.font] || READER_FONT_STACKS.serif;
  const theme = READER_THEMES[s.theme] || READER_THEMES.cream;
  // Build a CSS block that overrides the reader's root variables
  let css = `:root{--reader-font:${fontStack};--reader-size:${s.size}px;--reader-lh:${s.lineHeight};--reader-max:${s.maxWidth}px;--reader-bg:${theme.bg};--reader-text:${theme.text};--bg:${theme.bg};--text:${theme.text}}`;
  // If theme locks dark colors, override the prefers-color-scheme:dark block
  if (theme.darkBg) {
    css += `@media(prefers-color-scheme:dark){:root{--reader-bg:${theme.darkBg};--reader-text:${theme.darkText};--bg:${theme.darkBg};--text:${theme.darkText}}}`;
  } else {
    // Light themes should NOT flip to dark based on OS preference
    css += `@media(prefers-color-scheme:dark){:root{--reader-bg:${theme.bg};--reader-text:${theme.text};--bg:${theme.bg};--text:${theme.text}}}`;
  }
  return css;
}
