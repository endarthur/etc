// ═══════════════════════════════════════════
// PROMPT TEMPLATES — defaults + editing UI
// ═══════════════════════════════════════════

const DEFAULT_PROMPTS = {
  guardrails: `CONTENT BOUNDARIES — stay in commercial genre fiction territory:
- NO real-world atrocities, genocide, ethnic cleansing, or historical trauma as plot devices
- NO sexual violence, child abuse, or medical experimentation on unwilling subjects
- NO organ trafficking, forced sterilization, or torture
- Stakes should be personal and professional: reputation, power, money, status, love, legacy
- Villains should be greedy, arrogant, or selfish — not monstrous
- The world should feel dramatic and high-stakes without crossing into grimdark
- Think GoodNovel/WebNovel tone: emotional, addictive, satisfying — not disturbing`,

  bible_system: `You generate structured story bibles for serialized revenge fiction. Be specific, vivid, and concise. Every name should feel real and culturally grounded. Every detail should serve the plot. Avoid generic fantasy names — use names that belong in the setting you choose.`,

  bible_user: `You are a serialized fiction architect. Given these tropes, generate a story bible.

TROPES:
{tropes}

Generate a bible in EXACTLY this format (one sentence per bullet, concise and specific):

IDENTITY
- Title: [compelling title — no colons, no subtitles]
- Pitch: [one-line hook, under 20 words]
- Setting: [specific place, specific time period, specific milieu]

PROTAGONIST
- Name: [full name]
- Public face: [one sentence — what the world sees]
- Hidden truth: [one sentence — what they actually are]
- The wound: [one sentence — the specific injury that drives them]

ANTAGONIST
- Name: [name], [role]
- Why they feel justified: [one sentence — they believe they're right]
- What they're protecting or pursuing: [one sentence]

ENABLER
- Name: [name], [role]
- Their relationship to the protagonist: [one sentence]
- Why they fail the protagonist: [one sentence — the specific moment or pattern of failure]

CATALYST
- Name: [name], [role]
- Why they're dangerous: [one sentence]

WORLD
- Institution: [the specific world — not just "high society" but the actual industry, organization, or community]
- Key locations: [3-4 specific, named places that matter to the plot]
- What everyone assumes about the power structure: [one sentence — this assumption is what the reveal will shatter]

STAKES
- What the protagonist secretly holds: [specific asset, ability, knowledge, proof, or connection]
- What's being taken from them: [specific position, reputation, credit, relationships, or access]
- The tangible proof: [the specific evidence, object, document, or skill demonstration that makes the truth undeniable]
- The ticking clock: [what forces the timeline — a deadline, an event, a threat]

DRAMATIC IRONY
- What the reader knows from chapter one: [one sentence]
- What the antagonist won't learn until too late: [one sentence]{love_interest_block}

Output ONLY the bible. No commentary, no preamble, no markdown formatting. Start with "IDENTITY".`,

  beats_system: `You generate beat sheets for serialized revenge fiction. Each beat should be specific to the story bible — use character names, locations, and plot details from the bible. Cliffhangers must be compelling and VARIED — never repeat the same type of hook. Dramatic irony must evolve and deepen across chapters.`,

  beats_user: `Given this story bible, generate a 15-chapter beat sheet.

BIBLE:
{bible}

ARC STRUCTURE (use these beat names and follow this emotional shape):
{beat_descriptions}

For each chapter, output in EXACTLY this format:

CHAPTER [N]: [Beat Name]
Summary: [One sentence describing what happens, specific to THIS story — use names and places from the bible]
Emotional temperature: [one of: humiliation / tension / unease / satisfaction / triumph]
Characters present: [Names from the bible who appear in this chapter]
Cliffhanger: [One sentence — the hook. IMPORTANT: vary the cliffhanger type across chapters. Use revelations, reversals, arrivals, departures, discoveries, confrontations, decisions, and betrayals. NEVER repeat the same cliffhanger structure twice.]
Dramatic irony: [What the reader knows that the characters don't — this MUST evolve and deepen chapter by chapter]

Output all 15 chapters. No commentary, no preamble. Start with "CHAPTER 1:".`,

  chapter_system: `You write serialized commercial fiction. Your prose is clean, fast, and invisible — the reader should forget they're reading. Every chapter ends with the reader needing to turn the page.

ABSOLUTE RULES:
- NEVER use these phrases: "eyes locked onto", "mind racing", "everything went black", "frozen in time", "echoing through", "couldn't shake the feeling", "little did they know", "sent a shiver/chill down"
- NEVER end a chapter with a mysterious phone call or a whispered word from the shadows
- NEVER have characters announce their emotions or intentions ("I'm going to take you down")
- SHOW don't TELL — reveal emotion through action, gesture, silence, and subtext
- Vary sentence length. Mix short punches with longer flowing sentences.
- Each chapter's cliffhanger must be a DIFFERENT type from the previous chapter
- You never break character or add meta-commentary`,

  chapter_user: `Write chapter {chapter_num} of a 15-chapter serialized novel.

STORY BIBLE:
{bible}

CURRENT CHAPTER BEAT:
{current_beat}

NEXT CHAPTER BEAT (aim the cliffhanger toward this):
{next_beat}

{summaries}{prev_chapter}Write chapter {chapter_num}. Requirements:
- MINIMUM 900 words, target 1000-1200
- Short paragraphs (2-3 sentences max)
- At least 40% dialogue
- End on a cliffhanger that is DIFFERENT from any previous chapter's ending
- Commercial, accessible prose — the prose should be invisible
- Do NOT reference events from future beats — the characters don't know what's coming
- Match the emotional temperature from the beat entry
- Ground every scene in a SPECIFIC location from the bible
- Characters should act, not just talk about acting{love_interest_note}

Output ONLY the chapter text. No author notes, no commentary, no chapter title. Start with exactly: "Chapter {chapter_num}" on its own line. No colon, no title — just the number. This matches how real serialized fiction platforms (GoodNovel, WebNovel) present chapters.`,

  summary_system: `Summarize the chapter in one sentence (max 20 words). Focus on what changed — who did what, what was revealed, what shifted. Use character names.`,

  cover_prompt: `A dramatic illustration for a story. {pitch} Setting: {setting}. {protagonist} Painterly style, cinematic composition, moody lighting, rich colors. A single striking scene, no people's faces in full detail. Absolutely no text, no words, no letters, no typography, no writing of any kind in the image.`,

  blurb_system: `You write marketing blurbs for serialized fiction. Your blurbs are punchy, emotional, and irresistible — they sell the FEELING, not the plot. 2-4 sentences max. Use sentence fragments. Use tension. Make the reader need to know what happens next. Also generate genre/mood tags and a "For fans of..." line with fictional comparable titles.`,

  blurb_user: `Given this story bible, write a marketing blurb for a reading platform.

BIBLE:
{bible}

Output in EXACTLY this format:

BLURB: [2-4 punchy sentences that sell the story. Fragments welcome. No spoilers past chapter 3.]
TAGS: [comma-separated genre/mood tags, 4-8 tags. Examples: revenge, slow burn, enemies to lovers, corporate drama, historical, forbidden love, dark romance, family secrets, power struggle, underdog, identity reveal]
COMPARABLE: For fans of [2-3 fictional title/author combos that feel right for this story]

Output ONLY these three lines. No commentary.`,

  curation_system: `You are a bookstore merchandiser. Given a catalog of novels, you organize them into themed sections with editorial copy. You write like a passionate bookseller — warm, opinionated, genuine. Each section should feel curated by a human who read every book.`,

  curation_user: `Here is a catalog of novels. Organize them into 2-4 themed sections for a reading platform storefront.

CATALOG:
{catalog_summaries}

For each section, output in this format:

SECTION: [Evocative section name — not generic. "Burning Bridges" not "Drama"]
TAGLINE: [One sentence editorial hook — why this shelf exists]
NOVELS: [comma-separated novel titles that belong here]

After the sections, add:

FEATURED: [Title of the novel you'd put on the homepage]
FEATURED_NOTE: [2 sentences — why this one. Write like a bookseller handwriting a staff pick card.]

ALSO_LIKED:
[Title A] → [Title B], [Title C]
[Title D] → [Title E]
(Only include pairs that genuinely share thematic DNA. Don't force connections.)

Output ONLY the sections, featured pick, and recommendations. No commentary.`,
};

