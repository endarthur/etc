// ═══════════════════════════════════════════
// SLOP PIPELINE
// Bible → Beat Sheet → Chapters
// ═══════════════════════════════════════════

// ─── Trope labels (for prompt construction) ───
const TROPE_LABELS = {
  who: {
    'secret-heir': 'Secret Heir — they own/control more than anyone knows (money, land, throne, organization)',
    'hidden-master': 'Hidden Master — they\'re the best at something nobody sees them do (medicine, craft, fighting, cooking, code, music)',
    'disguised-royalty': 'Disguised Royalty — their bloodline/lineage is hidden (royal, noble, legendary family, dynasty)',
    'returned-exile': 'Returned Exile — they were cast out once and came back quietly (from a country, family, industry, community)',
    'retired-legend': 'Retired Legend — they were famous/feared once and walked away (warrior, surgeon, artist, champion, spy)',
    'secret-benefactor': 'Secret Benefactor — they\'ve been silently keeping things running (funding, protecting, supplying, creating)',
  },
  what: {
    'public-accusation': 'Public Accusation — accused of wrongdoing in front of witnesses',
    'betrayal': 'Betrayal by Trusted Person — someone close turns on them (partner, mentor, sibling, friend)',
    'cast-out': 'Cast Out — expelled from the place they belong (fired, exiled, disowned, expelled, excommunicated)',
    'stolen-credit': 'Stolen Credit — their work/achievement is claimed by someone else',
    'framed': 'Framed — evidence is fabricated against them',
    'wedding-ruined': 'Wedding Ruined — their ceremony/celebration/milestone is destroyed publicly',
  },
  how: {
    'reveal-identity': 'Reveal True Identity — the mask comes off, the truth speaks for itself',
    'withdraw-support': 'Withdraw What They Depend On — remove the support they didn\'t know came from you (money, protection, knowledge, supply, access, talent)',
    'let-them-fail': 'Let Them Fail Without You — step back and watch incompetence do the work',
    'take-theirs': 'Take What\'s Theirs — acquire their position, territory, institution, audience, throne',
    'someone-better': 'Show Up With Someone Better — appear with a rival, a superior replacement, a more powerful ally',
    'systematic-dismantling': 'Systematic Dismantling — destroy their position piece by piece through evidence, alliances, or exposure',
  },
  with: {
    'contract-marriage': 'Contract Marriage — forced proximity through obligation',
    'fake-dating': 'Fake Dating — pretending, then not pretending',
    'childhood-promise': 'Childhood Promise — an old bond resurfaces',
    'ex-returns': 'Ex Returns — unfinished business walks back in',
    'enemy-to-lover': 'Enemy to Lover — the adversary becomes the interest',
    'forbidden-connection': 'Forbidden Connection — the relationship crosses a line (class, faction, family, rival house)',
  },
};

