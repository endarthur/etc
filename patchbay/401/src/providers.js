// ═══════════════════════════════════════════
// PROVIDERS
// ═══════════════════════════════════════════
const PROVIDERS = {
  nanogpt: {
    name: 'NanoGPT',
    endpoint: 'https://nano-gpt.com/api/v1/chat/completions',
    modelsEndpoint: 'https://nano-gpt.com/api/subscription/v1/models',
    keyLabel: 'NanoGPT API Key',
    keyHint: 'From nano-gpt.com — subscription models shown (open-source, included)',
    models: [],
    defaultModel: 'deepseek-v3.2',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    fallbackModels: [
      'deepseek-v3.2','deepseek-chat','deepseek-r1','qwen3-235b-a22b',
      'qwen3-32b','qwen3-coder-plus','llama-4-maverick','llama-3.3-70b',
      'mistral-small','gemma-3-27b','command-a','nousresearch/hermes-4-405b',
    ],
  },
  groq: {
    name: 'Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    modelsEndpoint: 'https://api.groq.com/openai/v1/models',
    keyLabel: 'Groq API Key',
    keyHint: 'From console.groq.com — free tier, no credit card needed',
    models: [],
    defaultModel: 'llama-3.3-70b-versatile',
    authHeader: key => ({ 'Authorization': `Bearer ${key}` }),
    fallbackModels: [
      'llama-3.3-70b-versatile','meta-llama/llama-4-scout-17b-16e-instruct',
      'qwen/qwen3-32b','llama-3.1-8b-instant',
      'meta-llama/llama-4-maverick-17b-128e-instruct','moonshotai/kimi-k2-instruct',
    ],
  },
  ollama: {
    name: 'Ollama',
    endpoint: null,
    modelsEndpoint: null,
    keyLabel: null,
    keyHint: null,
    models: [],
    defaultModel: '',
    authHeader: () => ({}),
    fallbackModels: [],
  },
  custom: {
    name: 'Custom',
    endpoint: null, // set from user input
    modelsEndpoint: null,
    keyLabel: 'API Key (if required)',
    keyHint: 'Any OpenAI-compatible API — bring your own provider',
    models: [],
    defaultModel: '',
    authHeader: key => key ? ({ 'Authorization': `Bearer ${key}` }) : ({}),
    fallbackModels: [],
  },
  demo: {
    name: 'Demo',
    endpoint: null,
    modelsEndpoint: null,
    keyLabel: null,
    keyHint: null,
    models: [],
    defaultModel: 'mock-agent',
    authHeader: () => ({}),
    fallbackModels: [],
  },
};

// ── Mock LLM responses for demo mode ──
const MOCK_RESPONSES = [
  "Got it! I'll remember that for you.",
  "Sure, I've made a note of that. Anything else?",
  "Interesting! Let me save that thought.",
  "Done! Is there anything else you'd like me to help with?",
  "I understand. I've noted that down.",
  "Good idea! I'll keep track of that for you.",
  "Absolutely. What else is on your mind?",
  "Noted! I'm here whenever you need me.",
];
let mockIdx = 0;

