// ═══════════════════════════════════════════
// CRASH SCREENS
// ═══════════════════════════════════════════
function showCrashScreen(msg) {
  const overlay = document.getElementById('crash-overlay');
  if (!overlay) return;
  const chrome = _currentChromeId || 'pineapple';
  let html = '';
  if (chrome === 'gcu95') {
    html = `<div style="background:#0000AA;color:#fff;font-family:'Courier New',monospace;padding:40px;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
      <div style="font-size:18px;letter-spacing:2px;margin-bottom:24px">PATCHBAY_FATAL_ERROR</div>
      <div style="max-width:600px;text-align:left;font-size:13px;line-height:1.8">
      A problem has been detected and Patchbay has been shut down to prevent damage to your conversation.<br><br>
      <span style="color:#AAAAFF">*** STOP: 0x000000${(Math.random()*0xFF|0).toString(16).toUpperCase().padStart(2,'0')} (${msg})</span><br><br>
      If this is the first time you've seen this stop error screen, check your API key and network connection. If problems continue, contact your LLM provider.<br><br>
      Technical information:<br>
      *** agent.js - Address 0x${(Math.random()*0xFFFFFFFF|0).toString(16).toUpperCase().padStart(8,'0')}<br><br>
      <span style="color:#AAAAFF">Press any key to continue _</span>
      </div></div>`;
  } else if (chrome === 'luna') {
    html = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">
      <div style="background:#ECE9D8;border:2px solid #0054E3;border-radius:4px;width:420px;box-shadow:4px 4px 12px rgba(0,0,0,0.5)">
        <div style="background:linear-gradient(180deg,#0A246A,#0054E3,#0A6AFF,#0054E3,#0A246A);padding:4px 8px;border-radius:2px 2px 0 0;color:#fff;font-weight:700;font-family:'Tahoma',sans-serif;font-size:12px">Patchbay</div>
        <div style="padding:16px 20px;display:flex;gap:16px;align-items:flex-start">
          <div style="font-size:32px;flex-shrink:0">❌</div>
          <div style="font-family:'Tahoma',sans-serif;font-size:12px;color:#000;line-height:1.5">${escapeHtml(msg)}<br><br>Click OK to dismiss this error and continue.</div>
        </div>
        <div style="padding:8px 20px 16px;text-align:center"><button style="font-family:'Tahoma',sans-serif;font-size:11px;padding:4px 32px;border:1px solid #003C74;border-radius:3px;background:linear-gradient(180deg,#fff,#ECE9D8);cursor:pointer" onclick="event.stopPropagation();dismissCrashScreen()">OK</button></div>
      </div></div>`;
  } else if (chrome === 'guru') {
    const hash = Array.from({length:8},()=>(Math.random()*16|0).toString(16)).join('').toUpperCase();
    html = `<div style="background:#000;color:#FF0000;font-family:'Courier New',monospace;width:100%;height:100%;display:flex;align-items:center;justify-content:center">
      <div id="guru-box" style="border:4px solid #FF0000;padding:16px 32px;text-align:center;max-width:600px">
        <div style="font-size:16px;margin-bottom:12px">Software Failure.&nbsp; Press left mouse button to continue.</div>
        <div style="font-size:13px;margin-bottom:8px">Guru Meditation #${hash}.${(Date.now()&0xFFFF).toString(16).toUpperCase().padStart(4,'0')}</div>
        <div style="font-size:11px;color:#CC0000;margin-top:8px">${escapeHtml(msg)}</div>
      </div></div>`;
  } else if (chrome === 'slab') {
    html = `<div style="background:#000;color:#fff;font-family:'Courier New',monospace;width:100%;height:100%;padding:40px;display:flex;flex-direction:column;justify-content:center">
      <div style="max-width:700px;font-size:13px;line-height:1.8">
      panic: ${escapeHtml(msg)}<br><br>
      goroutine 1 [running]:<br>
      patchbay/agent.agentTurn(0x${(Math.random()*0xFFFFFFFF|0).toString(16)}, 0x${(Math.random()*0xFFFF|0).toString(16)})<br>
      &nbsp;&nbsp;&nbsp;&nbsp;/src/agent.js:${50+Math.random()*100|0} +0x${(Math.random()*0xFFF|0).toString(16)}<br>
      main.main()<br>
      &nbsp;&nbsp;&nbsp;&nbsp;/src/init.js:32 +0x1a<br><br>
      <span style="color:#888">Click anywhere to continue...</span>
      </div></div>`;
  } else if (chrome === 'motif') {
    html = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">
      <div style="background:#ACA899;border:3px outset #C8C4B8;width:420px;box-shadow:3px 3px 0 rgba(0,0,0,0.3)">
        <div style="background:#88666B;padding:4px 8px;border-bottom:2px solid #6B6B60;color:#fff;font-weight:700;font-family:var(--font-mono);font-size:11px">Error</div>
        <div style="padding:16px 20px;display:flex;gap:16px;align-items:flex-start">
          <div style="font-size:28px;flex-shrink:0">⚠</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:#000;line-height:1.5">${escapeHtml(msg)}</div>
        </div>
        <div style="padding:8px 20px 16px;text-align:center"><button style="font-family:var(--font-mono);font-size:11px;padding:4px 24px;border:3px outset #C8C4B8;background:#ACA899;cursor:pointer" onclick="event.stopPropagation();dismissCrashScreen()">OK</button></div>
      </div></div>`;
  } else {
    // pineapple (default) — clean modern
    html = `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">
      <div style="background:var(--surface);border:1px solid var(--border-focus);border-radius:12px;padding:32px 40px;max-width:440px;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,0.5)">
        <div style="font-size:36px;margin-bottom:12px">⚠️</div>
        <div style="font-family:var(--font-mono);font-size:13px;font-weight:600;color:var(--red);margin-bottom:8px">Agent Error</div>
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);line-height:1.6;margin-bottom:16px">${escapeHtml(msg)}</div>
        <div style="font-size:10px;color:var(--text-faint)">Click anywhere to dismiss</div>
      </div></div>`;
  }
  overlay.innerHTML = html;
  overlay.classList.add('visible');
  // Guru meditation blink
  if (chrome === 'guru') {
    overlay._guruBlink = setInterval(() => {
      const box = overlay.querySelector('#guru-box');
      if (box) box.style.borderColor = box.style.borderColor === 'transparent' ? '#FF0000' : 'transparent';
    }, 800);
  }
}