// ─── Beat definitions (full descriptions from spec) ───
const BEATS = [
  { name: 'The Mask', act: 'Act 1 — Fall', desc: 'The protagonist exists in their diminished form. This chapter needs at least TWO full scenes: (1) the protagonist in their reduced daily life — show their competence leaking through in small, specific moments that the people around them miss or dismiss; (2) a encounter or interaction that lets the reader see the gap between who this person appears to be and who they actually are. Plant at least one concrete detail that will pay off later. The world treats the protagonist as less than they are. Establish what "normal" looks like so the reader feels its destruction.' },
  { name: 'The Strike', act: 'Act 1 — Fall', desc: 'The humiliation happens. It\'s public, witnessed, and specific. This chapter needs a full scene with buildup: the setting, the crowd, the moment before. The catalyst acts, the antagonist endorses or enables it. The protagonist loses standing in front of people whose opinion matters within this world. Show at least three different characters\' reactions to the humiliation. End: the damage is done.' },
  { name: 'The Silence', act: 'Act 1 — Fall', desc: 'The one person who could have intervened didn\'t. This chapter needs TWO scenes: (1) the aftermath — the protagonist alone, processing, but the reader sees the first sign that this isn\'t grief — it\'s calculation; (2) a conversation with someone (the enabler, a friend, a stranger) where the protagonist reveals nothing but the reader learns everything. End: the protagonist makes one small, private move.' },
  { name: 'The Strut', act: 'Act 2A — Pressure', desc: 'The antagonist enjoys the new order. This chapter is told partly or entirely from the antagonist\'s perspective. Show at least TWO scenes of the antagonist exercising their stolen power: one public (a meeting, a party, a press event) and one private (a conversation that reveals their insecurity or justification). Whatever they gained — status, credit, position, admiration, control — they wear it openly. The world seems to validate their action. This chapter is for the reader to feel the injustice build.' },
  { name: 'The Overreach', act: 'Act 2A — Pressure', desc: 'The antagonist tries to operate in the space the protagonist secretly occupied. Show a specific, concrete scene where they attempt something the protagonist used to do — and it goes subtly wrong. They don\'t understand why things aren\'t working. First cracks — small, deniable, but visible to the reader. Include at least one secondary character noticing the failure.' },
  { name: 'The Quiet Move', act: 'Act 2A — Pressure', desc: 'The protagonist acts once. Precisely. Through whatever channel their hidden power operates (money, connections, knowledge, authority, skill). Show the move in detail — the preparation, the execution, the result. The reader sees the cause. The antagonist only sees the effect — and misreads it. This chapter should feel like watching a chess move from above.' },
  { name: 'The Wobble', act: 'Act 2A — Pressure', desc: 'The world begins to feel the protagonist\'s absence. Things that worked don\'t work. People who were comfortable aren\'t. Someone says the protagonist\'s name for the first time since the fall — not with respect yet, but with the beginning of doubt. End: the antagonist notices something is wrong but can\'t identify the source.' },
  { name: 'The Bleed', act: 'Act 2B — Shift', desc: 'Multiple things go wrong simultaneously. The antagonist\'s position weakens on several fronts. Someone beneath them starts questioning. The catalyst begins to look less like a hero and more like a liability. The comfortable people are no longer comfortable.' },
  { name: 'The Offer', act: 'Act 2B — Shift', desc: 'The antagonist or enabler reaches out to the protagonist. Not an apology — a transaction. Come back, help us, on our terms. The protagonist refuses. This isn\'t pride — the reader knows the protagonist is already past needing them. End: the antagonist is shaken by the refusal.' },
  { name: 'The Scope', act: 'Act 2B — Shift', desc: 'The reader sees the full picture for the first time. The protagonist\'s hidden power is revealed in its entirety — not to the antagonist, just to the reader. The scale of what\'s coming becomes clear. This is the chapter where the reader realizes the revenge isn\'t petty — it\'s structural.' },
  { name: 'The Freefall', act: 'Act 2B — Shift', desc: 'Everything unravels at once. The catalyst is exposed or abandoned. The enabler tries to distance themselves. The antagonist\'s support network collapses. End: the protagonist\'s name — or their hidden identity — surfaces in a way the antagonist can\'t ignore.' },
  { name: 'The Reveal', act: 'Act 3 — Rise', desc: 'The protagonist\'s true nature becomes known to the antagonist. Face to face. The reader has waited twelve chapters for this moment. It must be specific, visual, and earned. The antagonist understands, all at once, the scale of their mistake.' },
  { name: 'The Mirror', act: 'Act 3 — Rise', desc: 'The antagonist experiences a reflection of what they inflicted. Not identical — the protagonist isn\'t cruel in the same way — but the parallel is unmistakable. The catalyst faces consequences. The enabler faces their own cowardice. The power dynamic is fully inverted.' },
  { name: 'The Terms', act: 'Act 3 — Rise', desc: 'The protagonist holds all the power and chooses what to do with it. This is the character-defining moment — mercy, justice, or destruction. The choice reveals who the protagonist actually is beneath the mask. If there\'s a love interest, this is where the relationship pivots.' },
  { name: 'The Throne', act: 'Act 3 — Rise', desc: 'New equilibrium. Mirror of chapter 1 but inverted — the protagonist is visible where they were hidden, respected where they were dismissed. The world has reorganized around the truth. The last image should rhyme with the first. Something small, concrete, and resonant.' },
];

// ═══════════════════════════════════════════
// PROMPT BUILDERS (pure functions — no DOM)
// ═══════════════════════════════════════════

