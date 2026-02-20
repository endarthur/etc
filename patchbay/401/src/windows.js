// ═══════════════════════════════════════════
// WINDOW MANAGER
// ═══════════════════════════════════════════
let topZ = 100, dragState = null, resizeState = null;

// ═══════════════════════════════════════════
// LAYOUT PERSISTENCE
// ═══════════════════════════════════════════
function saveLayout() {
  const layout = { windows: {}, guide: {} };
  document.querySelectorAll('.window').forEach(w => {
    layout.windows[w.id] = {
      left: w.style.left, top: w.style.top,
      width: w.style.width, height: w.style.height,
      minimized: w.classList.contains('minimized'),
      z: parseInt(w.style.zIndex) || 0
    };
  });
  const gp = document.getElementById('guide-panel');
  layout.guide.visible = gp.classList.contains('visible');
  layout.guide.width = gp.style.width || '';
  layout.guide.chapter = currentChapter;
  localStorage.setItem('pb401-layout', JSON.stringify(layout));
}

function restoreLayout() {
  let layout;
  try { layout = JSON.parse(localStorage.getItem('pb401-layout')); } catch(e) {}
  if (!layout) return false;
  if (layout.windows) {
    for (const [id, s] of Object.entries(layout.windows)) {
      const w = document.getElementById(id);
      if (!w) continue;
      if (s.left) w.style.left = s.left;
      if (s.top) w.style.top = s.top;
      if (s.width) w.style.width = s.width;
      if (s.height) w.style.height = s.height;
      if (s.minimized) w.classList.add('minimized'); else w.classList.remove('minimized');
      if (s.z) w.style.zIndex = s.z;
    }
    const maxZ = Math.max(0, ...Object.values(layout.windows).map(s => s.z || 0));
    if (maxZ > topZ) topZ = maxZ;
  }
  if (layout.guide) {
    const gp = document.getElementById('guide-panel');
    if (layout.guide.visible) gp.classList.add('visible'); else gp.classList.remove('visible');
    if (layout.guide.width) gp.style.width = layout.guide.width;
    if (typeof layout.guide.chapter === 'number') showChapter(layout.guide.chapter);
  }
  updateDock();
  return true;
}

function focusWin(id) {
  document.querySelectorAll('.window').forEach(w => w.classList.remove('focused'));
  const win = document.getElementById(id);
  if (win) { win.classList.add('focused'); win.style.zIndex = ++topZ; }
}
function closeWin(id) { document.getElementById(id).classList.add('minimized'); updateDock(); saveLayout(); }
function minimizeWin(id) { document.getElementById(id).classList.add('minimized'); updateDock(); saveLayout(); }
function toggleWin(id) {
  const win = document.getElementById(id);
  if (!win) return;
  if (win.classList.contains('minimized')) {
    win.classList.remove('minimized'); focusWin(id);
    if (id === 'win-terminal') setTimeout(() => document.getElementById('term-input').focus(), 0);
  } else win.classList.add('minimized');
  updateDock(); saveLayout();
}
function resetWinPos(id) {
  const win = document.getElementById(id);
  if (!win) return;
  win.classList.remove('minimized');
  win.style.left = '80px'; win.style.top = '40px';
  win.style.width = ''; win.style.height = '';
  focusWin(id);
  updateDock(); saveLayout();
}

const DOCK_MAP = { 'win-terminal':0, 'win-inspector':1, 'win-editor':2, 'win-files':3, 'win-memory':4, 'win-skills':5, 'win-routing':6, 'win-scheduler':7, 'win-about':8, 'win-log':9, 'win-settings':10 };
function updateDock() {
  const items = document.querySelectorAll('#dock .dock-item');
  for (const [wid, idx] of Object.entries(DOCK_MAP)) {
    const w = document.getElementById(wid);
    if (w && items[idx]) items[idx].classList.toggle('active', !w.classList.contains('minimized'));
  }
}

function startDrag(e, id) {
  if (e.target.classList.contains('dot')) return;
  e.preventDefault(); focusWin(id);
  const r = document.getElementById(id).getBoundingClientRect();
  dragState = { id, ox: e.clientX - r.left, oy: e.clientY - r.top };
}
function startResize(e, id) {
  e.preventDefault(); e.stopPropagation(); focusWin(id);
  const r = document.getElementById(id).getBoundingClientRect();
  resizeState = { id, sx: e.clientX, sy: e.clientY, sw: r.width, sh: r.height };
}
document.addEventListener('mousemove', e => {
  if (dragState) {
    const w = document.getElementById(dragState.id);
    w.style.left = (e.clientX - dragState.ox) + 'px';
    w.style.top = Math.max(0, e.clientY - dragState.oy - 28) + 'px';
  }
  if (resizeState) {
    const w = document.getElementById(resizeState.id);
    w.style.width = Math.max(280, resizeState.sw + (e.clientX - resizeState.sx)) + 'px';
    w.style.height = Math.max(180, resizeState.sh + (e.clientY - resizeState.sy)) + 'px';
  }
});
document.addEventListener('mouseup', () => { if (dragState || resizeState) saveLayout(); dragState = null; resizeState = null; });
document.addEventListener('mousedown', e => { const w = e.target.closest('.window'); if (w) focusWin(w.id); });

function desktopClick(e) { if (e.target === document.getElementById('desktop')) { document.querySelectorAll('.window').forEach(w => w.classList.remove('focused')); } }

// Double-click dock icon → reset window position (recovery from off-screen)
document.addEventListener('dblclick', e => {
  const item = e.target.closest('.dock-item');
  if (!item) return;
  const idx = [...item.parentElement.querySelectorAll('.dock-item')].indexOf(item);
  const wid = Object.keys(DOCK_MAP).find(k => DOCK_MAP[k] === idx);
  if (wid) resetWinPos(wid);
});
