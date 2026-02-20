// ═══════════════════════════════════════════
// LOG
// ═══════════════════════════════════════════
let logEntries = [];

function addLogEntry(type, action, summary, detail = {}) {
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const entry = { ts, type, action, summary, detail };
  logEntries.push(entry);

  // Persist to workspace logs/YYYY-MM-DD.jsonl
  if (STATE.wsHandle) {
    const d = new Date();
    const fname = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.jsonl`;
    (async () => {
      try {
        const logsDir = await STATE.wsHandle.getDirectoryHandle('logs', { create: true });
        const fh = await logsDir.getFileHandle(fname, { create: true });
        const file = await fh.getFile();
        const existing = await file.text();
        const w = await fh.createWritable();
        await w.write(existing + JSON.stringify(entry) + '\n');
        await w.close();
      } catch {}
    })();
  }

  const panel = document.getElementById('log-panel');
  // Remove placeholder
  if (logEntries.length === 1) panel.innerHTML = '';

  const el = document.createElement('div');
  el.className = 'log-entry';
  el.innerHTML = `
    <span class="log-ts">${ts}</span>
    <span class="log-action">${escapeHtml(action)}</span>
    <span class="log-result">${escapeHtml(summary)}</span>
    <span class="log-toggle">▸ detail</span>
    <div class="log-detail">${escapeHtml(JSON.stringify(detail, null, 2))}</div>`;
  el.addEventListener('click', () => {
    const expanded = el.classList.toggle('expanded');
    el.querySelector('.log-toggle').textContent = expanded ? '▾ detail' : '▸ detail';
  });
  panel.appendChild(el);
  panel.scrollTop = panel.scrollHeight;
}