function buildBiblePrompt(tropes) {
  const { who, what, how, with: with_, tags } = tropes;

  const tropeDesc = [
    `WHO (hidden truth): ${TROPE_LABELS.who[who]}`,
    `WHAT (humiliation): ${TROPE_LABELS.what[what]}`,
    `HOW (revenge): ${TROPE_LABELS.how[how]}`,
    with_ ? `WITH (relationship): ${TROPE_LABELS.with[with_]}` : null,
    tags ? `SETTING/FLAVOR TAGS: ${tags}` : null,
  ].filter(Boolean).join('\n');

  const loveInterestBlock = with_
    ? `\n\nLOVE INTEREST\n- Name, role\n- Their connection to the conflict\n- What keeps them apart (obligation, faction, misunderstanding, history, pride)\n- What will bring them together`
    : '';

  // Collect existing titles so the model avoids repetition
  const existingTitles = (STATE.novels || [])
    .map(n => extractTitle(n.bible))
    .filter(Boolean);
  const titleAvoidance = existingTitles.length
    ? `\n\nEXISTING TITLES IN THIS CATALOG (choose a title that is distinct from all of these):\n${existingTitles.map(t => '- ' + t).join('\n')}`
    : '';

  const guardrails = getPrompt('guardrails');
  const systemBase = getPrompt('bible_system');
  const system = systemBase + '\n\n' + guardrails + titleAvoidance;

  const user = getPrompt('bible_user')
    .replace('{tropes}', tropeDesc)
    .replace('{love_interest_block}', loveInterestBlock);

  return { system, user };
}

function buildBeatsPrompt(bible) {
  const beatDescs = BEATS.map((b, i) =>
    `CHAPTER ${i + 1}: ${b.name} (${b.act})\n${b.desc}`
  ).join('\n\n');

  const system = getPrompt('beats_system');
  const user = getPrompt('beats_user')
    .replace('{bible}', bible)
    .replace('{beat_descriptions}', beatDescs);

  return { system, user };
}

function buildChapterPrompt(bible, beats, chapterNum, prevSummaries, prevChapterText, withTrope) {
  const currentBeat = parseBeatEntry(beats, chapterNum);
  const nextBeat = chapterNum < 15 ? parseBeatEntry(beats, chapterNum + 1) : '(Final chapter — no next beat. End with resolution, not a cliffhanger. The last image should rhyme with the first chapter\'s opening.)';

  const summaryBlock = prevSummaries.length
    ? `PREVIOUS CHAPTER SUMMARIES:\n${prevSummaries.map((s, i) => `Ch ${i + 1}: ${s}`).join('\n')}\n\n`
    : '';

  const prevBlock = prevChapterText
    ? `FULL TEXT OF PREVIOUS CHAPTER (match this prose style, rhythm, and vocabulary — maintain continuity of voice):\n${prevChapterText}\n\n`
    : '';

  const loveInterestNote = withTrope
    ? `\n- If the love interest appears in this chapter's beat, give them meaningful interaction with the protagonist — tension, attraction, conflict, or vulnerability. Don't just mention them in passing.`
    : '';

  const system = getPrompt('chapter_system');
  const user = getPrompt('chapter_user')
    .replace(/\{chapter_num\}/g, chapterNum)
    .replace('{bible}', bible)
    .replace('{current_beat}', currentBeat)
    .replace('{next_beat}', nextBeat)
    .replace('{summaries}', summaryBlock)
    .replace('{prev_chapter}', prevBlock)
    .replace('{love_interest_note}', loveInterestNote);

  return { system, user };
}

function buildSummaryPrompt(chapterText) {
  return {
    system: getPrompt('summary_system'),
    user: chapterText,
  };
}

function parseBeatEntry(beats, chapterNum) {
  const pattern = new RegExp(
    `CHAPTER\\s+${chapterNum}:([\\s\\S]*?)(?=CHAPTER\\s+${chapterNum + 1}:|$)`,
    'i'
  );
  const m = beats.match(pattern);
  return m ? m[0].trim() : `CHAPTER ${chapterNum}: (beat not found)`;
}

function extractTitle(bible) {
  if (!bible) return null;
  const m = bible.match(/Title:?\s*(.+)/i);
  return m ? m[1].trim() : null;
}

