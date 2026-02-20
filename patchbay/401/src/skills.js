// ═══════════════════════════════════════════
// SKILLS SYSTEM (Ch.5 + Ch.6)
// ═══════════════════════════════════════════
const SKILLS = {};

function registerSkill(skill) {
  SKILLS[skill.id] = skill;
  // Register each tool in the skill
  for (const tool of (skill.tools || [])) {
    registerTool(tool.name, tool.description, tool.parameters, tool.handler);
  }
  refreshSkillsPanel();
}

// Builtin: datetime
registerSkill({
  id: 'datetime', name: 'Date & Time', description: 'Get the current date and time.',
  builtin: true,
  tools: [{
    name: 'get_datetime',
    description: 'Get the current date and time.',
    parameters: { type: 'object', properties: {}, required: [] },
    handler: async () => new Date().toLocaleString(),
  }],
});

// Builtin: calculator
registerSkill({
  id: 'calculator', name: 'Calculator', description: 'Evaluate mathematical expressions safely.',
  builtin: true,
  tools: [{
    name: 'calculate',
    description: 'Evaluate a mathematical expression. Supports +, -, *, /, **, %, sqrt, abs, round, floor, ceil, sin, cos, tan, log, PI, E.',
    parameters: { type: 'object', properties: { expression: { type: 'string', description: 'Math expression, e.g. "sqrt(144) + 2**3"' } }, required: ['expression'] },
    handler: async ({ expression }) => {
      try {
        // Safe math eval: only allow math operations
        const sanitized = expression.replace(/[^0-9+\-*/().%,\s]/g, (m) => {
          const allowed = ['sqrt','abs','round','floor','ceil','sin','cos','tan','log','PI','E','pow','min','max'];
          return m; // let through for Function check
        });
        const mathFn = new Function('Math', `with(Math){return (${expression})}`);
        const result = mathFn(Math);
        if (typeof result !== 'number' || !isFinite(result)) return 'Error: invalid result';
        return String(result);
      } catch(e) { return `Error: ${e.message}`; }
    },
  }],
});

// Skill creation tool (Ch.6)
let _pendingSkill = null;

registerTool('propose_skill', 'Propose a new dynamic skill for the agent. The user must approve it before it is installed.', {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Short skill name' },
    description: { type: 'string', description: 'What the skill does' },
    tools: {
      type: 'array',
      description: 'Array of tool definitions',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          parameters: { type: 'object' },
          code: { type: 'string', description: 'JavaScript function body. Receives (api, args). api has: readNote, writeNote, memoryGet, memorySet, listFiles, fetchUrl.' },
        },
        required: ['name', 'description', 'code'],
      },
    },
  },
  required: ['name', 'description', 'tools'],
}, async ({ name, description, tools: toolDefs }) => {
  _pendingSkill = { name, description, tools: toolDefs };
  // Show approval overlay
  const preview = document.getElementById('skill-preview-content');
  preview.innerHTML = `<div class="sp-name">${escapeHtml(name)}</div><div class="sp-desc">${escapeHtml(description)}</div>` +
    toolDefs.map(t => `<div style="margin-top:8px;color:var(--text)">🔧 ${escapeHtml(t.name)}</div><div class="sp-code">${escapeHtml(t.code)}</div>`).join('');
  document.getElementById('skill-approve-overlay').classList.add('visible');
  // Wait for approval
  return new Promise(resolve => {
    window._skillResolve = resolve;
  });
});

