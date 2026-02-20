// ═══════════════════════════════════════════
// VAULT — OPFS + Web Crypto + IndexedDB
// Secrets live in the browser's Origin Private File System,
// encrypted with PBKDF2→AES-GCM if a passphrase is set.
// Workspace handles persist in IndexedDB.
// Nothing touches localStorage. Nothing enters the workspace.
// ═══════════════════════════════════════════
const Vault = {
  // ── OPFS: secret storage ──
  async _opfs() { return navigator.storage.getDirectory(); },

  async exists() {
    try { const d = await this._opfs(); await d.getFileHandle('vault.json'); return true; }
    catch { return false; }
  },

  async load(passphrase) {
    const d = await this._opfs();
    const fh = await d.getFileHandle('vault.json');
    const raw = JSON.parse(await (await fh.getFile()).text());
    if (raw.encrypted) {
      if (!passphrase) { const e = new Error('NEEDS_PASSPHRASE'); e.code = 'NEEDS_PASSPHRASE'; throw e; }
      return await this._decrypt(raw, passphrase);
    }
    return raw.data;
  },

  async save(data, passphrase) {
    const d = await this._opfs();
    const fh = await d.getFileHandle('vault.json', { create: true });
    const w = await fh.createWritable();
    let blob;
    if (passphrase) {
      blob = await this._encrypt(data, passphrase);
      blob.encrypted = true;
    } else {
      blob = { encrypted: false, data };
    }
    await w.write(JSON.stringify(blob));
    await w.close();
  },

  async clear() {
    try { const d = await this._opfs(); await d.removeEntry('vault.json'); } catch {}
  },

  // ── Crypto: PBKDF2 → AES-GCM ──
  async _deriveKey(passphrase, salt) {
    const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  },

  async _encrypt(data, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await this._deriveKey(passphrase, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)));
    const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
    return { salt: b64(salt), iv: b64(iv), ct: b64(ct) };
  },

  async _decrypt(blob, passphrase) {
    const fromB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
    const key = await this._deriveKey(passphrase, fromB64(blob.salt));
    const dec = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(blob.iv) }, key, fromB64(blob.ct));
    return JSON.parse(new TextDecoder().decode(dec));
  },

  // ── IndexedDB: workspace handle persistence ──
  _openDB() {
    return new Promise((resolve, reject) => {
      const r = indexedDB.open('patchbay401', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('handles');
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },

  async saveHandle(handle) {
    const db = await this._openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction('handles', 'readwrite');
      tx.objectStore('handles').put(handle, 'workspace');
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  },

  async loadHandle() {
    const db = await this._openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction('handles', 'readonly');
      const r = tx.objectStore('handles').get('workspace');
      r.onsuccess = () => res(r.result || null); r.onerror = () => rej(r.error);
    });
  },

  async clearAll() {
    await this.clear();
    try {
      const db = await this._openDB();
      await new Promise((res, rej) => {
        const tx = db.transaction('handles', 'readwrite');
        tx.objectStore('handles').clear();
        tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
      });
    } catch {}
  },
};

// ═══════════════════════════════════════════
// VAULT HELPERS
// ═══════════════════════════════════════════
function getSecretsPayload() {
  // Sync current key into providerKeys before saving
  if (STATE.provider) STATE.providerKeys[STATE.provider] = STATE.apiKey;
  return {
    provider: STATE.provider, apiKey: STATE.apiKey, model: STATE.model,
    ollamaUrl: STATE.ollamaUrl, customUrl: STATE.customUrl, tgToken: STATE.tgToken,
    hasPassphrase: STATE._hasPassphrase, providerKeys: STATE.providerKeys,
    providerModels: STATE.providerModels, routing: STATE.routing,
    notificationsEnabled: STATE.notificationsEnabled, safety: STATE.safety,
    stats: STATE.stats,
  };
}

let _vaultTimer = null;
function scheduleVaultSave() {
  clearTimeout(_vaultTimer);
  _vaultTimer = setTimeout(async () => {
    try { await Vault.save(getSecretsPayload(), STATE._passphrase); }
    catch(e) { console.warn('Vault save failed:', e); }
  }, 400);
}

function loadSecretsIntoState(data) {
  STATE.provider = data.provider || '';
  STATE.providerKeys = data.providerKeys || {};
  STATE.providerModels = data.providerModels || {};
  // Prefer per-provider key; fall back to legacy single apiKey
  STATE.apiKey = STATE.providerKeys[STATE.provider] || data.apiKey || '';
  STATE.model = STATE.providerModels[STATE.provider] || data.model || '';
  STATE.ollamaUrl = data.ollamaUrl || 'http://localhost:11434';
  STATE.customUrl = data.customUrl || '';
  STATE.tgToken = data.tgToken || '';
  STATE._hasPassphrase = data.hasPassphrase || false;
  if (data.routing) {
    STATE.routing = { ...STATE.routing, ...data.routing };
  }
  if (data.notificationsEnabled !== undefined) STATE.notificationsEnabled = data.notificationsEnabled;
  if (data.safety) STATE.safety = { ...STATE.safety, ...data.safety };
  if (data.stats) STATE.stats = { ...STATE.stats, ...data.stats };
}