// ═══════════════════════════════════════════
// BIBLE GENERATION (browser UI wrapper)
// ═══════════════════════════════════════════
async function generateBible() {
  const who = document.getElementById('trope-who').value;
  const what = document.getElementById('trope-what').value;
  const how = document.getElementById('trope-how').value;
  const with_ = document.getElementById('trope-with').value;
  const tags = document.getElementById('trope-tags')?.value || '';

  if (!who || !what || !how) return;

  const btn = document.getElementById('btn-generate-bible');
  btn.disabled = true;
  btn.textContent = 'Generating...';

  try {
    const { system, user } = buildBiblePrompt({ who, what, how, with: with_, tags });

    // Retry up to 3 times if the bible is malformed (can't extract title)
    let bible = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await llmChat([
        { role: 'system', content: system },
        { role: 'user', content: user },
      ], { temperature: 0.9, max_tokens: 1200 });
      if (extractTitle(result)) {
        bible = result;
        break;
      }
      console.warn('Bible attempt %d: could not extract title, retrying...', attempt + 1);
    }
    if (!bible) throw new Error('Could not generate a valid bible after 3 attempts.');

    if (!STATE.currentNovel && STATE.currentNovel !== 0) {
      STATE.novels.push({
        tropes: { who, what, how, with: with_, tags },
        bible: null, beats: null, chapters: [], summaries: [],
        createdAt: Date.now(),
      });
      STATE.currentNovel = STATE.novels.length - 1;
    }
    STATE.novels[STATE.currentNovel].bible = bible;
    saveState();
    displayBible(bible);
    toggleWin('win-editorial');
    updateNovelCount();
    // Auto-generate marketing blurb + tags in background
    autoGenerateBlurb();
  } catch (e) {
    alert('Bible generation failed: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Generate Bible →';
  }
}

function displayBible(bible) {
  const pane = document.getElementById('ed-bible');
  const novel = STATE.novels[STATE.currentNovel];
  const coverHtml = novel?.cover
    ? `<img src="${novel.cover}" style="max-width:100%;max-height:250px;border-radius:4px;border:1px solid var(--border)">`
    : '';
  const coverBtn = canGenerateCovers()
    ? `<button class="btn" onclick="generateCover()" style="padding:4px 10px;font-size:10px" id="btn-gen-cover">🎨 ${novel?.coverIllustration ? 'Regenerate Illustration' : 'Generate Cover'}</button>`
    : '';
  const compositorHtml = (typeof renderCompositorPreview === 'function') ? renderCompositorPreview() : '';
  pane.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">Story Bible</span>
      <div style="display:flex;gap:6px">
        ${coverBtn}
        <button class="btn" onclick="regenerateBible()" style="padding:4px 10px;font-size:10px">↻ Regenerate</button>
        <button class="btn btn-primary" onclick="generateBeats()" style="padding:4px 10px;font-size:10px" id="btn-gen-beats">Generate Beat Sheet →</button>
      </div>
    </div>
    <div id="cover-preview" style="margin-bottom:8px">${coverHtml}</div>
    ${compositorHtml}
    <pre style="white-space:pre-wrap;word-break:break-word;margin-top:8px">${esc(bible)}</pre>`;
}

function regenerateBible() { generateBible(); }

// ═══════════════════════════════════════════
// BEAT SHEET GENERATION (browser UI wrapper)
// ═══════════════════════════════════════════
async function generateBeats() {
  const novel = STATE.novels[STATE.currentNovel];
  if (!novel || !novel.bible) return;

  const btn = document.getElementById('btn-gen-beats');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating...'; }

  try {
    const { system, user } = buildBeatsPrompt(novel.bible);
    const beats = await llmChat([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], { temperature: 0.8, max_tokens: 4096 });

    novel.beats = beats;
    saveState();
    displayBeats(beats);
    editorialTab('beats');
    document.getElementById('btn-gen-next').disabled = false;
    document.getElementById('btn-automate').disabled = false;
    awardSkull(0); // Skull 0: The Generator — bible + beats complete
  } catch (e) {
    alert('Beat sheet generation failed: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generate Beat Sheet →'; }
  }
}

function displayBeats(beats) {
  const pane = document.getElementById('ed-beats');
  pane.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">Beat Sheet — 15 Chapters</span>
      <button class="btn" onclick="generateBeats()" style="padding:4px 10px;font-size:10px">↻ Regenerate</button>
    </div>
    <pre style="white-space:pre-wrap;word-break:break-word">${esc(beats)}</pre>`;
}