function dismissCrashScreen() {
  const overlay = document.getElementById('crash-overlay');
  if (!overlay) return;
  overlay.classList.remove('visible');
  overlay.innerHTML = '';
  if (overlay._guruBlink) { clearInterval(overlay._guruBlink); overlay._guruBlink = null; }
}

// ═══════════════════════════════════════════
// ABOUT THIS MACHINE
// ═══════════════════════════════════════════
function refreshAboutWindow() {
  const body = document.getElementById('about-body');
  if (!body) return;
  const s = STATE.stats;
  // Uptime
  let uptime = '—';
  if (s.bootTime) {
    const ms = Date.now() - s.bootTime;
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    uptime = hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;
  }
  // Skill count
  const skillCount = typeof SKILLS !== 'undefined' ? Object.keys(SKILLS).length : 0;
  const toolCount = typeof TOOLS !== 'undefined' ? Object.keys(TOOLS).length : 0;
  // Tool call histogram
  const calls = Object.entries(s.toolCalls || {}).sort((a, b) => b[1] - a[1]);
  const maxCalls = calls.length > 0 ? calls[0][1] : 1;
  let histHtml = '';
  if (calls.length === 0) {
    histHtml = '<div style="color:var(--text-faint);font-style:italic">No tool calls yet.</div>';
  } else {
    for (const [name, count] of calls) {
      const pct = Math.max(4, (count / maxCalls) * 100);
      histHtml += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
        <span style="width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-dim)">${escapeHtml(name)}</span>
        <div style="flex:1;height:10px;background:var(--overlay-subtle);border-radius:2px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--cyan);border-radius:2px"></div></div>
        <span style="width:28px;text-align:right;color:var(--text-faint)">${count}</span>
      </div>`;
    }
  }
  body.innerHTML = `
    <div style="font-family:var(--font-mono);margin-bottom:16px">
      <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:2px">Patchbay 401</div>
      <div style="font-size:10px;color:var(--text-faint)">Raising the Soul of a New Machine</div>
    </div>
    <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-family:var(--font-mono);margin-bottom:16px">
      <span style="color:var(--text-faint)">Uptime</span><span style="color:var(--text-dim)">${uptime}</span>
      <span style="color:var(--text-faint)">Messages</span><span style="color:var(--text-dim)">${s.messageCount}</span>
      <span style="color:var(--text-faint)">Tokens</span><span style="color:var(--text-dim)">${STATE.totalTokens}</span>
      <span style="color:var(--text-faint)">Provider</span><span style="color:var(--text-dim)">${STATE.provider || '—'} / ${STATE.model || '—'}</span>
      <span style="color:var(--text-faint)">Theme</span><span style="color:var(--text-dim)">${_currentThemeId}</span>
      <span style="color:var(--text-faint)">Wallpaper</span><span style="color:var(--text-dim)">${_currentWallpaperId}</span>
      <span style="color:var(--text-faint)">Chrome</span><span style="color:var(--text-dim)">${_currentChromeId}</span>
      <span style="color:var(--text-faint)">Skills</span><span style="color:var(--text-dim)">${skillCount}</span>
      <span style="color:var(--text-faint)">Tools</span><span style="color:var(--text-dim)">${toolCount}</span>
    </div>
    <div style="font-family:var(--font-mono);font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-faint);margin-bottom:6px">Tool Calls</div>
    <div style="font-family:var(--font-mono);font-size:10px">${histHtml}</div>
  `;
}

// ═══════════════════════════════════════════
// DESKTOP PET
// ═══════════════════════════════════════════
let _pet = null;

function spawnPet() {
  if (_pet) return;
  const desktop = document.getElementById('desktop');
  if (!desktop) return;
  const el = document.createElement('div');
  el.id = 'desktop-pet';
  const thoughtEl = document.createElement('span');
  thoughtEl.className = 'pet-thought';
  thoughtEl.textContent = '💭';
  el.appendChild(thoughtEl);
  const face = document.createElement('span');
  face.className = 'pet-face';
  face.textContent = '🐱';
  el.appendChild(face);
  const deskRect = desktop.getBoundingClientRect();
  const deskW = deskRect.width || window.innerWidth;
  const startX = Math.max(40, 100 + Math.random() * Math.max(0, deskW - 200));
  el.style.left = startX + 'px';
  el.style.bottom = '60px';
  desktop.appendChild(el);
  _pet = { el, face, thoughtEl, state: 'idle', x: startX, timer: null, direction: 1 };
  // Pet the cat!
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!_pet || _pet.state === 'pet') return;
    _petTransition('pet');
  });
  el.style.cursor = 'pointer';
  _petTransition('idle');
}

function despawnPet() {
  if (!_pet) return;
  if (_pet.timer) clearTimeout(_pet.timer);
  if (_pet.el.parentNode) _pet.el.parentNode.removeChild(_pet.el);
  _pet = null;
}

function _petTransition(state) {
  if (!_pet) return;
  _pet.state = state;
  const p = _pet;
  if (p.timer) clearTimeout(p.timer);

  if (state === 'idle') {
    p.face.textContent = '🐱';
    p.el.classList.remove('sleeping');
    p.thoughtEl.classList.remove('visible');
    // Occasional ear twitch
    let twitchTimer = setInterval(() => {
      if (!_pet || _pet.state !== 'idle') { clearInterval(twitchTimer); return; }
      p.face.textContent = p.face.textContent === '🐱' ? '😺' : '🐱';
    }, 1500);
    const dur = 3000 + Math.random() * 5000;
    p.timer = setTimeout(() => {
      clearInterval(twitchTimer);
      if (!_pet) return;
      const next = Math.random();
      if (next < 0.4) _petTransition('wander');
      else if (next < 0.65) _petTransition('sleep');
      else if (next < 0.85) _petTransition('think');
      else _petTransition('idle');
    }, dur);
  } else if (state === 'wander') {
    p.face.textContent = '🐱';
    p.el.classList.remove('sleeping');
    p.thoughtEl.classList.remove('visible');
    const dist = (30 + Math.random() * 50) * (Math.random() < 0.5 ? -1 : 1);
    const desktop = document.getElementById('desktop');
    const maxX = desktop ? desktop.offsetWidth - 40 : 800;
    p.x = Math.max(20, Math.min(maxX, p.x + dist));
    p.el.style.left = p.x + 'px';
    p.el.style.transform = dist < 0 ? 'scaleX(-1)' : 'scaleX(1)';
    const dur = 2000 + Math.random() * 3000;
    p.timer = setTimeout(() => { if (_pet) _petTransition('idle'); }, dur);
  } else if (state === 'think') {
    p.face.textContent = '🐱';
    p.el.classList.remove('sleeping');
    p.thoughtEl.classList.add('visible');
    const dur = 2000 + Math.random() * 2000;
    p.timer = setTimeout(() => {
      if (!_pet) return;
      p.thoughtEl.classList.remove('visible');
      _petTransition('idle');
    }, dur);
  } else if (state === 'sleep') {
    p.face.textContent = '😴';
    p.el.classList.add('sleeping');
    p.thoughtEl.classList.remove('visible');
    const dur = 5000 + Math.random() * 10000;
    p.timer = setTimeout(() => { if (_pet) _petTransition('idle'); }, dur);
  } else if (state === 'pet') {
    p.el.classList.remove('sleeping');
    p.face.textContent = '😻';
    p.thoughtEl.textContent = '❤️';
    p.thoughtEl.classList.add('visible');
    p.el.classList.add('purring');
    const dur = 2000 + Math.random() * 1000;
    p.timer = setTimeout(() => {
      if (!_pet) return;
      p.thoughtEl.classList.remove('visible');
      p.thoughtEl.textContent = '💭';
      p.el.classList.remove('purring');
      _petTransition('idle');
    }, dur);
  }
}

// ═══════════════════════════════════════════
// DESKTOP ICONS
// ═══════════════════════════════════════════
async function refreshDesktopIcons() {
  const container = document.getElementById('desktop-icons');
  if (!container || !STATE.wsHandle) return;
  container.innerHTML = '';
  let x = 16, y = 12;
  try {
    for await (const entry of STATE.wsHandle.values()) {
      if (entry.name.startsWith('.')) continue;
      const icon = document.createElement('div');
      icon.className = 'desktop-icon';
      icon.style.left = x + 'px';
      icon.style.top = y + 'px';
      const glyph = entry.kind === 'directory' ? '📁' : (entry.name.endsWith('.md') ? '📝' : '📄');
      icon.innerHTML = `<span class="icon-glyph">${glyph}</span><span class="icon-label">${escapeHtml(entry.name)}</span>`;
      icon.onclick = (e) => {
        e.stopPropagation();
        if (entry.kind === 'directory') navigateFileBrowser(entry.name);
        else openFileInEditor(entry, entry.name);
      };
      icon.oncontextmenu = (e) => {
        e.stopPropagation();
        if (entry.kind === 'directory') {
          showContextMenu(e, [
            { label: 'Open', icon: '📁', action: () => navigateFileBrowser(entry.name) },
            { label: 'Rename', icon: '✏', action: () => renameEntry(entry, entry.name) },
            { divider: true },
            { label: 'Delete', icon: '🗑', action: () => moveToTrash(entry.name), danger: true },
          ]);
        } else {
          showContextMenu(e, [
            { label: 'Open', icon: '📝', action: () => openFileInEditor(entry, entry.name) },
            { label: 'Rename', icon: '✏', action: () => renameEntry(entry, entry.name) },
            { divider: true },
            { label: 'Delete', icon: '🗑', action: () => moveToTrash(entry.name), danger: true },
          ]);
        }
      };
      container.appendChild(icon);
      y += 88;
      if (y > 400) { y = 12; x += 84; }
    }
  } catch {}
}

// ═══════════════════════════════════════════
// FILE EDITOR
// ═══════════════════════════════════════════
let _editorHandle = null;
let _editorPath = '';
let _editorDirHandle = null;
let _editorClean = true;

function _isEditorDirty() {
  return _editorHandle && !_editorClean;
}

async function openFileInEditor(entry, path) {
  // Guard: unsaved changes in current file
  if (_isEditorDirty()) {
    const choice = await _editorDirtyPrompt(_editorPath);
    if (choice === 'cancel') return;
    if (choice === 'save') await saveOpenFile();
    // 'discard' falls through
  }
  try {
    const file = await entry.getFile();
    const text = await file.text();
    _editorHandle = entry;
    _editorPath = path;
    _editorClean = true;
    document.getElementById('editor-title').textContent = '📝 ' + entry.name;
    document.getElementById('editor-filename').textContent = path;
    const ta = document.getElementById('editor-content');
    ta.value = text;
    document.getElementById('editor-dirty').style.display = 'none';
    // Un-minimize and focus the editor window
    const win = document.getElementById('win-editor');
    win.classList.remove('minimized');
    focusWin('win-editor');
    updateDock();
    saveLayout();
    // Track dirty state
    ta.oninput = () => {
      _editorClean = false;
      document.getElementById('editor-dirty').style.display = '';
    };
  } catch(e) {
    termPrint(`Error opening ${path}: ${e.message}`, 'err');
  }
}

function _editorDirtyPrompt(filename) {
  return new Promise(resolve => {
    const overlay = document.getElementById('editor-dirty-overlay');
    document.getElementById('editor-dirty-filename').textContent = filename;
    overlay.classList.add('visible');
    document.getElementById('editor-dirty-save').onclick = () => { overlay.classList.remove('visible'); resolve('save'); };
    document.getElementById('editor-dirty-discard').onclick = () => { overlay.classList.remove('visible'); resolve('discard'); };
    document.getElementById('editor-dirty-cancel').onclick = () => { overlay.classList.remove('visible'); resolve('cancel'); };
  });
}

async function saveOpenFile() {
  if (!_editorHandle) { termPrint('No file open in editor.', 'warn'); return; }
  try {
    const content = document.getElementById('editor-content').value;
    const writable = await _editorHandle.createWritable();
    await writable.write(content);
    await writable.close();
    termPrint(`✓ Saved ${_editorPath}`, 'obs');
    _editorClean = true;
    document.getElementById('editor-dirty').style.display = 'none';
    refreshDesktopIcons();
    refreshFileBrowser();
  } catch(e) {
    termPrint(`Error saving: ${e.message}`, 'err');
  }
}

// Ctrl+S to save when editor is focused
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    const editorWin = document.getElementById('win-editor');
    if (editorWin && editorWin.classList.contains('focused') && _editorHandle) {
      e.preventDefault();
      saveOpenFile();
    }
  }
});

// ═══════════════════════════════════════════
// RECYCLE BIN / TRASH
// ═══════════════════════════════════════════
async function getTrashDir() {
  if (!STATE.wsHandle) return null;
  return await STATE.wsHandle.getDirectoryHandle('.trash', { create: true });
}

async function moveToTrash(path) {
  if (!STATE.wsHandle) return;
  try {
    const { dir: srcDir, fileName } = await resolveFile(STATE.wsHandle, path);
    const srcHandle = await srcDir.getFileHandle(fileName);
    const file = await srcHandle.getFile();
    const content = await file.text();
    const trashDir = await getTrashDir();
    const destHandle = await trashDir.getFileHandle(fileName, { create: true });
    const w = await destHandle.createWritable();
    await w.write(content);
    await w.close();
    await srcDir.removeEntry(fileName);
    termPrint(`🗑 Moved "${fileName}" to Trash`, 'sys');
    refreshDesktopIcons();
    refreshFileBrowser();
    refreshTrashView();
  } catch(e) {
    termPrint(`Error moving to trash: ${e.message}`, 'err');
  }
}

async function restoreFromTrash(name) {
  try {
    const trashDir = await getTrashDir();
    const fh = await trashDir.getFileHandle(name);
    const file = await fh.getFile();
    const content = await file.text();
    const destHandle = await STATE.wsHandle.getFileHandle(name, { create: true });
    const w = await destHandle.createWritable();
    await w.write(content);
    await w.close();
    await trashDir.removeEntry(name);
    termPrint(`↩ Restored "${name}" from Trash`, 'obs');
    refreshDesktopIcons();
    refreshFileBrowser();
    refreshTrashView();
  } catch(e) {
    termPrint(`Error restoring: ${e.message}`, 'err');
  }
}

async function permanentDeleteFromTrash(name) {
  try {
    const trashDir = await getTrashDir();
    await trashDir.removeEntry(name);
    termPrint(`❌ Permanently deleted "${name}"`, 'sys');
    refreshTrashView();
  } catch(e) {
    termPrint(`Error deleting: ${e.message}`, 'err');
  }
}

async function emptyTrash() {
  const allowed = await termConfirm('⚠ Permanently delete all items in Trash?');
  if (!allowed) return;
  try {
    const trashDir = await getTrashDir();
    const names = [];
    for await (const entry of trashDir.values()) names.push(entry.name);
    for (const name of names) await trashDir.removeEntry(name);
    termPrint(`🗑 Trash emptied (${names.length} items removed)`, 'sys');
    refreshTrashView();
  } catch(e) {
    termPrint(`Error emptying trash: ${e.message}`, 'err');
  }
}

async function refreshTrashView() {
  const list = document.getElementById('trash-list');
  const glyphEl = document.getElementById('trash-glyph');
  const titleEl = document.getElementById('trash-title');
  if (!list) return;
  if (!STATE.wsHandle) { list.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">No workspace selected.</div>'; return; }
  try {
    const trashDir = await getTrashDir();
    const entries = [];
    for await (const entry of trashDir.values()) entries.push(entry);
    if (entries.length === 0) {
      list.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">Trash is empty.</div>';
      if (glyphEl) glyphEl.textContent = '🗑';
      if (titleEl) titleEl.textContent = '🗑 Trash';
    } else {
      list.innerHTML = '';
      if (glyphEl) glyphEl.textContent = '🗑';
      if (titleEl) titleEl.textContent = `🗑 Trash (${entries.length})`;
      for (const entry of entries) {
        const row = document.createElement('div');
        row.className = 'trash-entry';
        row.innerHTML = `<span class="fe-icon">📄</span><span class="te-name">${escapeHtml(entry.name)}</span>` +
          `<button class="btn" onclick="restoreFromTrash('${escapeHtml(entry.name)}')">Restore</button>` +
          `<button class="btn btn-danger" onclick="permanentDeleteFromTrash('${escapeHtml(entry.name)}')">Delete</button>`;
        row.oncontextmenu = (e) => {
          showContextMenu(e, [
            { label: 'Restore', icon: '↩', action: () => restoreFromTrash(entry.name) },
            { label: 'Delete Permanently', icon: '❌', action: () => permanentDeleteFromTrash(entry.name), danger: true },
          ]);
        };
        list.appendChild(row);
      }
    }
  } catch {
    list.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">Trash is empty.</div>';
    if (glyphEl) glyphEl.textContent = '🗑';
  }
}

// ═══════════════════════════════════════════
// CONTEXT MENU
// ═══════════════════════════════════════════
function showContextMenu(e, items) {
  e.preventDefault();
  e.stopPropagation();
  const menu = document.getElementById('ctx-menu');
  menu.innerHTML = '';
  // Build menu items
  const submenus = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.divider) {
      menu.insertAdjacentHTML('beforeend', '<div class="ctx-divider"></div>');
      continue;
    }
    if (item.children) {
      const el = document.createElement('div');
      el.className = 'ctx-item ctx-has-sub';
      el.dataset.subIdx = String(submenus.length);
      el.textContent = (item.icon || '') + ' ' + item.label;
      menu.appendChild(el);
      // Build submenu
      const sub = document.createElement('div');
      sub.className = 'ctx-submenu';
      sub.dataset.subIdx = String(submenus.length);
      for (let j = 0; j < item.children.length; j++) {
        const child = item.children[j];
        if (child.divider) { sub.insertAdjacentHTML('beforeend', '<div class="ctx-divider"></div>'); continue; }
        const ce = document.createElement('div');
        ce.className = child.danger ? 'ctx-item danger' : 'ctx-item';
        ce.textContent = (child.icon || '') + ' ' + child.label;
        ce.onclick = () => { hideContextMenu(); if (child.action) child.action(); };
        sub.appendChild(ce);
      }
      menu.appendChild(sub);
      submenus.push({ trigger: el, panel: sub });
    } else {
      const el = document.createElement('div');
      el.className = item.danger ? 'ctx-item danger' : 'ctx-item';
      el.textContent = (item.icon || '') + ' ' + item.label;
      el.onclick = () => { hideContextMenu(); if (item.action) item.action(); };
      menu.appendChild(el);
    }
  }
  // Position menu clamped to viewport
  menu.style.display = 'block';
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let x = e.clientX, y = e.clientY;
  if (x + mw > window.innerWidth) x = window.innerWidth - mw - 4;
  if (y + mh > window.innerHeight) y = window.innerHeight - mh - 4;
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';
  // Submenu hover logic
  let activeSub = null;
  for (const { trigger, panel } of submenus) {
    let hideTimer = null;
    const showSub = () => {
      if (activeSub && activeSub !== panel) activeSub.classList.remove('visible');
      activeSub = panel;
      // Position submenu
      const tr = trigger.getBoundingClientRect();
      const mr = menu.getBoundingClientRect();
      panel.style.left = '';
      panel.style.right = '';
      panel.style.top = '';
      panel.style.bottom = '';
      panel.classList.add('visible');
      const pw = panel.offsetWidth, ph = panel.offsetHeight;
      // Horizontal: right of parent, or flip left
      if (mr.right + pw > window.innerWidth) {
        panel.style.right = mr.width + 'px';
        panel.style.left = 'auto';
      } else {
        panel.style.left = mr.width + 'px';
      }
      // Vertical: align with trigger, or flip up
      const topOffset = tr.top - mr.top;
      if (tr.top + ph > window.innerHeight) {
        panel.style.bottom = '0px';
        panel.style.top = 'auto';
      } else {
        panel.style.top = topOffset + 'px';
      }
    };
    const hideSub = () => { hideTimer = setTimeout(() => { panel.classList.remove('visible'); if (activeSub === panel) activeSub = null; }, 120); };
    const cancelHide = () => { if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; } };
    trigger.addEventListener('mouseenter', () => { cancelHide(); showSub(); });
    trigger.addEventListener('mouseleave', hideSub);
    panel.addEventListener('mouseenter', cancelHide);
    panel.addEventListener('mouseleave', hideSub);
  }
  // Dismiss on click-outside (one-shot)
  setTimeout(() => {
    const dismiss = (ev) => {
      if (!menu.contains(ev.target)) { hideContextMenu(); }
      document.removeEventListener('mousedown', dismiss);
    };
    document.addEventListener('mousedown', dismiss);
  }, 0);
}

function hideContextMenu() {
  const menu = document.getElementById('ctx-menu');
  if (menu) { menu.style.display = 'none'; menu.innerHTML = ''; }
}

// ═══════════════════════════════════════════
// RENAME HELPER
// ═══════════════════════════════════════════
async function renameEntry(entry, oldPath) {
  const newName = prompt('Rename to:', entry.name);
  if (!newName || newName === entry.name) return;
  if (!safePath(newName)) { termPrint('Invalid filename.', 'err'); return; }
  try {
    if (entry.kind === 'file') {
      const file = await entry.getFile();
      const content = await file.text();
      const { dir } = await resolveFile(STATE.wsHandle, oldPath);
      const nfh = await dir.getFileHandle(newName, { create: true });
      const w = await nfh.createWritable();
      await w.write(content);
      await w.close();
      await dir.removeEntry(entry.name);
      termPrint(`✏ Renamed "${entry.name}" → "${newName}"`, 'obs');
    } else {
      termPrint('Directory rename not yet supported.', 'warn');
      return;
    }
    refreshDesktopIcons();
    refreshFileBrowser();
  } catch(e) {
    termPrint(`Error renaming: ${e.message}`, 'err');
  }
}

// ═══════════════════════════════════════════
// DESKTOP BACKGROUND CONTEXT MENU
// ═══════════════════════════════════════════
document.getElementById('desktop')?.addEventListener('contextmenu', (e) => {
  if (e.target.id === 'desktop' || e.target.id === 'desktop-icons') {
    const items = [];
    // Theme submenu
    const themeChildren = [];
    for (const [id, theme] of Object.entries(THEMES)) {
      themeChildren.push({ label: (_currentThemeId === id ? '✓ ' : '  ') + theme.name, action: () => { selectTheme(id); } });
    }
    items.push({ label: 'Theme', icon: '🎨', children: themeChildren });
    // Wallpaper submenu
    const wpChildren = [];
    for (const [id, wp] of Object.entries(WALLPAPERS)) {
      wpChildren.push({ label: (_currentWallpaperId === id ? '✓ ' : '  ') + wp.name, action: () => { selectWallpaper(id); } });
    }
    items.push({ label: 'Wallpaper', icon: '🖼', children: wpChildren });
    // Chrome submenu
    const chromeChildren = [];
    for (const [id, style] of Object.entries(CHROME_STYLES)) {
      chromeChildren.push({ label: (_currentChromeId === id ? '✓ ' : '  ') + style.name, icon: style.emoji, action: () => { selectChrome(id); } });
    }
    items.push({ label: 'Chrome', icon: '🖥', children: chromeChildren });
    // Workspace items if loaded
    if (STATE.wsHandle) {
      items.push({ divider: true });
      items.push({ label: 'New File', icon: '📄', action: async () => {
        const name = prompt('File name:');
        if (!name || !safePath(name)) return;
        try {
          const fh = await STATE.wsHandle.getFileHandle(name, { create: true });
          const w = await fh.createWritable();
          await w.write('');
          await w.close();
          termPrint(`📄 Created "${name}"`, 'obs');
          refreshDesktopIcons();
          refreshFileBrowser();
        } catch(err) { termPrint(`Error: ${err.message}`, 'err'); }
      }});
      items.push({ label: 'New Folder', icon: '📁', action: async () => {
        const name = prompt('Folder name:');
        if (!name || !safePath(name)) return;
        try {
          await STATE.wsHandle.getDirectoryHandle(name, { create: true });
          termPrint(`📁 Created folder "${name}"`, 'obs');
          refreshDesktopIcons();
          refreshFileBrowser();
        } catch(err) { termPrint(`Error: ${err.message}`, 'err'); }
      }});
      items.push({ divider: true });
      items.push({ label: 'Refresh', icon: '🔄', action: () => { refreshDesktopIcons(); refreshFileBrowser(); } });
    }
    showContextMenu(e, items);
  }
});

// ═══════════════════════════════════════════
// FILE BROWSER (navigable with breadcrumbs)
// ═══════════════════════════════════════════
let _fileBrowserPath = '';

async function resolveDirHandle(path) {
  let dir = STATE.wsHandle;
  if (!path) return dir;
  const segs = path.replace(/\\/g, '/').split('/').filter(s => s && s !== '.');
  for (const seg of segs) dir = await dir.getDirectoryHandle(seg);
  return dir;
}

function navigateFileBrowser(path) {
  _fileBrowserPath = (path || '').replace(/\/+$/, '');
  // Open the Files window if minimized
  const win = document.getElementById('win-files');
  if (win && win.classList.contains('minimized')) {
    win.classList.remove('minimized');
    focusWin('win-files');
    updateDock();
    saveLayout();
  }
  refreshFileBrowser();
}

function renderBreadcrumbs() {
  const bar = document.getElementById('fb-breadcrumb');
  if (!bar) return;
  const segs = _fileBrowserPath ? _fileBrowserPath.split('/') : [];
  bar.innerHTML = '';
  // Root crumb
  const root = document.createElement('span');
  root.className = 'fb-crumb' + (segs.length === 0 ? ' current' : '');
  root.textContent = '📁 ' + (STATE.wsHandle ? STATE.wsHandle.name : 'root');
  if (segs.length > 0) root.onclick = () => navigateFileBrowser('');
  bar.appendChild(root);
  // Path segments
  for (let i = 0; i < segs.length; i++) {
    const sep = document.createElement('span');
    sep.className = 'fb-sep';
    sep.textContent = '›';
    bar.appendChild(sep);
    const crumb = document.createElement('span');
    crumb.className = 'fb-crumb' + (i === segs.length - 1 ? ' current' : '');
    crumb.textContent = segs[i];
    if (i < segs.length - 1) {
      const target = segs.slice(0, i + 1).join('/');
      crumb.onclick = () => navigateFileBrowser(target);
    }
    bar.appendChild(crumb);
  }
}

async function refreshFileBrowser() {
  const panel = document.getElementById('file-browser');
  if (!panel || !STATE.wsHandle) return;
  panel.innerHTML = '';
  renderBreadcrumbs();
  try {
    const dirHandle = await resolveDirHandle(_fileBrowserPath);
    await renderDirEntries(panel, dirHandle, _fileBrowserPath);
  } catch(e) {
    panel.innerHTML = `<div style="color:var(--red);padding:12px;font-size:11px;font-family:var(--font-mono)">Error: ${escapeHtml(e.message)}</div>`;
  }
}

async function renderDirEntries(container, dirHandle, prefix) {
  const prefixSlash = prefix ? prefix + '/' : '';
  try {
    const dirs = [], files = [];
    for await (const entry of dirHandle.values()) {
      if (entry.name.startsWith('.')) continue;
      if (entry.kind === 'directory') dirs.push(entry);
      else files.push(entry);
    }
    // Sort alphabetically
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    // Render directories first
    for (const entry of dirs) {
      const row = document.createElement('div');
      row.className = 'file-entry';
      const fullPath = prefixSlash + entry.name;
      row.innerHTML = `<span class="fe-icon">📁</span><span class="fe-name">${escapeHtml(entry.name)}/</span>`;
      row.onclick = () => navigateFileBrowser(fullPath);
      row.oncontextmenu = (e) => {
        e.stopPropagation();
        showContextMenu(e, [
          { label: 'Open', icon: '📁', action: () => navigateFileBrowser(fullPath) },
          { label: 'Rename', icon: '✏', action: () => renameEntry(entry, fullPath) },
          { divider: true },
          { label: 'Delete', icon: '🗑', action: () => moveToTrash(fullPath), danger: true },
        ]);
      };
      container.appendChild(row);
    }
    // Render files
    for (const entry of files) {
      const row = document.createElement('div');
      row.className = 'file-entry';
      const fullPath = prefixSlash + entry.name;
      const file = await entry.getFile();
      const sizeStr = file.size < 1024 ? file.size + 'B' : (file.size / 1024).toFixed(1) + 'KB';
      row.innerHTML = `<span class="fe-icon">📄</span><span class="fe-name">${escapeHtml(entry.name)}</span><span class="fe-size">${sizeStr}</span>`;
      row.onclick = () => openFileInEditor(entry, fullPath);
      row.oncontextmenu = (e) => {
        e.stopPropagation();
        showContextMenu(e, [
          { label: 'Open', icon: '📝', action: () => openFileInEditor(entry, fullPath) },
          { label: 'Rename', icon: '✏', action: () => renameEntry(entry, fullPath) },
          { divider: true },
          { label: 'Delete', icon: '🗑', action: () => moveToTrash(fullPath), danger: true },
        ]);
      };
      container.appendChild(row);
    }
    if (dirs.length === 0 && files.length === 0) {
      container.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">(empty directory)</div>';
    }
  } catch {}
}
