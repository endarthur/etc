// ═══════════════════════════════════════════
// TERMINAL CONFIRM (Promise-based Allow/Deny)
// ═══════════════════════════════════════════
function termConfirm(message) {
  return new Promise(resolve => {
    const out = getTermOut();
    const line = document.createElement('div');
    line.className = 'tl tl-warn';
    line.innerHTML = `${escapeHtml(message)} <span class="term-confirm"><button class="tc-allow">Allow</button><button class="tc-deny">Deny</button></span>`;
    out.appendChild(line);
    scrollTerminal();
    line.querySelector('.tc-allow').onclick = () => { line.querySelector('.term-confirm').remove(); line.textContent += ' ✓ Allowed'; resolve(true); };
    line.querySelector('.tc-deny').onclick = () => { line.querySelector('.term-confirm').remove(); line.textContent += ' ✗ Denied'; resolve(false); };
  });
}

// ═══════════════════════════════════════════
// FSAA TOOL HANDLERS (Ch.2 + Ch.3)
// ═══════════════════════════════════════════
registerTool('save_note', 'Save or overwrite a text file in the workspace. Use for notes, lists, documents.', {
  type: 'object',
  properties: {
    filename: { type: 'string', description: 'Filename including extension, e.g. "groceries.md"' },
    content: { type: 'string', description: 'File content to write' },
  },
  required: ['filename', 'content'],
}, async ({ filename, content }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  if (!safePath(filename)) return 'Error: invalid path';
  const parts = filename.replace(/\\/g, '/').split('/');
  const name = parts.pop();
  let dir = await STATE.wsHandle.getDirectoryHandle('notes', { create: true });
  for (const seg of parts) {
    if (seg === '.' || seg === '') continue;
    dir = await dir.getDirectoryHandle(seg, { create: true });
  }
  const fh = await dir.getFileHandle(name, { create: true });
  const w = await fh.createWritable();
  await w.write(content);
  await w.close();
  return `Saved ${filename} (${content.length} bytes)`;
});

registerTool('read_note', 'Read the content of a file from the workspace.', {
  type: 'object',
  properties: {
    filename: { type: 'string', description: 'Filename to read, e.g. "groceries.md"' },
  },
  required: ['filename'],
}, async ({ filename }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  if (!safePath(filename)) return 'Error: invalid path';
  // Try notes/ first, then root
  try {
    const notesDir = await STATE.wsHandle.getDirectoryHandle('notes');
    const fh = await notesDir.getFileHandle(filename);
    return await (await fh.getFile()).text();
  } catch {}
  // Try as a full relative path from workspace root
  try {
    const { dir, fileName } = await resolveFile(STATE.wsHandle, filename);
    const fh = await dir.getFileHandle(fileName);
    return await (await fh.getFile()).text();
  } catch {}
  // Try root directly
  try {
    const fh = await STATE.wsHandle.getFileHandle(filename);
    return await (await fh.getFile()).text();
  } catch {
    return `Error: file "${filename}" not found`;
  }
});

registerTool('list_files', 'List files and folders in a workspace directory.', {
  type: 'object',
  properties: {
    path: { type: 'string', description: 'Directory path relative to workspace, e.g. "notes" or "."' },
  },
  required: ['path'],
}, async ({ path }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  const cleanPath = (path || '.').replace(/\\/g, '/');
  try {
    let dir = STATE.wsHandle;
    if (cleanPath !== '.' && cleanPath !== '') {
      const segs = cleanPath.split('/').filter(s => s && s !== '.');
      for (const seg of segs) dir = await dir.getDirectoryHandle(seg);
    }
    const entries = [];
    for await (const entry of dir.values()) {
      entries.push(`${entry.kind === 'directory' ? '📁' : '📄'} ${entry.name}`);
    }
    return entries.length > 0 ? entries.join('\n') : '(empty directory)';
  } catch(e) {
    return `Error: ${e.message}`;
  }
});

registerTool('mkdir', 'Create a new directory in the workspace.', {
  type: 'object',
  properties: {
    path: { type: 'string', description: 'Directory path to create, e.g. "notes/projects"' },
  },
  required: ['path'],
}, async ({ path }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  if (!safePath(path)) return 'Error: invalid path';
  const segs = path.replace(/\\/g, '/').split('/').filter(s => s && s !== '.');
  let dir = STATE.wsHandle;
  for (const seg of segs) dir = await dir.getDirectoryHandle(seg, { create: true });
  return `Created directory: ${path}`;
});