// ═══════════════════════════════════════════
// CHAPTER GENERATION (browser UI wrapper)
// ═══════════════════════════════════════════
async function generateNextChapter() {
  const novel = STATE.novels[STATE.currentNovel];
  if (!novel || !novel.bible || !novel.beats) return;

  const chapterNum = novel.chapters.length + 1;
  if (chapterNum > 15) return;

  const btn = document.getElementById('btn-gen-next');
  btn.disabled = true;
  btn.textContent = `Generating Ch ${chapterNum}...`;

  const pips = document.querySelectorAll('#factory-progress .factory-pip');
  if (pips[chapterNum - 1]) pips[chapterNum - 1].classList.add('active');

  const stream = document.getElementById('factory-stream');
  stream.innerHTML = `<span style="color:var(--amber)">Generating chapter ${chapterNum}/15...</span>\n`;

  try {
    const { system, user } = buildChapterPrompt(
      novel.bible, novel.beats, chapterNum,
      novel.summaries,
      novel.chapters.length > 0 ? novel.chapters[novel.chapters.length - 1].text : '',
      novel.tropes.with
    );

    // Retry if chapter is too short (likely truncated response)
    let text = null, wordCount = 0;
    const MIN_WORDS = 400;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await llmChat([
        { role: 'system', content: system },
        { role: 'user', content: user },
      ], { temperature: 0.85, max_tokens: 4096 });
      const wc = result.split(/\s+/).filter(Boolean).length;
      if (wc >= MIN_WORDS) {
        text = result; wordCount = wc;
        break;
      }
      console.warn(`Chapter ${chapterNum} attempt ${attempt + 1}: only ${wc} words, retrying...`);
    }
    if (!text) throw new Error(`Chapter ${chapterNum} generated too short after 3 attempts`);

    const sumPrompt = buildSummaryPrompt(text);
    const summary = await llmChat([
      { role: 'system', content: sumPrompt.system },
      { role: 'user', content: sumPrompt.user },
    ], { temperature: 0.3, max_tokens: 100 });

    novel.chapters.push({ number: chapterNum, text, word_count: wordCount });
    novel.summaries.push(summary.trim());
    saveState();

    if (pips[chapterNum - 1]) {
      pips[chapterNum - 1].classList.remove('active');
      pips[chapterNum - 1].classList.add('done');
    }
    document.getElementById('fact-ch-count').textContent = novel.chapters.length;
    document.getElementById('fact-word-count').textContent =
      novel.chapters.reduce((sum, ch) => sum + ch.word_count, 0).toLocaleString();
    stream.innerHTML = esc(text);

    if (novel.chapters.length >= 15) {
      btn.textContent = 'All 15 chapters complete';
      btn.disabled = true;
      document.getElementById('btn-automate').disabled = true;
      awardSkull(1);
    } else {
      btn.textContent = 'Generate Next Chapter';
      btn.disabled = false;
    }
  } catch (e) {
    if (pips[chapterNum - 1]) {
      pips[chapterNum - 1].classList.remove('active');
      pips[chapterNum - 1].classList.add('error');
    }
    stream.innerHTML += `\n<span style="color:var(--red)">Error: ${esc(e.message)}</span>`;
    btn.textContent = 'Retry Chapter';
    btn.disabled = false;
  }
}

// ─── The Big Red Button ───
let automating = false;
async function automateAll() {
  if (automating) return;
  automating = true;
  const btn = document.getElementById('btn-automate');
  btn.textContent = '⚠ RUNNING...';
  btn.disabled = true;
  document.getElementById('btn-gen-next').disabled = true;
  const novel = STATE.novels[STATE.currentNovel];
  for (let ch = novel.chapters.length + 1; ch <= 15; ch++) {
    try { await generateNextChapter(); } catch (e) { break; }
  }
  automating = false;
  if (novel.chapters.length < 15) {
    btn.textContent = '⚠ Automate Everything';
    btn.disabled = false;
    document.getElementById('btn-gen-next').disabled = false;
  }
}

// ═══════════════════════════════════════════
// SKULL AWARDS
// ═══════════════════════════════════════════
function awardSkull(index) {
  if (STATE.skulls[index]) return;
  STATE.skulls[index] = true;
  saveState();
  updateSkulls();
  const el = document.getElementById('skull-' + index);
  if (el) { el.style.transform = 'scale(1.5)'; setTimeout(() => el.style.transform = '', 400); }
}

// ═══════════════════════════════════════════
// LIBRARY
// ═══════════════════════════════════════════
function updateNovelCount() {
  const pill = document.getElementById('sp-novels');
  const count = document.getElementById('novel-count');
  if (STATE.novels.length > 0) {
    pill.style.display = '';
    count.textContent = STATE.novels.length;
  }
  if (STATE.novels.length >= 3) awardSkull(3); // Skull 3: The Catalog — 3+ novels
}

