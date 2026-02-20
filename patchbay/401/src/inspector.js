// ═══════════════════════════════════════════
// INSPECTOR
// ═══════════════════════════════════════════
function inspectorTab(name) {
  document.querySelectorAll('.inspector-tab').forEach(t =>
    t.classList.toggle('active', t.textContent.toLowerCase() === name));
  document.querySelectorAll('.inspector-pane').forEach(p =>
    p.classList.toggle('active', p.id === 'insp-' + name));
}

function updateHistoryInspector() {
  document.getElementById('history-json').textContent = JSON.stringify(STATE.conversation, null, 2);
}
