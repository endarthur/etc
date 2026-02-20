// ═══════════════════════════════════════════
// BOOT — decides which splash state to show
// ═══════════════════════════════════════════
async function boot() {
  try {
    const hasVault = await Vault.exists();
    if (!hasVault) { showSplashState('welcome'); return; }

    // Try loading without passphrase
    try {
      const data = await Vault.load(null);
      loadSecretsIntoState(data);
      showSplashState('loading');
      await restoreWorkspaceHandle();
      setTimeout(() => enterDesktop(), 600);
    } catch(e) {
      if (e.code === 'NEEDS_PASSPHRASE') {
        showSplashState('unlock');
        setTimeout(() => document.getElementById('unlock-passphrase')?.focus(), 100);
      } else {
        console.warn('Vault corrupted, starting fresh:', e);
        showSplashState('welcome');
      }
    }
  } catch(e) {
    // OPFS not available (rare) — fall back to welcome
    console.warn('OPFS unavailable:', e);
    showSplashState('welcome');
  }
}

function showSplashState(state) {
  document.querySelectorAll('.splash-state').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('splash-' + state);
  if (el) el.classList.add('active');
}

async function unlockWithPassphrase() {
  const input = document.getElementById('unlock-passphrase');
  const passphrase = input.value;
  if (!passphrase) return;
  const errEl = document.getElementById('unlock-error');
  errEl.textContent = '';

  try {
    const data = await Vault.load(passphrase);
    STATE._passphrase = passphrase;
    loadSecretsIntoState(data);
    await restoreWorkspaceHandle();
    enterDesktop();
  } catch(e) {
    errEl.textContent = 'Wrong passphrase. Try again.';
    input.value = '';
    input.focus();
  }
}

function startFresh() { enterDesktop(); }
function startWorkshop() {
  enterDesktop();
  setTimeout(() => {
    document.getElementById('guide-panel').classList.add('visible');
    showChapter(0);
  }, 100);
}

function enterDesktop() {
  document.getElementById('splash').classList.add('hidden');
  initGuidePips();
  if (!restoreLayout()) showChapter(0);
  applySettingsUI();
  checkReady();
  updateDock();
}

async function restoreWorkspaceHandle() {
  try {
    const handle = await Vault.loadHandle();
    if (!handle) return;
    const perm = await handle.requestPermission({ mode: 'readwrite' });
    if (perm === 'granted') {
      await initWorkspace(handle);
    }
  } catch(e) { console.warn('Workspace handle restore failed:', e); }
}

async function resetVault() {
  if (!confirm('This will delete all saved API keys, tokens, and passphrase.\n\nYour workspace files are not affected.\n\nContinue?')) return;
  await Vault.clearAll();
  localStorage.clear();
  location.reload();
}
