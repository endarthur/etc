// ═══════════════════════════════════════════
// CORE STATE
// ═══════════════════════════════════════════
const STATE = {
  provider: null,
  apiKey: '',
  model: '',
  baseUrl: '',
  // Novel pipeline
  novels: [],          // Array of novel objects (bible, beats, chapters, covers)
  currentNovel: null,  // Index into novels[]
  // Course
  skulls: [false, false, false, false, false],
  courseMode: false,
  // Provider
  providerReady: false,
  // Prompt overrides (null = use default)
  prompts: {},
};

// ═══════════════════════════════════════════
// INDEXEDDB STORAGE
// Novels (heavy: chapters, covers) go in IDB.
// Lightweight config stays in localStorage for sync boot.
// ═══════════════════════════════════════════
const DB_NAME = 'pb501';
const DB_VERSION = 1;
let _db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (_db) return resolve(_db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state');
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(_db); };
    req.onerror = () => reject(req.error);
  });
}

// ─── Save: lightweight config → localStorage, novels → IDB ───
let _saveTimer = null;
function saveState() {
  // Lightweight config (no novels, no covers) → localStorage (sync, fast)
  const light = {
    provider: STATE.provider,
    apiKey: STATE.apiKey,
    model: STATE.model,
    baseUrl: STATE.baseUrl,
    currentNovel: STATE.currentNovel,
    skulls: STATE.skulls,
    courseMode: STATE.courseMode,
    hasStarted: STATE.hasStarted,
    prompts: STATE.prompts,
    imageModel: STATE.imageModel,
    coverStyle: STATE.coverStyle,
    coverTemplate: STATE.coverTemplate,
  };
  localStorage.setItem('pb501-config', JSON.stringify(light));

  // Debounce IDB writes (novels are large)
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => _saveNovelsIDB(), 500);
}

async function _saveNovelsIDB() {
  try {
    const db = await openDB();
    const tx = db.transaction('state', 'readwrite');
    tx.objectStore('state').put(STATE.novels, 'novels');
  } catch (e) {
    console.warn('IDB save failed, falling back to localStorage:', e);
    try { localStorage.setItem('pb501-novels', JSON.stringify(STATE.novels)); } catch (e2) {}
  }
}

// ─── Load: localStorage config + IDB novels ───
async function loadState() {
  // 1. Load lightweight config from localStorage (sync)
  try {
    const light = JSON.parse(localStorage.getItem('pb501-config'));
    if (light) Object.assign(STATE, light);
  } catch (e) {}

  // 2. Load novels from IDB (async)
  try {
    const db = await openDB();
    const novels = await new Promise((resolve, reject) => {
      const tx = db.transaction('state', 'readonly');
      const req = tx.objectStore('state').get('novels');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (novels) STATE.novels = novels;
  } catch (e) {
    console.warn('IDB load failed:', e);
  }

  // 3. Migrate from old localStorage format (one-time)
  if (!STATE.novels.length) {
    try {
      const old = JSON.parse(localStorage.getItem('pb501-state'));
      if (old && old.novels && old.novels.length) {
        STATE.novels = old.novels;
        Object.assign(STATE, {
          provider: old.provider, apiKey: old.apiKey, model: old.model,
          currentNovel: old.currentNovel, skulls: old.skulls,
          courseMode: old.courseMode, prompts: old.prompts || {},
        });
        // Save to new format and remove old key
        saveState();
        localStorage.removeItem('pb501-state');
        console.log('Migrated %d novels from localStorage to IndexedDB', STATE.novels.length);
      }
    } catch (e) {}
    // Also try localStorage fallback
    try {
      const lsNovels = JSON.parse(localStorage.getItem('pb501-novels'));
      if (lsNovels && lsNovels.length && !STATE.novels.length) {
        STATE.novels = lsNovels;
      }
    } catch (e) {}
  }
}
