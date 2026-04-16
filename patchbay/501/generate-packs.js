#!/usr/bin/env node
// Generate extension pack novels overnight.
// Uses the EXACT same pipeline as the browser.
// Usage: node generate-packs.js [start] [end]
//   start/end are 1-indexed (default: all)

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ─── Load pipeline code (same as browser) ───
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

// ─── Extension pack combos — wilder, with freeform tags ───
const PACK_COMBOS = [
  // ── Historical Pack ──
  { who: 'disguised-royalty', what: 'betrayal',          how: 'reveal-identity',        with: 'enemy-to-lover',       tags: 'Ottoman Empire, 1550s Istanbul' },
  { who: 'retired-legend',    what: 'stolen-credit',     how: 'systematic-dismantling', with: 'forbidden-connection', tags: 'Edo period Japan, samurai turned monk' },
  { who: 'secret-benefactor', what: 'public-accusation', how: 'withdraw-support',       with: 'childhood-promise',   tags: 'Renaissance Florence, Medici banking' },
  { who: 'returned-exile',    what: 'cast-out',          how: 'take-theirs',            with: 'contract-marriage',   tags: 'Viking Age Scandinavia, 900 AD' },
  { who: 'hidden-master',     what: 'framed',            how: 'let-them-fail',          with: 'fake-dating',         tags: 'Prohibition-era Chicago, jazz clubs' },

  // ── Modern Pack ──
  { who: 'hidden-master',     what: 'stolen-credit',     how: 'systematic-dismantling', with: 'fake-dating',         tags: 'Silicon Valley, AI startup, 2025' },
  { who: 'secret-heir',       what: 'cast-out',          how: 'withdraw-support',       with: 'enemy-to-lover',      tags: 'K-pop industry, Seoul trainee program' },
  { who: 'retired-legend',    what: 'betrayal',          how: 'someone-better',         with: 'ex-returns',          tags: 'Formula 1 racing, Monaco Grand Prix' },
  { who: 'secret-benefactor', what: 'wedding-ruined',    how: 'reveal-identity',        with: 'forbidden-connection', tags: 'Bollywood film industry, Mumbai' },
  { who: 'returned-exile',    what: 'public-accusation', how: 'take-theirs',            with: 'childhood-promise',   tags: 'Wall Street, hedge fund world' },

  // ── Fantasy/Unusual Pack ──
  { who: 'disguised-royalty', what: 'wedding-ruined',    how: 'let-them-fail',          with: 'contract-marriage',   tags: 'underwater civilization, bioluminescent cities' },
  { who: 'hidden-master',     what: 'framed',            how: 'reveal-identity',        with: 'enemy-to-lover',      tags: 'traveling circus, 1890s Europe' },
  { who: 'secret-heir',       what: 'betrayal',          how: 'systematic-dismantling', with: null,                  tags: 'Antarctic research station, winter isolation' },
  { who: 'retired-legend',    what: 'cast-out',          how: 'withdraw-support',       with: 'forbidden-connection', tags: 'professional chess, world championship' },
  { who: 'secret-benefactor', what: 'stolen-credit',     how: 'someone-better',         with: 'fake-dating',         tags: 'haute couture fashion, Paris Fashion Week' },

  // ── No Romance Pack ──
  { who: 'hidden-master',     what: 'public-accusation', how: 'let-them-fail',          with: null,                  tags: 'hospital politics, neurosurgery department' },
  { who: 'secret-heir',       what: 'cast-out',          how: 'reveal-identity',        with: null,                  tags: 'wine industry, Napa Valley dynasty' },
  { who: 'retired-legend',    what: 'framed',            how: 'systematic-dismantling', with: null,                  tags: 'Olympic gymnastics, coaching scandal' },
  { who: 'disguised-royalty', what: 'stolen-credit',     how: 'take-theirs',            with: null,                  tags: 'classical music, Vienna Philharmonic' },
  { who: 'returned-exile',    what: 'wedding-ruined',    how: 'withdraw-support',       with: null,                  tags: 'architecture firm, skyscraper competition' },

  // ── Extra Variety ──
  { who: 'secret-benefactor', what: 'cast-out',          how: 'let-them-fail',          with: 'enemy-to-lover',      tags: 'space station, orbital mining colony, 2180' },
  { who: 'hidden-master',     what: 'wedding-ruined',    how: 'take-theirs',            with: 'childhood-promise',   tags: 'Brazilian telenovela industry, São Paulo' },
  { who: 'disguised-royalty', what: 'public-accusation', how: 'someone-better',         with: 'ex-returns',          tags: 'professional surfing, Hawaiian North Shore' },
  { who: 'retired-legend',    what: 'betrayal',          how: 'reveal-identity',        with: 'contract-marriage',   tags: 'Michelin-star restaurant, Tokyo' },
  { who: 'returned-exile',    what: 'framed',            how: 'systematic-dismantling', with: 'fake-dating',         tags: 'art forgery world, Amsterdam galleries' },

  // ── More Historical ──
  { who: 'secret-heir',       what: 'betrayal',          how: 'withdraw-support',       with: 'forbidden-connection', tags: 'Mughal India, 1600s, jewel trade' },
  { who: 'hidden-master',     what: 'cast-out',          how: 'someone-better',         with: 'contract-marriage',   tags: 'Song Dynasty China, imperial examinations' },
  { who: 'secret-benefactor', what: 'framed',            how: 'take-theirs',            with: 'enemy-to-lover',      tags: 'Weimar Republic Berlin, cabaret scene, 1929' },
  { who: 'disguised-royalty', what: 'stolen-credit',     how: 'let-them-fail',          with: 'childhood-promise',   tags: 'Maya civilization, Tikal, 800 AD' },
  { who: 'retired-legend',    what: 'wedding-ruined',    how: 'systematic-dismantling', with: 'ex-returns',          tags: 'Age of Sail, Caribbean privateers, 1720' },
];

