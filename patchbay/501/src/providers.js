// ═══════════════════════════════════════════
// PROVIDER ABSTRACTION
// ═══════════════════════════════════════════
const PROVIDERS = {
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', desc: 'Best quality, 1K RPD' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', desc: 'Fast, 14.4K RPD' },
    ],
    needsKey: true,
  },
  nanogpt: {
    name: 'NanoGPT',
    baseUrl: 'https://nano-gpt.com/api/v1',
    models: [
      { id: 'mistralai/mistral-small-4-119b-2603', name: 'Mistral Small 4 (119B)', desc: 'Recommended — fast, great prose' },
      { id: 'meta-llama/llama-4-scout', name: 'Llama 4 Scout', desc: 'Fast, strong' },
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', desc: 'Larger Llama 4' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', desc: 'Proven, reliable' },
      { id: 'deepseek-chat', name: 'DeepSeek V3', desc: 'Strong but slow' },
      { id: 'Qwen/Qwen3-235B-A22B', name: 'Qwen3 235B', desc: 'Large MoE, capable' },
      { id: 'zai-org/glm-5', name: 'GLM-5', desc: 'Good quality, moderate speed' },
    ],
    needsKey: true,
    supportsImages: true,
  },
  ollama: {
    name: 'Ollama',
    baseUrl: 'http://localhost:11434/v1',
    models: [],
    needsKey: false,
  },
  none: {
    name: 'None',
    baseUrl: '',
    models: [],
    needsKey: false,
  },
};

function selectProvider(id) {
  STATE.provider = id;
  document.querySelectorAll('.provider-card').forEach(c =>
    c.classList.toggle('selected', c.dataset.p === id));
  renderProviderConfig(id);
  updateProviderStatus();
  saveState();
}

function renderProviderConfig(id) {
  const el = document.getElementById('provider-config');
  const p = PROVIDERS[id];
  if (!p || id === 'none') { el.innerHTML = ''; return; }

  let html = '';
  if (p.needsKey) {
    html += `<div class="sf"><label>API Key</label>
      <input type="password" id="prov-key" placeholder="paste your key" value="${STATE.apiKey || ''}"
        oninput="STATE.apiKey=this.value;updateProviderStatus();saveState()">
    </div>`;
  }
  if (p.models.length) {
    html += `<div class="sf" style="margin-top:8px"><label>Model</label>
      <select id="prov-model" onchange="STATE.model=this.value;saveState()">
        ${p.models.map(m => `<option value="${m.id}" ${m.id===STATE.model?'selected':''}>${m.name} — ${m.desc}</option>`).join('')}
      </select></div>`;
    if (!STATE.model) STATE.model = p.models[0].id;
  }
  el.innerHTML = html;
}

function updateProviderStatus() {
  const dot = document.getElementById('provider-dot');
  const label = document.getElementById('provider-status');
  if (!STATE.provider || STATE.provider === 'none') {
    dot.className = 'status-dot'; label.textContent = 'no provider';
    STATE.providerReady = false;
  } else {
    const p = PROVIDERS[STATE.provider];
    const ready = !p.needsKey || (STATE.apiKey && STATE.apiKey.length > 5);
    dot.className = 'status-dot ' + (ready ? 'green' : 'amber');
    label.textContent = ready ? p.name : p.name + ' (needs key)';
    STATE.providerReady = ready;
  }
  // Enable/disable generation buttons
  const canGenerate = STATE.providerReady;
  const bibleBtn = document.getElementById('btn-generate-bible');
  if (bibleBtn) bibleBtn.disabled = !canGenerate;
}

async function llmChat(messages, opts = {}) {
  const p = PROVIDERS[STATE.provider];
  if (!p || !STATE.providerReady) throw new Error('No provider configured');
  const res = await fetch(p.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(p.needsKey ? { 'Authorization': 'Bearer ' + STATE.apiKey } : {}),
    },
    body: JSON.stringify({
      model: STATE.model || p.models[0]?.id,
      messages,
      temperature: opts.temperature ?? 0.8,
      max_tokens: opts.max_tokens ?? 4096,
      stream: opts.stream ?? false,
    }),
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);
  if (opts.stream) return res;
  const data = await res.json();
  return data.choices[0].message.content;
}