registerTool('move_file', 'Move/rename a file within the workspace.', {
  type: 'object',
  properties: {
    from: { type: 'string', description: 'Source path' },
    to: { type: 'string', description: 'Destination path' },
  },
  required: ['from', 'to'],
}, async ({ from, to }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  if (!safePath(from) || !safePath(to)) return 'Error: invalid path';
  try {
    const { dir: srcDir, fileName: srcName } = await resolveFile(STATE.wsHandle, from);
    const fh = await srcDir.getFileHandle(srcName);
    const content = await (await fh.getFile()).text();
    const { dir: dstDir, fileName: dstName } = await resolveFile(STATE.wsHandle, to);
    const nfh = await dstDir.getFileHandle(dstName, { create: true });
    const w = await nfh.createWritable();
    await w.write(content);
    await w.close();
    await srcDir.removeEntry(srcName);
    return `Moved ${from} → ${to}`;
  } catch(e) {
    return `Error: ${e.message}`;
  }
});

registerTool('delete_file', 'Delete a file from the workspace (moved to Trash). Requires user confirmation.', {
  type: 'object',
  properties: {
    path: { type: 'string', description: 'File path to delete' },
  },
  required: ['path'],
}, async ({ path }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  if (!safePath(path)) return 'Error: invalid path';
  const allowed = STATE.safety.autoApproveDelete ? true : await termConfirm(`⚠ Agent wants to delete "${path}" (moved to Trash). Allow?`);
  if (!allowed) return 'Denied: user refused deletion.';
  try {
    await moveToTrash(path);
    return `Deleted ${path} (moved to Trash)`;
  } catch(e) {
    return `Error: ${e.message}`;
  }
});

registerTool('fetch_url', 'Fetch the text content of a URL (GET request). Requires user confirmation. Returns plain text or JSON.', {
  type: 'object',
  properties: {
    url: { type: 'string', description: 'The URL to fetch, e.g. "https://api.example.com/data"' },
  },
  required: ['url'],
}, async ({ url }) => {
  if (!url || !url.startsWith('http')) return 'Error: URL must start with http:// or https://';
  const allowed = STATE.safety.autoApproveNetwork ? true : await termConfirm(`⚠ Agent wants to fetch: ${url}`);
  if (!allowed) return 'Denied: user refused network request.';
  try {
    const resp = await fetch(url);
    if (!resp.ok) return `Error: HTTP ${resp.status} ${resp.statusText}`;
    const text = await resp.text();
    if (text.length > 8000) return text.slice(0, 8000) + '\n...(truncated)';
    return text;
  } catch(e) {
    return `Error: ${e.message} (this may be a CORS restriction — the target server must allow cross-origin requests from browsers)`;
  }
});

registerTool('search_notes', 'Search through notes for text matching a query.', {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'Search text to find in notes' },
  },
  required: ['query'],
}, async ({ query }) => {
  if (!STATE.wsHandle) return 'Error: no workspace folder selected';
  const results = [];
  try {
    const notesDir = await STATE.wsHandle.getDirectoryHandle('notes');
    for await (const entry of notesDir.values()) {
      if (entry.kind !== 'file') continue;
      const file = await (await entry.getFile()).text();
      if (file.toLowerCase().includes(query.toLowerCase())) {
        const snippet = file.slice(0, 100).replace(/\n/g, ' ');
        results.push(`📄 ${entry.name}: "${snippet}..."`);
      }
    }
  } catch {}
  return results.length > 0 ? results.join('\n') : `No notes matching "${query}"`;
});

// ═══════════════════════════════════════════
// BROWSER API TOOLS (Ch.10)
// ═══════════════════════════════════════════