function renderLibrary() {
  const grid = document.getElementById('library-grid');
  if (!STATE.novels.length) {
    grid.innerHTML = '<div style="color:var(--text-faint);padding:40px;text-align:center;font-size:11px;grid-column:1/-1">No novels in your library yet.</div>';
    return;
  }

  let html = '';

  // Top toolbar: count, curate button, load pack button
  const canCurate = STATE.providerReady && STATE.novels.filter(n => n.chapters.length > 0).length >= 2;
  const preGenCount = STATE.novels.filter(n => n.preGen).length;
  const userCount = STATE.novels.length - preGenCount;
  const countLabel = preGenCount
    ? `${STATE.novels.length} novels${userCount ? ` (${userCount} yours, ${preGenCount} pre-gen)` : ' (all pre-generated)'}`
    : `${STATE.novels.length} novel${STATE.novels.length !== 1 ? 's' : ''}`;
  html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;grid-column:1/-1;gap:8px;flex-wrap:wrap">
    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">${countLabel}</span>
    <div style="display:flex;gap:6px">
      <button class="btn" onclick="showPackLoader()" style="padding:4px 10px;font-size:10px">📦 Load Pack</button>
      ${canCurate ? `<button class="btn" id="btn-curate" onclick="curateCatalog()" style="padding:4px 10px;font-size:10px">${STATE.curation ? '✨ Re-curate' : '✨ Curate Catalog'}</button>` : ''}
    </div>
  </div>`;

  // If we have curation, show sections
  if (STATE.curation && STATE.curation.sections && STATE.curation.sections.length) {
    // Featured pick
    if (STATE.curation.featured) {
      const featIdx = STATE.novels.findIndex(n => extractTitle(n.bible) === STATE.curation.featured);
      if (featIdx >= 0) {
        const novel = STATE.novels[featIdx];
        const coverImg = novel.cover
          ? `<img src="${novel.cover}" style="width:80px;height:120px;object-fit:cover;border-radius:4px">`
          : '';
        html += `<div style="grid-column:1/-1;padding:12px;background:var(--amber-dim);border:1px solid rgba(212,160,23,0.2);border-radius:8px;margin-bottom:12px;display:flex;gap:12px;cursor:pointer" onclick="selectNovel(${featIdx})">
          ${coverImg}
          <div>
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--amber);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Featured</div>
            <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:4px">${esc(STATE.curation.featured)}</div>
            <div style="font-size:11px;color:var(--text-dim);line-height:1.5">${esc(STATE.curation.featuredNote || '')}</div>
          </div>
        </div>`;
      }
    }

    // Themed sections
    for (const section of STATE.curation.sections) {
      html += `<div style="grid-column:1/-1;margin-bottom:4px;margin-top:8px">
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:600;color:var(--text);margin-bottom:2px">${esc(section.name)}</div>
        <div style="font-size:10px;color:var(--text-dim);margin-bottom:8px">${esc(section.tagline)}</div>
      </div>`;
      // Find matching novels
      for (const novelTitle of section.novels) {
        const idx = STATE.novels.findIndex(n => {
          const t = extractTitle(n.bible);
          return t && (t === novelTitle || t.includes(novelTitle) || novelTitle.includes(t));
        });
        if (idx >= 0) html += renderNovelCard(idx);
      }
    }
  } else {
    // Flat grid — no curation
    STATE.novels.forEach((_, i) => { html += renderNovelCard(i); });
  }

  grid.innerHTML = html;
}

function renderNovelCard(i) {
  const novel = STATE.novels[i];
  const title = extractTitle(novel.bible) || `Novel #${i + 1}`;
  const chCount = novel.chapters.length;
  const words = novel.chapters.reduce((s, c) => s + c.word_count, 0);
  const selected = i === STATE.currentNovel;
  const coverImg = novel.cover
    ? `<img src="${novel.cover}" style="width:100%;height:100%;object-fit:cover">`
    : '📖';
  const blurb = novel.blurb
    ? `<div style="font-size:9px;color:var(--text-dim);margin-top:4px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(novel.blurb)}</div>`
    : '';
  const tags = (novel.genre_tags || []).slice(0, 2).map(t =>
    `<span style="font-size:8px;padding:1px 4px;border-radius:2px;background:var(--amber-dim);color:var(--amber)">${esc(t)}</span>`
  ).join(' ');
  return `<div class="novel-card${selected ? ' selected' : ''}" onclick="selectNovel(${i})" style="${selected ? 'border-color:var(--amber)' : ''}">
    <div class="nc-cover">${coverImg}</div>
    <div class="nc-info">
      <div class="nc-title">${esc(title)}</div>
      <div class="nc-meta">${chCount}/15 ch · ${words.toLocaleString()} words</div>
      ${tags ? `<div style="margin-top:3px">${tags}</div>` : ''}
      ${blurb}
    </div>
  </div>`;
}

