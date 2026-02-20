// ═══════════════════════════════════════════
// SETTINGS — vault-aware
// ═══════════════════════════════════════════
function settingsTab(name) {
  document.querySelectorAll('.settings-tab').forEach(t =>
    t.classList.toggle('active', t.textContent.toLowerCase() === name));
  document.querySelectorAll('.settings-pane').forEach(p =>
    p.classList.toggle('active', p.id === 'stab-' + name));
}
function saveSetting(key, val) {
  const keyMap = { tg_token: 'tgToken', ollama_url: 'ollamaUrl', custom_url: 'customUrl', apikey: 'apiKey' };
  STATE[keyMap[key] || key] = val;
  scheduleVaultSave();
}

function selectProvider(p) {
  // Save current key + model to per-provider store
  if (STATE.provider) {
    STATE.providerKeys[STATE.provider] = STATE.apiKey;
    STATE.providerModels[STATE.provider] = STATE.model;
  }
  STATE.provider = p;
  // Restore key + model for this provider
  STATE.apiKey = STATE.providerKeys[p] || '';
  STATE.model = STATE.providerModels[p] || '';
  document.querySelectorAll('.provider-card').forEach(c =>
    c.classList.toggle('selected', c.dataset.p === p));
  renderProviderConfig(p);
  scheduleVaultSave();
  checkReady();
}

function applySettingsUI() {
  // Render appearance cards
  renderChromeCards();
  renderThemeCards();
  renderWallpaperCards();
  // Restore provider card selection
  if (STATE.provider) {
    document.querySelectorAll('.provider-card').forEach(c =>
      c.classList.toggle('selected', c.dataset.p === STATE.provider));
    renderProviderConfig(STATE.provider);
  }
  // Restore Telegram token
  if (STATE.tgToken) document.getElementById('tg-token').value = STATE.tgToken;
  // Restore workspace display
  if (STATE.wsHandle) {
    document.getElementById('ws-display').value = STATE.wsHandle.name;
    document.getElementById('sp-ws').style.display = '';
    document.getElementById('ws-path').textContent = STATE.wsHandle.name;
  }
  // Show Telegram toggle if token exists
  updateTgControls();
  // Sync notification toggle
  const notifTog = document.getElementById('notif-toggle');
  if (notifTog) {
    notifTog.checked = STATE.notificationsEnabled;
    const lbl = document.getElementById('notif-toggle-status');
    if (lbl) lbl.textContent = STATE.notificationsEnabled ? 'enabled' : 'disabled';
  }
  // Safety toggles
  updateSafetyUI();
  // Security status
  updateSecurityUI();
}

function updateSecurityUI() {
  const statusEl = document.getElementById('sec-passphrase-status');
  const actionsEl = document.getElementById('passphrase-actions');
  if (STATE._hasPassphrase) {
    statusEl.textContent = 'on';
    statusEl.style.color = 'var(--green)';
    actionsEl.innerHTML = `
      <button class="btn" onclick="showSetPassphrase()" style="margin-right:6px">Change passphrase</button>
      <button class="btn" onclick="removePassphrase()">Remove passphrase</button>`;
  } else {
    statusEl.textContent = 'off';
    statusEl.style.color = 'var(--amber)';
    actionsEl.innerHTML = `<button class="btn" onclick="showSetPassphrase()" id="btn-set-passphrase">Set passphrase (recommended)</button>`;
  }
}

function showSetPassphrase() {
  document.getElementById('passphrase-set-form').style.display = '';
  document.getElementById('new-passphrase').value = '';
  document.getElementById('new-passphrase').focus();
}

function cancelSetPassphrase() {
  document.getElementById('passphrase-set-form').style.display = 'none';
}

async function applyPassphrase() {
  const pw = document.getElementById('new-passphrase').value;
  if (!pw) return;
  STATE._passphrase = pw;
  STATE._hasPassphrase = true;
  try {
    await Vault.save(getSecretsPayload(), pw);
    cancelSetPassphrase();
    updateSecurityUI();
    termLog('🔒 Passphrase set. Secrets are now encrypted.', 'obs');
  } catch(e) {
    termLog('Failed to encrypt vault: ' + e.message, 'err');
  }
}

