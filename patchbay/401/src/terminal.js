// ═══════════════════════════════════════════
// TERMINAL
// ═══════════════════════════════════════════
let _pipDoc = null;

function getTermOut() {
  if (_pipDoc) { const el = _pipDoc.getElementById('term-out'); if (el) return el; }
  return document.getElementById('term-out');
}

function termPrint(text, cls = '') {
  const out = getTermOut();
  const line = document.createElement('div');
  line.className = `tl tl-${cls}`;
  line.textContent = text;
  out.appendChild(line);
  scrollTerminal();
}

function termLog(text, cls = 'sys') { termPrint(text, cls); }

function termPrintExpandable(text, cls = '', threshold = 200) {
  const out = getTermOut();
  const line = document.createElement('div');
  line.className = `tl tl-${cls}`;
  if (text.length > threshold) {
    const preview = document.createElement('span');
    preview.textContent = text.slice(0, threshold);
    const rest = document.createElement('span');
    rest.textContent = text.slice(threshold);
    rest.style.display = 'none';
    const toggle = document.createElement('span');
    toggle.className = 'tl-expand';
    toggle.textContent = ' ▸ more';
    toggle.onclick = (e) => {
      e.stopPropagation();
      if (rest.style.display === 'none') {
        rest.style.display = 'inline';
        toggle.textContent = ' ▾ less';
      } else {
        rest.style.display = 'none';
        toggle.textContent = ' ▸ more';
      }
    };
    line.appendChild(preview);
    line.appendChild(toggle);
    line.appendChild(rest);
  } else {
    line.textContent = text;
  }
  out.appendChild(line);
  scrollTerminal();
}

function termHR() {
  const out = getTermOut();
  const hr = document.createElement('hr');
  hr.className = 'tl-hr';
  out.appendChild(hr);
}

function removeLastTermLine() {
  const out = getTermOut();
  const last = out.lastElementChild;
  if (last && last.classList.contains('tl')) out.removeChild(last);
}

function scrollTerminal() {
  const tc = getTermOut();
  tc.scrollTop = tc.scrollHeight;
}

// Click anywhere in terminal body → focus input (unless selecting text)
document.getElementById('term-out').addEventListener('mouseup', () => {
  if (!window.getSelection().toString()) document.getElementById('term-input').focus();
});

// Command history
const cmdHistory = [];
let historyIdx = -1;
let historyDraft = '';

document.getElementById('term-input').addEventListener('keydown', e => {
  const inp = e.target;
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (cmdHistory.length === 0) return;
    if (historyIdx === -1) historyDraft = inp.value;
    if (historyIdx < cmdHistory.length - 1) historyIdx++;
    inp.value = cmdHistory[cmdHistory.length - 1 - historyIdx];
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (historyIdx <= 0) { historyIdx = -1; inp.value = historyDraft; return; }
    historyIdx--;
    inp.value = cmdHistory[cmdHistory.length - 1 - historyIdx];
  } else if (e.key === 'Enter' && inp.value.trim() && !inp.disabled) {
    const val = inp.value.trim();
    cmdHistory.push(val);
    historyIdx = -1;
    historyDraft = '';
    inp.value = '';
    termHR();
    const out = getTermOut();
    const uLine = document.createElement('div');
    uLine.className = 'tl tl-user';
    uLine.innerHTML = `<span class="pfx">you›</span> ${escapeHtml(val)}`;
    out.appendChild(uLine);
    scrollTerminal();
    // Debug commands (/#PREFIX to avoid collision with user-defined commands)
    if (val.startsWith('/#')) {
      const parts = val.slice(2).split(/\s+/);
      const cmd = parts[0].toUpperCase();
      const arg = val.slice(2 + parts[0].length).trim();
      if (cmd === 'CRASH') {
        showCrashScreen(arg || 'Debug crash triggered by /#CRASH');
        return;
      }
      if (cmd === 'SPEAK') {
        if (!arg) { termPrint('Usage: /#SPEAK text to speak', 'warn'); return; }
        if (!('speechSynthesis' in window)) { termPrint('Speech synthesis not supported in this browser', 'err'); return; }
        speechSynthesis.cancel();
        speechSynthesis.speak(new SpeechSynthesisUtterance(arg));
        termPrint(`🔊 Speaking: "${arg}"`, 'obs');
        return;
      }
      termPrint(`Unknown debug command: /#${cmd}`, 'warn');
      return;
    }
    agentTurn(val, 'terminal');
  }
});

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ═══════════════════════════════════════════
// PICTURE-IN-PICTURE
// ═══════════════════════════════════════════
async function toggleTerminalPip() {
  if (_pipDoc) {
    // Close PiP — the pagehide handler will move elements back
    _pipDoc.defaultView.close();
    return;
  }
  if (!('documentPictureInPicture' in window)) {
    termPrint('PiP not supported in this browser', 'err');
    return;
  }
  const termOut = document.getElementById('term-out');
  const termBar = document.getElementById('term-input-bar');
  try {
    const pipWin = await documentPictureInPicture.requestWindow({ width: 500, height: 400 });
    // Copy styles
    const style = pipWin.document.createElement('style');
    style.textContent = document.querySelector('style')?.textContent || '';
    pipWin.document.head.appendChild(style);
    // Copy theme class
    pipWin.document.body.className = document.body.className;
    pipWin.document.body.style.cssText = 'margin:0;background:var(--bg);display:flex;flex-direction:column;height:100vh';
    // Copy CSS custom properties (theme vars) from :root
    const rootStyle = document.documentElement.style;
    for (let i = 0; i < rootStyle.length; i++) {
      const prop = rootStyle[i];
      if (prop.startsWith('--')) {
        pipWin.document.documentElement.style.setProperty(prop, rootStyle.getPropertyValue(prop));
      }
    }
    // Move elements
    termOut.style.flex = '1';
    termOut.style.overflowY = 'auto';
    pipWin.document.body.appendChild(termOut);
    pipWin.document.body.appendChild(termBar);
    _pipDoc = pipWin.document;
    // Focus input in PiP
    const pipInput = _pipDoc.getElementById('term-input');
    if (pipInput) {
      pipInput.addEventListener('keydown', e => {
        const inp = e.target;
        if (e.key === 'Enter' && inp.value.trim() && !inp.disabled) {
          const val = inp.value.trim();
          cmdHistory.push(val);
          historyIdx = -1;
          historyDraft = '';
          inp.value = '';
          termHR();
          const out = getTermOut();
          const uLine = document.createElement('div');
          uLine.className = 'tl tl-user';
          uLine.innerHTML = `<span class="pfx">you›</span> ${escapeHtml(val)}`;
          out.appendChild(uLine);
          scrollTerminal();
          agentTurn(val, 'terminal');
        }
      });
      setTimeout(() => pipInput.focus(), 100);
    }
    // On close, move elements back
    pipWin.addEventListener('pagehide', () => {
      const wb = document.querySelector('#win-terminal .window-body');
      if (wb) {
        wb.insertBefore(termOut, wb.firstChild);
        wb.appendChild(termBar);
        termOut.style.flex = '';
        termOut.style.overflowY = '';
      }
      _pipDoc = null;
    });
  } catch (e) {
    termPrint(`PiP error: ${e.message}`, 'err');
  }
}
