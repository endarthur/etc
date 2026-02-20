// ═══════════════════════════════════════════
// SCHEDULER (Ch.11)
// ═══════════════════════════════════════════
let schedulerRunning = false;
let schedules = [];
const MAX_SCHEDULES = 5;
const MIN_INTERVAL_MS = 60000;

// ─── Persistence ───────────────────────────
async function loadSchedules() {
  if (!STATE.wsHandle) return;
  try {
    const fh = await STATE.wsHandle.getFileHandle('schedules.json');
    const text = await (await fh.getFile()).text();
    schedules = JSON.parse(text);
  } catch { schedules = []; }
}

async function saveSchedules() {
  if (!STATE.wsHandle) return;
  const fh = await STATE.wsHandle.getFileHandle('schedules.json', { create: true });
  const w = await fh.createWritable();
  await w.write(JSON.stringify(schedules, null, 2));
  await w.close();
}

// ─── Init ──────────────────────────────────
async function initScheduler() {
  await loadSchedules();
  refreshSchedulerPanel();
  if (schedules.some(s => s.enabled)) {
    startScheduler();
  }
}

// ─── Start / Stop ──────────────────────────
function startScheduler() {
  if (schedulerRunning) return;
  schedulerRunning = true;
  document.getElementById('sp-sched').style.display = '';
  document.getElementById('sched-status').textContent = 'running';
  document.getElementById('sched-header-status').textContent = 'running';
  document.getElementById('sched-toggle').checked = true;
  schedulerTick();
}

function stopScheduler() {
  schedulerRunning = false;
  document.getElementById('sched-header-status').textContent = 'stopped';
  document.getElementById('sched-toggle').checked = false;
  if (schedules.length === 0) {
    document.getElementById('sp-sched').style.display = 'none';
  } else {
    document.getElementById('sched-status').textContent = 'stopped';
  }
}

function toggleSchedulerGlobal(on) {
  if (on) {
    if (schedules.some(s => s.enabled)) startScheduler();
  } else {
    stopScheduler();
  }
}

// ─── Tick Loop ─────────────────────────────
async function schedulerTick() {
  if (!schedulerRunning) return;

  const now = Date.now();

  for (let i = 0; i < schedules.length; i++) {
    const sched = schedules[i];
    if (!sched.enabled || now < sched.nextRun) continue;
    if (STATE.agentBusy) break;

    // Update timing before firing
    sched.lastRun = now;
    if (sched.repeat) {
      sched.nextRun = now + sched.intervalMs;
    }

    // Render in terminal
    termHR();
    const out = document.getElementById('term-out');
    const uLine = document.createElement('div');
    uLine.className = 'tl tl-sched';
    uLine.innerHTML = `<span class="pfx">\u23F0\u203A</span> ${escapeHtml(sched.name)}: ${escapeHtml(sched.prompt)}`;
    out.appendChild(uLine);
    scrollTerminal();

    await agentTurn(sched.prompt, 'scheduler');

    // One-shot: remove after firing
    if (!sched.repeat) {
      schedules.splice(i, 1);
    }

    await saveSchedules();
    break; // one per tick
  }

  refreshSchedulerPanel();

  // Auto-stop if no schedules remain
  if (schedules.length === 0) {
    stopScheduler();
    return;
  }

  if (schedulerRunning) setTimeout(schedulerTick, 5000);
}

// ─── Formatting ────────────────────────────
function formatInterval(ms) {
  if (ms < 60000) return `every ${Math.round(ms / 1000)}s`;
  if (ms < 3600000) {
    const m = Math.round(ms / 60000);
    return `every ${m} min`;
  }
  if (ms < 86400000) {
    const h = Math.round(ms / 3600000);
    return `every ${h} hr`;
  }
  return `every ${Math.round(ms / 86400000)} day`;
}

function formatNextRun(ts) {
  const diff = ts - Date.now();
  if (diff <= 0) return 'due now';
  if (diff < 60000) return `in ${Math.round(diff / 1000)}s`;
  if (diff < 3600000) {
    const m = Math.floor(diff / 60000);
    const s = Math.round((diff % 60000) / 1000);
    return `in ${m}m ${s}s`;
  }
  return `in ${Math.round(diff / 3600000)}h`;
}

// ─── Panel Rendering ───────────────────────
function refreshSchedulerPanel() {
  const panel = document.getElementById('scheduler-panel');
  if (!panel) return;

  if (schedules.length === 0) {
    panel.innerHTML = '<div style="color:var(--text-faint);padding:20px;text-align:center;font-size:11px">No scheduled tasks. Ask your agent to schedule something.</div>';
    return;
  }

  panel.innerHTML = schedules.map(s => `
    <div class="sched-card${s.enabled ? '' : ' disabled'}">
      <div class="sc-top">
        <span class="sc-name">${escapeHtml(s.name)}</span>
        <span class="sc-interval">${s.repeat ? formatInterval(s.intervalMs) : 'one-shot'}</span>
      </div>
      <div class="sc-prompt">${escapeHtml(s.prompt)}</div>
      <div class="sc-meta">
        ${s.repeat ? 'Recurring' : 'Reminder'} \u00B7 Next: ${formatNextRun(s.nextRun)}${s.lastRun ? ' \u00B7 Last: ' + new Date(s.lastRun).toLocaleTimeString() : ''}
      </div>
      <div class="sc-actions">
        <label class="toggle toggle-sm"><input type="checkbox" ${s.enabled ? 'checked' : ''} onchange="toggleSchedule('${s.id}')"><span class="slider"></span></label>
        <button class="sc-delete" onclick="deleteScheduleUI('${s.id}')">\u2715</button>
      </div>
    </div>
  `).join('');
}

