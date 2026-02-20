// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
const STATE = {
  provider: '',
  apiKey: '',
  model: '',
  ollamaUrl: 'http://localhost:11434',
  customUrl: '',
  tgToken: '',
  providerKeys: {},     // per-provider API keys { nanogpt:'sk-...', groq:'gsk_...' }
  providerModels: {},   // per-provider model selection { groq:'llama-3.3-70b', nanogpt:'...' }
  wsHandle: null,       // FSAA directory handle
  wsReady: false,
  conversation: [],     // messages array for LLM
  totalTokens: 0,
  lastRaw: null,        // last request/response for inspector
  agentBusy: false,
  _hasPassphrase: false,
  _passphrase: null,    // cached in memory only, never persisted
  // Routing (Ch.7)
  routing: {
    enabled: false,
    strategy: 'single',  // 'single' | 'cost' | 'fallback'
    routes: {
      tool_select: { provider: '', model: '' },
      generate:    { provider: '', model: '' },
      summarize:   { provider: '', model: '' },
    },
    fallbackChain: [],
    fallbackTimeout: 5000,
  },
  routingStats: {},  // { 'provider:model': { calls:0, totalMs:0 } }
  notificationsEnabled: true,  // global toggle for desktop notifications
  // Safety overrides
  safety: {
    sandboxNetwork: false,      // allow api.fetchUrl in dynamic skills
    autoApproveNetwork: false,  // skip termConfirm for fetch_url
    autoApproveDelete: false,   // skip termConfirm for delete_file
    autoApproveMic: false,      // skip termConfirm for listen
    autoApproveLocation: false, // skip termConfirm for get_location
    hideBadge: false,           // hide UNSAFE badge
    petEnabled: false,
  },
  stats: { bootTime: null, messageCount: 0, toolCalls: {}, totalTokens: 0 },
};

// ═══════════════════════════════════════════
// TOOL REGISTRY (Ch.2)
// ═══════════════════════════════════════════
const TOOLS = {};
const MAX_ITERATIONS = 10;

function registerTool(name, description, parameters, handler) {
  TOOLS[name] = { name, description, parameters, handler };
  updateToolsInspector();
}

function getToolSchemas() {
  return Object.values(TOOLS).map(t => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.parameters },
  }));
}

function updateToolsInspector() {
  const el = document.getElementById('tools-json');
  if (el) el.textContent = JSON.stringify(getToolSchemas(), null, 2);
}

// ═══════════════════════════════════════════
// PATH SAFETY
// ═══════════════════════════════════════════
function safePath(path) {
  if (!path || typeof path !== 'string') return false;
  if (path.includes('..')) return false;
  if (/^[A-Za-z]:/.test(path) || path.startsWith('/')) return false;
  return true;
}

async function resolveDir(handle, segments) {
  let current = handle;
  for (const seg of segments) {
    if (seg === '.' || seg === '') continue;
    current = await current.getDirectoryHandle(seg);
  }
  return current;
}

async function resolveFile(handle, path) {
  const parts = path.replace(/\\/g, '/').split('/');
  const fileName = parts.pop();
  const dir = await resolveDir(handle, parts);
  return { dir, fileName };
}

const DEFAULT_SOUL = `You are a helpful personal assistant that lives in a folder on the user's computer.

You are friendly, concise, and practical. When the user asks you to remember something, acknowledge it warmly.

You respond in the same language the user writes to you.`;

