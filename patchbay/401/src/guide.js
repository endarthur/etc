// ═══════════════════════════════════════════
// CHAPTER GUIDE
// ═══════════════════════════════════════════
const TOTAL_CHAPTERS = 15; // 0-14
let currentChapter = 0;

function toggleGuide() { document.getElementById('guide-panel').classList.toggle('visible'); saveLayout(); }

function initGuidePips() {
  const bar = document.getElementById('guide-progress');
  bar.innerHTML = '';
  for (let i = 0; i < TOTAL_CHAPTERS; i++) {
    const pip = document.createElement('span');
    pip.className = 'guide-pip' + (i === 0 ? ' current' : '');
    pip.title = 'Chapter ' + i;
    pip.onclick = () => showChapter(i);
    bar.appendChild(pip);
  }
}

function showChapter(n) {
  if (n < 0 || n >= TOTAL_CHAPTERS) return;
  currentChapter = n;
  document.querySelectorAll('.ch-content').forEach(c => c.classList.remove('active'));
  const txt = document.getElementById('ch-text-' + n);
  if (txt) txt.classList.add('active');
  // scroll guide body to top
  const body = document.querySelector('.guide-body');
  if (body) body.scrollTop = 0;
  // update pips
  document.querySelectorAll('.guide-pip').forEach((p, i) => {
    p.classList.toggle('current', i === n);
    p.classList.toggle('done', i < n);
  });
  // update position text
  document.getElementById('guide-pos').textContent = n + ' / ' + (TOTAL_CHAPTERS - 1);
  // enable/disable nav buttons
  document.getElementById('guide-prev').disabled = (n === 0);
  document.getElementById('guide-next').disabled = (n === TOTAL_CHAPTERS - 1);
  // close index if open
  const idx = document.getElementById('guide-index');
  if (idx) idx.remove();
  saveLayout();
}

function guideNav(delta) {
  showChapter(currentChapter + delta);
}

function showGuideIndex() {
  let idx = document.getElementById('guide-index');
  if (idx) { idx.remove(); return; }
  idx = document.createElement('div');
  idx.id = 'guide-index';
  idx.style.cssText = 'position:absolute;bottom:44px;left:0;right:0;background:var(--surface);border-top:1px solid var(--border);padding:8px;max-height:220px;overflow-y:auto;z-index:10';
  const titles = ['0 — Setup','1 — First Words','2 — Giving It Hands','3 — Home Turf','4 — The Persistent Self','5 — The Context Budget','6 — Skills & Superpowers','7 — Self-Modification','8 — The Switchboard','9 — Beyond the Terminal','10 — The Senses','11 — The Landscape','12 — Going Local','13 — Autonomy','14 — Certificate'];
  titles.forEach((t, i) => {
    const row = document.createElement('div');
    row.textContent = t;
    row.style.cssText = 'padding:4px 8px;cursor:pointer;font-size:12px;border-radius:4px;color:' + (i === currentChapter ? 'var(--cyan)' : 'var(--text-dim)');
    row.onmouseenter = () => row.style.background = 'var(--bg)';
    row.onmouseleave = () => row.style.background = 'none';
    row.onclick = () => showChapter(i);
    idx.appendChild(row);
  });
  document.querySelector('.guide-footer').appendChild(idx);
}

// Guide resize drag
(function() {
  const handle = document.getElementById('guide-resize');
  const panel = document.getElementById('guide-panel');
  let dragging = false;
  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    dragging = true;
    handle.classList.add('dragging');
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const w = Math.max(200, Math.min(e.clientX, window.innerWidth - 200));
    panel.style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    saveLayout();
  });
})();