async function mockLlmCall(messages, tools) {
  const userMsg = messages[messages.length - 1]?.content || '';
  const lastRole = messages[messages.length - 1]?.role || '';
  await new Promise(r => setTimeout(r, 300 + Math.random() * 700));

  const promptTokens = Math.round(userMsg.length / 4);
  const latency = Math.round(300 + Math.random() * 700);

  // If tools are available and user message implies tool use, return mock tool_calls
  const toolKeywords = {
    save_note: /\b(save|write|create|make)\b.*\b(note|file|document)\b/i,
    read_note: /\b(read|show|open|what'?s in|get)\b.*\b(note|file)\b/i,
    list_files: /\b(list|show|what)\b.*\b(files|folder|directory|notes)\b/i,
    memory_set: /\b(remember|memorize|store|save)\b.*\b(my|that|this)\b/i,
    memory_get: /\b(recall|what'?s?|do you know|what did i)\b.*\b(remember|mem|know)\b/i,
    search_notes: /\b(search|find|look for|grep)\b.*\b(note|file)\b/i,
    delete_file: /\b(delete|remove|trash)\b.*\b(note|file)\b/i,
    mkdir: /\b(create|make|new)\b.*\b(folder|directory|dir)\b/i,
  };

  if (tools && tools.length > 0 && lastRole !== 'tool') {
    for (const [toolName, pattern] of Object.entries(toolKeywords)) {
      if (pattern.test(userMsg) && TOOLS[toolName]) {
        const mockArgs = getMockToolArgs(toolName, userMsg);
        const completionTokens = 20;
        const usage = { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens };
        STATE.totalTokens += usage.total_tokens;
        document.getElementById('token-count').textContent = STATE.totalTokens.toLocaleString();
        return {
          reply: '', usage, latency,
          toolCalls: [{ id: 'mock_' + Date.now(), type: 'function', function: { name: toolName, arguments: JSON.stringify(mockArgs) } }],
          model: 'mock-agent', provider: 'demo',
        };
      }
    }
  }

  // Regular text reply
  const reply = MOCK_RESPONSES[mockIdx++ % MOCK_RESPONSES.length];
  const completionTokens = Math.round(reply.length / 4);
  const usage = { prompt_tokens: promptTokens, completion_tokens: completionTokens, total_tokens: promptTokens + completionTokens };
  STATE.totalTokens += usage.total_tokens;
  document.getElementById('token-count').textContent = STATE.totalTokens.toLocaleString();
  STATE.lastRaw = {
    request: { endpoint: 'mock://demo', body: { model: 'mock-agent', messages } },
    response: { model: 'mock-agent', usage, latency_ms: latency, content: reply },
  };
  document.getElementById('raw-json').textContent = JSON.stringify(STATE.lastRaw, null, 2);
  return { reply, usage, latency, toolCalls: null, model: 'mock-agent', provider: 'demo' };
}

function getMockToolArgs(toolName, userMsg) {
  switch(toolName) {
    case 'save_note': {
      const topic = userMsg.replace(/\b(save|write|create|make|a|the|note|file|about|please|can you|could you)\b/gi, '').trim() || 'note';
      const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30);
      return { filename: slug + '.md', content: topic };
    }
    case 'read_note': return { filename: 'note.md' };
    case 'list_files': return { path: 'notes' };
    case 'memory_set': {
      const m = userMsg.match(/(?:remember|memorize)\s+(?:that\s+)?(.+)/i);
      const val = m ? m[1] : userMsg;
      return { key: 'user_note', value: val };
    }
    case 'memory_get': return { key: 'user_note' };
    case 'search_notes': return { query: userMsg.replace(/\b(search|find|look for|grep|in|notes|files)\b/gi, '').trim() || 'search' };
    case 'delete_file': return { path: 'notes/note.md' };
    case 'mkdir': return { path: 'notes/new-folder' };
    default: return {};
  }
}
// Fetch models from provider API with fallback
let _modelCache = '';  // 'providerId:apiKey' — skip refetch if unchanged
async function fetchModels(providerId, force = false) {
  const prov = PROVIDERS[providerId];
  if (!prov || !prov.modelsEndpoint) return;

  // Skip redundant fetches unless forced (refresh button)
  const cacheKey = providerId + ':' + (STATE.apiKey || '');
  if (!force && _modelCache === cacheKey) {
    if (prov.models.length > 0) renderModelSelect(providerId);
    return;
  }
  _modelCache = cacheKey;  // Set early to prevent concurrent duplicate fetches

  const modelSelect = document.getElementById('model-select');
  if (modelSelect) { modelSelect.innerHTML = '<option value="">Loading models...</option>'; modelSelect.disabled = true; }

  try {
    const headers = { 'Content-Type': 'application/json', ...prov.authHeader(STATE.apiKey) };
    const resp = await fetch(prov.modelsEndpoint, { headers });
    if (!resp.ok) throw new Error(`${resp.status}`);
    const data = await resp.json();
    let models = (data.data || []).map(m => ({
      id: m.id,
      name: m.name || m.id,
      owned_by: m.owned_by || '',
    }));

    // Groq: filter out non-chat models (whisper, guard, etc.)
    if (providerId === 'groq') {
      const skip = ['whisper', 'guard', 'safeguard', 'orpheus'];
      models = models.filter(m => !skip.some(s => m.id.includes(s)));
    }

    models.sort((a, b) => a.id.localeCompare(b.id));
    prov.models = models;
    _modelCache = cacheKey;
    renderModelSelect(providerId);
    const hint = document.getElementById('model-count-hint');
    if (hint) hint.textContent = `${models.length} models available`;
  } catch(e) {
    console.warn('Model fetch failed for', providerId, '— using fallback list:', e.message);
    // Use fallback
    prov.models = prov.fallbackModels.map(id => ({ id, name: id, owned_by: '' }));
    _modelCache = cacheKey;
    renderModelSelect(providerId);
    const hint = document.getElementById('model-count-hint');
    if (hint) hint.textContent = `Showing ${prov.fallbackModels.length} known models (API unreachable)`;
  }
}

function renderModelSelect(providerId) {
  const prov = PROVIDERS[providerId];
  const modelSelect = document.getElementById('model-select');
  if (!modelSelect || !prov) return;

  modelSelect.disabled = false;
  const currentModel = STATE.model || prov.defaultModel;

  if (prov.models.length === 0) {
    modelSelect.innerHTML = '<option value="">No models found</option>';
    return;
  }

  // Put default at top if it exists in list
  const sorted = [...prov.models];
  const defIdx = sorted.findIndex(m => m.id === prov.defaultModel);
  if (defIdx > 0) { const [def] = sorted.splice(defIdx, 1); sorted.unshift(def); }

  modelSelect.innerHTML = sorted.map(m => {
    const label = m.id + (m.owned_by ? ` (${m.owned_by})` : '');
    return `<option value="${m.id}" ${m.id === currentModel ? 'selected' : ''}>${label}</option>`;
  }).join('');

  // Auto-select default if no model chosen
  if (!STATE.model) {
    STATE.model = prov.defaultModel || sorted[0]?.id || '';
    saveSetting('model', STATE.model);
  }
  modelSelect.value = STATE.model;
  checkReady();
}
