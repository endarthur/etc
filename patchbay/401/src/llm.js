// ═══════════════════════════════════════════
// LLM CALL — supports tools + provider override
// ═══════════════════════════════════════════
async function llmCall(messages, { tools = null, providerOverride = null } = {}) {
  // Demo mode: use mock responses
  const effectiveProvider = providerOverride?.provider || STATE.provider;
  if (effectiveProvider === 'demo') return mockLlmCall(messages, tools);

  const pId = providerOverride?.provider || STATE.provider;
  const p = PROVIDERS[pId];
  if (!p) throw new Error('No provider configured');

  const mId = providerOverride?.model || STATE.model;
  const aKey = providerOverride?.apiKey || (STATE.providerKeys[pId] || STATE.apiKey);

  const endpoint = pId === 'ollama'
    ? (STATE.ollamaUrl + '/v1/chat/completions')
    : pId === 'custom'
    ? STATE.customUrl
    : p.endpoint;

  const body = {
    model: mId,
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  };
  if (tools && tools.length > 0) body.tools = tools;

  const headers = {
    'Content-Type': 'application/json',
    ...p.authHeader(aKey),
  };

  const t0 = performance.now();
  const request = { endpoint, body: { ...body, tools: body.tools ? `[${body.tools.length} tools]` : undefined }, headers: { ...headers, Authorization: '***' } };

  const resp = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`${resp.status}: ${errText}`);
  }

  const data = await resp.json();
  const latency = Math.round(performance.now() - t0);
  const choice = data.choices?.[0];
  const reply = choice?.message?.content || '';
  const toolCalls = choice?.message?.tool_calls || null;
  const usage = data.usage || {};

  STATE.totalTokens += (usage.total_tokens || 0);
  document.getElementById('token-count').textContent = STATE.totalTokens.toLocaleString();

  // Track routing stats
  const routeKey = `${pId}:${mId}`;
  if (!STATE.routingStats[routeKey]) STATE.routingStats[routeKey] = { calls: 0, totalMs: 0 };
  STATE.routingStats[routeKey].calls++;
  STATE.routingStats[routeKey].totalMs += latency;

  STATE.lastRaw = {
    request,
    response: { model: data.model, usage, latency_ms: latency, content: reply, tool_calls: toolCalls },
  };
  document.getElementById('raw-json').textContent = JSON.stringify(STATE.lastRaw, null, 2);

  return { reply, usage, latency, toolCalls, model: mId, provider: pId };
}
