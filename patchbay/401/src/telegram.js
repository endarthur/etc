// ═══════════════════════════════════════════
// TELEGRAM (Ch.8)
// ═══════════════════════════════════════════
let tgPolling = false;
let tgOffset = 0;
let tgBackoff = 500;

async function tgAPI(method, body = {}) {
  if (!STATE.tgToken) return null;
  try {
    const r = await fetch(`https://api.telegram.org/bot${STATE.tgToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await r.json();
  } catch(e) { return { ok: false, error: e.message }; }
}

function startTgPolling() {
  if (tgPolling || !STATE.tgToken) return;
  tgPolling = true;
  tgBackoff = 500;
  document.getElementById('sp-tg').style.display = '';
  document.getElementById('tg-status').textContent = 'polling';
  const tog = document.getElementById('tg-toggle');
  if (tog) { tog.checked = true; }
  const lbl = document.getElementById('tg-toggle-status');
  if (lbl) lbl.textContent = 'polling';
  termPrint('📱 Telegram polling started', 'sys');
  tgPoll();
}

function stopTgPolling() {
  tgPolling = false;
  document.getElementById('tg-status').textContent = 'stopped';
  const tog = document.getElementById('tg-toggle');
  if (tog) { tog.checked = false; }
  const lbl = document.getElementById('tg-toggle-status');
  if (lbl) lbl.textContent = 'stopped';
}

function toggleTelegram(on) {
  if (on) startTgPolling();
  else stopTgPolling();
}

function updateTgControls() {
  const el = document.getElementById('tg-controls');
  if (!el) return;
  el.style.display = STATE.tgToken ? 'flex' : 'none';
  // Sync toggle state
  const tog = document.getElementById('tg-toggle');
  if (tog) tog.checked = tgPolling;
  const lbl = document.getElementById('tg-toggle-status');
  if (lbl) lbl.textContent = tgPolling ? 'polling' : 'stopped';
}

async function tgPoll() {
  if (!tgPolling) return;
  try {
    const data = await tgAPI('getUpdates', { offset: tgOffset, timeout: 20 });
    if (data?.ok && data.result?.length > 0) {
      tgBackoff = 500;
      for (const update of data.result) {
        tgOffset = update.update_id + 1;
        const msg = update.message;
        if (!msg?.text) continue;
        STATE._tgChatId = msg.chat.id;
        const text = msg.text.trim();

        // Render in terminal
        termHR();
        const out = document.getElementById('term-out');
        const uLine = document.createElement('div');
        uLine.className = 'tl tl-tg';
        uLine.innerHTML = `<span class="pfx">📱›</span> ${escapeHtml(text)}`;
        out.appendChild(uLine);
        scrollTerminal();

        // Command routing
        if (text.startsWith('/')) {
          const reply = await handleTgCommand(text, msg.chat.id);
          if (reply) await tgAPI('sendMessage', { chat_id: msg.chat.id, text: reply });
        } else {
          await agentTurn(text, 'telegram');
        }
      }
    }
  } catch(e) {
    tgBackoff = Math.min(tgBackoff * 2, 30000);
  }
  if (tgPolling) setTimeout(tgPoll, tgBackoff);
}

async function handleTgCommand(text, chatId) {
  const cmd = text.split(' ')[0].toLowerCase();
  switch(cmd) {
    case '/start': return 'Patchbay 401 agent online. Send me a message.';
    case '/status': return `Provider: ${STATE.provider}/${STATE.model}\nWorkspace: ${STATE.wsHandle?.name || 'none'}\nTools: ${Object.keys(TOOLS).length}\nSkills: ${Object.keys(SKILLS).length}`;
    case '/files': {
      const h = TOOLS['list_files']?.handler;
      return h ? await h({ path: '.' }) : 'No workspace';
    }
    case '/memory': {
      const mem = await loadMemory();
      const keys = Object.keys(mem);
      return keys.length > 0 ? keys.map(k => `${k}: ${mem[k]}`).join('\n') : 'Memory is empty';
    }
    case '/skills': return Object.values(SKILLS).map(s => `${s.name}: ${s.description}`).join('\n') || 'No skills';
    case '/export': {
      if (!STATE.wsHandle) return 'No workspace open.';
      try {
        let listing = '';
        async function walk(dir, prefix) {
          for await (const entry of dir.values()) {
            if (entry.name.startsWith('.')) continue;
            const path = prefix ? prefix + '/' + entry.name : entry.name;
            if (entry.kind === 'directory') {
              listing += `📁 ${path}/\n`;
              await walk(await dir.getDirectoryHandle(entry.name), path);
            } else {
              const file = await entry.getFile();
              const sizeStr = file.size < 1024 ? file.size + 'B' : (file.size / 1024).toFixed(1) + 'KB';
              listing += `📄 ${path} (${sizeStr})\n`;
              if (file.size < 4096 && (entry.name.endsWith('.md') || entry.name.endsWith('.json') || entry.name.endsWith('.txt'))) {
                const text = await file.text();
                listing += '```\n' + text.slice(0, 2000) + (text.length > 2000 ? '\n...(truncated)' : '') + '\n```\n';
              }
            }
          }
        }
        await walk(STATE.wsHandle, '');
        return listing || '(empty workspace)';
      } catch(e) { return `Export error: ${e.message}`; }
    }
    case '/nuke': {
      if (!STATE.wsHandle) return 'No workspace open.';
      const args = text.split(/\s+/);
      if (args[1] !== 'CONFIRM') return '⚠ This will delete all files in your workspace.\nType: /nuke CONFIRM';
      try {
        const names = [];
        for await (const entry of STATE.wsHandle.values()) {
          if (entry.name.startsWith('.')) continue;
          names.push({ name: entry.name, kind: entry.kind });
        }
        for (const { name, kind } of names) {
          await STATE.wsHandle.removeEntry(name, { recursive: kind === 'directory' });
        }
        await initWorkspace(STATE.wsHandle);
        refreshDesktopIcons();
        refreshFileBrowser();
        refreshMemoryViewer();
        termPrint('💣 Workspace nuked via Telegram', 'warn');
        return `💣 Nuked ${names.length} items. Workspace re-initialized.`;
      } catch(e) { return `Nuke error: ${e.message}`; }
    }
    case '/help': return 'Commands: /start /status /files /memory /skills /export /nuke /stop /resume /help';
    case '/stop': stopTgPolling(); return 'Polling stopped.';
    case '/resume': startTgPolling(); return null; // Don't reply, just restart
    default: return `Unknown command: ${cmd}. Try /help`;
  }
}
