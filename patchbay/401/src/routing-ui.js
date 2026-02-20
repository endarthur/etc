// ═══════════════════════════════════════════
// ROUTING UI (Ch.7)
// ═══════════════════════════════════════════
function renderRoutingSettings() {
  // Inject into settings window after Telegram section
  const existing = document.getElementById('routing-settings-section');
  if (existing) return; // already rendered

  const settingsBody = document.querySelector('.settings-body');
  if (!settingsBody) return;

  const section = document.createElement('div');
  section.id = 'routing-settings-section';
  section.innerHTML = `
    <h3>Model Routing <span style="font-weight:400;color:var(--text-faint)">(Chapter 7)</span></h3>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      <label class="toggle"><input type="checkbox" id="routing-toggle" ${STATE.routing.enabled ? 'checked' : ''} onchange="toggleRouting(this.checked)"><span class="slider"></span></label>
      <span style="font-size:12px;color:var(--text-dim)">Enable model routing</span>
    </div>
    <div id="routing-config" style="display:${STATE.routing.enabled ? 'block' : 'none'}">
      <div class="sf" style="margin-bottom:8px">
        <label>Strategy</label>
        <select id="routing-strategy" onchange="setRoutingStrategy(this.value)">
          <option value="single" ${STATE.routing.strategy==='single'?'selected':''}>Single (one model for all)</option>
          <option value="cost" ${STATE.routing.strategy==='cost'?'selected':''}>Cost (route by purpose)</option>
          <option value="fallback" ${STATE.routing.strategy==='fallback'?'selected':''}>Fallback (try in order)</option>
        </select>
      </div>
      <div id="routing-cost-config" style="display:${STATE.routing.strategy==='cost'?'block':'none'}">
        <div class="route-row"><span class="rr-label">Tool Select</span><select id="route-tool-select" onchange="setRoute('tool_select',this.value)"><option value="">default</option></select></div>
        <div class="route-row"><span class="rr-label">Generate</span><select id="route-generate" onchange="setRoute('generate',this.value)"><option value="">default</option></select></div>
        <div class="route-row"><span class="rr-label">Summarize</span><select id="route-summarize" onchange="setRoute('summarize',this.value)"><option value="">default</option></select></div>
      </div>
      <div id="routing-fallback-config" style="display:${STATE.routing.strategy==='fallback'?'block':'none'}">
        <div class="sf"><label>Fallback Chain (comma-separated provider IDs)</label>
          <input type="text" id="fallback-chain" value="${STATE.routing.fallbackChain.join(',')}" placeholder="e.g. ollama,groq,nanogpt" oninput="STATE.routing.fallbackChain=this.value.split(',').map(s=>s.trim()).filter(Boolean);scheduleVaultSave()">
        </div>
        <div class="sf" style="margin-top:6px"><label>Timeout (ms)</label>
          <input type="text" id="fallback-timeout" value="${STATE.routing.fallbackTimeout}" oninput="STATE.routing.fallbackTimeout=parseInt(this.value)||5000;scheduleVaultSave()">
        </div>
      </div>
    </div>`;
  // Insert before security section
  const secSection = settingsBody.querySelector('.security-section');
  if (secSection) settingsBody.insertBefore(section, secSection);
  else settingsBody.appendChild(section);

  populateRouteSelects();
}

function toggleRouting(enabled) {
  STATE.routing.enabled = enabled;
  const cfg = document.getElementById('routing-config');
  if (cfg) cfg.style.display = enabled ? 'block' : 'none';
  scheduleVaultSave();
  updateRoutingViewer();
}

function setRoutingStrategy(strategy) {
  STATE.routing.strategy = strategy;
  const costCfg = document.getElementById('routing-cost-config');
  const fbCfg = document.getElementById('routing-fallback-config');
  if (costCfg) costCfg.style.display = strategy === 'cost' ? 'block' : 'none';
  if (fbCfg) fbCfg.style.display = strategy === 'fallback' ? 'block' : 'none';
  scheduleVaultSave();
  updateRoutingViewer();
}

function setRoute(purpose, val) {
  if (!val) { STATE.routing.routes[purpose] = { provider: '', model: '' }; scheduleVaultSave(); return; }
  const [provider, model] = val.split('|');
  STATE.routing.routes[purpose] = { provider, model };
  scheduleVaultSave();
  updateRoutingViewer();
}

function populateRouteSelects() {
  const allModels = [];
  for (const [pId, prov] of Object.entries(PROVIDERS)) {
    if (pId === 'demo') continue;
    const models = prov.models.length > 0 ? prov.models : prov.fallbackModels.map(id => ({ id }));
    for (const m of models) {
      allModels.push({ label: `${m.id} (${pId})`, value: `${pId}|${m.id}` });
    }
  }
  for (const selId of ['route-tool-select', 'route-generate', 'route-summarize']) {
    const sel = document.getElementById(selId);
    if (!sel) continue;
    const purpose = selId.replace('route-', '').replace('-', '_');
    const current = STATE.routing.routes[purpose];
    const currentVal = current?.provider ? `${current.provider}|${current.model}` : '';
    sel.innerHTML = '<option value="">default</option>' +
      allModels.map(m => `<option value="${m.value}" ${m.value===currentVal?'selected':''}>${m.label}</option>`).join('');
  }
}

// ═══════════════════════════════════════════
// ROUTING VIEWER WINDOW
// ═══════════════════════════════════════════
function updateRoutingViewer() {
  const panel = document.getElementById('routing-panel');
  if (!panel) return;
  const r = STATE.routing;
  if (!r.enabled) {
    panel.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">Routing disabled. Enable in Settings.</div>';
    return;
  }
  let html = `<div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);margin-bottom:8px">Strategy: <strong style="color:var(--cyan)">${r.strategy}</strong></div>`;
  if (r.strategy === 'cost') {
    for (const [purpose, route] of Object.entries(r.routes)) {
      const label = route.provider ? `${route.provider}/${route.model}` : 'default';
      html += `<div class="route-row"><span class="rr-label">${purpose}</span><span class="model-badge"><span class="mb-dot" style="background:var(--cyan)"></span>${escapeHtml(label)}</span></div>`;
    }
  } else if (r.strategy === 'fallback') {
    html += `<div style="font-size:11px;color:var(--text-dim)">Chain: ${r.fallbackChain.join(' → ') || 'none'}</div>`;
    html += `<div style="font-size:10px;color:var(--text-faint)">Timeout: ${r.fallbackTimeout}ms</div>`;
  }
  // Stats
  const stats = STATE.routingStats;
  const keys = Object.keys(stats);
  if (keys.length > 0) {
    html += '<div style="margin-top:12px;font-family:var(--font-mono);font-size:10px;color:var(--text-faint);margin-bottom:4px">STATS</div><div class="routing-stats">';
    for (const k of keys) {
      const s = stats[k];
      const avg = s.calls > 0 ? Math.round(s.totalMs / s.calls) : 0;
      html += `<div class="rs-row"><span>${escapeHtml(k)}</span><span class="rs-val">${s.calls} calls, avg ${avg}ms</span></div>`;
    }
    html += '</div>';
  }
  panel.innerHTML = html;
}