// ═══════════════════════════════════════════
// THEMES (RelayKVM-aligned)
// ═══════════════════════════════════════════
const THEMES = {
  dark: {
    name: 'Dark', isDark: true,
    vars: {
      '--bg':'#111114','--surface':'#1c1c21','--window-bg':'#18181d','--title-bg':'#222228',
      '--border':'#2a2a32','--border-focus':'#3a3a48','--text':'#d8d8dc','--text-dim':'#78787f',
      '--text-faint':'#48484f','--green':'#4ade80','--cyan':'#22d3ee','--amber':'#fbbf24',
      '--red':'#f87171','--purple':'#a78bfa','--blue':'#60a5fa','--pink':'#f472b6',
      '--dock-bg':'rgba(25,25,30,0.92)','--dot-color':'rgba(255,255,255,0.04)',
      '--overlay-subtle':'rgba(255,255,255,0.04)','--overlay-hover':'rgba(255,255,255,0.06)',
      '--overlay-strong':'rgba(255,255,255,0.08)','--overlay-faint':'rgba(255,255,255,0.02)',
      '--overlay-faintest':'rgba(255,255,255,0.03)',
      '--shadow-color':'rgba(0,0,0,0.5)','--shadow-heavy':'rgba(0,0,0,0.6)',
      '--statusbar-bg':'rgba(17,17,20,0.95)'
    }
  },
  light: {
    name: 'Light', isDark: false,
    vars: {
      '--bg':'#C8C8C8','--surface':'#D8D8D8','--window-bg':'#E4E4E4','--title-bg':'#ECECEC',
      '--border':'#A0A0A0','--border-focus':'#888888','--text':'#1A1A1A','--text-dim':'#555555',
      '--text-faint':'#888888','--green':'#16a34a','--cyan':'#0891b2','--amber':'#d97706',
      '--red':'#dc2626','--purple':'#7c3aed','--blue':'#2563eb','--pink':'#db2777',
      '--dock-bg':'rgba(210,210,215,0.92)','--dot-color':'rgba(0,0,0,0.06)',
      '--overlay-subtle':'rgba(0,0,0,0.04)','--overlay-hover':'rgba(0,0,0,0.06)',
      '--overlay-strong':'rgba(0,0,0,0.08)','--overlay-faint':'rgba(0,0,0,0.02)',
      '--overlay-faintest':'rgba(0,0,0,0.03)',
      '--shadow-color':'rgba(0,0,0,0.15)','--shadow-heavy':'rgba(0,0,0,0.25)',
      '--statusbar-bg':'rgba(240,240,242,0.95)'
    }
  },
  industrial: {
    name: 'Industrial', isDark: true,
    vars: {
      '--bg':'#0D0F12','--surface':'#1A1D21','--window-bg':'#151820','--title-bg':'#1E2228',
      '--border':'#2A2E35','--border-focus':'#3A3F48','--text':'#E8EAED','--text-dim':'#808890',
      '--text-faint':'#505860','--green':'#00FF66','--cyan':'#00FF66','--amber':'#FFAA00',
      '--red':'#FF3333','--purple':'#66AAFF','--blue':'#4488FF','--pink':'#FF66AA',
      '--dock-bg':'rgba(13,15,18,0.92)','--dot-color':'rgba(0,255,102,0.04)',
      '--overlay-subtle':'rgba(255,255,255,0.04)','--overlay-hover':'rgba(255,255,255,0.06)',
      '--overlay-strong':'rgba(255,255,255,0.08)','--overlay-faint':'rgba(255,255,255,0.02)',
      '--overlay-faintest':'rgba(255,255,255,0.03)',
      '--shadow-color':'rgba(0,0,0,0.5)','--shadow-heavy':'rgba(0,0,0,0.6)',
      '--statusbar-bg':'rgba(13,15,18,0.95)'
    }
  },
  signal: {
    name: 'Signal', isDark: true,
    vars: {
      '--bg':'#0D0F12','--surface':'#1A1D21','--window-bg':'#151820','--title-bg':'#1E2228',
      '--border':'#2A2E35','--border-focus':'#3A3F48','--text':'#E8EAED','--text-dim':'#808890',
      '--text-faint':'#505860','--green':'#0099FF','--cyan':'#0099FF','--amber':'#FFAA00',
      '--red':'#FF3333','--purple':'#8866FF','--blue':'#0099FF','--pink':'#FF6699',
      '--dock-bg':'rgba(13,15,18,0.92)','--dot-color':'rgba(0,153,255,0.04)',
      '--overlay-subtle':'rgba(255,255,255,0.04)','--overlay-hover':'rgba(255,255,255,0.06)',
      '--overlay-strong':'rgba(255,255,255,0.08)','--overlay-faint':'rgba(255,255,255,0.02)',
      '--overlay-faintest':'rgba(255,255,255,0.03)',
      '--shadow-color':'rgba(0,0,0,0.5)','--shadow-heavy':'rgba(0,0,0,0.6)',
      '--statusbar-bg':'rgba(13,15,18,0.95)'
    }
  },
  amber: {
    name: 'Amber', isDark: true,
    vars: {
      '--bg':'#0D0F12','--surface':'#1A1D21','--window-bg':'#151820','--title-bg':'#1E2228',
      '--border':'#2A2E35','--border-focus':'#3A3F48','--text':'#E8EAED','--text-dim':'#808890',
      '--text-faint':'#505860','--green':'#FFAA00','--cyan':'#FFAA00','--amber':'#FF6600',
      '--red':'#FF3333','--purple':'#FFCC44','--blue':'#FFAA44','--pink':'#FF8866',
      '--dock-bg':'rgba(13,15,18,0.92)','--dot-color':'rgba(255,170,0,0.04)',
      '--overlay-subtle':'rgba(255,255,255,0.04)','--overlay-hover':'rgba(255,255,255,0.06)',
      '--overlay-strong':'rgba(255,255,255,0.08)','--overlay-faint':'rgba(255,255,255,0.02)',
      '--overlay-faintest':'rgba(255,255,255,0.03)',
      '--shadow-color':'rgba(0,0,0,0.5)','--shadow-heavy':'rgba(0,0,0,0.6)',
      '--statusbar-bg':'rgba(13,15,18,0.95)'
    }
  },
  koma: {
    name: 'Koma', isDark: true,
    vars: {
      '--bg':'#0F0F0F','--surface':'#1A1A1A','--window-bg':'#202020','--title-bg':'#282828',
      '--border':'#333333','--border-focus':'#444444','--text':'#E0E0E0','--text-dim':'#888888',
      '--text-faint':'#555555','--green':'#00FF88','--cyan':'#FF6B35','--amber':'#FF6B35',
      '--red':'#FF3333','--purple':'#CC66FF','--blue':'#4D9FFF','--pink':'#FF66AA',
      '--dock-bg':'rgba(15,15,15,0.92)','--dot-color':'rgba(255,107,53,0.04)',
      '--overlay-subtle':'rgba(255,255,255,0.04)','--overlay-hover':'rgba(255,255,255,0.06)',
      '--overlay-strong':'rgba(255,255,255,0.08)','--overlay-faint':'rgba(255,255,255,0.02)',
      '--overlay-faintest':'rgba(255,255,255,0.03)',
      '--shadow-color':'rgba(0,0,0,0.5)','--shadow-heavy':'rgba(0,0,0,0.6)',
      '--statusbar-bg':'rgba(15,15,15,0.95)'
    }
  },
  'ctp-mocha': {
    name: 'Catppuccin Mocha', isDark: true,
    vars: {
      '--bg':'#1E1E2E','--surface':'#313244','--window-bg':'#24243a','--title-bg':'#313244',
      '--border':'#45475a','--border-focus':'#585b70','--text':'#CDD6F4','--text-dim':'#A6ADC8',
      '--text-faint':'#6C7086','--green':'#A6E3A1','--cyan':'#CBA6F7','--amber':'#FAB387',
      '--red':'#F38BA8','--purple':'#CBA6F7','--blue':'#89B4FA','--pink':'#F5C2E7',
      '--dock-bg':'rgba(30,30,46,0.92)','--dot-color':'rgba(203,166,247,0.04)',
      '--overlay-subtle':'rgba(255,255,255,0.04)','--overlay-hover':'rgba(255,255,255,0.06)',
      '--overlay-strong':'rgba(255,255,255,0.08)','--overlay-faint':'rgba(255,255,255,0.02)',
      '--overlay-faintest':'rgba(255,255,255,0.03)',
      '--shadow-color':'rgba(0,0,0,0.5)','--shadow-heavy':'rgba(0,0,0,0.6)',
      '--statusbar-bg':'rgba(30,30,46,0.95)'
    }
  },
  'ctp-latte': {
    name: 'Catppuccin Latte', isDark: false,
    vars: {
      '--bg':'#EFF1F5','--surface':'#E6E9EF','--window-bg':'#EFF1F5','--title-bg':'#DCE0E8',
      '--border':'#ACB0BE','--border-focus':'#9CA0AE','--text':'#4C4F69','--text-dim':'#6C6F85',
      '--text-faint':'#8C8FA1','--green':'#40A02B','--cyan':'#8839EF','--amber':'#FE640B',
      '--red':'#D20F39','--purple':'#8839EF','--blue':'#1E66F5','--pink':'#EA76CB',
      '--dock-bg':'rgba(230,233,239,0.92)','--dot-color':'rgba(136,57,239,0.04)',
      '--overlay-subtle':'rgba(0,0,0,0.04)','--overlay-hover':'rgba(0,0,0,0.06)',
      '--overlay-strong':'rgba(0,0,0,0.08)','--overlay-faint':'rgba(0,0,0,0.02)',
      '--overlay-faintest':'rgba(0,0,0,0.03)',
      '--shadow-color':'rgba(0,0,0,0.15)','--shadow-heavy':'rgba(0,0,0,0.25)',
      '--statusbar-bg':'rgba(239,241,245,0.95)'
    }
  },
  pineapple: {
    name: 'Pineapple', isDark: false,
    vars: {
      '--bg':'#E8E8ED','--surface':'#F0F0F5','--window-bg':'#FFFFFF','--title-bg':'#E8E8ED',
      '--border':'#C5C5CA','--border-focus':'#007AFF','--text':'#1D1D1F','--text-dim':'#6E6E73',
      '--text-faint':'#AEAEB2','--green':'#34C759','--cyan':'#007AFF','--amber':'#FF9500',
      '--red':'#FF3B30','--purple':'#AF52DE','--blue':'#007AFF','--pink':'#FF2D55',
      '--dock-bg':'rgba(232,232,237,0.92)','--dot-color':'rgba(0,0,0,0.05)',
      '--overlay-subtle':'rgba(0,0,0,0.03)','--overlay-hover':'rgba(0,0,0,0.05)',
      '--overlay-strong':'rgba(0,0,0,0.07)','--overlay-faint':'rgba(0,0,0,0.02)',
      '--overlay-faintest':'rgba(0,0,0,0.015)',
      '--shadow-color':'rgba(0,0,0,0.12)','--shadow-heavy':'rgba(0,0,0,0.2)',
      '--statusbar-bg':'rgba(242,242,247,0.95)'
    }
  },
  gcu95: {
    name: 'GCU95', isDark: false,
    vars: {
      '--bg':'#008080','--surface':'#C0C0C0','--window-bg':'#C0C0C0','--title-bg':'#000080',
      '--border':'#808080','--border-focus':'#000080','--text':'#000000','--text-dim':'#444444',
      '--text-faint':'#808080','--green':'#008000','--cyan':'#000080','--amber':'#808000',
      '--red':'#800000','--purple':'#800080','--blue':'#000080','--pink':'#C0C0C0',
      '--dock-bg':'rgba(192,192,192,0.95)','--dot-color':'rgba(0,0,0,0.06)',
      '--overlay-subtle':'rgba(0,0,0,0.04)','--overlay-hover':'rgba(0,0,0,0.06)',
      '--overlay-strong':'rgba(0,0,0,0.08)','--overlay-faint':'rgba(0,0,0,0.02)',
      '--overlay-faintest':'rgba(0,0,0,0.03)',
      '--shadow-color':'rgba(0,0,0,0.2)','--shadow-heavy':'rgba(0,0,0,0.3)',
      '--statusbar-bg':'rgba(192,192,192,0.95)'
    }
  },
  luna: {
    name: 'Luna', isDark: false,
    vars: {
      '--bg':'#3A6EA5','--surface':'#D4D0C8','--window-bg':'#ECE9D8','--title-bg':'#0054E3',
      '--border':'#808080','--border-focus':'#0054E3','--text':'#000000','--text-dim':'#444444',
      '--text-faint':'#808080','--green':'#3C9A3C','--cyan':'#0054E3','--amber':'#FF8C00',
      '--red':'#CC0000','--purple':'#800080','--blue':'#0054E3','--pink':'#CC3399',
      '--dock-bg':'rgba(212,208,200,0.95)','--dot-color':'rgba(0,0,0,0.06)',
      '--overlay-subtle':'rgba(0,0,0,0.04)','--overlay-hover':'rgba(0,0,0,0.06)',
      '--overlay-strong':'rgba(0,0,0,0.08)','--overlay-faint':'rgba(0,0,0,0.02)',
      '--overlay-faintest':'rgba(0,0,0,0.03)',
      '--shadow-color':'rgba(0,0,0,0.15)','--shadow-heavy':'rgba(0,0,0,0.25)',
      '--statusbar-bg':'rgba(212,208,200,0.95)'
    }
  },
  guru: {
    name: 'Guru', isDark: true,
    vars: {
      '--bg':'#0055AA','--surface':'#0055AA','--window-bg':'#AAAAAA','--title-bg':'#0055AA',
      '--border':'#000000','--border-focus':'#FF8800','--text':'#FFFFFF','--text-dim':'#CCCCCC',
      '--text-faint':'#888888','--green':'#00CC00','--cyan':'#FF8800','--amber':'#FF8800',
      '--red':'#FF0000','--purple':'#AA00AA','--blue':'#0055AA','--pink':'#FF66AA',
      '--dock-bg':'rgba(0,85,170,0.95)','--dot-color':'rgba(255,255,255,0.04)',
      '--overlay-subtle':'rgba(255,255,255,0.04)','--overlay-hover':'rgba(255,255,255,0.06)',
      '--overlay-strong':'rgba(255,255,255,0.08)','--overlay-faint':'rgba(255,255,255,0.02)',
      '--overlay-faintest':'rgba(255,255,255,0.03)',
      '--shadow-color':'rgba(0,0,0,0.5)','--shadow-heavy':'rgba(0,0,0,0.6)',
      '--statusbar-bg':'rgba(0,85,170,0.95)'
    }
  },
  slab: {
    name: 'Slab', isDark: true,
    vars: {
      '--bg':'#333333','--surface':'#666666','--window-bg':'#AAAAAA','--title-bg':'#999999',
      '--border':'#222222','--border-focus':'#444444','--text':'#000000','--text-dim':'#333333',
      '--text-faint':'#666666','--green':'#339933','--cyan':'#336699','--amber':'#CC9900',
      '--red':'#CC3333','--purple':'#663399','--blue':'#336699','--pink':'#CC6699',
      '--dock-bg':'rgba(51,51,51,0.95)','--dot-color':'rgba(255,255,255,0.04)',
      '--overlay-subtle':'rgba(255,255,255,0.04)','--overlay-hover':'rgba(255,255,255,0.06)',
      '--overlay-strong':'rgba(255,255,255,0.08)','--overlay-faint':'rgba(255,255,255,0.02)',
      '--overlay-faintest':'rgba(255,255,255,0.03)',
      '--shadow-color':'rgba(0,0,0,0.5)','--shadow-heavy':'rgba(0,0,0,0.6)',
      '--statusbar-bg':'rgba(51,51,51,0.95)'
    }
  },
  motif: {
    name: 'Motif', isDark: true,
    vars: {
      '--bg':'#5F7B8A','--surface':'#ACA899','--window-bg':'#ACA899','--title-bg':'#88666B',
      '--border':'#6B6B60','--border-focus':'#88666B','--text':'#000000','--text-dim':'#3D3D38',
      '--text-faint':'#6B6B60','--green':'#669966','--cyan':'#5F7B8A','--amber':'#CC9966',
      '--red':'#993333','--purple':'#7B6B8A','--blue':'#5F7B8A','--pink':'#8A6B7B',
      '--dock-bg':'rgba(95,123,138,0.95)','--dot-color':'rgba(0,0,0,0.06)',
      '--overlay-subtle':'rgba(0,0,0,0.04)','--overlay-hover':'rgba(0,0,0,0.06)',
      '--overlay-strong':'rgba(0,0,0,0.08)','--overlay-faint':'rgba(0,0,0,0.02)',
      '--overlay-faintest':'rgba(0,0,0,0.03)',
      '--shadow-color':'rgba(0,0,0,0.3)','--shadow-heavy':'rgba(0,0,0,0.4)',
      '--statusbar-bg':'rgba(95,123,138,0.95)'
    }
  }
};