async function removePassphrase() {
  if (!confirm('Remove passphrase protection?\n\nSecrets will still be stored in the browser vault, but without encryption.')) return;
  STATE._passphrase = null;
  STATE._hasPassphrase = false;
  try {
    await Vault.save(getSecretsPayload(), null);
    updateSecurityUI();
    termLog('🔓 Passphrase removed. Secrets stored unencrypted.', 'obs');
  } catch(e) {
    termLog('Failed to save vault: ' + e.message, 'err');
  }
}

function renderProviderConfig(p) {
  const cfg = document.getElementById('provider-config');
  const prov = PROVIDERS[p];
  if (!prov) { cfg.innerHTML = ''; return; }

  if (p === 'ollama') {
    cfg.innerHTML = `
      <div class="sf"><label>Ollama URL</label>
        <input type="text" value="${STATE.ollamaUrl}" oninput="STATE.ollamaUrl=this.value;saveSetting('ollama_url',this.value)">
        <div class="hint">Default: http://localhost:11434</div>
      </div>
      <div class="sf"><label>Model</label>
        <div class="sf-row">
          <input type="text" id="ollama-model" value="${STATE.model}" placeholder="e.g. qwen2.5:7b" oninput="STATE.model=this.value;saveSetting('model',this.value);checkReady()">
          <button class="btn" onclick="fetchOllamaModels()">Refresh</button>
        </div>
        <div class="hint">Run <code style="background:var(--bg);padding:1px 4px;border-radius:2px">ollama list</code> to see installed models</div>
        <div id="ollama-models-list" style="margin-top:6px"></div>
      </div>`;
  } else if (p === 'custom') {
    cfg.innerHTML = `
      <div class="sf"><label>Endpoint URL</label>
        <input type="text" value="${STATE.customUrl}" placeholder="https://your-provider.com/v1/chat/completions" oninput="STATE.customUrl=this.value;saveSetting('custom_url',this.value);checkReady()">
        <div class="hint">Must be OpenAI-compatible (/v1/chat/completions)</div>
      </div>
      <div class="sf"><label>${prov.keyLabel}</label>
        <input type="password" value="${STATE.apiKey}" placeholder="sk-... (leave empty if not needed)" oninput="STATE.apiKey=this.value;saveSetting('apikey',this.value);checkReady()">
        <div class="hint">${prov.keyHint}</div>
      </div>
      <div class="sf"><label>Model ID</label>
        <input type="text" value="${STATE.model}" placeholder="e.g. gpt-4o, deepseek-chat, llama3..." oninput="STATE.model=this.value;saveSetting('model',this.value);checkReady()">
        <div class="hint">The exact model ID your provider expects</div>
      </div>`;
  } else if (p === 'demo') {
    STATE.model = 'mock-agent';
    saveSetting('model', 'mock-agent');
    cfg.innerHTML = `
      <div style="padding:8px 0;font-size:12px;color:var(--text-dim);line-height:1.5">
        <strong style="color:var(--green)">No configuration needed.</strong><br>
        Mock responses — explore the UI without an API key.
        Switch to a real provider when you're ready.
      </div>`;
    checkReady();
  } else {
    cfg.innerHTML = `
      <div class="sf"><label>${prov.keyLabel}</label>
        <input type="password" value="${STATE.apiKey}" placeholder="sk-..." oninput="STATE.apiKey=this.value;STATE.providerKeys[STATE.provider]=this.value;saveSetting('apikey',this.value);checkReady()">
        <div class="hint">${prov.keyHint}</div>
      </div>
      <div class="sf"><label>Model</label>
        <div class="sf-row">
          <select id="model-select" onchange="STATE.model=this.value;saveSetting('model',this.value)">
            <option value="">Loading models...</option>
          </select>
          <button class="btn" onclick="fetchModels('${p}',true)">↻</button>
        </div>
        <div class="hint" id="model-count-hint"></div>
      </div>`;
    fetchModels(p);
  }
}

async function fetchOllamaModels() {
  try {
    const r = await fetch(STATE.ollamaUrl + '/api/tags');
    const d = await r.json();
    const list = d.models || [];
    const el = document.getElementById('ollama-models-list');
    if (!list.length) { el.innerHTML = '<div style="color:var(--amber);font-size:10px">No models found. Run: ollama pull qwen2.5:7b</div>'; return; }
    el.innerHTML = list.map(m =>
      `<div style="font-family:var(--font-mono);font-size:10px;color:var(--cyan);cursor:pointer;padding:2px 0" onclick="document.getElementById('ollama-model').value='${m.name}';STATE.model='${m.name}';saveSetting('model','${m.name}');checkReady()">${m.name} <span style="color:var(--text-faint)">(${(m.size/1e9).toFixed(1)}GB)</span></div>`
    ).join('');
  } catch(e) {
    document.getElementById('ollama-models-list').innerHTML = `<div style="color:var(--red);font-size:10px">Cannot reach Ollama at ${STATE.ollamaUrl}</div>`;
  }
}

