// ═══════════════════════════════════════════
// RESET FUNCTIONS
// Fine-grained and nuclear options for clearing state.
// ═══════════════════════════════════════════

// ─── Confirmation modal helper ───
function confirmAction({ title, body, danger = true, confirmLabel = 'Confirm', typeToConfirm = null }) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'overlay visible';

    const typeInputHtml = typeToConfirm
      ? `<div style="margin-top:12px">
           <div style="font-size:11px;color:var(--text-dim);margin-bottom:4px">Type <strong style="color:var(--red);font-family:var(--font-mono)">${typeToConfirm}</strong> to confirm:</div>
           <input type="text" id="confirm-input" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:7px 10px;color:var(--text);font-family:var(--font-mono);font-size:12px" autocomplete="off">
         </div>`
      : '';

    overlay.innerHTML = `<div class="modal" style="max-width:440px">
      <div class="modal-header"><h2 style="${danger ? 'color:var(--red)' : ''}">${title}</h2></div>
      <div class="modal-body">
        <div style="font-size:12px;color:var(--text-dim);line-height:1.6">${body}</div>
        ${typeInputHtml}
      </div>
      <div class="modal-footer">
        <button class="btn" id="confirm-cancel">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok" ${typeToConfirm ? 'disabled' : ''}>${confirmLabel}</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    const cancel = () => { overlay.remove(); resolve(false); };
    const ok = () => { overlay.remove(); resolve(true); };

    overlay.querySelector('#confirm-cancel').onclick = cancel;
    overlay.querySelector('#confirm-ok').onclick = ok;

    if (typeToConfirm) {
      const input = overlay.querySelector('#confirm-input');
      const okBtn = overlay.querySelector('#confirm-ok');
      input.focus();
      input.addEventListener('input', () => {
        okBtn.disabled = input.value.trim() !== typeToConfirm;
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !okBtn.disabled) ok();
        if (e.key === 'Escape') cancel();
      });
    }
  });
}

// ─── Fine-grained resets ───
async function resetUserNovels() {
  const userCount = STATE.novels.filter(n => !n.preGen).length;
  if (userCount === 0) {
    alert('You have no user-generated novels to delete.');
    return;
  }
  const ok = await confirmAction({
    title: 'Delete Your Novels?',
    body: `This will delete <strong>${userCount} novel${userCount !== 1 ? 's' : ''}</strong> you generated. The pre-generated library stays.<br><br>This cannot be undone.`,
    confirmLabel: `Delete ${userCount} novel${userCount !== 1 ? 's' : ''}`,
  });
  if (!ok) return;

  STATE.novels = STATE.novels.filter(n => n.preGen);
  if (STATE.currentNovel >= STATE.novels.length) STATE.currentNovel = STATE.novels.length ? 0 : null;
  saveState();
  updateNovelCount();
  renderLibrary();
  const novel = STATE.novels[STATE.currentNovel];
  if (novel) {
    if (novel.bible) displayBible(novel.bible); else document.getElementById('ed-bible').innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">No bible.</div>';
    if (novel.beats) displayBeats(novel.beats); else document.getElementById('ed-beats').innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">No beats.</div>';
    updateFactoryUI(novel);
    renderPhoneReader(novel);
  }
}

async function resetCourseProgress() {
  const ok = await confirmAction({
    title: 'Reset Course Progress?',
    body: 'This will clear your skulls and reset the course to Chapter 0. Your novels, prompts, and settings stay.',
    confirmLabel: 'Reset Progress',
  });
  if (!ok) return;

  STATE.skulls = [false, false, false, false, false];
  saveState();
  updateSkulls();
  if (typeof showChapter === 'function') showChapter(0);
  renderCertSection();
}

async function resetEverything() {
  const ok = await confirmAction({
    title: '⚠ Reset Everything',
    body: 'This wipes <strong>all data</strong>: novels, prompts, progress, layout, API keys. The pre-generated library will reload. The page will refresh.<br><br>This cannot be undone.',
    confirmLabel: 'Reset Everything',
    typeToConfirm: 'RESET',
  });
  if (!ok) return;

  // Clear localStorage
  try {
    localStorage.removeItem('pb501-config');
    localStorage.removeItem('pb501-layout');
    localStorage.removeItem('pb501-state'); // legacy
    localStorage.removeItem('pb501-novels'); // legacy
  } catch (e) {}

  // Clear IndexedDB
  try {
    const db = await openDB();
    const tx = db.transaction('state', 'readwrite');
    tx.objectStore('state').delete('novels');
    await new Promise(r => tx.oncomplete = r);
  } catch (e) {
    console.warn('IDB reset failed:', e);
  }

  // Reload
  location.reload();
}