function selectNovel(index) {
  STATE.currentNovel = index;
  saveState();
  renderLibrary();
  const novel = STATE.novels[index];
  if (novel.bible) displayBible(novel.bible);
  if (novel.beats) displayBeats(novel.beats);
  updateFactoryUI(novel);
  renderPhoneReader(novel);
}

function updateFactoryUI(novel) {
  const pips = document.querySelectorAll('#factory-progress .factory-pip');
  pips.forEach((pip, i) => {
    pip.className = 'factory-pip';
    if (i < novel.chapters.length) pip.classList.add('done');
  });
  document.getElementById('fact-ch-count').textContent = novel.chapters.length;
  document.getElementById('fact-word-count').textContent =
    novel.chapters.reduce((s, c) => s + c.word_count, 0).toLocaleString();
  const btn = document.getElementById('btn-gen-next');
  if (novel.chapters.length >= 15) {
    btn.textContent = 'All 15 chapters complete';
    btn.disabled = true;
  } else {
    btn.textContent = 'Generate Next Chapter';
    btn.disabled = !novel.beats;
  }
  document.getElementById('btn-automate').disabled = !novel.beats || novel.chapters.length >= 15;
  if (novel.chapters.length > 0) {
    document.getElementById('factory-stream').innerHTML =
      esc(novel.chapters[novel.chapters.length - 1].text);
  }
}

// ═══════════════════════════════════════════
// PHONE READER
// ═══════════════════════════════════════════
let phoneChapter = 0;

let _phoneBlobUrl = null;

function renderPhoneReader(novel) {
  const container = document.getElementById('phone-content');
  if (!container) return;
  if (!novel || !novel.chapters.length) {
    container.innerHTML = '<div class="phone-empty"><div class="icon">📖</div><div class="msg">No novel loaded.<br>Select one from the Library.</div></div>';
    return;
  }
  awardSkull(2);

  // Pass the FULL library to the preview — it's a real storefront, not a single-novel viewer
  const eligibleNovels = STATE.novels.filter(n => n.chapters && n.chapters.length > 0);
  const fullCatalog = eligibleNovels.map(n => ({
    title: extractTitle(n.bible) || 'Untitled',
    pitch: n.blurb || (n.bible?.match(/Pitch:\s*(.+)/i)?.[1] || ''),
    blurb: n.blurb || '',
    genre_tags: n.genre_tags || [],
    comparable: n.comparable || '',
    cover: n.cover || null,
    word_count: n.chapters.reduce((s, c) => s + c.word_count, 0),
    chapters: n.chapters.map(ch => ({
      number: ch.number,
      title: ch.title || '', // empty → reader shows just "Chapter N"
      text: ch.text,
      word_count: ch.word_count,
    })),
  }));

  // Find the index of the currently selected novel in the catalog
  const initialIndex = eligibleNovels.indexOf(novel);

  const storeName = fullCatalog.length === 1 ? fullCatalog[0].title : 'NaNoGEon Library';
  const settingsCss = typeof buildReaderSettingsCss === 'function' ? buildReaderSettingsCss() : '';
  const readerHtml = READER_TEMPLATE
    .replace(/__READER_TITLE__/g, esc(storeName))
    .replace('__CATALOG_JSON__', JSON.stringify(fullCatalog))
    .replace('__INITIAL_NOVEL__', initialIndex >= 0 ? String(initialIndex) : 'null')
    .replace('/* __READER_SETTINGS_CSS__ */', settingsCss);

  // Revoke old blob URL to avoid memory leaks
  if (_phoneBlobUrl) URL.revokeObjectURL(_phoneBlobUrl);
  const blob = new Blob([readerHtml], { type: 'text/html' });
  _phoneBlobUrl = URL.createObjectURL(blob);
  container.innerHTML = `<iframe class="phone-iframe" src="${_phoneBlobUrl}"></iframe>`;
}

function phoneNav() {} // no-op — iframe handles navigation

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════
function esc(s) {
  if (!s) return '';
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