function checkReady() {
  let hasProvider = false;
  if (STATE.provider === 'demo') hasProvider = true;
  else if (STATE.provider === 'ollama') hasProvider = !!STATE.model;
  else if (STATE.provider === 'custom') hasProvider = !!(STATE.customUrl && STATE.model);
  else if (STATE.provider) hasProvider = !!(STATE.apiKey && STATE.model);

  const input = document.getElementById('term-input');
  input.disabled = !hasProvider;
  input.placeholder = hasProvider ? 'talk to your agent...' : 'configure in Settings first...';
  const dot = document.getElementById('agent-dot');
  const statusText = document.getElementById('agent-status');
  if (hasProvider) {
    dot.className = 'status-dot green';
    statusText.textContent = 'ready';
    document.getElementById('sp-tokens').style.display = '';
  } else {
    dot.className = 'status-dot amber';
    statusText.textContent = 'no provider';
  }
}

// ═══════════════════════════════════════════
// THEME / WALLPAPER UI
// ═══════════════════════════════════════════
function renderThemeCards() {
  const container = document.getElementById('theme-cards');
  if (!container) return;
  container.innerHTML = '';
  for (const [id, theme] of Object.entries(THEMES)) {
    const card = document.createElement('div');
    card.className = 'theme-card' + (id === _currentThemeId ? ' selected' : '');
    const bg = theme.vars['--bg'];
    const green = theme.vars['--green'];
    const cyan = theme.vars['--cyan'];
    const amber = theme.vars['--amber'];
    const red = theme.vars['--red'];
    card.innerHTML = `<div class="tc-swatch" style="background:${bg}"><div class="tc-accents"><span style="background:${green}"></span><span style="background:${cyan}"></span><span style="background:${amber}"></span><span style="background:${red}"></span></div></div><div class="tc-name">${theme.name}</div>`;
    card.onclick = () => selectTheme(id);
    container.appendChild(card);
  }
  // Custom card
  if (_customTheme) {
    const card = document.createElement('div');
    card.className = 'theme-card' + (_currentThemeId === 'custom' ? ' selected' : '');
    const bg = _customTheme.vars['--bg'] || '#111';
    const green = _customTheme.vars['--green'] || '#4ade80';
    const cyan = _customTheme.vars['--cyan'] || '#22d3ee';
    const amber = _customTheme.vars['--amber'] || '#fbbf24';
    const red = _customTheme.vars['--red'] || '#f87171';
    card.innerHTML = `<div class="tc-swatch" style="background:${bg}"><div class="tc-accents"><span style="background:${green}"></span><span style="background:${cyan}"></span><span style="background:${amber}"></span><span style="background:${red}"></span></div></div><div class="tc-name">Custom</div>`;
    card.onclick = () => selectTheme('custom');
    container.appendChild(card);
  }
}