// ─── UI Actions ────────────────────────────
function toggleSchedule(id) {
  const sched = schedules.find(s => s.id === id);
  if (!sched) return;
  sched.enabled = !sched.enabled;
  saveSchedules();
  refreshSchedulerPanel();
  if (sched.enabled && !schedulerRunning) startScheduler();
  if (schedules.every(s => !s.enabled) && schedulerRunning) stopScheduler();
}

async function deleteScheduleUI(id) {
  const sched = schedules.find(s => s.id === id);
  if (!sched) return;
  const ok = await termConfirm(`Delete schedule "${sched.name}"?`);
  if (!ok) return;
  schedules = schedules.filter(s => s.id !== id);
  await saveSchedules();
  refreshSchedulerPanel();
  if (schedules.length === 0) stopScheduler();
}

// ─── Tools ─────────────────────────────────
registerTool('schedule_task', 'Create a recurring scheduled task that runs on a timer. The agent will execute the prompt automatically at each interval.', {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Short name for the schedule, e.g. "daily journal"' },
    prompt: { type: 'string', description: 'The prompt to execute on each run' },
    interval_minutes: { type: 'number', description: 'Interval in minutes between runs (minimum 1)' },
  },
  required: ['name', 'prompt', 'interval_minutes'],
}, async ({ name, prompt, interval_minutes }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  if (schedules.length >= MAX_SCHEDULES) return `Error: maximum ${MAX_SCHEDULES} schedules reached. Remove one first.`;
  const intervalMs = Math.max(MIN_INTERVAL_MS, interval_minutes * 60000);
  const ok = await termConfirm(`\u23F0 Schedule "${name}" \u2014 ${formatInterval(intervalMs)}: "${prompt.slice(0, 60)}${prompt.length > 60 ? '...' : ''}"?`);
  if (!ok) return 'Denied: user refused schedule creation.';
  const sched = {
    id: 's_' + Date.now(),
    name,
    prompt,
    intervalMs,
    repeat: true,
    enabled: true,
    lastRun: null,
    nextRun: Date.now() + intervalMs,
    createdAt: Date.now(),
  };
  schedules.push(sched);
  await saveSchedules();
  refreshSchedulerPanel();
  if (!schedulerRunning) startScheduler();
  return `Scheduled "${name}" \u2014 ${formatInterval(intervalMs)}. Next run: ${formatNextRun(sched.nextRun)}.`;
});

registerTool('set_reminder', 'Set a one-shot reminder that fires once after a delay. The agent will execute the prompt once, then the reminder auto-removes.', {
  type: 'object',
  properties: {
    message: { type: 'string', description: 'Reminder message / prompt to execute when it fires' },
    delay_minutes: { type: 'number', description: 'Delay in minutes before firing (minimum 1)' },
  },
  required: ['message', 'delay_minutes'],
}, async ({ message, delay_minutes }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  if (schedules.length >= MAX_SCHEDULES) return `Error: maximum ${MAX_SCHEDULES} schedules reached. Remove one first.`;
  const delayMs = Math.max(MIN_INTERVAL_MS, delay_minutes * 60000);
  const label = formatInterval(delayMs).replace('every ', '');
  const ok = await termConfirm(`\u23F0 Reminder in ${label}: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"?`);
  if (!ok) return 'Denied: user refused reminder creation.';
  const sched = {
    id: 's_' + Date.now(),
    name: 'Reminder',
    prompt: message,
    intervalMs: delayMs,
    repeat: false,
    enabled: true,
    lastRun: null,
    nextRun: Date.now() + delayMs,
    createdAt: Date.now(),
  };
  schedules.push(sched);
  await saveSchedules();
  refreshSchedulerPanel();
  if (!schedulerRunning) startScheduler();
  return `Reminder set \u2014 fires in ${label}. "${message}"`;
});

registerTool('list_schedules', 'List all scheduled tasks and reminders with their status.', {
  type: 'object', properties: {}, required: [],
}, async () => {
  if (schedules.length === 0) return 'No schedules or reminders set.';
  return schedules.map(s => {
    const type = s.repeat ? 'Recurring' : 'One-shot';
    const status = s.enabled ? 'enabled' : 'disabled';
    const interval = s.repeat ? formatInterval(s.intervalMs) : 'once';
    const next = formatNextRun(s.nextRun);
    return `\u2022 ${s.name} [${type}, ${status}] \u2014 ${interval} \u2014 next: ${next} \u2014 "${s.prompt.slice(0, 50)}${s.prompt.length > 50 ? '...' : ''}"`;
  }).join('\n');
});

registerTool('remove_schedule', 'Remove a scheduled task or reminder by name.', {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Name of the schedule to remove' },
  },
  required: ['name'],
}, async ({ name }) => {
  const sched = schedules.find(s => s.name.toLowerCase() === name.toLowerCase());
  if (!sched) return `Error: no schedule found with name "${name}". Use list_schedules to see current schedules.`;
  const ok = await termConfirm(`\u23F0 Remove schedule "${sched.name}"?`);
  if (!ok) return 'Denied: user refused removal.';
  schedules = schedules.filter(s => s.id !== sched.id);
  await saveSchedules();
  refreshSchedulerPanel();
  if (schedules.length === 0) stopScheduler();
  return `Removed schedule "${sched.name}".`;
});