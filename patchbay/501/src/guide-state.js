// ═══════════════════════════════════════════
// LIVE GUIDE STATE
// Renders current novel/skull/generation status inline in the guide.
// Called whenever STATE changes (generation, selection, skull awards).
// ═══════════════════════════════════════════

function renderGuideState() {
  const novel = STATE.novels[STATE.currentNovel];
  const els = document.querySelectorAll('.guide-state');
  if (!els.length) return;

  const title = novel?.bible ? (extractTitle(novel.bible) || 'Untitled') : null;
  const hasBible = !!novel?.bible;
  const hasBeats = !!novel?.beats;
  const chaptersCount = novel?.chapters?.length || 0;
  const hasCover = !!novel?.cover;
  const skullsEarned = STATE.skulls.filter(Boolean).length;

  const novelsTotal = STATE.novels.length;
  const preGenCount = STATE.novels.filter(n => n.preGen).length;
  const userCount = novelsTotal - preGenCount;

  const row = (label, value, done) =>
    `<div class="guide-state-row"><span>${label}</span><strong class="${done ? 'guide-state-done' : 'guide-state-pending'}">${value}</strong></div>`;

  const html = `
    <div class="guide-state-title">Current state</div>
    ${novel ? row('Selected novel:', title || '(untitled)', true) : row('Selected novel:', 'none', false)}
    ${row('Bible:', hasBible ? '✓' : '—', hasBible)}
    ${row('Beat sheet:', hasBeats ? '✓' : '—', hasBeats)}
    ${row('Chapters:', chaptersCount + '/15', chaptersCount === 15)}
    ${hasCover ? row('Cover:', '✓', true) : ''}
    ${row('Library size:', novelsTotal + (userCount ? ` (${userCount} yours)` : ''), novelsTotal >= 3)}
    ${row('Skulls earned:', skullsEarned + '/5', skullsEarned === 5)}
  `;

  els.forEach(el => { el.innerHTML = html; });
}

// Auto-check task list items based on state
function renderGuideTasks() {
  // Find task items with data-check attributes
  document.querySelectorAll('.ch-content .task ol li[data-check]').forEach(li => {
    const check = li.dataset.check;
    let done = false;
    const novel = STATE.novels[STATE.currentNovel];

    switch (check) {
      case 'has-provider': done = !!STATE.provider; break;
      case 'has-library':  done = STATE.novels.length > 0; break;
      case 'has-bible':    done = !!novel?.bible; break;
      case 'has-beats':    done = !!novel?.beats; break;
      case 'has-chapter1': done = novel?.chapters?.length >= 1; break;
      case 'has-all-chapters': done = novel?.chapters?.length >= 15; break;
      case 'has-cover':    done = !!novel?.cover; done = done || STATE.novels.some(n => n.cover); break;
      case 'previewed':    done = STATE.skulls[2]; break;
      case 'has-3-novels': done = STATE.novels.length >= 3; break;
      case 'exported':     done = STATE.skulls[4]; break;
    }
    li.classList.toggle('done', done);
  });
}

// Called from: saveState after any mutation, on chapter navigation, on boot
function updateGuideLiveState() {
  renderGuideState();
  renderGuideTasks();
}

// Hook into saveState — monkeypatch to trigger updates on any save
(function hookSaveState() {
  if (typeof saveState !== 'function') return;
  const original = saveState;
  saveState = function(...args) {
    const result = original.apply(this, args);
    // Defer to next tick so DOM can settle
    setTimeout(updateGuideLiveState, 0);
    return result;
  };
})();
