// ═══════════════════════════════════════════
// MEMORY SYSTEM (Ch.4)
// ═══════════════════════════════════════════
async function loadMemory() {
  if (!STATE.wsHandle) return {};
  try {
    const fh = await STATE.wsHandle.getFileHandle('memory.json');
    const text = await (await fh.getFile()).text();
    return JSON.parse(text);
  } catch { return {}; }
}

async function saveMemory(mem) {
  if (!STATE.wsHandle) return;
  const fh = await STATE.wsHandle.getFileHandle('memory.json', { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(mem, null, 2));
  await w.close();
}

registerTool('memory_set', 'Store a key-value pair in persistent memory. Use for user preferences, facts, and context.', {
  type: 'object',
  properties: {
    key: { type: 'string', description: 'Memory key, e.g. "user_name" or "dog_name"' },
    value: { type: 'string', description: 'Value to store' },
  },
  required: ['key', 'value'],
}, async ({ key, value }) => {
  const mem = await loadMemory();
  mem[key] = value;
  await saveMemory(mem);
  refreshMemoryViewer(key);
  return `Stored: ${key} = ${value}`;
});

registerTool('memory_get', 'Retrieve a value from persistent memory.', {
  type: 'object',
  properties: {
    key: { type: 'string', description: 'Memory key to retrieve' },
  },
  required: ['key'],
}, async ({ key }) => {
  const mem = await loadMemory();
  return mem[key] !== undefined ? `${key} = ${JSON.stringify(mem[key])}` : `No memory found for key "${key}"`;
});

registerTool('memory_delete', 'Delete a key from persistent memory.', {
  type: 'object',
  properties: {
    key: { type: 'string', description: 'Memory key to delete' },
  },
  required: ['key'],
}, async ({ key }) => {
  const mem = await loadMemory();
  if (mem[key] === undefined) return `Key "${key}" not found in memory`;
  delete mem[key];
  await saveMemory(mem);
  refreshMemoryViewer();
  return `Deleted memory key: ${key}`;
});

registerTool('memory_keys', 'List all keys currently in persistent memory.', {
  type: 'object', properties: {}, required: [],
}, async () => {
  const mem = await loadMemory();
  const keys = Object.keys(mem);
  return keys.length > 0 ? `Memory keys: ${keys.join(', ')}` : 'Memory is empty';
});

// ═══════════════════════════════════════════
// MEMORY VIEWER
// ═══════════════════════════════════════════
async function refreshMemoryViewer(pulseKey) {
  const panel = document.getElementById('memory-panel');
  if (!panel) return;
  const mem = await loadMemory();
  const keys = Object.keys(mem);
  if (keys.length === 0) {
    panel.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">No memories yet. Ask the agent to remember something.</div>';
    return;
  }
  panel.innerHTML = keys.map(k => {
    const pulse = k === pulseKey ? ' pulse' : '';
    return `<div class="memory-entry${pulse}"><span class="me-key">${escapeHtml(k)}</span><span class="me-val">${escapeHtml(String(mem[k]))}</span></div>`;
  }).join('');
}