// ═══════════════════════════════════════════
// WALLPAPERS
// ═══════════════════════════════════════════
const WALLPAPERS = {
  dots: {
    name: 'Dot Grid',
    css: { background:'radial-gradient(circle,var(--dot-color) 1px,transparent 1px)', backgroundSize:'24px 24px', backgroundPosition:'12px 12px' }
  },
  solid: {
    name: 'Solid',
    css: { background:'var(--bg)', backgroundSize:'', backgroundPosition:'' }
  },
  grid: {
    name: 'Grid',
    css: { background:'repeating-linear-gradient(0deg,var(--dot-color),var(--dot-color) 1px,transparent 1px,transparent 24px),repeating-linear-gradient(90deg,var(--dot-color),var(--dot-color) 1px,transparent 1px,transparent 24px)', backgroundSize:'24px 24px', backgroundPosition:'0 0' }
  },
  gradient1: {
    name: 'Dusk',
    css: { background:'linear-gradient(135deg,var(--bg) 0%,color-mix(in srgb,var(--cyan) 8%,var(--bg)) 50%,color-mix(in srgb,var(--purple) 6%,var(--bg)) 100%)', backgroundSize:'', backgroundPosition:'' }
  },
  gradient2: {
    name: 'Ocean',
    css: { background:'linear-gradient(180deg,var(--bg) 0%,color-mix(in srgb,var(--blue) 10%,var(--bg)) 60%,color-mix(in srgb,var(--cyan) 8%,var(--bg)) 100%)', backgroundSize:'', backgroundPosition:'' }
  }
};