function renderWallpaperCards() {
  const container = document.getElementById('wallpaper-cards');
  if (!container) return;
  container.innerHTML = '';
  for (const [id, wp] of Object.entries(WALLPAPERS)) {
    const card = document.createElement('div');
    card.className = 'wallpaper-card' + (id === _currentWallpaperId ? ' selected' : '');
    let preview = 'var(--bg)';
    if (id === 'dots') preview = 'radial-gradient(circle,var(--text-faint) 1px,var(--bg) 1px)';
    else if (id === 'grid') preview = 'repeating-linear-gradient(0deg,var(--text-faint),var(--text-faint) 1px,var(--bg) 1px,var(--bg) 8px),repeating-linear-gradient(90deg,var(--text-faint),var(--text-faint) 1px,var(--bg) 1px,var(--bg) 8px)';
    else if (id === 'gradient1') preview = 'linear-gradient(135deg,var(--bg),var(--cyan))';
    else if (id === 'gradient2') preview = 'linear-gradient(180deg,var(--bg),var(--blue))';
    card.innerHTML = `<div class="wc-swatch" style="background:${preview};background-size:8px 8px"></div><div class="wc-name">${wp.name}</div>`;
    card.onclick = () => selectWallpaper(id);
    container.appendChild(card);
  }
  // Custom image card (if previously uploaded)
  if (_customWallpaperImage) {
    const card = document.createElement('div');
    card.className = 'wallpaper-card' + (_currentWallpaperId === 'custom-image' ? ' selected' : '');
    card.innerHTML = `<div class="wc-swatch" style="background:url(${_customWallpaperImage}) center/cover"></div><div class="wc-name">Image</div>`;
    card.onclick = () => selectWallpaper('custom-image');
    container.appendChild(card);
  }
  // Custom color card (if previously set)
  if (_customWallpaperColor) {
    const card = document.createElement('div');
    card.className = 'wallpaper-card' + (_currentWallpaperId === 'custom-color' ? ' selected' : '');
    card.innerHTML = `<div class="wc-swatch" style="background:${_customWallpaperColor}"></div><div class="wc-name">Color</div>`;
    card.onclick = () => selectWallpaper('custom-color');
    container.appendChild(card);
  }
  // Image action card
  const imgCard = document.createElement('div');
  imgCard.className = 'wallpaper-card wp-action-card';
  imgCard.innerHTML = `<div class="wc-swatch">📷</div><div class="wc-name">Image</div>`;
  imgCard.onclick = () => pickWallpaperImage();
  container.appendChild(imgCard);
  // Color action card
  const colorCard = document.createElement('div');
  colorCard.className = 'wallpaper-card wp-action-card';
  const curColor = _customWallpaperColor || '#111114';
  colorCard.innerHTML = `<div class="wc-swatch" style="background:${curColor};border-style:dashed"></div><div class="wc-name">Color</div><input type="color" id="wp-color" value="${curColor}" onchange="applyCustomWallpaperColor(this.value)">`;
  colorCard.onclick = (e) => { if (e.target.tagName !== 'INPUT') document.getElementById('wp-color').click(); };
  container.appendChild(colorCard);
}

function renderChromeCards() {
  const container = document.getElementById('chrome-cards');
  if (!container) return;
  container.innerHTML = '';
  for (const [id, style] of Object.entries(CHROME_STYLES)) {
    const card = document.createElement('div');
    card.className = 'chrome-card' + (id === _currentChromeId ? ' selected' : '');
    card.innerHTML = `<div class="cc-preview">${style.emoji || ''}</div><div class="cc-name">${style.name}</div>`;
    card.onclick = () => selectChrome(id);
    container.appendChild(card);
  }
}

function selectChrome(id) {
  applyChromeStyle(id);
  const chrome = CHROME_STYLES[id];
  if (chrome && chrome.defaultTheme && THEMES[chrome.defaultTheme]) {
    applyTheme(chrome.defaultTheme);
    _currentThemeId = chrome.defaultTheme;
    renderThemeCards();
    applyWallpaper(_currentWallpaperId);
  }
  saveAppearance();
  renderChromeCards();
}

function selectTheme(id) {
  applyTheme(id);
  saveAppearance();
  renderThemeCards();
  renderWallpaperCards();
  // Re-apply wallpaper since theme vars may have changed
  applyWallpaper(_currentWallpaperId);
}

function selectWallpaper(id) {
  applyWallpaper(id);
  saveAppearance();
  renderWallpaperCards();
}

function pickWallpaperImage() {
  document.getElementById('wp-file-input').click();
}

