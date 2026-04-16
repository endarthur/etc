// ═══════════════════════════════════════════
// COVER GENERATION (NanoGPT image models)
// ═══════════════════════════════════════════

const IMAGE_MODELS = [
  { id: 'qwen-image', name: 'Qwen Image', desc: 'Painterly, atmospheric' },
  { id: 'chroma', name: 'Chroma', desc: 'Lush, illustrated' },
  { id: 'hidream', name: 'Hidream', desc: 'Bold, stylized' },
  { id: 'z-image-turbo', name: 'Z Image Turbo', desc: 'Fast, photorealistic' },
];

const DEFAULT_IMAGE_MODEL = 'qwen-image';

function canGenerateCovers() {
  return STATE.provider === 'nanogpt' && STATE.apiKey && STATE.apiKey.length > 5;
}

const COVER_STYLES = [
  { id: 'default', name: 'Default', desc: 'Uses the prompt template as-is' },
  { id: 'painterly', name: 'Painterly', suffix: ' Oil painting style, visible brushstrokes, classical composition.' },
  { id: 'cinematic', name: 'Cinematic', suffix: ' Cinematic movie poster lighting, dramatic shadows, widescreen feel.' },
  { id: 'minimalist', name: 'Minimalist', suffix: ' Minimalist design, bold shapes, limited color palette, graphic novel feel.' },
  { id: 'vintage', name: 'Vintage', suffix: ' Vintage pulp fiction illustration style, retro colors, grain texture.' },
  { id: 'watercolor', name: 'Watercolor', suffix: ' Soft watercolor illustration, gentle washes of color, dreamy atmosphere.' },
];

function buildCoverPrompt(bible) {
  const pitch = bible.match(/Pitch:\s*(.+)/i)?.[1] || '';
  const setting = bible.match(/Setting:\s*(.+)/i)?.[1] || '';
  const protag = bible.match(/Public face:\s*(.+)/i)?.[1] || '';

  let prompt = getPrompt('cover_prompt')
    .replace('{pitch}', pitch)
    .replace('{setting}', setting)
    .replace('{protagonist}', protag ? 'The main character: ' + protag + '.' : '');

  // Append style suffix if not default
  const styleId = STATE.coverStyle || 'default';
  const style = COVER_STYLES.find(s => s.id === styleId);
  if (style && style.suffix) prompt += style.suffix;

  return prompt;
}

async function generateCover() {
  const novel = STATE.novels[STATE.currentNovel];
  if (!novel || !novel.bible) return;
  if (!canGenerateCovers()) {
    alert('Cover generation requires NanoGPT as provider with an API key.');
    return;
  }

  const btn = document.getElementById('btn-gen-cover');
  if (btn) { btn.disabled = true; btn.textContent = 'Generating cover...'; }

  const prompt = buildCoverPrompt(novel.bible);
  const imageModel = STATE.imageModel || DEFAULT_IMAGE_MODEL;

  try {
    const res = await fetch('https://nano-gpt.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': STATE.apiKey,
      },
      body: JSON.stringify({
        model: imageModel,
        prompt,
        n: 1,
        size: '1024x1536', // Portrait, book cover ratio
        response_format: 'b64_json',
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Image API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) throw new Error('No image data returned');

    // Store raw illustration separately, then composite with text
    novel.coverIllustration = 'data:image/png;base64,' + b64;
    saveState();

    // Auto-composite with current template
    compositeCovers();

  } catch (e) {
    alert('Cover generation failed: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🎨 Generate Cover'; }
  }
}

function displayCover(coverDataUri) {
  const el = document.getElementById('cover-preview');
  if (el) {
    el.innerHTML = `<img src="${coverDataUri}" style="max-width:100%;max-height:300px;border-radius:4px;border:1px solid var(--border)">`;
  }
}
