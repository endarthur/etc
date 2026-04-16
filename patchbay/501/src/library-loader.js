// ═══════════════════════════════════════════
// PRE-GENERATED LIBRARY LOADER
// Decompresses embedded library on first boot.
// ═══════════════════════════════════════════

// LIBRARY_BASE_B64 is injected by build.js from dist/library-base.b64.txt

async function decompressLibraryBlob(base64) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  const reader = stream.getReader();
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  const blob = new Blob(chunks);
  const text = await blob.text();
  return JSON.parse(text);
}

// Bump this whenever the embedded library content changes (titles stripped, regens, etc.)
const LIBRARY_VERSION = 2;

async function loadPreGenLibraryIfEmpty() {
  if (typeof LIBRARY_BASE_B64 === 'undefined' || !LIBRARY_BASE_B64) return;

  const hasStalePreGen = STATE.preGenVersion !== LIBRARY_VERSION && STATE.novels?.some(n => n.preGen);
  const isEmpty = !STATE.novels || STATE.novels.length === 0;

  if (!isEmpty && !hasStalePreGen) return; // already loaded and current

  try {
    const data = await decompressLibraryBlob(LIBRARY_BASE_B64);
    if (!data.novels || !data.novels.length) return;

    // Preserve user-generated novels, replace pre-gen ones
    const userNovels = (STATE.novels || []).filter(n => !n.preGen);
    const newPreGen = data.novels.map(n => ({
      ...n,
      tropes: n.tropes || {},
      chapters: n.chapters || [],
      summaries: n.summaries || [],
      createdAt: Date.now(),
      preGen: true,
    }));

    STATE.novels = [...newPreGen, ...userNovels];
    STATE.currentNovel = STATE.currentNovel ?? 0;
    STATE.preGenShowcaseTitle = data.showcaseTitle;
    STATE.preGenVersion = LIBRARY_VERSION;
    saveState();

    // Award skull 0 (The Generator) — student has examined pre-gen artifacts
    awardSkull(0);

    // Update UI
    updateNovelCount();
    renderLibrary();
    const novel = STATE.novels[0];
    if (novel) {
      if (novel.bible) displayBible(novel.bible);
      if (novel.beats) displayBeats(novel.beats);
      updateFactoryUI(novel);
      renderPhoneReader(novel);
    }

    console.log('[library] Loaded %d pre-generated novels', data.novels.length);
  } catch (e) {
    console.warn('[library] Failed to load pre-generated library:', e);
  }
}

// ─── Pack loader UI ───
const AVAILABLE_PACKS = [
  { id: 'historical',      name: 'Historical',      file: 'dist/pack-historical.json.gz',       desc: 'Ottoman Istanbul, Edo Japan, Renaissance Florence, Viking Scandinavia, Prohibition Chicago' },
  { id: 'modern',          name: 'Modern',          file: 'dist/pack-modern.json.gz',           desc: 'Silicon Valley, K-pop Seoul, Formula 1, Bollywood, Wall Street' },
  { id: 'fantasy',         name: 'Fantasy & Unusual', file: 'dist/pack-fantasy.json.gz',        desc: 'Underwater cities, traveling circus, Antarctic station, chess, haute couture' },
  { id: 'no-romance',      name: 'No Romance',      file: 'dist/pack-no-romance.json.gz',       desc: 'Neurosurgery, Napa wine, Olympic gymnastics, Vienna Philharmonic, architecture' },
  { id: 'variety',         name: 'Extra Variety',   file: 'dist/pack-variety.json.gz',          desc: 'Space colony, Brazilian telenovela, Hawaiian surfing, Michelin Tokyo, art forgery' },
  { id: 'more-historical', name: 'More Historical', file: 'dist/pack-more-historical.json.gz',  desc: 'Mughal India, Song Dynasty China, Weimar Berlin, Maya Tikal, Caribbean pirates' },
];

function showPackLoader() {
  const loadedPacks = new Set(STATE.novels.filter(n => n.pack).map(n => n.pack));
  const rows = AVAILABLE_PACKS.map(p => {
    const loaded = loadedPacks.has(p.id);
    return `<div style="padding:10px 12px;border:1px solid var(--border);border-radius:6px;margin-bottom:8px;${loaded ? 'opacity:0.5' : ''}">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <span style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text)">${p.name}</span>
        <button class="btn" style="padding:3px 10px;font-size:10px" ${loaded ? 'disabled' : ''} onclick="doLoadPack('${p.id}','${p.file}')">${loaded ? 'Loaded' : '+ Load'}</button>
      </div>
      <div style="font-size:10px;color:var(--text-dim);line-height:1.4">${p.desc}</div>
    </div>`;
  }).join('');

  const overlay = document.createElement('div');
  overlay.className = 'overlay visible';
  overlay.innerHTML = `<div class="modal" style="max-width:520px">
    <div class="modal-header"><h2>📦 Load Extension Pack</h2></div>
    <div class="modal-body">
      <p style="font-size:11px;color:var(--text-dim);margin-bottom:12px;line-height:1.5">Extension packs add themed novels to your library. Each pack is a separate file fetched on demand.</p>
      <div id="pack-load-status" style="display:none;padding:8px 12px;background:var(--amber-dim);border-radius:4px;margin-bottom:10px;font-family:var(--font-mono);font-size:11px;color:var(--amber)"></div>
      ${rows}
    </div>
    <div class="modal-footer"><button class="btn" onclick="this.closest('.overlay').remove()">Close</button></div>
  </div>`;
  document.body.appendChild(overlay);
}

async function doLoadPack(packId, packFile) {
  const status = document.getElementById('pack-load-status');
  if (status) { status.style.display = 'block'; status.textContent = 'Loading ' + packId + '...'; }
  try {
    const result = await loadExtensionPack(packFile, packId);
    if (status) status.textContent = `Loaded ${result.added} novels from "${result.name}".`;
    // Refresh the modal
    setTimeout(() => {
      document.querySelector('.overlay')?.remove();
      showPackLoader();
    }, 1000);
  } catch (e) {
    if (status) { status.style.color = 'var(--red)'; status.textContent = 'Failed: ' + e.message; }
  }
}

// ─── Extension pack loader ───
async function loadExtensionPack(packFile, packId) {
  try {
    const res = await fetch(packFile);
    if (!res.ok) throw new Error('Failed to fetch ' + packFile);
    const bytes = new Uint8Array(await res.arrayBuffer());
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    const blob = await new Response(stream).blob();
    const pack = JSON.parse(await blob.text());

    // Append novels to STATE, skip duplicates by title
    const existingTitles = new Set(STATE.novels.map(n => n.title));
    let added = 0;
    for (const novel of pack.novels) {
      if (existingTitles.has(novel.title)) continue;
      STATE.novels.push({
        ...novel,
        tropes: novel.tropes || {},
        chapters: novel.chapters || [],
        summaries: novel.summaries || [],
        createdAt: Date.now(),
        preGen: true,
        pack: packId || pack.id,
      });
      added++;
    }
    saveState();
    updateNovelCount();
    renderLibrary();
    return { added, total: pack.novels.length, name: pack.name };
  } catch (e) {
    console.warn('[library] Pack load failed:', e);
    throw e;
  }
}
