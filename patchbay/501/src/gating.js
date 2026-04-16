// ═══════════════════════════════════════════
// COURSE MODE GATING
// Progressive window unlock tied to guide chapters
// ═══════════════════════════════════════════

// Which windows are available at each chapter
// Each chapter ADDS to what's already unlocked (cumulative)
const CHAPTER_GATES = {
  0: ['win-settings', 'win-commission'],           // Intro: settings + browse tropes
  1: ['win-editorial'],                             // Anatomy: examine pre-gen bible/beats
  2: [],                                            // MadLibs: commissioning now allows generation (handled by button gating)
  3: [],                                            // Beat Sheet: editorial beats tab (already unlocked)
  4: ['win-factory'],                               // Factory: chapter generation
  5: ['win-phone'],                                 // Reader: phone preview
  6: ['win-library'],                               // Catalog & Covers: library + cover gen
  7: ['win-export'],                                // Package: export + certificate
};

function getUnlockedWindows() {
  if (!STATE.courseMode) return null; // null = all unlocked

  const unlocked = new Set();
  for (let ch = 0; ch <= currentChapter; ch++) {
    (CHAPTER_GATES[ch] || []).forEach(w => unlocked.add(w));
  }
  return unlocked;
}

function isWindowLocked(winId) {
  const unlocked = getUnlockedWindows();
  if (!unlocked) return false; // "Just Build" mode — nothing locked
  return !unlocked.has(winId);
}

function updateGating() {
  const unlocked = getUnlockedWindows();
  const items = document.querySelectorAll('#dock .dock-item');

  for (const [winId, dockIdx] of Object.entries(DOCK_MAP)) {
    const item = items[dockIdx];
    if (!item) continue;

    if (!unlocked) {
      // Just Build — everything unlocked
      item.classList.remove('locked');
    } else {
      item.classList.toggle('locked', !unlocked.has(winId));
    }
  }

  // Also update generate bible button — locked until chapter 2 in course mode
  if (STATE.courseMode && currentChapter < 2) {
    const btn = document.getElementById('btn-generate-bible');
    if (btn) btn.disabled = true;
  }
}

// Patch toggleWin to respect gating
const _originalToggleWin = toggleWin;
toggleWin = function(id) {
  if (isWindowLocked(id)) return; // silently ignore locked windows
  _originalToggleWin(id);
};