// ─── LLM / Cover / Blurb functions — same as generate-library.js ───
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
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + PROVIDER.apiKey },
        body: JSON.stringify({ model, messages, temperature: opts.temperature ?? 0.8, max_tokens: opts.max_tokens ?? 4096 }),
        signal: AbortSignal.timeout(300000),
      });
    } catch (e) {
      retries++; console.log('      ⚠ Network error, retrying in 5s...'); await new Promise(r => setTimeout(r, 5000)); continue;
    }
    if (res.status >= 500) { retries++; console.log('      ⚠ Server %d, retrying...', res.status); await new Promise(r => setTimeout(r, 5000)); continue; }
    if (res.status === 429) { retries++; const b=await res.text(); const w=parseFloat(b.match(/try again in ([\d.]+)s/)?.[1]||'10'); console.log('      ⏳ Rate limited, %ds...', Math.ceil(w)); await new Promise(r=>setTimeout(r,(w+1)*1000)); continue; }
    if (!res.ok) throw new Error(`LLM error ${res.status}: ${await res.text()}`);
    const data = await res.json();
    totalCalls++;
    callLog.push({ label: opts.label||`call-${totalCalls}`, model, elapsed_ms: Date.now()-startTime, retries, input_tokens: data.usage?.prompt_tokens||null, output_tokens: data.usage?.completion_tokens||null, messages, response_content: data.choices[0].message.content });
    return data.choices[0].message.content;
  }
  throw new Error('Max retries exceeded');
}

