#!/usr/bin/env node
// Generate the core pre-generated library using the EXACT same pipeline as the browser.
// Saves each novel to base_library/NN-slug/ with all artifacts and pipeline log.
// Usage: node generate-library.js [start] [end]
//   start/end are 1-indexed novel numbers (default: all 15)

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ─── Load pipeline code (same as browser) ───
const promptsCode = fs.readFileSync(path.join(__dirname, 'src', 'prompts.js'), 'utf-8');
const pipelineCode = fs.readFileSync(path.join(__dirname, 'src', 'pipeline.js'), 'utf-8');
const ctx = vm.createContext({
  console, setTimeout,
  document: { getElementById: () => ({ value: '', selectedOptions: [{ text: '' }] }) },
  STATE: { skulls: [], prompts: {} },
  saveState: () => {},
});
vm.runInContext(promptsCode, ctx);
vm.runInContext(pipelineCode, ctx);
vm.runInContext(`
  this._TROPE_LABELS = TROPE_LABELS;
  this._BEATS = BEATS;
  this._DEFAULT_PROMPTS = DEFAULT_PROMPTS;
`, ctx);

// ─── Config ───
const SECRETS = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, 'SECRETS'), 'utf-8')
    .trim().split('\n').map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

const PROVIDER = {
  baseUrl: 'https://nano-gpt.com/api/v1',
  apiKey: SECRETS.NANOGPT_KEY,
  textModel: 'mistralai/mistral-small-4-119b-2603',
  imageModel: 'qwen-image',
};

// ─── The 15 recommended combos from the spec ───
const COMBOS = [
  { who: 'secret-heir',       what: 'public-accusation', how: 'reveal-identity',       with: 'contract-marriage' },
  { who: 'hidden-master',     what: 'cast-out',          how: 'let-them-fail',          with: 'enemy-to-lover' },
  { who: 'disguised-royalty',  what: 'betrayal',          how: 'take-theirs',            with: 'forbidden-connection' },
  { who: 'returned-exile',    what: 'stolen-credit',     how: 'someone-better',         with: 'ex-returns' },
  { who: 'retired-legend',    what: 'public-accusation', how: 'reveal-identity',        with: 'childhood-promise' },
  { who: 'secret-benefactor', what: 'framed',            how: 'withdraw-support',       with: 'fake-dating' },
  { who: 'secret-heir',       what: 'wedding-ruined',    how: 'withdraw-support',       with: 'enemy-to-lover' },
  { who: 'hidden-master',     what: 'wedding-ruined',    how: 'systematic-dismantling', with: 'enemy-to-lover' },
  { who: 'disguised-royalty',  what: 'cast-out',          how: 'reveal-identity',        with: 'contract-marriage' },
  { who: 'returned-exile',    what: 'betrayal',          how: 'let-them-fail',          with: 'childhood-promise' },
  { who: 'secret-heir',       what: 'framed',            how: 'take-theirs',            with: null },  // no romance
  { who: 'retired-legend',    what: 'stolen-credit',     how: 'reveal-identity',        with: 'forbidden-connection' },
  { who: 'hidden-master',     what: 'public-accusation', how: 'systematic-dismantling', with: 'fake-dating' },
  { who: 'secret-benefactor', what: 'wedding-ruined',    how: 'withdraw-support',       with: 'ex-returns' },
  { who: 'disguised-royalty',  what: 'framed',            how: 'systematic-dismantling', with: 'forbidden-connection' },
];

// ─── LLM call with retry ───
let totalCalls = 0;
const callLog = [];

async function llmChat(messages, opts = {}) {
  const maxRetries = 10;
  const model = opts.model || PROVIDER.textModel;
  const startTime = Date.now();
  let retries = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let res;
    try {
      res = await fetch(PROVIDER.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + PROVIDER.apiKey,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts.temperature ?? 0.8,
          max_tokens: opts.max_tokens ?? 4096,
        }),
        signal: AbortSignal.timeout(300000),
      });
    } catch (e) {
      retries++;
      console.log('      ⚠ Network error, retrying in 5s...');
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    if (res.status >= 500) {
      retries++;
      console.log('      ⚠ Server error %d, retrying in 5s...', res.status);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    if (res.status === 429) {
      retries++;
      const body = await res.text();
      const wait = parseFloat(body.match(/try again in ([\d.]+)s/)?.[1] || '10');
      console.log('      ⏳ Rate limited, waiting %ds...', Math.ceil(wait));
      await new Promise(r => setTimeout(r, (wait + 1) * 1000));
      continue;
    }
    if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);

    const data = await res.json();
    const content = data.choices[0].message.content;
    totalCalls++;

    callLog.push({
      label: opts.label || `call-${totalCalls}`,
      model,
      elapsed_ms: Date.now() - startTime,
      retries,
      input_tokens: data.usage?.prompt_tokens || null,
      output_tokens: data.usage?.completion_tokens || null,
      messages,
      response_content: content,
    });

    return content;
  }
  throw new Error('Max retries exceeded');
}

