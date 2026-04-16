// ═══════════════════════════════════════════
// COURSE GUIDE
// ═══════════════════════════════════════════
let currentChapter = 0;
const TOTAL_CHAPTERS = 9; // 0 intro, 1-7 course chapters, 8 post-credits appendix

function showChapter(n) {
  currentChapter = Math.max(0, Math.min(n, TOTAL_CHAPTERS - 1));
  document.querySelectorAll('.ch-content').forEach((c, i) =>
    c.classList.toggle('active', i === currentChapter));
  updateGuideUI();
  if (typeof updateGating === 'function') updateGating();
  if (typeof updateGuideLiveState === 'function') updateGuideLiveState();
}

function guideNav(dir) {
  showChapter(currentChapter + dir);
  saveLayout();
}

function updateGuideUI() {
  // Progress pips
  const prog = document.getElementById('guide-progress');
  prog.innerHTML = '';
  for (let i = 0; i < TOTAL_CHAPTERS; i++) {
    const pip = document.createElement('div');
    pip.className = 'guide-pip';
    if (i === currentChapter) pip.classList.add('current');
    pip.onclick = () => { showChapter(i); saveLayout(); };
    prog.appendChild(pip);
  }
  // Position label
  document.getElementById('guide-pos').textContent = `${currentChapter} / ${TOTAL_CHAPTERS - 1}`;
  // Nav buttons
  document.getElementById('guide-prev').disabled = currentChapter === 0;
  document.getElementById('guide-next').disabled = currentChapter >= TOTAL_CHAPTERS - 1;
}

function toggleGuide() {
  const gp = document.getElementById('guide-panel');
  gp.classList.toggle('visible');
  saveLayout();
}

const CHAPTER_TITLES = [
  '0. Welcome',
  '1. The Anatomy',
  '2. At the Mountains of MadLibs',
  '3. The Beat Sheet',
  '4. The Factory',
  '5. The Reader',
  '6. The Catalog & Covers',
  '7. The Package',
  '8. Beyond the Novel (post-credits)',
];

function showGuideIndex() {
  // Close if already open
  const existing = document.getElementById('guide-index-pop');
  if (existing) { existing.remove(); return; }

  const pop = document.createElement('div');
  pop.id = 'guide-index-pop';
  pop.className = 'guide-index-pop';
  pop.innerHTML = CHAPTER_TITLES.map((t, i) => {
    const isCurrent = i === currentChapter;
    return `<div class="guide-index-item ${isCurrent ? 'current' : ''}" data-ch="${i}">${t}</div>`;
  }).join('');
  document.getElementById('guide-panel').appendChild(pop);

  // Click handlers
  pop.querySelectorAll('.guide-index-item').forEach(el => {
    el.addEventListener('click', () => {
      const ch = parseInt(el.dataset.ch);
      showChapter(ch);
      saveLayout();
      pop.remove();
    });
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function closer(e) {
      if (!pop.contains(e.target) && !e.target.classList.contains('guide-btn-idx')) {
        pop.remove();
        document.removeEventListener('click', closer);
      }
    });
  }, 0);
}

// Guide panel resize
(function() {
  const handle = document.getElementById('guide-resize');
  if (!handle) return;
  let dragging = false, startX, startW;
  handle.addEventListener('mousedown', e => {
    e.preventDefault();
    dragging = true;
    handle.classList.add('dragging');
    startX = e.clientX;
    startW = document.getElementById('guide-panel').offsetWidth;
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const w = Math.max(200, Math.min(600, startW + (e.clientX - startX)));
    document.getElementById('guide-panel').style.width = w + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; handle.classList.remove('dragging'); saveLayout(); }
  });
})();
