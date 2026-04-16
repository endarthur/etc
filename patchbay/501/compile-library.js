#!/usr/bin/env node
// Compile base_library/ into a compressed blob for embedding in the HTML.
// Also compiles extension packs into separate files.
// Uses ImageMagick to resize covers to JPEG thumbnails.

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execSync } = require('child_process');

const ROOT = __dirname;
const BASE_DIR = path.join(ROOT, 'base_library');
const PACKS_DIR = path.join(ROOT, 'extension_packs');
const OUT_DIR = path.join(ROOT, 'dist');

// Pack definitions — which extension novels go in which pack
const PACK_GROUPS = {
  historical: { name: 'Historical', range: [1, 5] },
  modern: { name: 'Modern', range: [6, 10] },
  fantasy: { name: 'Fantasy & Unusual', range: [11, 15] },
  'no-romance': { name: 'No Romance', range: [16, 20] },
  variety: { name: 'Extra Variety', range: [21, 25] },
  'more-historical': { name: 'More Historical', range: [26, 30] },
};

// ─── Cover resizing ───
function resizeCoverJpeg(dir, size = '256x384', quality = 75) {
  const coverPath = path.join(dir, 'cover.png');
  if (!fs.existsSync(coverPath)) return null;

  const tempJpeg = path.join(dir, '.cover_thumb.jpg');
  try {
    execSync(`magick "${coverPath}" -resize ${size} -quality ${quality} "${tempJpeg}"`, { stdio: 'pipe' });
    const bytes = fs.readFileSync(tempJpeg);
    fs.unlinkSync(tempJpeg);
    return 'data:image/jpeg;base64,' + bytes.toString('base64');
  } catch (e) {
    console.warn('    ⚠ Cover resize failed for', path.basename(dir));
    return null;
  }
}

// ─── Compile one novel from its directory ───
function compileNovel(dir, opts = {}) {
  const novel = JSON.parse(fs.readFileSync(path.join(dir, 'novel.json'), 'utf-8'));
  const arts = JSON.parse(fs.readFileSync(path.join(dir, 'artifacts.json'), 'utf-8'));

  // Replace full-size cover with thumbnail
  const thumbCover = opts.resizeCovers ? resizeCoverJpeg(dir) : novel.cover;

  // Package — includes both reader data and pipeline artifacts
  return {
    title: novel.title,
    blurb: novel.blurb,
    pitch: novel.blurb, // for the reader's pitch field
    genre_tags: novel.genre_tags || [],
    comparable: novel.comparable || '',
    tropes: novel.tropes,
    cover: thumbCover,
    word_count: novel.word_count,
    chapters: novel.chapters,
    // Artifacts for course examination
    bible: arts.bible,
    beats: arts.beats,
    summaries: arts.summaries,
    // Mark as pre-generated
    preGen: true,
  };
}

// ─── Compile base library ───
function compileBase() {
  console.log('Compiling base library (15 novels)...');
  const dirs = fs.readdirSync(BASE_DIR)
    .filter(d => fs.statSync(path.join(BASE_DIR, d)).isDirectory())
    .sort();

  const novels = [];
  for (const d of dirs) {
    process.stdout.write('  ' + d + '... ');
    const novel = compileNovel(path.join(BASE_DIR, d), { resizeCovers: true });
    novels.push(novel);
    console.log('ok (' + (novel.cover ? Math.round(novel.cover.length/1024) + 'KB cover' : 'no cover') + ')');
  }

  // Include ONE pipeline log for the showcase novel (first one)
  const showcasePath = path.join(BASE_DIR, dirs[0], 'pipeline-log.json');
  let showcaseLog = null;
  if (fs.existsSync(showcasePath)) {
    showcaseLog = JSON.parse(fs.readFileSync(showcasePath, 'utf-8'));
    console.log('  Including pipeline log for showcase: ' + novels[0].title);
  }

  return { novels, showcaseLog, showcaseNovelTitle: novels[0]?.title };
}

// ─── Compile extension pack ───
function compilePack(packId, packInfo) {
  console.log('Compiling pack "' + packInfo.name + '" (#' + packInfo.range[0] + '-' + packInfo.range[1] + ')...');
  const dirs = fs.readdirSync(PACKS_DIR)
    .filter(d => fs.statSync(path.join(PACKS_DIR, d)).isDirectory())
    .sort();

  const [start, end] = packInfo.range;
  const packDirs = dirs.filter(d => {
    const num = parseInt(d.slice(0, 2));
    return num >= start && num <= end;
  });

  const novels = [];
  for (const d of packDirs) {
    process.stdout.write('  ' + d + '... ');
    const novel = compileNovel(path.join(PACKS_DIR, d), { resizeCovers: true });
    novels.push(novel);
    console.log('ok');
  }

  return { id: packId, name: packInfo.name, novels };
}

// ─── Write output ───
function writeCompressed(obj, filename) {
  const json = JSON.stringify(obj);
  const gz = zlib.gzipSync(json);
  const outPath = path.join(OUT_DIR, filename);
  fs.writeFileSync(outPath, gz);
  console.log('  ✓ ' + filename + ': ' + (json.length/1024).toFixed(0) + ' KB raw → ' + (gz.length/1024).toFixed(0) + ' KB gzipped');
  return { raw: json.length, gz: gz.length };
}

// ─── Main ───
function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

  console.log('══ Compiling base library ══');
  const base = compileBase();

  // Save base library text (no showcase log) as the embed blob
  const embedPayload = {
    novels: base.novels,
    showcaseTitle: base.showcaseNovelTitle,
    // showcase log stored separately (too big to inline the raw log)
  };

  console.log('\n══ Writing outputs ══');
  const baseStats = writeCompressed(embedPayload, 'library-base.json.gz');

  if (base.showcaseLog) {
    const logStats = writeCompressed(base.showcaseLog, 'library-showcase-log.json.gz');
  }

  // Also write a base64 version for embedding
  const baseGz = fs.readFileSync(path.join(OUT_DIR, 'library-base.json.gz'));
  const baseB64 = baseGz.toString('base64');
  fs.writeFileSync(path.join(OUT_DIR, 'library-base.b64.txt'), baseB64);
  console.log('  ✓ library-base.b64.txt: ' + (baseB64.length/1024).toFixed(0) + ' KB (base64 for HTML embedding)');

  // Extension packs
  console.log('\n══ Compiling extension packs ══');
  const packIndex = [];
  for (const [id, info] of Object.entries(PACK_GROUPS)) {
    const pack = compilePack(id, info);
    const stats = writeCompressed(pack, 'pack-' + id + '.json.gz');
    packIndex.push({ id, name: info.name, file: 'pack-' + id + '.json.gz', novels: pack.novels.length, size_kb: Math.round(stats.gz/1024) });
  }

  // Write pack index
  fs.writeFileSync(path.join(OUT_DIR, 'packs-index.json'), JSON.stringify(packIndex, null, 2));
  console.log('\n  ✓ packs-index.json: metadata for pack loader');

  console.log('\n══ Summary ══');
  console.log('  Base library (embedded):  ' + (baseStats.gz/1024).toFixed(0) + ' KB gzipped');
  console.log('  Base64-encoded for HTML:  ' + (baseB64.length/1024).toFixed(0) + ' KB');
  console.log('  ' + packIndex.length + ' extension packs: ' + packIndex.reduce((s, p) => s + p.size_kb, 0) + ' KB total');
}

main();