// ═══════════════════════════════════════════
// APPEARANCE STATE + FUNCTIONS
// ═══════════════════════════════════════════
let _currentThemeId = 'dark';
let _currentWallpaperId = 'dots';
let _customTheme = null;
let _customWallpaperImage = null;
let _customWallpaperColor = null;
let _appliedVarKeys = [];

// ═══════════════════════════════════════════
// CHROME STYLES
// ═══════════════════════════════════════════
let _currentChromeId = 'pineapple';
const CHROME_STYLES = {
  pineapple:  { name: 'Pineapple', emoji: '🍍', defaultTheme: 'pineapple' },
  gcu95:      { name: 'GCU95', emoji: '🪟', defaultTheme: 'gcu95' },
  luna:       { name: 'Luna', emoji: '🌙', defaultTheme: 'luna' },
  guru:       { name: 'Guru', emoji: '💾', defaultTheme: 'guru' },
  slab:       { name: 'Slab', emoji: '⬛', defaultTheme: 'slab' },
  motif:      { name: 'Motif', emoji: '🖳', defaultTheme: 'motif' }
};

function applyChromeStyle(id) {
  for (const key of Object.keys(CHROME_STYLES)) {
    document.body.classList.remove('chrome-' + key);
  }
  if (id !== 'pineapple') document.body.classList.add('chrome-' + id);
  _currentChromeId = id;
}