// ─── Get active prompt (user-edited or default) ───
function getPrompt(key) {
  if (STATE.prompts && STATE.prompts[key] !== undefined && STATE.prompts[key] !== null) {
    return STATE.prompts[key];
  }
  return DEFAULT_PROMPTS[key];
}

function setPrompt(key, value) {
  if (!STATE.prompts) STATE.prompts = {};
  STATE.prompts[key] = value;
  saveState();
}

function resetPrompt(key) {
  if (!STATE.prompts) STATE.prompts = {};
  delete STATE.prompts[key];
  saveState();
  // Update textarea
  const ta = document.getElementById('prompt-' + key);
  if (ta) {
    ta.value = DEFAULT_PROMPTS[key];
    ta.classList.remove('edited');
  }
}

function resetAllPrompts() {
  STATE.prompts = {};
  saveState();
  renderPromptsTab();
}

function isPromptEdited(key) {
  return STATE.prompts && STATE.prompts[key] !== undefined && STATE.prompts[key] !== null
    && STATE.prompts[key] !== DEFAULT_PROMPTS[key];
}

// ─── Render the Prompts tab ───
const PROMPT_SECTIONS = [
  { key: 'guardrails', label: 'Content Guardrails', desc: 'Injected into the bible system prompt. Defines what the factory will and won\'t generate.' },
  { key: 'bible_system', label: 'Bible — System Prompt', desc: 'Sets the model\'s role for bible generation.' },
  { key: 'bible_user', label: 'Bible — User Template', desc: 'The template sent to generate a bible. Variables: {tropes}, {love_interest_block}' },
  { key: 'beats_system', label: 'Beat Sheet — System Prompt', desc: 'Sets the model\'s role for beat sheet generation.' },
  { key: 'beats_user', label: 'Beat Sheet — User Template', desc: 'Template for beat sheet generation. Variables: {bible}, {beat_descriptions}' },
  { key: 'chapter_system', label: 'Chapter — System Prompt', desc: 'Sets the model\'s role and rules for chapter writing. The banned-phrases list lives here.' },
  { key: 'chapter_user', label: 'Chapter — User Template', desc: 'Template for each chapter. Variables: {chapter_num}, {bible}, {current_beat}, {next_beat}, {summaries}, {prev_chapter}, {love_interest_note}' },
  { key: 'summary_system', label: 'Summary — System Prompt', desc: 'Instructions for generating one-line chapter summaries.' },
  { key: 'cover_prompt', label: 'Cover — Image Prompt', desc: 'Sent to the image model. Variables: {pitch}, {setting}, {protagonist}. Avoid words like "book cover" or "title" — image models will add garbled text.' },
  { key: 'blurb_system', label: 'Blurb — System Prompt', desc: 'Sets the model\'s role for marketing blurb generation.' },
  { key: 'blurb_user', label: 'Blurb — User Template', desc: 'Generates marketing blurb, genre tags, and comparable titles. Variable: {bible}' },
  { key: 'curation_system', label: 'Curation — System Prompt', desc: 'Sets the model\'s role for catalog merchandising (sections, recommendations).' },
  { key: 'curation_user', label: 'Curation — User Template', desc: 'Organizes the catalog into themed sections. Variable: {catalog_summaries}' },
];

