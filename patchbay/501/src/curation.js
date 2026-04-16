// ═══════════════════════════════════════════
// CATALOG CURATION
// LLM-powered blurbs, tags, sections, recommendations
// "You just used an LLM to write the books. Now you're using one to sell them."
// ═══════════════════════════════════════════

// ─── Per-novel: blurb + tags + comparables ───
async function generateBlurb(novelIdx) {
  const novel = STATE.novels[novelIdx];
  if (!novel || !novel.bible) return;
  if (!STATE.providerReady) {
    alert('Set up a provider first.');
    return;
  }

  const system = getPrompt('blurb_system');
  const user = getPrompt('blurb_user').replace('{bible}', novel.bible);

  try {
    const result = await llmChat([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], { temperature: 0.85, max_tokens: 300 });

    // Parse response
    const blurbMatch = result.match(/BLURB:\s*(.+?)(?=\nTAGS:|\n\n|$)/is);
    const tagsMatch = result.match(/TAGS:\s*(.+?)(?=\nCOMPARABLE:|\n\n|$)/is);
    const compMatch = result.match(/COMPARABLE:\s*(.+?)$/is);

    novel.blurb = blurbMatch ? blurbMatch[1].trim() : result.trim();
    novel.genre_tags = tagsMatch
      ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean)
      : [];
    novel.comparable = compMatch ? compMatch[1].trim() : '';

    saveState();
    return novel;
  } catch (e) {
    console.warn('Blurb generation failed:', e);
  }
}

// ─── Auto-generate blurb after bible creation ───
async function autoGenerateBlurb() {
  if (STATE.currentNovel === null || STATE.currentNovel === undefined) return;
  if (!STATE.providerReady) return;
  const novel = STATE.novels[STATE.currentNovel];
  if (!novel || !novel.bible || novel.blurb) return; // don't overwrite existing
  await generateBlurb(STATE.currentNovel);
}

// ─── Catalog-level curation ───
async function curateCatalog() {
  const novels = STATE.novels.filter(n => n.bible && n.chapters.length > 0);
  if (novels.length < 2) {
    alert('Need at least 2 completed novels to curate.');
    return;
  }
  if (!STATE.providerReady) {
    alert('Set up a provider first.');
    return;
  }

  const btn = document.getElementById('btn-curate');
  if (btn) { btn.disabled = true; btn.textContent = 'Curating...'; }

  // Build catalog summaries for the prompt
  const summaries = novels.map((n, i) => {
    const title = extractTitle(n.bible) || `Novel ${i + 1}`;
    const pitch = n.bible.match(/Pitch:\s*(.+)/i)?.[1] || '';
    const setting = n.bible.match(/Setting:\s*(.+)/i)?.[1] || '';
    const tags = (n.genre_tags || []).join(', ');
    return `"${title}" — ${pitch} (Setting: ${setting}) [Tags: ${tags}]`;
  }).join('\n');

  const system = getPrompt('curation_system');
  const user = getPrompt('curation_user').replace('{catalog_summaries}', summaries);

  try {
    const result = await llmChat([
      { role: 'system', content: system },
      { role: 'user', content: user },
    ], { temperature: 0.8, max_tokens: 1500 });

    // Parse sections
    const sections = [];
    const sectionRegex = /SECTION:\s*(.+?)\nTAGLINE:\s*(.+?)\nNOVELS:\s*(.+?)(?=\n\nSECTION:|\n\nFEATURED:|\n\nALSO_LIKED:|$)/gis;
    let m;
    while ((m = sectionRegex.exec(result)) !== null) {
      sections.push({
        name: m[1].trim(),
        tagline: m[2].trim(),
        novels: m[3].split(',').map(t => t.trim().replace(/^"|"$/g, '')).filter(Boolean),
      });
    }

    // Parse featured
    const featMatch = result.match(/FEATURED:\s*(.+?)(?=\n)/i);
    const featNoteMatch = result.match(/FEATURED_NOTE:\s*(.+?)(?=\n\nALSO_LIKED:|$)/is);

    // Parse recommendations
    const recs = {};
    const alsoLikedSection = result.match(/ALSO_LIKED:\s*([\s\S]+?)$/i);
    if (alsoLikedSection) {
      const lines = alsoLikedSection[1].trim().split('\n');
      for (const line of lines) {
        const parts = line.match(/(.+?)\s*→\s*(.+)/);
        if (parts) {
          const from = parts[1].trim().replace(/^"|"$/g, '');
          const to = parts[2].split(',').map(t => t.trim().replace(/^"|"$/g, '')).filter(Boolean);
          recs[from] = to;
        }
      }
    }

    STATE.curation = {
      sections,
      featured: featMatch ? featMatch[1].trim().replace(/^"|"$/g, '') : null,
      featuredNote: featNoteMatch ? featNoteMatch[1].trim() : null,
      recommendations: recs,
      generatedAt: Date.now(),
    };
    saveState();

    renderLibrary();
    if (btn) { btn.disabled = false; btn.textContent = '✨ Re-curate'; }
    return STATE.curation;
  } catch (e) {
    alert('Catalog curation failed: ' + e.message);
    if (btn) { btn.disabled = false; btn.textContent = '✨ Curate Catalog'; }
  }
}

// ─── Build catalog data for reader export ───
function buildExportCatalog() {
  return STATE.novels.filter(n => n.chapters.length > 0).map(n => {
    const title = extractTitle(n.bible) || 'Untitled';
    const pitch = n.bible?.match(/Pitch:\s*(.+)/i)?.[1] || '';
    return {
      title,
      pitch,
      blurb: n.blurb || pitch,
      genre_tags: n.genre_tags || [],
      comparable: n.comparable || '',
      cover: n.cover || null,
      word_count: n.chapters.reduce((s, c) => s + c.word_count, 0),
      chapters: n.chapters.map(ch => ({
        number: ch.number,
        title: ch.title || '',
        text: ch.text,
        word_count: ch.word_count,
      })),
    };
  });
}

// ─── Build curation data for reader export ───
function buildExportCuration() {
  return STATE.curation || null;
}