async function generateCover(bible) {
  const pitch = bible.match(/Pitch:\s*(.+)/i)?.[1]||'';
  const setting = bible.match(/Setting:\s*(.+)/i)?.[1]||'';
  const protag = bible.match(/Public face:\s*(.+)/i)?.[1]||'';
  const prompt = ctx._DEFAULT_PROMPTS.cover_prompt.replace('{pitch}',pitch).replace('{setting}',setting).replace('{protagonist}',protag?'The main character: '+protag+'.':'');
  const res = await fetch('https://nano-gpt.com/v1/images/generations', {
    method:'POST', headers:{'Content-Type':'application/json','x-api-key':PROVIDER.apiKey},
    body: JSON.stringify({model:PROVIDER.imageModel,prompt,n:1,size:'512x768',response_format:'b64_json'}),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Image error ${res.status}`);
  const data = await res.json();
  return data.data?.[0]?.b64_json||null;
}

async function generateBlurb(bible) {
  return await llmChat([
    { role:'system', content:ctx._DEFAULT_PROMPTS.blurb_system },
    { role:'user', content:ctx._DEFAULT_PROMPTS.blurb_user.replace('{bible}',bible) },
  ], { temperature:0.85, max_tokens:300, label:'blurb' });
}

function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40); }

// ─── Generate one novel ───
async function generateNovel(combo, index, outDir) {
  const tropeDisplay = [
    combo.who, combo.what, combo.how, combo.with||'(none)'
  ].join(' + ') + (combo.tags ? ' [' + combo.tags + ']' : '');

  console.log('\n══ Pack Novel %d: %s', index, tropeDisplay);
  callLog.length = 0;
  const t0 = Date.now();
  const tropes = { who:combo.who, what:combo.what, how:combo.how, with:combo.with, tags:combo.tags||'' };

  // Bible (with retry)
  console.log('  ▸ Bible...');
  const bp = ctx.buildBiblePrompt(tropes);
  let bible=null, title=null;
  for (let a=0;a<3;a++) {
    const r = await llmChat([{role:'system',content:bp.system},{role:'user',content:bp.user}],{temperature:0.9,max_tokens:1200,label:'bible'});
    title = ctx.extractTitle(r);
    if (title) { bible=r; break; }
    console.log('    ⚠ Bad title, retrying...');
  }
  if (!bible) { console.log('  ✗ Failed bible'); return null; }
  console.log('    ✓ "%s"', title);

  // Blurb
  console.log('  ▸ Blurb...');
  const blurbRaw = await generateBlurb(bible);
  const blurb = blurbRaw.match(/BLURB:\s*(.+?)(?=\nTAGS:|\n\n|$)/is)?.[1]?.trim()||blurbRaw.trim();
  const genre_tags = (blurbRaw.match(/TAGS:\s*(.+?)(?=\nCOMPARABLE:|\n\n|$)/is)?.[1]||'').split(',').map(t=>t.trim()).filter(Boolean);
  const comparable = blurbRaw.match(/COMPARABLE:\s*(.+?)$/is)?.[1]?.trim()||'';

  // Beats
  console.log('  ▸ Beats...');
  const btp = ctx.buildBeatsPrompt(bible);
  const beats = await llmChat([{role:'system',content:btp.system},{role:'user',content:btp.user}],{temperature:0.8,max_tokens:4096,label:'beats'});

  // Chapters
  const chapters=[], summaries=[];
  for (let ch=1;ch<=15;ch++) {
    process.stdout.write(`  ▸ Ch ${ch}/15...`);
    const cp = ctx.buildChapterPrompt(bible,beats,ch,summaries,chapters.length?chapters[chapters.length-1]:'',combo.with);
    let text=null;
    for (let a=0;a<3;a++) {
      const r = await llmChat([{role:'system',content:cp.system},{role:'user',content:cp.user}],{temperature:0.85,max_tokens:4096,label:`ch-${ch}${a?'-retry'+a:''}`});
      if (r.split(/\s+/).filter(Boolean).length >= 400) { text=r; break; }
      process.stdout.write(' [short,retry]');
    }
    if (!text) throw new Error(`Ch ${ch} too short after 3 tries`);
    chapters.push(text);
    const sp = ctx.buildSummaryPrompt(text);
    const sum = await llmChat([{role:'system',content:sp.system},{role:'user',content:sp.user}],{temperature:0.3,max_tokens:100,label:`sum-${ch}`});
    summaries.push(sum.trim());
    console.log(' %d words', text.split(/\s+/).length);
  }
  const totalWords = chapters.reduce((s,c)=>s+c.split(/\s+/).length,0);

  // Cover
  console.log('  ▸ Cover...');
  let coverB64=null;
  try { coverB64=await generateCover(bible); console.log('    ✓'); } catch(e) { console.log('    ⚠ %s',e.message); }

  // Save
  const slug = slugify(title);
  const dir = path.join(outDir, `${String(index).padStart(2,'0')}-${slug}`);
  fs.mkdirSync(dir, {recursive:true});

  fs.writeFileSync(path.join(dir,'novel.json'), JSON.stringify({
    title, blurb, genre_tags, comparable, tropes:combo,
    cover: coverB64?`data:image/png;base64,${coverB64}`:null,
    word_count: totalWords,
    chapters: chapters.map((t,i)=>({number:i+1,title:t.split('\n')[0].replace(/^Chapter\s+\d+:\s*/i,'').trim(),text:t,word_count:t.split(/\s+/).length})),
  },null,2));

  fs.writeFileSync(path.join(dir,'artifacts.json'), JSON.stringify({bible,beats,summaries,tropes:combo,tropeDisplay},null,2));
  fs.writeFileSync(path.join(dir,'pipeline-log.json'), JSON.stringify({
    stats:{title,tropeDisplay,model:PROVIDER.textModel,total_calls:callLog.length,total_words:totalWords,elapsed_ms:Date.now()-t0},
    calls:callLog.map(c=>({...c})),
  },null,2));
  if (coverB64) fs.writeFileSync(path.join(dir,'cover.png'), Buffer.from(coverB64,'base64'));

  const elapsed = Date.now()-t0;
  console.log('  ══ Done: "%s" — %s words, %dm %ds', title, totalWords.toLocaleString(), Math.floor(elapsed/60000), Math.round((elapsed%60000)/1000));
  return {title,totalWords,elapsed};
}

// ─── Main ───
async function main() {
  const startIdx = parseInt(process.argv[2])||1;
  const endIdx = Math.min(parseInt(process.argv[3])||PACK_COMBOS.length, PACK_COMBOS.length);
  const outDir = path.join(__dirname, 'extension_packs');

  console.log('═══════════════════════════════════════════');
  console.log('NaNoGEon Extension Pack Generator');
  console.log('Provider: NanoGPT / %s', PROVIDER.textModel);
  console.log('Generating novels %d through %d (%d total)', startIdx, endIdx, endIdx-startIdx+1);
  console.log('═══════════════════════════════════════════');

  const results=[];
  const t0=Date.now();
  for (let i=startIdx;i<=endIdx;i++) {
    try {
      const r = await generateNovel(PACK_COMBOS[i-1],i,outDir);
      if (r) results.push(r);
    } catch(e) {
      console.error('\n  ✗ Novel %d failed: %s\n', i, e.message);
    }
  }
  const total=Date.now()-t0;
  console.log('\n═══════════════════════════════════════════');
  console.log('COMPLETE: %d/%d novels, %s words, %dm %ds',
    results.length,endIdx-startIdx+1,
    results.reduce((s,r)=>s+r.totalWords,0).toLocaleString(),
    Math.floor(total/60000),Math.round((total%60000)/1000));
  console.log('═══════════════════════════════════════════');
}

main().catch(e=>{console.error('Failed:',e);process.exit(1)});
