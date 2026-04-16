#!/usr/bin/env node
// End-to-end pipeline test using the SAME prompt code as the browser.
// Randomizes tropes, counts all API calls, logs full requests/responses (minus keys).
// Usage: node test-pipeline.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ─── Load prompts.js + pipeline.js into a context with minimal stubs ───
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
// Extract const values from context (const isn't enumerable on the proxy)
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

const USE_PROVIDER = 'nanogpt-mistral';

const PROVIDERS = {
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: SECRETS.GROQ_KEY,
    model: 'llama-3.3-70b-versatile',
    summaryModel: 'llama-3.1-8b-instant',
  },
  nanogpt: {
    baseUrl: 'https://nano-gpt.com/api/v1',
    apiKey: SECRETS.NANOGPT_KEY,
    model: 'deepseek-chat',
    summaryModel: 'deepseek-chat',
  },
  'nanogpt-mistral': {
    baseUrl: 'https://nano-gpt.com/api/v1',
    apiKey: SECRETS.NANOGPT_KEY,
    model: 'mistralai/mistral-small-4-119b-2603',
    summaryModel: 'mistralai/mistral-small-4-119b-2603',
  },
};

const PROVIDER = PROVIDERS[USE_PROVIDER];

// ─── Call tracking ───
const callLog = [];
let callCount = 0;

async function llmChat(messages, opts = {}) {
  const callId = ++callCount;
  const model = opts.model || PROVIDER.model;
  const startTime = Date.now();
  const maxRetries = 10;
  let retries = 0;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let res;
    try {
      const body = {
        model,
        messages,
        temperature: opts.temperature ?? 0.8,
        max_tokens: opts.max_tokens ?? 4096,
      };
      res = await fetch(PROVIDER.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + PROVIDER.apiKey,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(300000),
      });
    } catch (e) {
      retries++;
      console.log('    ⚠ Network error (%s), retrying in 5s...', e.cause?.code || e.message);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    if (res.status >= 500) {
      retries++;
      console.log('    ⚠ Server error %d, retrying in 5s...', res.status);
      await new Promise(r => setTimeout(r, 5000));
      continue;
    }
    if (res.status === 429) {
      retries++;
      const body = await res.text();
      const wait = parseFloat(body.match(/try again in ([\d.]+)s/)?.[1] || '10');
      console.log('    ⏳ Rate limited, waiting %ds...', Math.ceil(wait));
      await new Promise(r => setTimeout(r, (wait + 1) * 1000));
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`LLM error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const elapsed = Date.now() - startTime;
    const content = data.choices[0].message.content;
    const usage = data.usage || {};

    callLog.push({
      id: callId,
      label: opts.label || `call-${callId}`,
      model,
      elapsed_ms: elapsed,
      retries,
      input_tokens: usage.prompt_tokens || null,
      output_tokens: usage.completion_tokens || null,
      total_tokens: usage.total_tokens || null,
      messages,
      response_content: content,
    });

    return content;
  }
  throw new Error('Max retries exceeded');
}

// ─── Randomize tropes ───
function pickRandom(obj) {
  const keys = Object.keys(obj);
  return keys[Math.floor(Math.random() * keys.length)];
}

function randomizeTropes() {
  return {
    who: pickRandom(ctx._TROPE_LABELS.who),
    what: pickRandom(ctx._TROPE_LABELS.what),
    how: pickRandom(ctx._TROPE_LABELS.how),
    with: pickRandom(ctx._TROPE_LABELS.with),
    tags: '',
  };
}

function tropeName(key, category) {
  const label = ctx._TROPE_LABELS[category][key];
  return label ? label.split('—')[0].trim() : key;
}

// ─── Cover generation (reuses NanoGPT image API) ───
async function generateCoverImage(bible) {
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
    body: JSON.stringify({ model: 'qwen-image', prompt, n: 1, size: '512x768', response_format: 'b64_json' }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Image API error ${res.status}`);
  const data = await res.json();
  return data.data?.[0]?.b64_json || null;
}