function applyTheme(id) {
  const root = document.documentElement;
  for (const key of _appliedVarKeys) root.style.removeProperty(key);
  _appliedVarKeys = [];
  let theme;
  if (id === 'custom' && _customTheme) {
    theme = _customTheme;
  } else {
    theme = THEMES[id];
    if (!theme) theme = THEMES.dark;
  }
  for (const [key, val] of Object.entries(theme.vars)) {
    root.style.setProperty(key, val);
    _appliedVarKeys.push(key);
  }
  _currentThemeId = id;
}

function applyWallpaper(id) {
  const desktop = document.getElementById('desktop');
  if (!desktop) return;
  if (id === 'custom-image' && _customWallpaperImage) {
    desktop.style.background = `url(${_customWallpaperImage}) center/cover no-repeat`;
    desktop.style.backgroundSize = 'cover';
    desktop.style.backgroundPosition = 'center';
  } else if (id === 'custom-color' && _customWallpaperColor) {
    desktop.style.background = _customWallpaperColor;
    desktop.style.backgroundSize = '';
    desktop.style.backgroundPosition = '';
  } else {
    const wp = WALLPAPERS[id];
    if (!wp) { _currentWallpaperId = id; return; }
    desktop.style.background = wp.css.background;
    desktop.style.backgroundSize = wp.css.backgroundSize || '';
    desktop.style.backgroundPosition = wp.css.backgroundPosition || '';
  }
  _currentWallpaperId = id;
}