// ─── Cover generation ───
async function generateCover(bible) {
  const pitch = bible.match(/Pitch:\s*(.+)/i)?.[1] || '';
  const setting = bible.match(/Setting:\s*(.+)/i)?.[1] || '';
  const protag = bible.match(/Public face:\s*(.+)/i)?.[1] || '';

  const prompt = ctx._DEFAULT_PROMPTS.cover_prompt
    .replace('{pitch}', pitch)
    .replace('{setting}', setting)
    .replace('{protagonist}', protag ? 'The main character: ' + protag + '.' : '');

  const res = await fetch('https://nano-gpt.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': PROVIDER.apiKey },
    body: JSON.stringify({ model: PROVIDER.imageModel, prompt, n: 1, size: '512x768', response_format: 'b64_json' }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Image error ${res.status}`);
  const data = await res.json();
  return data.data?.[0]?.b64_json || null;
}

// ─── Blurb generation ───
async function generateBlurb(bible) {
  const system = ctx._DEFAULT_PROMPTS.blurb_system;
  const user = ctx._DEFAULT_PROMPTS.blurb_user.replace('{bible}', bible);
  return await llmChat([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ], { temperature: 0.85, max_tokens: 300, label: 'blurb' });
}

// ─── Trope display name ───
function tropeName(key, cat) {
  const label = ctx._TROPE_LABELS[cat]?.[key];
  return label ? label.split('—')[0].trim() : key || '(none)';
}

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

// ─── Generate one novel ───
async function generateNovel(combo, index) {
  const tropeDisplay = `${tropeName(combo.who,'who')} + ${tropeName(combo.what,'what')} + ${tropeName(combo.how,'how')} + ${tropeName(combo.with,'with')}`;
  console.log('\n══════════════════════════════════════');
  console.log('Novel %d/15: %s', index, tropeDisplay);
  console.log('══════════════════════════════════════');

  // Reset call log for this novel
  callLog.length = 0;
  const t0 = Date.now();

  const tropes = { ...combo, tags: '' };

  // 1. Bible (retry if title can't be extracted)
  console.log('  ▸ Bible...');
  const biblePrompt = ctx.buildBiblePrompt(tropes);
  let bible = null, title = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const result = await llmChat([
      { role: 'system', content: biblePrompt.system },
      { role: 'user', content: biblePrompt.user },
    ], { temperature: 0.9, max_tokens: 1200, label: 'bible' });
    title = ctx.extractTitle(result);
    if (title) { bible = result; break; }
    console.log('    ⚠ Could not extract title, retrying...');
  }
  if (!bible) throw new Error('Failed to generate valid bible after 3 attempts');
  console.log('    ✓ "%s" (%d chars)', title, bible.length);

  // 2. Blurb
  console.log('  ▸ Blurb...');
  const blurbRaw = await generateBlurb(bible);
  const blurbMatch = blurbRaw.match(/BLURB:\s*(.+?)(?=\nTAGS:|\n\n|$)/is);
  const tagsMatch = blurbRaw.match(/TAGS:\s*(.+?)(?=\nCOMPARABLE:|\n\n|$)/is);
  const compMatch = blurbRaw.match(/COMPARABLE:\s*(.+?)$/is);
  const blurb = blurbMatch ? blurbMatch[1].trim() : blurbRaw.trim();
  const genre_tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [];
  const comparable = compMatch ? compMatch[1].trim() : '';
  console.log('    ✓ Tags: %s', genre_tags.join(', '));

  // 3. Beat sheet
  console.log('  ▸ Beats...');
  const beatsPrompt = ctx.buildBeatsPrompt(bible);
  const beats = await llmChat([
    { role: 'system', content: beatsPrompt.system },
    { role: 'user', content: beatsPrompt.user },
  ], { temperature: 0.8, max_tokens: 4096, label: 'beats' });
  console.log('    ✓ Beat sheet (%d chars)', beats.length);

  // 4. Chapters
  const chapters = [];
  const summaries = [];
  for (let ch = 1; ch <= 15; ch++) {
    process.stdout.write(`  ▸ Chapter ${ch}/15...`);
    const chPrompt = ctx.buildChapterPrompt(bible, beats, ch, summaries,
      chapters.length > 0 ? chapters[chapters.length - 1] : '', combo.with);

    // Retry if too short (truncated response)
    let text = null, words = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await llmChat([
        { role: 'system', content: chPrompt.system },
        { role: 'user', content: chPrompt.user },
      ], { temperature: 0.85, max_tokens: 4096, label: `chapter-${ch}${attempt?'-retry'+attempt:''}` });
      const wc = result.split(/\s+/).filter(Boolean).length;
      if (wc >= 400) { text = result; words = wc; break; }
      process.stdout.write(` [${wc}w, retry]`);
    }
    if (!text) { console.log(' FAILED after 3 attempts'); throw new Error(`Chapter ${ch} too short`); }

    chapters.push(text);

    const sumPrompt = ctx.buildSummaryPrompt(text);
    const summary = await llmChat([
      { role: 'system', content: sumPrompt.system },
      { role: 'user', content: sumPrompt.user },
    ], { temperature: 0.3, max_tokens: 100, label: `summary-${ch}` });
    summaries.push(summary.trim());

    console.log(' %d words', words);
  }

  const totalWords = chapters.reduce((s, c) => s + c.split(/\s+/).length, 0);
  const elapsed = Date.now() - t0;

  // 5. Cover
  console.log('  ▸ Cover...');
  let coverB64 = null;
  try {
    coverB64 = await generateCover(bible);
    console.log('    ✓ Cover generated');
  } catch (e) {
    console.log('    ⚠ Cover failed: %s', e.message);
  }

  // 6. Save to base_library/
  const slug = slugify(title);
  const dir = path.join(__dirname, 'base_library', `${String(index).padStart(2, '0')}-${slug}`);
  fs.mkdirSync(dir, { recursive: true });

  // novel.json — what the reader needs
  const novelData = {
    title,
    blurb,
    genre_tags,
    comparable,
    tropes: combo,
    cover: coverB64 ? `data:image/png;base64,${coverB64}` : null,
    word_count: totalWords,
    chapters: chapters.map((text, i) => ({
      number: i + 1,
      title: text.split('\n')[0].replace(/^Chapter\s+\d+:\s*/i, '').trim(),
      text,
      word_count: text.split(/\s+/).length,
    })),
  };
  fs.writeFileSync(path.join(dir, 'novel.json'), JSON.stringify(novelData, null, 2));

  // artifacts.json — bible, beats, summaries, tropes
  fs.writeFileSync(path.join(dir, 'artifacts.json'), JSON.stringify({
    bible, beats, summaries, tropes: combo, tropeDisplay,
  }, null, 2));

  // pipeline-log.json — full prompt/response pairs
  fs.writeFileSync(path.join(dir, 'pipeline-log.json'), JSON.stringify({
    stats: {
      title, tropeDisplay,
      model: PROVIDER.textModel,
      imageModel: PROVIDER.imageModel,
      total_calls: callLog.length,
      total_words: totalWords,
      elapsed_ms: elapsed,
      elapsed_human: `${Math.floor(elapsed/60000)}m ${Math.round((elapsed%60000)/1000)}s`,
      words_per_chapter: chapters.map(c => c.split(/\s+/).length),
    },
    calls: callLog.map(c => ({ ...c })),
  }, null, 2));

  // cover as separate file too
  if (coverB64) {
    fs.writeFileSync(path.join(dir, 'cover.png'), Buffer.from(coverB64, 'base64'));
  }

  console.log('  ══ Done: "%s" — %d chapters, %s words, %s',
    title, 15, totalWords.toLocaleString(),
    `${Math.floor(elapsed/60000)}m ${Math.round((elapsed%60000)/1000)}s`);

  return { title, totalWords, elapsed };
}

// ─── Main ───
async function main() {
  const startIdx = parseInt(process.argv[2]) || 1;
  const endIdx = parseInt(process.argv[3]) || 15;

  console.log('═══════════════════════════════════════════');
  console.log('NaNoGEon Library Generator');
  console.log('Provider: NanoGPT / %s', PROVIDER.textModel);
  console.log('Generating novels %d through %d', startIdx, endIdx);
  console.log('═══════════════════════════════════════════');

  const results = [];
  const t0 = Date.now();

  for (let i = startIdx; i <= endIdx; i++) {
    try {
      const r = await generateNovel(COMBOS[i - 1], i);
      results.push(r);
    } catch (e) {
      console.error('\n  ✗ Novel %d failed: %s', i, e.message);
      console.error('  Continuing with next novel...\n');
    }
  }

  const totalElapsed = Date.now() - t0;
  console.log('\n═══════════════════════════════════════════');
  console.log('COMPLETE');
  console.log('Novels generated: %d/%d', results.length, endIdx - startIdx + 1);
  console.log('Total words: %s', results.reduce((s, r) => s + r.totalWords, 0).toLocaleString());
  console.log('Total time: %dm %ds',
    Math.floor(totalElapsed / 60000), Math.round((totalElapsed % 60000) / 1000));
  console.log('Output: base_library/');
  console.log('═══════════════════════════════════════════');
}

main().catch(e => { console.error('Generator failed:', e); process.exit(1); });