// ─── Pipeline ───
async function run(tag) {
  const tropes = randomizeTropes();
  const tropeDisplay = `${tropeName(tropes.who,'who')} + ${tropeName(tropes.what,'what')} + ${tropeName(tropes.how,'how')} + ${tropeName(tropes.with,'with')}`;

  // Reset call tracking for this novel
  callLog.length = 0;
  callCount = 0;

  console.log('=== NaNoGEon Novel: %s ===', tag);
  console.log('Provider: %s / %s', USE_PROVIDER, PROVIDER.model);
  console.log('Tropes: %s\n', tropeDisplay);

  const t0 = Date.now();

  // 1. Bible
  console.log('▸ Generating bible...');
  const biblePrompt = ctx.buildBiblePrompt(tropes);
  const bible = await llmChat([
    { role: 'system', content: biblePrompt.system },
    { role: 'user', content: biblePrompt.user },
  ], { temperature: 0.9, max_tokens: 800, label: 'bible' });
  console.log('  ✓ Bible generated (%d chars)\n', bible.length);

  // 2. Beat sheet
  console.log('▸ Generating beat sheet...');
  const beatsPrompt = ctx.buildBeatsPrompt(bible);
  const beats = await llmChat([
    { role: 'system', content: beatsPrompt.system },
    { role: 'user', content: beatsPrompt.user },
  ], { temperature: 0.8, max_tokens: 2500, label: 'beats' });
  console.log('  ✓ Beat sheet generated (%d chars)\n', beats.length);

  // 3. Chapters
  const chapters = [];
  const summaries = [];

  for (let ch = 1; ch <= 15; ch++) {
    console.log(`▸ Generating chapter ${ch}/15...`);

    const chPrompt = ctx.buildChapterPrompt(
      bible, beats, ch, summaries,
      chapters.length > 0 ? chapters[chapters.length - 1] : '',
      tropes.with
    );
    const text = await llmChat([
      { role: 'system', content: chPrompt.system },
      { role: 'user', content: chPrompt.user },
    ], { temperature: 0.85, max_tokens: 2000, label: `chapter-${ch}` });

    chapters.push(text);
    const words = text.split(/\s+/).length;
    console.log('  ✓ Chapter %d: %d words', ch, words);

    const sumPrompt = ctx.buildSummaryPrompt(text);
    const summary = await llmChat([
      { role: 'system', content: sumPrompt.system },
      { role: 'user', content: sumPrompt.user },
    ], { temperature: 0.3, max_tokens: 60, model: PROVIDER.summaryModel, label: `summary-${ch}` });
    summaries.push(summary.trim());
  }

  const totalElapsed = Date.now() - t0;

  // 4. Stats
  const totalWords = chapters.reduce((s, c) => s + c.split(/\s+/).length, 0);
  const title = ctx.extractTitle(bible) || 'Untitled Novel';
  const totalInputTokens = callLog.reduce((s, c) => s + (c.input_tokens || 0), 0);
  const totalOutputTokens = callLog.reduce((s, c) => s + (c.output_tokens || 0), 0);
  const totalRetries = callLog.reduce((s, c) => s + c.retries, 0);

  const stats = {
    title,
    tropes: tropeDisplay,
    trope_keys: tropes,
    provider: USE_PROVIDER,
    model: PROVIDER.model,
    summary_model: PROVIDER.summaryModel,
    total_calls: callLog.length,
    total_retries: totalRetries,
    total_elapsed_ms: totalElapsed,
    total_elapsed_human: `${Math.floor(totalElapsed/60000)}m ${Math.round((totalElapsed%60000)/1000)}s`,
    total_input_tokens: totalInputTokens,
    total_output_tokens: totalOutputTokens,
    total_tokens: totalInputTokens + totalOutputTokens,
    chapters: 15,
    total_words: totalWords,
    words_per_chapter: chapters.map(c => c.split(/\s+/).length),
    call_breakdown: callLog.map(c => ({
      label: c.label,
      model: c.model,
      elapsed_ms: c.elapsed_ms,
      retries: c.retries,
      input_tokens: c.input_tokens,
      output_tokens: c.output_tokens,
    })),
  };

  console.log('\n=== Results ===');
  console.log('Title: %s', title);
  console.log('Tropes: %s', tropeDisplay);
  console.log('Chapters: %d, Words: %s', 15, totalWords.toLocaleString());
  console.log('API calls: %d (%d retries)', callLog.length, totalRetries);
  console.log('Tokens: %s in + %s out = %s total',
    totalInputTokens.toLocaleString(), totalOutputTokens.toLocaleString(),
    (totalInputTokens + totalOutputTokens).toLocaleString());
  console.log('Time: %s', stats.total_elapsed_human);
  console.log('Words/chapter: %s', stats.words_per_chapter.join(', '));

  // 5. Cover
  let coverFile = null;
  if (PROVIDER.apiKey) {
    console.log('\n▸ Generating cover illustration...');
    try {
      const coverB64 = await generateCoverImage(bible);
      if (coverB64) {
        coverFile = `novel-${tag}-cover.png`;
        fs.writeFileSync(path.join(__dirname, coverFile), Buffer.from(coverB64, 'base64'));
        console.log('  ✓ Cover saved: %s', coverFile);
      }
    } catch (e) {
      console.log('  ⚠ Cover failed: %s', e.message);
    }
  }

  // 6. Write outputs
  let md = `# ${title}\n\n`;
  md += `*Generated by NaNoGEon*\n`;
  md += `*Provider: ${USE_PROVIDER} / ${PROVIDER.model}*\n\n`;
  md += `**Tropes:** ${tropeDisplay}\n\n`;
  md += `**Words:** ${totalWords.toLocaleString()} | **Calls:** ${callLog.length} | **Time:** ${stats.total_elapsed_human}\n\n`;
  if (coverFile) md += `**Cover:** ![cover](${coverFile})\n\n`;
  md += `---\n\n`;
  md += `## Story Bible\n\n\`\`\`\n${bible}\n\`\`\`\n\n`;
  md += `## Beat Sheet\n\n\`\`\`\n${beats}\n\`\`\`\n\n`;
  md += `---\n\n`;
  chapters.forEach(ch => { md += ch + '\n\n---\n\n'; });

  const novelPath = path.join(__dirname, `novel-${tag}.md`);
  fs.writeFileSync(novelPath, md);
  console.log('\nNovel: %s', novelPath);

  const logPath = path.join(__dirname, `novel-${tag}-log.json`);
  fs.writeFileSync(logPath, JSON.stringify({
    stats,
    calls: callLog.map(c => ({
      ...c,
      messages: c.messages,
      response_content: c.response_content,
    })),
  }, null, 2));
  console.log('Call log: %s', logPath);
  console.log('');
}

async function main() {
  await run('A');
  await run('B');
  console.log('=== Both novels complete! ===');
}

main().catch(e => { console.error('Pipeline failed:', e); process.exit(1); });