function saveAppearance() {
  try {
    localStorage.setItem('pb401-appearance', JSON.stringify({
      themeId: _currentThemeId,
      wallpaperId: _currentWallpaperId,
      chromeId: _currentChromeId,
      customTheme: _customTheme,
      customWallpaperImage: _customWallpaperImage,
      customWallpaperColor: _customWallpaperColor
    }));
  } catch(e) {}
}

function loadAppearance() {
  try {
    const raw = localStorage.getItem('pb401-appearance');
    if (raw) {
      const data = JSON.parse(raw);
      if (data.themeId) _currentThemeId = data.themeId;
      if (data.wallpaperId) _currentWallpaperId = data.wallpaperId;
      if (data.customTheme) _customTheme = data.customTheme;
      if (data.customWallpaperImage) _customWallpaperImage = data.customWallpaperImage;
      if (data.customWallpaperColor) _customWallpaperColor = data.customWallpaperColor;
      if (data.chromeId === 'macos') data.chromeId = 'pineapple';
      if (data.chromeId === 'win95') data.chromeId = 'gcu95';
      if (data.chromeId) _currentChromeId = data.chromeId;
    }
  } catch(e) {}
  applyTheme(_currentThemeId);
  applyChromeStyle(_currentChromeId);
  if (document.getElementById('desktop')) {
    applyWallpaper(_currentWallpaperId);
  } else {
    document.addEventListener('DOMContentLoaded', () => applyWallpaper(_currentWallpaperId));
  }
}

// ═══════════════════════════════════════════
// HSL HELPERS (for custom theme editor)
// ═══════════════════════════════════════════
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0))/6; break;
      case g: h = ((b-r)/d + 2)/6; break;
      case b: h = ((r-g)/d + 4)/6; break;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b2;
  if (s === 0) { r = g = b2 = l; }
  else {
    const hue2rgb = (p,q,t) => { if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p; };
    const q = l<0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l-q;
    r = hue2rgb(p,q,h+1/3); g = hue2rgb(p,q,h); b2 = hue2rgb(p,q,h-1/3);
  }
  const toHex = x => { const hx = Math.round(x*255).toString(16); return hx.length===1?'0'+hx:hx; };
  return '#'+toHex(r)+toHex(g)+toHex(b2);
}

function adjustL(hex, delta) {
  const [h,s,l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, Math.min(100, l + delta)));
}

// Load appearance synchronously at parse time (before boot)
loadAppearance();
