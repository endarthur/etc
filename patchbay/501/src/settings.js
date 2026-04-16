// ═══════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════
function settingsTab(name) {
  document.querySelectorAll('.settings-tab').forEach(t =>
    t.classList.toggle('active', t.textContent.toLowerCase().trim() === name));
  document.querySelectorAll('.settings-pane').forEach(p =>
    p.classList.toggle('active', p.id === 'stab-' + name));
}

function editorialTab(name) {
  document.querySelectorAll('.editorial-tab').forEach(t =>
    t.classList.toggle('active', t.textContent.toLowerCase().trim() === name));
  document.querySelectorAll('.editorial-pane').forEach(p =>
    p.classList.toggle('active', p.id === 'ed-' + name));
}
