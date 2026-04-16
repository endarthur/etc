#!/usr/bin/env node
// Regenerate a specific chapter of a specific novel.
// Usage: node regen-chapter.js <novel-dir> <chapter-num>
// Example: node regen-chapter.js base_library/01-stolen-crown 5

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const promptsCode = fs.readFileSync(path.join(__dirname, 'src', 'prompts.js'), 'utf-8');
const pipelineCode = fs.readFileSync(path.join(__dirname, 'src', 'pipeline.js'), 'utf-8');
const ctx = vm.createContext({
  console, setTimeout,
  document: { getElementById: () => ({ value: '', selectedOptions: [{ text: '' }] }) },
  STATE: { skulls: [], prompts: {}, novels: [] },
  saveState: () => {},
});
vm.runInContext(promptsCode, ctx);
vm.runInContext(pipelineCode, ctx);

const SECRETS = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, 'SECRETS'), 'utf-8').trim().split('\n')
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)]; })
);

const PROVIDER = {
  baseUrl: 'https://nano-gpt.com/api/v1',
  apiKey: SECRETS.NANOGPT_KEY,
  textModel: 'mistralai/mistral-small-4-119b-2603',
};

async function llmChat(messages, opts = {}) {
  const res = await fetch(PROVIDER.baseUrl + '/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PROVIDER.apiKey },
    body: JSON.stringify({
      model: opts.model || PROVIDER.textModel,
      messages,
      temperature: opts.temperature ?? 0.85,
      max_tokens: opts.max_tokens ?? 4096,
    }),
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) throw new Error(`LLM error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

async function main() {
  const novelDir = process.argv[2];
  const chapterNum = parseInt(process.argv[3]);
  if (!novelDir || !chapterNum) {
    console.error('Usage: node regen-chapter.js <novel-dir> <chapter-num>');
    process.exit(1);
  }

  const base = path.resolve(__dirname, novelDir);
  const novel = JSON.parse(fs.readFileSync(path.join(base, 'novel.json'), 'utf-8'));
  const arts = JSON.parse(fs.readFileSync(path.join(base, 'artifacts.json'), 'utf-8'));

  console.log('Regenerating Chapter %d of "%s"', chapterNum, novel.title);
  console.log('Previous word count:', novel.chapters[chapterNum - 1]?.word_count);

  const prevCh = chapterNum > 1 ? novel.chapters[chapterNum - 2]?.text : '';
  // Rolling summaries of chapters BEFORE this one
  const prevSummaries = arts.summaries.slice(0, chapterNum - 1);

  const chPrompt = ctx.buildChapterPrompt(
    arts.bible, arts.beats, chapterNum,
    prevSummaries, prevCh,
    arts.tropes.with
  );

  let text = null, words = 0;
  for (let attempt = 0; attempt < 3; attempt++) {
    process.stdout.write(`  Attempt ${attempt + 1}...`);
    const result = await llmChat([
      { role: 'system', content: chPrompt.system },
      { role: 'user', content: chPrompt.user },
    ], { temperature: 0.85, max_tokens: 4096 });
    const wc = result.split(/\s+/).filter(Boolean).length;
    console.log(' %d words', wc);
    if (wc >= 600) { text = result; words = wc; break; }
  }
  if (!text) { console.error('Failed after 3 attempts'); process.exit(1); }

  // Regenerate summary
  const sumPrompt = ctx.buildSummaryPrompt(text);
  const summary = await llmChat([
    { role: 'system', content: sumPrompt.system },
    { role: 'user', content: sumPrompt.user },
  ], { temperature: 0.3, max_tokens: 100 });

  // Update novel.json
  novel.chapters[chapterNum - 1] = {
    number: chapterNum,
    title: text.split('\n')[0].replace(/^Chapter\s+\d+:\s*/i, '').trim(),
    text,
    word_count: words,
  };
  novel.word_count = novel.chapters.reduce((s, c) => s + c.word_count, 0);

  // Update artifacts.json summary
  arts.summaries[chapterNum - 1] = summary.trim();

  fs.writeFileSync(path.join(base, 'novel.json'), JSON.stringify(novel, null, 2));
  fs.writeFileSync(path.join(base, 'artifacts.json'), JSON.stringify(arts, null, 2));

  console.log('\n✓ Chapter %d regenerated: %d words', chapterNum, words);
  console.log('  Total novel word count: %d', novel.word_count);
}

main().catch(e => { console.error('Failed:', e); process.exit(1); });