function renderPromptsTab() {
  const pane = document.getElementById('ed-prompts');
  if (!pane) return;

  pane.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
      <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-faint);text-transform:uppercase;letter-spacing:0.5px">Pipeline Prompts</span>
      <button class="btn btn-danger" onclick="resetAllPrompts()" style="padding:4px 10px;font-size:10px">Reset All to Defaults</button>
    </div>
    <div style="font-size:11px;color:var(--text-dim);margin-bottom:16px;line-height:1.5">
      These are the exact prompts sent to the LLM at each stage of the pipeline. Edit them to change the output. Reset to undo your changes.
    </div>
    ${PROMPT_SECTIONS.map(s => {
      const val = getPrompt(s.key);
      const edited = isPromptEdited(s.key);
      const rows = Math.min(16, Math.max(4, val.split('\n').length + 1));
      return `<div class="prompt-section">
        <div class="prompt-header">
          <div>
            <span class="prompt-label">${s.label}</span>
            ${edited ? '<span class="prompt-edited-badge">edited</span>' : ''}
          </div>
          <button class="btn" onclick="resetPrompt('${s.key}')" style="padding:3px 8px;font-size:9px" ${edited ? '' : 'disabled'}>Reset</button>
        </div>
        <div class="prompt-desc">${s.desc}</div>
        <textarea id="prompt-${s.key}" class="prompt-textarea${edited ? ' edited' : ''}" rows="${rows}"
          oninput="setPrompt('${s.key}',this.value);this.classList.toggle('edited',this.value!==DEFAULT_PROMPTS['${s.key}']);this.closest('.prompt-section').querySelector('.prompt-edited-badge')?.classList.toggle('hidden',this.value===DEFAULT_PROMPTS['${s.key}']);this.closest('.prompt-section').querySelector('.btn').disabled=this.value===DEFAULT_PROMPTS['${s.key}']"
        >${esc(val)}</textarea>
      </div>`;
    }).join('')}`;
}