// WMO weather code decoder
function _weatherCode(code) {
  const codes = {0:'Clear sky',1:'Mainly clear',2:'Partly cloudy',3:'Overcast',
    45:'Foggy',48:'Rime fog',51:'Light drizzle',53:'Moderate drizzle',55:'Dense drizzle',
    61:'Slight rain',63:'Moderate rain',65:'Heavy rain',71:'Slight snow',73:'Moderate snow',
    75:'Heavy snow',80:'Slight showers',81:'Moderate showers',82:'Violent showers',
    85:'Slight snow showers',86:'Heavy snow showers',95:'Thunderstorm',96:'Thunderstorm w/ hail',99:'Severe thunderstorm'};
  return codes[code] || `Code ${code}`;
}

registerTool('speak', 'Speak text aloud using the browser\'s text-to-speech. No permission needed.', {
  type: 'object',
  properties: {
    text: { type: 'string', description: 'Text to speak aloud' },
    voice: { type: 'string', description: 'Voice name to use (optional — omit for default)' },
  },
  required: ['text'],
}, async ({ text, voice }) => {
  if (!('speechSynthesis' in window)) return 'Error: speech synthesis not supported in this browser';
  speechSynthesis.cancel(); // stop any current speech
  const utter = new SpeechSynthesisUtterance(text);
  if (voice) {
    const voices = speechSynthesis.getVoices();
    const match = voices.find(v => v.name.toLowerCase().includes(voice.toLowerCase()));
    if (match) utter.voice = match;
  }
  speechSynthesis.speak(utter);
  return `Speaking: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"`;
});

registerTool('listen', 'Listen for speech using the microphone and return recognized text. Requires user permission.', {
  type: 'object',
  properties: {
    duration: { type: 'number', description: 'Max seconds to listen (default 5, max 15)' },
  },
  required: [],
}, async ({ duration = 5 }) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return 'Error: speech recognition not supported (Chromium browsers only)';
  const allowed = STATE.safety.autoApproveMic ? true : await termConfirm('⚠ Agent wants to use the microphone to listen for speech. Allow?');
  if (!allowed) return 'Denied: user refused microphone access.';
  const secs = Math.min(Math.max(duration || 5, 1), 15);
  return new Promise(resolve => {
    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let resolved = false;
    const done = (msg) => { if (!resolved) { resolved = true; resolve(msg); } };
    const timeout = setTimeout(() => { recognition.stop(); done('(no speech detected)'); }, secs * 1000);
    recognition.onresult = (e) => {
      clearTimeout(timeout);
      const t = e.results[0][0].transcript;
      const c = (e.results[0][0].confidence * 100).toFixed(0);
      done(`Heard: "${t}" (confidence: ${c}%)`);
    };
    recognition.onerror = (e) => { clearTimeout(timeout); done(`Error: ${e.error}`); };
    recognition.onend = () => { clearTimeout(timeout); done('(no speech detected)'); };
    recognition.start();
  });
});

registerTool('get_location', 'Get the user\'s current geographic location (latitude, longitude). Requires user permission.', {
  type: 'object',
  properties: {},
  required: [],
}, async () => {
  if (!navigator.geolocation) return 'Error: geolocation not supported';
  const allowed = STATE.safety.autoApproveLocation ? true : await termConfirm('⚠ Agent wants to access your location. Allow?');
  if (!allowed) return 'Denied: user refused location access.';
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        resolve(`Location: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E (accuracy: ±${accuracy.toFixed(0)}m)`);
      },
      err => resolve(`Error: ${err.message}`),
      { timeout: 10000, enableHighAccuracy: false }
    );
  });
});

