// ═══════════════════════════════════════════
// BUILD SYSTEM PROMPT (Ch.4+)
// ═══════════════════════════════════════════
async function buildSystemPrompt() {
  let prompt = getSoul();

  // Inject memory
  try {
    const mem = await loadMemory();
    const keys = Object.keys(mem);
    if (keys.length > 0) {
      prompt += '\n\n## Memory\nYou have these memories stored. Use them as context:\n';
      for (const k of keys) {
        prompt += `- **${k}**: ${JSON.stringify(mem[k])}\n`;
      }
    }
  } catch {}

  // Inject skill descriptions
  const skillDescs = Object.values(SKILLS).map(s => `- ${s.name}: ${s.description}`);
  if (skillDescs.length > 0) {
    prompt += '\n\n## Available Skills\n' + skillDescs.join('\n');
  }

  return prompt;
}

// ═══════════════════════════════════════════
// AGENT LOOP — ReAct: Reason → Act → Observe
// ═══════════════════════════════════════════
async function agentTurn(userMessage, source = 'terminal') {
  if (STATE.agentBusy) return;
  STATE.agentBusy = true;

  const statusText = document.getElementById('agent-status');
  const dot = document.getElementById('agent-dot');
  dot.className = 'status-dot amber';
  statusText.textContent = 'thinking...';

  // Add user message
  STATE.conversation.push({ role: 'user', content: userMessage });
  STATE.stats.messageCount++;
  updateHistoryInspector();

  // Trim conversation history to prevent context overflow
  const MAX_HISTORY = 40;
  if (STATE.conversation.length > MAX_HISTORY) {
    const trimmed = STATE.conversation.length - MAX_HISTORY;
    STATE.conversation = STATE.conversation.slice(-MAX_HISTORY);
    termPrint(`✂ Trimmed ${trimmed} old messages (keeping last ${MAX_HISTORY})`, 'sys');
  }

  // Build system prompt (async — reads memory + skills)
  const systemPrompt = await buildSystemPrompt();
  const tools = getToolSchemas();

  termPrint(`🧠 Thinking...`, 'think');

  try {
    let iteration = 0;
    while (iteration < MAX_ITERATIONS) {
      iteration++;
      const messages = [{ role: 'system', content: systemPrompt }, ...STATE.conversation];

      // Determine purpose for routing
      const purpose = iteration === 1 ? 'tool_select' : 'generate';
      const override = routeModel(purpose);

      let result;
      if (STATE.routing.enabled && STATE.routing.strategy === 'fallback' && STATE.routing.fallbackChain.length > 0) {
        result = await tryProviderChain(STATE.routing.fallbackChain, messages, tools.length > 0 ? tools : null, STATE.routing.fallbackTimeout);
      } else {
        result = await llmCall(messages, { tools: tools.length > 0 ? tools : null, providerOverride: override });
      }

      const { reply, usage, latency, toolCalls, model: usedModel, provider: usedProvider } = result;
      const routeTag = STATE.routing.enabled ? ` → ${usedProvider}/${usedModel}` : '';

      // Replace thinking line on first iteration
      if (iteration === 1) removeLastTermLine();

      if (toolCalls && toolCalls.length > 0) {
        // Tool calls — execute each
        termPrint(`🧠 (${latency}ms${routeTag})`, 'think');

        // Add assistant message with tool_calls to conversation
        const assistantMsg = { role: 'assistant', content: reply || null, tool_calls: toolCalls };
        STATE.conversation.push(assistantMsg);

        for (const tc of toolCalls) {
          const fn = tc.function;
          let args = {};
          try { args = JSON.parse(fn.arguments || '{}'); } catch(pe) { termPrint(`⚠ Bad tool args for ${fn.name}: ${pe.message}`, 'warn'); }
          const argsStr = Object.entries(args).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join(', ');
          termPrint(`🔧 ${fn.name}(${argsStr})${routeTag}`, 'tool');

          let toolResult;
          try {
            const handler = TOOLS[fn.name]?.handler;
            if (!handler) throw new Error(`Unknown tool: ${fn.name}`);
            toolResult = await handler(args);
            STATE.stats.toolCalls[fn.name] = (STATE.stats.toolCalls[fn.name] || 0) + 1;
            statusText.textContent = `tool: ${fn.name}`;
          } catch(e) {
            toolResult = `Error: ${e.message}`;
          }

          const resultStr = typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult);
          termPrintExpandable(`👁 ${resultStr}`, 'obs');

          // Add tool result to conversation
          STATE.conversation.push({ role: 'tool', tool_call_id: tc.id, content: resultStr });

          addLogEntry('tool_call', fn.name, resultStr.slice(0, 80), { args, result: resultStr, model: usedModel, provider: usedProvider });
        }

        updateHistoryInspector();
        statusText.textContent = 'thinking...';
        termPrint(`🧠 Thinking...`, 'think');
        // Loop back for next LLM call
        continue;
      }

      // Text reply — we're done
      if (iteration > 1) removeLastTermLine(); // remove "Thinking..." if we looped
      termPrint(`🧠 (${latency}ms, ${usage.prompt_tokens || '?'}→${usage.completion_tokens || '?'} tokens${routeTag})`, 'think');

      const finalReply = reply || '(empty response)';
      termPrint(`💬 ${finalReply}`, 'reply');

      STATE.conversation.push({ role: 'assistant', content: finalReply });
      updateHistoryInspector();

      addLogEntry('llm_call', usedModel || STATE.model, `${latency}ms, ${usage.total_tokens || '?'} tokens`, {
        response: finalReply, usage, latency, model: usedModel, provider: usedProvider, iterations: iteration,
      });

      // Send reply to Telegram if source is telegram
      if (source === 'telegram' && STATE._tgChatId) {
        tgAPI('sendMessage', { chat_id: STATE._tgChatId, text: finalReply });
      }

      break; // exit ReAct loop
    }

    // Refresh UI after tool operations
    refreshDesktopIcons();
    refreshFileBrowser();
    refreshMemoryViewer();
    updateRoutingViewer();

  } catch(e) {
    removeLastTermLine();
    termPrintExpandable(`🛑 Error: ${e.message}`, 'err');
    addLogEntry('error', 'llm_call', e.message.slice(0, 120), { error: e.message, provider: STATE.provider, model: STATE.model });
    showCrashScreen(e.message);
  }

  dot.className = 'status-dot green';
  statusText.textContent = 'ready';
  STATE.agentBusy = false;
}
