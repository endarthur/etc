// ═══════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════

function updateCombo() {
  const who = document.getElementById('trope-who').value;
  const what = document.getElementById('trope-what').value;
  const how = document.getElementById('trope-how').value;
  const with_ = document.getElementById('trope-with').value;
  const combo = document.getElementById('trope-combo');

  if (!who && !what && !how) {
    combo.style.display = 'none';
    return;
  }
  combo.style.display = 'block';
  const parts = [];
  if (who) parts.push(`<span class="combo-label">WHO:</span> ${document.getElementById('trope-who').selectedOptions[0].text}`);
  if (what) parts.push(`<span class="combo-label">WHAT:</span> ${document.getElementById('trope-what').selectedOptions[0].text}`);
  if (how) parts.push(`<span class="combo-label">HOW:</span> ${document.getElementById('trope-how').selectedOptions[0].text}`);
  if (with_) parts.push(`<span class="combo-label">WITH:</span> ${document.getElementById('trope-with').selectedOptions[0].text}`);
  combo.innerHTML = parts.join('<br>');

  // Enable bible generation when at least WHO + WHAT + HOW are set
  const canGenerate = who && what && how && STATE.providerReady;
  document.getElementById('btn-generate-bible').disabled = !canGenerate;
}

function randomizeTropes() {
  ['trope-who', 'trope-what', 'trope-how', 'trope-with'].forEach(id => {
    const sel = document.getElementById(id);
    // Skip first option (placeholder)
    const idx = 1 + Math.floor(Math.random() * (sel.options.length - 1));
    sel.selectedIndex = idx;
  });
  updateCombo();
}

function updateSkulls() {
  STATE.skulls.forEach((earned, i) => {
    const el = document.getElementById('skull-' + i);
    if (el) el.classList.toggle('earned', earned);
  });
}

function startCourse() {
  STATE.courseMode = true;
  STATE.hasStarted = true;
  saveState();
  document.getElementById('splash').classList.add('hidden');
  const gp = document.getElementById('guide-panel');
  gp.classList.add('visible');
  showChapter(0);
  // Minimize all windows except the ones unlocked at ch 0
  document.querySelectorAll('.window').forEach(w => {
    if (isWindowLocked(w.id)) w.classList.add('minimized');
  });
  // Open Settings + Commissioning by default
  toggleWin('win-settings');
  toggleWin('win-commission');
  updateDock();
}

function startTool() {
  STATE.courseMode = false;
  STATE.hasStarted = true;
  saveState();
  document.getElementById('splash').classList.add('hidden');
  updateGating();
}

function startNewNovel() {
  // Reset trope selectors
  ['trope-who', 'trope-what', 'trope-how', 'trope-with'].forEach(id => {
    document.getElementById(id).selectedIndex = 0;
  });
  const tags = document.getElementById('trope-tags');
  if (tags) tags.value = '';
  document.getElementById('trope-combo').style.display = 'none';
  document.getElementById('btn-generate-bible').disabled = true;

  // Clear current novel pointer — next generateBible() will create a new one
  STATE.currentNovel = null;
  saveState();

  // Reset editorial
  document.getElementById('ed-bible').innerHTML =
    '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">No bible generated yet. Use the Commissioning window to pick tropes and generate.</div>';
  document.getElementById('ed-beats').innerHTML =
    '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">No beat sheet generated yet. Generate a bible first.</div>';
  editorialTab('bible');

  // Reset factory
  document.querySelectorAll('#factory-progress .factory-pip').forEach(p => p.className = 'factory-pip');
  document.getElementById('fact-ch-count').textContent = '0';
  document.getElementById('fact-word-count').textContent = '0';
  document.getElementById('factory-stream').innerHTML =
    '<span style="color:var(--text-faint)">No chapters generated yet. Generate a bible and beat sheet first.</span>';
  document.getElementById('btn-gen-next').disabled = true;
  document.getElementById('btn-automate').disabled = true;
}

// ═══ Boot ═══
(async function boot() {
  // Load config from localStorage (sync) + novels from IDB (async)
  await loadState();

  // If no novels yet, load the pre-generated library (if embedded)
  await loadPreGenLibraryIfEmpty();

  updateSkulls();

  // Restore provider UI
  if (STATE.provider) {
    selectProvider(STATE.provider);
  }
  if (STATE.providerReady) {
    const ff = document.getElementById('trope-freeform');
    if (ff) ff.style.display = 'block';
  }

  // Hide splash only if the user has already started (picked Course or Just Build).
  // Auto-loaded pre-gen library alone does NOT count as "started".
  if (STATE.hasStarted) {
    restoreLayout();
    document.getElementById('splash').classList.add('hidden');
    updateGuideUI();
  }

  updateProviderStatus();
  updateNovelCount();
  renderCertSection();
  updateGating();
  if (typeof initReaderSettingsUI === 'function') initReaderSettingsUI();
  if (typeof updateGuideLiveState === 'function') updateGuideLiveState();

  // Populate cover selectors
  const coverModelSel = document.getElementById('cover-model');
  if (coverModelSel) {
    IMAGE_MODELS.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.id; opt.textContent = `${m.name} — ${m.desc}`;
      if (m.id === (STATE.imageModel || DEFAULT_IMAGE_MODEL)) opt.selected = true;
      coverModelSel.appendChild(opt);
    });
  }
  const coverStyleSel = document.getElementById('cover-style');
  if (coverStyleSel) {
    COVER_STYLES.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id; opt.textContent = s.name + (s.desc ? ' — ' + s.desc : '');
      if (s.id === (STATE.coverStyle || 'default')) opt.selected = true;
      coverStyleSel.appendChild(opt);
    });
  }

  // Restore current novel UI
  if (STATE.currentNovel !== null && STATE.novels[STATE.currentNovel]) {
    const novel = STATE.novels[STATE.currentNovel];
    if (novel.bible) displayBible(novel.bible);
    if (novel.beats) displayBeats(novel.beats);
    updateFactoryUI(novel);
    renderLibrary();
  }
})();