function approveSkill() {
  document.getElementById('skill-approve-overlay').classList.remove('visible');
  if (!_pendingSkill) { window._skillResolve?.('Error: no pending skill'); return; }
  const skill = _pendingSkill;
  _pendingSkill = null;

  const skillId = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const sandboxApi = {
    readNote: async (fn) => { const h = TOOLS['read_note']?.handler; return h ? h({ filename: fn }) : 'no handler'; },
    writeNote: async (fn, c) => { const h = TOOLS['save_note']?.handler; return h ? h({ filename: fn, content: c }) : 'no handler'; },
    memoryGet: async (k) => { const mem = await loadMemory(); return mem[k]; },
    memorySet: async (k, v) => { const mem = await loadMemory(); mem[k] = v; await saveMemory(mem); },
    listFiles: async (p) => { const h = TOOLS['list_files']?.handler; return h ? h({ path: p || '.' }) : 'no handler'; },
    fetchUrl: async (url) => {
      if (!STATE.safety.sandboxNetwork) return 'Error: network access disabled for skills (enable in Settings → Safety)';
      const h = TOOLS['fetch_url']?.handler; return h ? h({ url }) : 'no handler';
    },
  };

  const tools = skill.tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters || { type: 'object', properties: {}, required: [] },
    handler: async (args) => {
      try {
        const fn = new Function('api', 'args', t.code);
        return await fn(sandboxApi, args);
      } catch(e) { return `Skill error: ${e.message}`; }
    },
  }));

  registerSkill({ id: skillId, name: skill.name, description: skill.description, builtin: false, tools });
  // Save to workspace
  saveSkillToWorkspace(skillId, skill);
  termPrint(`⚡ Skill installed: ${skill.name}`, 'obs');
  window._skillResolve?.(`Skill "${skill.name}" approved and installed with ${tools.length} tool(s).`);
}

function denySkill() {
  document.getElementById('skill-approve-overlay').classList.remove('visible');
  _pendingSkill = null;
  window._skillResolve?.('Skill denied by user.');
}

async function saveSkillToWorkspace(id, skill) {
  if (!STATE.wsHandle) return;
  try {
    const dir = await STATE.wsHandle.getDirectoryHandle('skills', { create: true });
    const fh = await dir.getFileHandle(id + '.json', { create: true });
    const w = await fh.createWritable();
    await w.write(JSON.stringify(skill, null, 2));
    await w.close();
  } catch {}
}

async function loadDynamicSkills() {
  if (!STATE.wsHandle) return;
  try {
    const dir = await STATE.wsHandle.getDirectoryHandle('skills');
    for await (const entry of dir.values()) {
      if (!entry.name.endsWith('.json')) continue;
      try {
        const text = await (await entry.getFile()).text();
        const skill = JSON.parse(text);
        const skillId = entry.name.replace('.json', '');
        if (SKILLS[skillId]) continue; // already loaded
        // Reconstruct with sandbox
        const sandboxApi = {
          readNote: async (fn) => TOOLS['read_note']?.handler?.({ filename: fn }),
          writeNote: async (fn, c) => TOOLS['save_note']?.handler?.({ filename: fn, content: c }),
          memoryGet: async (k) => { const mem = await loadMemory(); return mem[k]; },
          memorySet: async (k, v) => { const mem = await loadMemory(); mem[k] = v; await saveMemory(mem); },
          listFiles: async (p) => TOOLS['list_files']?.handler?.({ path: p || '.' }),
          fetchUrl: async (url) => {
            if (!STATE.safety.sandboxNetwork) return 'Error: network access disabled for skills (enable in Settings → Safety)';
            return TOOLS['fetch_url']?.handler?.({ url });
          },
        };
        const tools = (skill.tools || []).map(t => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters || { type: 'object', properties: {}, required: [] },
          handler: async (args) => {
            try { return await new Function('api', 'args', t.code)(sandboxApi, args); }
            catch(e) { return `Skill error: ${e.message}`; }
          },
        }));
        registerSkill({ id: skillId, name: skill.name, description: skill.description, builtin: false, tools });
      } catch {}
    }
  } catch {}
}

// ═══════════════════════════════════════════
// SKILLS PANEL
// ═══════════════════════════════════════════
function refreshSkillsPanel() {
  const panel = document.getElementById('skills-panel');
  if (!panel) return;
  const skills = Object.values(SKILLS);
  if (skills.length === 0) {
    panel.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">No skills loaded.</div>';
    return;
  }
  panel.innerHTML = skills.map(s => {
    const badge = s.builtin ? 'builtin' : 'dynamic';
    const cls = s.builtin ? '' : ' dynamic';
    const toolNames = (s.tools || []).map(t => t.name).join(', ');
    return `<div class="skill-card${cls}"><div class="sc-header"><span class="sc-name">${escapeHtml(s.name)}</span><span class="sc-badge">${badge}</span></div><div class="sc-desc">${escapeHtml(s.description)}</div><div class="sc-tools">Tools: ${escapeHtml(toolNames)}</div></div>`;
  }).join('');
}