function handleWallpaperFileInput(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    if (typeof termPrint === 'function') termPrint('Image must be under 2MB.', 'warn');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    _customWallpaperImage = reader.result;
    selectWallpaper('custom-image');
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function applyCustomWallpaperColor(hex) {
  _customWallpaperColor = hex;
  selectWallpaper('custom-color');
}

function toggleCustomThemeEditor() {
  const editor = document.getElementById('custom-theme-editor');
  if (!editor) return;
  if (editor.style.display === 'none') {
    editor.style.display = '';
    document.getElementById('custom-theme-toggle').textContent = 'Hide Theme Editor';
    renderCustomThemeEditor();
  } else {
    editor.style.display = 'none';
    document.getElementById('custom-theme-toggle').textContent = 'Customize Theme...';
  }
}

function renderCustomThemeEditor() {
  const editor = document.getElementById('custom-theme-editor');
  if (!editor) return;
  // Get current theme vars as base
  const base = (_currentThemeId === 'custom' && _customTheme) ? _customTheme.vars : (THEMES[_currentThemeId] || THEMES.dark).vars;
  const groups = [
    { label: 'Background', key: '--bg', related: ['--surface','--window-bg','--title-bg'] },
    { label: 'Surface', key: '--surface', related: ['--window-bg','--title-bg'] },
    { label: 'Borders', key: '--border', related: ['--border-focus'] },
    { label: 'Text', key: '--text', related: ['--text-dim','--text-faint'] },
    { label: 'Primary', key: '--cyan', related: [] },
    { label: 'Secondary', key: '--amber', related: [] },
  ];
  let html = '';
  for (const g of groups) {
    const val = base[g.key] || '#888888';
    // Extract hex from the value (skip rgba values)
    const hexVal = val.startsWith('#') ? val : '#888888';
    html += `<div class="custom-theme-row"><label>${g.label}</label><input type="color" value="${hexVal}" onchange="applyCustomThemeGroup('${g.key}',this.value)"><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-faint)">${hexVal}</span></div>`;
  }
  html += `<button class="btn" style="margin-top:8px;font-size:10px" onclick="resetCustomTheme()">Reset to Preset</button>`;
  editor.innerHTML = html;
}

function applyCustomThemeGroup(key, hex) {
  // Start from current theme or existing custom
  const base = (_currentThemeId === 'custom' && _customTheme) ? { ..._customTheme.vars } : { ...(THEMES[_currentThemeId] || THEMES.dark).vars };
  base[key] = hex;
  // Derive related vars based on key
  if (key === '--bg') {
    base['--surface'] = adjustL(hex, 5);
    base['--window-bg'] = adjustL(hex, 3);
    base['--title-bg'] = adjustL(hex, 8);
    const [,,l] = hexToHsl(hex);
    const isDark = l < 50;
    base['--dock-bg'] = isDark ? `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.92)` : `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.92)`;
    base['--dot-color'] = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    base['--overlay-subtle'] = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    base['--overlay-hover'] = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    base['--overlay-strong'] = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    base['--overlay-faint'] = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)';
    base['--overlay-faintest'] = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
    base['--shadow-color'] = isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)';
    base['--shadow-heavy'] = isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.25)';
    base['--statusbar-bg'] = isDark ? `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.95)` : `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},0.95)`;
  } else if (key === '--surface') {
    base['--window-bg'] = adjustL(hex, -2);
    base['--title-bg'] = adjustL(hex, 3);
  } else if (key === '--border') {
    base['--border-focus'] = adjustL(hex, 8);
  } else if (key === '--text') {
    base['--text-dim'] = adjustL(hex, -20);
    base['--text-faint'] = adjustL(hex, -35);
  }
  const [,,bgL] = hexToHsl(base['--bg']);
  _customTheme = { name: 'Custom', isDark: bgL < 50, vars: base };
  _currentThemeId = 'custom';
  applyTheme('custom');
  saveAppearance();
  renderThemeCards();
  renderCustomThemeEditor();
}

function resetCustomTheme() {
  _customTheme = null;
  _currentThemeId = 'dark';
  applyTheme('dark');
  saveAppearance();
  renderThemeCards();
  renderCustomThemeEditor();
}

// ═══════════════════════════════════════════
// SAFETY SETTINGS
// ═══════════════════════════════════════════
function updateSafety(key, val) {
  STATE.safety[key] = val;
  scheduleVaultSave();
  updateSafetyBadge();
}

function updateSafetyUI() {
  const s = STATE.safety;
  const ids = {
    sandboxNetwork: 'safety-sandbox-network',
    autoApproveNetwork: 'safety-auto-network',
    autoApproveDelete: 'safety-auto-delete',
    autoApproveMic: 'safety-auto-mic',
    autoApproveLocation: 'safety-auto-location',
    hideBadge: 'safety-hide-badge',
    petEnabled: 'safety-pet',
  };
  for (const [key, id] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.checked = !!s[key];
  }
  updateSafetyBadge();
  // Sync pet state with toggle
  if (s.petEnabled) { if (typeof spawnPet === 'function') spawnPet(); }
  else { if (typeof despawnPet === 'function') despawnPet(); }
}

function updateSafetyBadge() {
  const s = STATE.safety;
  const anyUnsafe = s.sandboxNetwork || s.autoApproveNetwork || s.autoApproveDelete || s.autoApproveMic || s.autoApproveLocation;
  const badge = document.getElementById('sp-unsafe');
  if (badge) badge.style.display = (anyUnsafe && !s.hideBadge) ? '' : 'none';
}