registerTool('get_weather', 'Get current weather for a city using Open-Meteo (free, no API key). Returns temperature, wind, and conditions.', {
  type: 'object',
  properties: {
    location: { type: 'string', description: 'City name, e.g. "London" or "São Paulo"' },
  },
  required: ['location'],
}, async ({ location }) => {
  try {
    const geoResp = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en`);
    if (!geoResp.ok) return `Error: geocoding failed (HTTP ${geoResp.status})`;
    const geoData = await geoResp.json();
    if (!geoData.results || geoData.results.length === 0) return `Location "${location}" not found`;
    const { latitude, longitude, name, country } = geoData.results[0];
    const wxResp = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
    if (!wxResp.ok) return `Error: weather fetch failed (HTTP ${wxResp.status})`;
    const wx = (await wxResp.json()).current_weather;
    return `Weather for ${name}, ${country}:\nTemperature: ${wx.temperature}°C\nWind: ${wx.windspeed} km/h\nConditions: ${_weatherCode(wx.weathercode)}\nTime: ${wx.time}`;
  } catch(e) {
    return `Error: ${e.message}`;
  }
});

registerTool('send_notification', 'Send a desktop notification to the user. Requires notification permission. Can be toggled off in Settings.', {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Notification title' },
    body: { type: 'string', description: 'Notification body text (optional)' },
  },
  required: ['title'],
}, async ({ title, body }) => {
  if (!('Notification' in window)) return 'Error: notifications not supported in this browser';
  if (!STATE.notificationsEnabled) return 'Notifications are disabled (user can re-enable in Settings → Comms).';
  if (Notification.permission === 'denied') return 'Error: notifications blocked by browser — user must allow in browser settings';
  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return 'Error: notification permission denied by user';
  }
  new Notification(title, { body: body || '' });
  return `Notification sent: "${title}"`;
});

registerTool('search_wikipedia', 'Search Wikipedia and return a summary of the top result. No API key needed.', {
  type: 'object',
  properties: {
    query: { type: 'string', description: 'Search query, e.g. "photosynthesis" or "Alan Turing"' },
  },
  required: ['query'],
}, async ({ query }) => {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=1`;
    const searchResp = await fetch(searchUrl);
    if (!searchResp.ok) return `Error: Wikipedia search failed (HTTP ${searchResp.status})`;
    const searchData = await searchResp.json();
    if (!searchData.query.search.length) return `No Wikipedia results for "${query}"`;
    const title = searchData.query.search[0].title;
    const extUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro&explaintext&format=json&origin=*`;
    const extResp = await fetch(extUrl);
    if (!extResp.ok) return `Error: Wikipedia extract failed (HTTP ${extResp.status})`;
    const pages = (await extResp.json()).query.pages;
    const page = Object.values(pages)[0];
    let extract = page.extract || '(no summary available)';
    if (extract.length > 2000) extract = extract.slice(0, 2000) + '\n...(truncated)';
    return `Wikipedia: ${title}\nhttps://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g,'_'))}\n\n${extract}`;
  } catch(e) {
    return `Error: ${e.message}`;
  }
});

// ═══════════════════════════════════════════
// SELF-DECORATION TOOLS
// ═══════════════════════════════════════════
registerTool('set_theme', 'Change the desktop color theme.', {
  type: 'object',
  properties: {
    theme_id: { type: 'string', description: 'Theme ID', enum: Object.keys(THEMES) },
  },
  required: ['theme_id'],
}, async ({ theme_id }) => {
  if (!THEMES[theme_id]) return 'Unknown theme. Available: ' + Object.keys(THEMES).join(', ');
  selectTheme(theme_id);
  return 'Theme changed to ' + theme_id;
});

registerTool('set_wallpaper', 'Change the desktop wallpaper.', {
  type: 'object',
  properties: {
    wallpaper_id: { type: 'string', description: 'Wallpaper ID', enum: Object.keys(WALLPAPERS) },
  },
  required: ['wallpaper_id'],
}, async ({ wallpaper_id }) => {
  if (!WALLPAPERS[wallpaper_id]) return 'Unknown wallpaper. Available: ' + Object.keys(WALLPAPERS).join(', ');
  selectWallpaper(wallpaper_id);
  return 'Wallpaper changed to ' + wallpaper_id;
});

registerTool('set_chrome', 'Change the desktop window chrome style.', {
  type: 'object',
  properties: {
    chrome_id: { type: 'string', description: 'Chrome style ID', enum: Object.keys(CHROME_STYLES) },
  },
  required: ['chrome_id'],
}, async ({ chrome_id }) => {
  if (!CHROME_STYLES[chrome_id]) return 'Unknown chrome. Available: ' + Object.keys(CHROME_STYLES).join(', ');
  selectChrome(chrome_id);
  return 'Chrome changed to ' + chrome_id;
});

registerTool('pip_open', 'Pop the terminal into a floating Picture-in-Picture window.', {
  type: 'object',
  properties: {},
  required: [],
}, async () => {
  if (_pipDoc) return 'Terminal is already in PiP mode.';
  await toggleTerminalPip();
  return 'Terminal popped into PiP window.';
});
