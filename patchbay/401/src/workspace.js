// ═══════════════════════════════════════════
// FSAA WORKSPACE
// ═══════════════════════════════════════════
const REFUSE_NAMES = new Set(['desktop','documents','downloads','pictures','music','videos',
  'appdata','application data','.ssh','.config','.local','node_modules','.git','users','home']);

async function pickWorkspace() {
  if (!window.showDirectoryPicker) {
    termLog('Your browser does not support the File System Access API. Use Chrome or Edge.', 'warn');
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
    const name = handle.name.toLowerCase();

    // Refuse obviously dangerous folders
    if (REFUSE_NAMES.has(name)) {
      termLog(`🛑 Refused: "${handle.name}" is a system folder. Choose or create a dedicated folder for your agent.`, 'err');
      return;
    }

    // Count existing files
    let fileCount = 0;
    const fileNames = [];
    for await (const entry of handle.values()) {
      if (entry.name === '.patchbay-agent-workspace') { /* known workspace, skip counting */ fileCount = -1; break; }
      fileCount++;
      if (fileNames.length < 10) fileNames.push(entry.name);
    }

    if (fileCount > 100) {
      termLog(`🛑 Refused: this folder has ${fileCount}+ files. Create a new empty folder for your agent.`, 'err');
      return;
    }

    if (fileCount > 0) {
      // Show warning
      document.getElementById('folder-warn-files').innerHTML =
        `<div style="margin-bottom:4px"><strong>${fileCount} files found:</strong></div>` +
        fileNames.map(f => `<div>  ${f}</div>`).join('') +
        (fileCount > 10 ? `<div style="color:var(--amber)">  ...and ${fileCount - 10} more</div>` : '');
      document.getElementById('folder-warn-check').checked = false;
      document.getElementById('folder-warn-confirm').disabled = true;
      document.getElementById('folder-warn-overlay').classList.add('visible');
      STATE._pendingHandle = handle;
      return;
    }

    // Empty folder or known workspace — proceed
    await initWorkspace(handle);
  } catch(e) {
    if (e.name !== 'AbortError') termLog('Folder selection failed: ' + e.message, 'err');
  }
}

document.getElementById('folder-warn-check')?.addEventListener('change', function() {
  document.getElementById('folder-warn-confirm').disabled = !this.checked;
});

function cancelFolderPick() {
  document.getElementById('folder-warn-overlay').classList.remove('visible');
  STATE._pendingHandle = null;
}

async function confirmFolder() {
  document.getElementById('folder-warn-overlay').classList.remove('visible');
  if (STATE._pendingHandle) await initWorkspace(STATE._pendingHandle);
  STATE._pendingHandle = null;
}

async function initWorkspace(handle) {
  STATE.wsHandle = handle;

  // Persist handle to IndexedDB for next session
  try { await Vault.saveHandle(handle); } catch(e) { console.warn('Could not persist workspace handle:', e); }

  // Create directories
  await handle.getDirectoryHandle('notes', { create: true });
  await handle.getDirectoryHandle('skills', { create: true });
  await handle.getDirectoryHandle('logs', { create: true });

  // Create marker
  const marker = await handle.getFileHandle('.patchbay-agent-workspace', { create: true });
  const mw = await marker.createWritable();
  await mw.write(JSON.stringify({ created: new Date().toISOString(), workshop: 'patchbay-401', version: '1.0.0' }));
  await mw.close();

  // Create soul.md if missing
  let soulContent = DEFAULT_SOUL;
  try {
    const sf = await handle.getFileHandle('soul.md');
    const file = await sf.getFile();
    soulContent = await file.text();
  } catch {
    const sf = await handle.getFileHandle('soul.md', { create: true });
    const sw = await sf.createWritable();
    await sw.write(DEFAULT_SOUL);
    await sw.close();
  }
  document.getElementById('soul-editor').value = soulContent;

  // Create memory.json if missing
  try { await handle.getFileHandle('memory.json'); }
  catch {
    const mf = await handle.getFileHandle('memory.json', { create: true });
    const mw2 = await mf.createWritable();
    await mw2.write('{}');
    await mw2.close();
  }

  STATE.wsReady = true;
  document.getElementById('ws-display').value = handle.name;
  document.getElementById('sp-ws').style.display = '';
  document.getElementById('ws-path').textContent = handle.name;
  document.getElementById('trash-icon').style.display = '';
  termLog(`📁 Workspace ready: ${handle.name}/`, 'sys');
  termLog(`   soul.md | memory.json | notes/ | skills/ | logs/`, 'sys');
  refreshTrashView();
  checkReady();
}

// ═══════════════════════════════════════════
// SOUL.MD
// ═══════════════════════════════════════════
async function saveSoul() {
  const text = document.getElementById('soul-editor').value;
  if (!STATE.wsHandle) { termLog('No workspace — soul.md saved in memory only.', 'warn'); return; }
  try {
    const sf = await STATE.wsHandle.getFileHandle('soul.md', { create: true });
    const sw = await sf.createWritable();
    await sw.write(text);
    await sw.close();
    termLog('✓ soul.md saved.', 'obs');
  } catch(e) {
    termLog('Failed to save soul.md: ' + e.message, 'err');
  }
}

function getSoul() {
  return document.getElementById('soul-editor').value;
}
