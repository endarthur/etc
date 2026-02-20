// ═══════════════════════════════════════════
// MODEL ROUTING (Ch.7)
// ═══════════════════════════════════════════
function routeModel(purpose) {
  const r = STATE.routing;
  if (!r.enabled || r.strategy === 'single') return null; // use defaults

  if (r.strategy === 'cost') {
    const route = r.routes[purpose] || r.routes.generate;
    if (route && route.provider && route.model) {
      return { provider: route.provider, model: route.model, apiKey: STATE.providerKeys[route.provider] || '' };
    }
    return null;
  }

  if (r.strategy === 'fallback') {
    // Fallback handled in agentTurn via tryProviderChain
    return null;
  }
  return null;
}

async function tryProviderChain(chain, messages, tools, timeout) {
  for (let i = 0; i < chain.length; i++) {
    const pId = chain[i];
    const p = PROVIDERS[pId];
    if (!p) continue;
    const mId = p.defaultModel || STATE.model;
    const aKey = STATE.providerKeys[pId] || '';
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      const result = await llmCall(messages, {
        tools,
        providerOverride: { provider: pId, model: mId, apiKey: aKey },
      });
      clearTimeout(timer);
      return result;
    } catch(e) {
      termPrint(`⚠ ${pId} failed: ${e.message.slice(0, 60)}${i < chain.length - 1 ? ' — trying next...' : ''}`, 'warn');
      continue;
    }
  }
  throw new Error('All providers in fallback chain failed');
}
