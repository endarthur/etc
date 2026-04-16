# Patchbay 501: The Eternal NaNoGenMo
## At the Mountains of MadLibs

**Version:** 0.3 (Draft — revised tropes, bible, beat sheet, clean reader, ad slot architecture)
**Author:** Arthur Endlein Correia / GCU
**License:** CC0
**Target:** Browser-native single HTML file, zero dependencies except CDN imports
**Deployment:** GitHub Pages (course), Cloudflare Pages (taught in appendix)
**Context:** 2026 Vibe Coding Game Jam entry (deadline May 1, 2026) + Patchbay workshop series

---

## 1. Overview

Patchbay 501 is simultaneously a course, a tool, and a game jam entry. It teaches the student to build a complete AI-generated serialized novel pipeline — from trope selection to deployed reader — in a single HTML file.

The course is a media literacy inoculation disguised as an empire-building game. The student learns how serialized fiction platforms (GoodNovel, WebNovel, KDP) operate by building every component of the pipeline themselves.

### 1.1 What It Is

- **A Patchbay course** — the fifth in the series, following the progression: HTTP (101) → Bots (201) → Visual Pipelines (301) → AI Agents (401) → Content Factory (501)
- **A tool** — a fully functional novel generation and publishing pipeline
- **A game jam entry** — an interactive experience with progression, achievements (skulls), and a certificate
- **An ARG** — the game's output is real. The novels work. The reader works. The deploy is real. The "game" is the real world.

### 1.2 Design Principles

- **Single file deploy.** シングルファイルデプロイ. One HTML file. CDN imports only (JSZip for export). No build step.
- **Zero collection.** No analytics, no tracking, no cookies, no referral links. State stored in localStorage/IndexedDB on the student's machine only.
- **Two modes.** "Follow the Course" (guided, chapter by chapter) and "Just Build" (all screens unlocked, skip to tool mode).
- **Three provider tiers.** Groq free (zero cost), NanoGPT subscription ($8/month, adds image generation), local inference (Mac Studio / ollama).
- **Pre-generated library.** 15-20 novels bundled as JSON. Full experience works with no API keys at all.
- **The course never publishes.** We document deployment and distribution platforms. We don't automate publishing to them. We don't gamify it.

### 1.3 What We Don't Do

- Auto-publish to KDP, WebNovel, or any platform
- Use referral links for NanoGPT, Groq, or any service
- Track students in any way
- Collect any data whatsoever
- Award achievements for publishing generated content to third-party platforms
- Pretend there's a safe distance between knowledge and action

---

## 2. Inspirations & References

### Direct Inspirations
- **"1,500 Slot Machines Walk into a Bar"** — GDC 2019 talk by Alex Schwartz & Ziba Scott. Flooded app stores with auto-generated slot machine games, made money, documented the ethics. Same energy, different medium.
- **"Let's Go Whaling"** — GDC talk on predatory F2P monetization. Said the quiet part loud. The audience left informed, not exploitative.
- **NaNoGenMo** — National Novel Generation Month. Annual challenge to write code that generates a 50k+ word novel. Still running yearly since 2013. The human version (NaNoWriMo) died in 2025 after AI and grooming controversies. The machine version lives on.
- **Universal Paperclips** — Frank Lantz's incremental game. You start clicking, and by the end you've consumed the universe. Same escalation arc: innocent start, frictionless progression, retrospective horror.
- **Roel Van de Paar** — YouTuber with 2M+ auto-generated videos (Stack Exchange answers as slideshows). 0.2% of all YouTube videos. Average likes per video: 0. Pre-LLM slop at industrial scale.
- **GoodNovel / WebNovel** — The platforms this course reverse-engineers. Serialized AI-friendly fiction, chapter-unlock monetization, dark pattern engagement.

### Legal Context
- **Thaler v. Perlmutter** (2025 DC Circuit, cert denied by SCOTUS March 2026) — Works created solely by AI with no human authorship cannot receive copyright protection. The student's generated novels exist in a legal grey area proportional to how much they edited.
- **Amazon KDP AI policy** — Requires disclosure of AI-generated content. Limits uploads to 3 books/day. Does not disclose AI status to customers.

---

## 3. Provider Tiers

### Groq Free (Zero Cost)
- No credit card required
- Access to all models including Llama 3.3 70B Versatile and GPT-OSS 120B
- 1,000 requests/day on 70B models
- ~394 tokens/second on 70B — chapters generate in seconds
- Sufficient for ~10 novels/day
- No image generation
- Bible and beat sheet generation work fine on smaller models (Llama 8B, 14,400 RPD)
- **Recommended for:** Course experience, pipeline validation, moderate generation

### NanoGPT Subscription ($8/month)
- 60,000 generations/month, 2,000/day
- 200+ open-source models (DeepSeek, Qwen, Kimi K2)
- Image generation models included (for covers)
- Web and API access
- **Recommended for:** Full pipeline including cover generation, bulk generation

### Local Inference (No Cost After Hardware)
- Ollama, llama.cpp, or similar
- 70B+ models on 128GB Mac Studio or equivalent
- No rate limits, no network dependency
- Slower (~2-3 min/chapter) but unlimited
- **Recommended for:** Offline use, privacy-conscious users, unlimited generation

### No Keys (Pre-Generated Only)
- Full course experience using bundled library
- All UI, reader, export functionality works
- 15-20 pre-generated novels with complete pipeline artifacts
- **Recommended for:** Game jam play-through, learning without API signup

---

## 4. The Slop Pipeline

### 4.0 Trope Selection

Four slots, six options each. 1,296 unique combinations. The student picks one from each slot or randomizes.

**WHO** (the hidden truth):
1. **Secret Heir** — they own/control more than anyone knows (money, land, throne, organization)
2. **Hidden Master** — they're the best at something nobody sees them do (medicine, craft, fighting, cooking, code, music)
3. **Disguised Royalty** — their bloodline/lineage is hidden (royal, noble, legendary family, dynasty)
4. **Returned Exile** — they were cast out once and came back quietly (from a country, family, industry, community)
5. **Retired Legend** — they were famous/feared once and walked away (warrior, surgeon, artist, champion, spy)
6. **Secret Benefactor** — they've been silently keeping things running (funding, protecting, supplying, creating)

**WHAT** (the humiliation):
1. **Public Accusation** — accused of wrongdoing in front of witnesses
2. **Betrayal by Trusted Person** — someone close turns on them (partner, mentor, sibling, friend)
3. **Cast Out** — expelled from the place they belong (fired, exiled, disowned, expelled, excommunicated)
4. **Stolen Credit** — their work/achievement is claimed by someone else
5. **Framed** — evidence is fabricated against them
6. **Wedding Ruined** — their ceremony/celebration/milestone is destroyed publicly

**HOW** (the revenge):
1. **Reveal True Identity** — the mask comes off, the truth speaks for itself
2. **Withdraw What They Depend On** — remove the support they didn't know came from you (money, protection, knowledge, supply, access, talent)
3. **Let Them Fail Without You** — step back and watch incompetence do the work
4. **Take What's Theirs** — acquire their position, territory, institution, audience, throne
5. **Show Up With Someone Better** — appear with a rival, a superior replacement, a more powerful ally
6. **Systematic Dismantling** — destroy their position piece by piece through evidence, alliances, or exposure

**WITH** (the relationship subplot — optional):
1. **Contract Marriage** — forced proximity through obligation
2. **Fake Dating** — pretending, then not pretending
3. **Childhood Promise** — an old bond resurfaces
4. **Ex Returns** — unfinished business walks back in
5. **Enemy to Lover** — the adversary becomes the interest
6. **Forbidden Connection** — the relationship crosses a line (class, faction, family, rival house)

**Freeform Tags** (with API keys only): An additional text field where the player can add setting/flavor keywords — "werewolves," "K-pop industry," "space station," "1920s Shanghai," etc. These get appended to the bible generation prompt. The four trope slots define story structure. The tags define world texture. The model does the rest.

UI: Draggable tiles into four slots. "Randomize All" button. Freeform tags input (when keys are set). Visual preview of the combination. "At the Mountains of MadLibs."

### 4.1 Bible Generation

Single LLM call. Input: four tropes + optional freeform tags. Output: structured story bible (~400-500 tokens).

**Bible Structure:**

```
IDENTITY
- Title
- One-line pitch
- Setting (place, time, milieu)

PROTAGONIST
- Name
- Public face (one sentence)
- Hidden truth (one sentence)
- The wound (one sentence)

ANTAGONIST
- Name, role
- Why they feel justified (one sentence)
- What they're protecting or pursuing (one sentence)

ENABLER
- Name, role
- Their relationship to the protagonist (one sentence)
- Why they fail the protagonist (one sentence)

CATALYST
- Name, role
- Why they're dangerous (one sentence)

WORLD
- Institution (the world the story takes place in)
- Key locations (3-4 specific places)
- What everyone assumes about the power structure (one sentence — this is what the reveal will shatter)

STAKES
- What the protagonist secretly holds (asset, ability, knowledge, proof, connection)
- What's being taken from them (position, reputation, credit, relationships, access)
- The tangible proof (the specific evidence, object, document, or skill demonstration that makes the truth undeniable)
- The ticking clock (what forces the timeline)

DRAMATIC IRONY
- What the reader knows from chapter one (one sentence)
- What the antagonist won't learn until too late (one sentence)
```

If WITH trope selected, add:

```
LOVE INTEREST
- Name, role
- Their connection to the conflict
- What keeps them apart (obligation, faction, misunderstanding, history, pride)
- What will bring them together
```

**Design rationale:** The bible is the novel's single source of truth. It fits in every prompt with room to spare. The model never needs to "remember" anything — the bible is the memory. This is why the pipeline works on mid-tier models with small context windows.

### 4.2 Beat Sheet Generation

Single LLM call. Input: bible. Output: 15 chapter beat entries.

**Arc Structure:**

**Act 1 — Fall (Ch 1-3)**
1. **The Mask** — The protagonist exists in their diminished form. The reader sees cracks: small moments that hint at what's underneath. The world treats the protagonist as less than they are. Establish what "normal" looks like so the reader feels its destruction.
2. **The Strike** — The humiliation happens. It's public, witnessed, and specific. The catalyst acts, the antagonist endorses or enables it. The protagonist loses standing in front of people whose opinion matters within this world. End: the damage is done.
3. **The Silence** — The one person who could have intervened didn't. The protagonist absorbs the blow without revealing their hand. The reader sees the first sign that this isn't grief — it's calculation. End: the protagonist makes one small, private move.

**Act 2A — Pressure (Ch 4-7)**
4. **The Strut** — The antagonist enjoys the new order. Whatever they gained — status, credit, position, admiration, control — they wear it openly. The world seems to validate their action. This chapter is for the reader to feel the injustice build.
5. **The Overreach** — The antagonist tries to operate in the space the protagonist secretly occupied. They don't understand why things aren't working. First cracks — small, deniable, but visible to the reader.
6. **The Quiet Move** — The protagonist acts once. Precisely. Through whatever channel their hidden power operates (money, connections, knowledge, authority, skill). The reader sees the cause. The antagonist only sees the effect — and misreads it.
7. **The Wobble** — The world begins to feel the protagonist's absence. Things that worked don't work. People who were comfortable aren't. Someone says the protagonist's name for the first time since the fall — not with respect yet, but with the beginning of doubt. End: the antagonist notices something is wrong but can't identify the source.

**Act 2B — Shift (Ch 8-11)**
8. **The Bleed** — Multiple things go wrong simultaneously. The antagonist's position weakens on several fronts. Someone beneath them starts questioning. The catalyst begins to look less like a hero and more like a liability. The comfortable people are no longer comfortable.
9. **The Offer** — The antagonist or enabler reaches out to the protagonist. Not an apology — a transaction. Come back, help us, on our terms. The protagonist refuses. This isn't pride — the reader knows the protagonist is already past needing them. End: the antagonist is shaken by the refusal.
10. **The Scope** — The reader sees the full picture for the first time. The protagonist's hidden power is revealed in its entirety — not to the antagonist, just to the reader. The scale of what's coming becomes clear. This is the chapter where the reader realizes the revenge isn't petty — it's structural.
11. **The Freefall** — Everything unravels at once. The catalyst is exposed or abandoned. The enabler tries to distance themselves. The antagonist's support network collapses. End: the protagonist's name — or their hidden identity — surfaces in a way the antagonist can't ignore.

**Act 3 — Rise (Ch 12-15)**
12. **The Reveal** — The protagonist's true nature becomes known to the antagonist. Face to face. The reader has waited twelve chapters for this moment. It must be specific, visual, and earned. The antagonist understands, all at once, the scale of their mistake.
13. **The Mirror** — The antagonist experiences a reflection of what they inflicted. Not identical — the protagonist isn't cruel in the same way — but the parallel is unmistakable. The catalyst faces consequences. The enabler faces their own cowardice. The power dynamic is fully inverted.
14. **The Terms** — The protagonist holds all the power and chooses what to do with it. This is the character-defining moment — mercy, justice, or destruction. The choice reveals who the protagonist actually is beneath the mask. If there's a love interest, this is where the relationship pivots.
15. **The Throne** — New equilibrium. Mirror of chapter 1 but inverted — the protagonist is visible where they were hidden, respected where they were dismissed. The world has reorganized around the truth. The last image should rhyme with the first. Something small, concrete, and resonant.

**Per-Chapter Entry:**
```
CHAPTER [N]: [Beat Name]
Summary: [One sentence]
Emotional temperature: [humiliation / tension / unease / satisfaction / triumph]
Characters present: [Names from bible]
Cliffhanger: [One sentence — the hook]
Dramatic irony: [What reader knows that characters don't — evolves per chapter]
```

**Design rationale:** Pure emotional/power state beats, not scene descriptions or actions. The bible provides the nouns; the beats provide the shape. "The Strut" works for an intern redecorating an office, a prince wearing a stolen crown, or a chef accepting a Michelin star for someone else's recipe. "The Quiet Move" works for a phone call to a lawyer, a letter to a king, or a single perfect dish served to the right person. No beat assumes any specific setting or industry.

### 4.3 Chapter Generation

Sequential calls, one per chapter. Each chapter is independent but receives context.

**Input per chapter:**
- Full bible (~400-500 tokens)
- Current chapter's beat entry (~80 tokens)
- Next chapter's beat entry (~80 tokens, so the model knows what the cliffhanger aims toward)
- One-line summary of each previous chapter (~15 tokens × N, generated as we go)
- Full text of the previous chapter (~1,500 tokens, for prose continuity)
- System prompt (~200 tokens)

**Total context per call:** ~2,500-3,000 tokens input at the worst case (chapter 15), ~1,500 tokens output. Comfortable on any model. Full previous chapter gives way better prose continuity than a 2-3 paragraph excerpt — rhythm, vocabulary, dialogue style all carry forward naturally.

**Why not the full beat sheet?** Giving the model the complete beat sheet lets it "peek ahead" at reveals it shouldn't reference yet. Instead: current beat, next beat, and rolling summaries of what's happened so far. The model knows where it is and where it's going next, but not the full arc.

**Chapter specs:**
- 800-1,200 words per chapter
- Short paragraphs (2-3 sentences)
- Heavy dialogue
- Phone-readable formatting (lots of white space)
- Every chapter ends on a cliffhanger
- Commercial, accessible prose — the prose should be invisible
- 3-4 minutes reading time on a phone

**Novel specs:**
- 15 chapters per novel
- ~15,000 words total
- Roughly novella length by traditional standards, full "novel" by platform standards

**The Automate Button:** Randomize tropes → generate bible → generate beat sheet → generate all 15 chapters → polish → package. Zero human input. One click. The Universal Paperclips moment.

### 4.4 Polish Pass

**Prevention (built into every chapter call):**
- Bible included in every prompt — model can't drift on names/numbers

**Deterministic checks (JavaScript, no API calls):**
- Extract proper nouns from each chapter, diff against bible
- Extract numbers/dollar amounts, flag mismatches
- Character presence checks (character who left a scene shouldn't be speaking)

**LLM review (single call, optional):**
- Feed bible + all chapters
- Ask for: timeline contradictions, character knowledge violations, tonal inconsistencies
- Output as flagged issues list
- Fix only affected passages, don't regenerate whole chapters

### 4.5 Packaging

Output: single JSON blob per novel.

```json
{
  "title": "Novel Title",
  "pitch": "One-line blurb",
  "genre_tags": ["revenge", "romance"],
  "author": "Generated pen name",
  "cover": "base64 image or null",
  "chapter_count": 15,
  "word_count": 15000,
  "bible": { ... },
  "beat_sheet": [ ... ],
  "chapters": [
    {
      "number": 1,
      "title": "Chapter 1",
      "text": "...",
      "word_count": 1050
    }
  ]
}
```

---

## 5. The Reader

The reader PWA is the student's primary output — a beautiful, functional serialized fiction reader. The default is clean, honest, and excellent. No dark patterns. No manipulation. Just a first-class reading experience.

### 5.1 Design Requirements

- **McMaster-Carr levels of snappy.** Everything pre-loaded. No loading spinners. Instant chapter transitions.
- **Perfect typography.** Warm background, gentle serif, generous line height. Reading experience that makes you forget you're in a browser.
- **Phone-first.** The course UI may be desktop (like 401), but the reader preview should render in a phone-shaped frame. The slop is consumed on phones.
- **Service worker.** Offline support. Add-to-homescreen. Splash screen. The reader should feel like a native app.
- **Pre-loaded content.** All chapters loaded from JSON on first fetch. No per-chapter network requests. Everything is already there.

### 5.2 Customization

The reader is fully customizable by the student:

- Typography (font, size, line height, paragraph spacing)
- Color scheme (background, text, accents)
- Layout (margins, max-width, chapter title style)
- Transitions (fade, slide, instant)
- Progress display (bar, percentage, chapter count, none)

The defaults ship as a beautiful, opinionated reading experience. The student can modify everything. The reader works perfectly out of the box.

### 5.3 Dark Patterns — Theory, Not Default

The course text discusses dark patterns where relevant — what GoodNovel does, why it works, what it costs the reader. Examples are discussed and explained:

- Fake "readers online" counters
- Fake review stars
- Engagement toast notifications ("Sarah from Ohio just started reading")
- Next chapter button manipulation
- Chapter-locking paywalls
- Interstitial ads

None of these ship in the default reader. The student understands them through the course, not by building them. If a student wants to add manipulation, the reader's architecture supports customization — but we don't build it for them and we don't make it a course requirement.

### 5.4 Ad Slot Architecture

The reader ships with pre-placed, hidden, empty ad slots at key positions. These are documented but inactive by default.

```html
<!-- AD SLOT: chapter-break (between chapters) -->
<div class="ad-slot ad-chapter-break" hidden></div>

<!-- AD SLOT: catalog (on the browse page) -->
<div class="ad-slot ad-catalog" hidden></div>

<!-- AD SLOT: interstitial (before first chapter — most hostile placement) -->
<div class="ad-slot ad-interstitial" hidden></div>
```

The reader JS includes lifecycle hooks for chapter transitions:

```javascript
reader.onChapterChange(chapterNumber) // fires on every chapter navigation
reader.onCatalogOpen()                // fires when browsing the catalog
reader.onFirstChapter()               // fires before the first chapter loads
```

These hooks exist so ad network refresh calls can be registered. In a single-page app, page-level ads go stale on navigation — the hooks solve this.

The reader does NOT ship ad SDK integration code. Ad networks vary and change constantly. Instead, a clearly commented integration guide:

```html
<!--
  AD INTEGRATION GUIDE (we strongly recommend against this)
  1. Unhide the ad-slot divs you want to use
  2. Paste your ad network's script tag in the head
  3. Register a refresh callback with the reader lifecycle hooks
  The distance between "beautiful free reader" and "ad-infested engagement trap"
  is uncommenting a div. That's worth knowing.
-->
```

**Design rationale:** Pretending monetization doesn't exist would be dishonest. The slots are honest about where ads would go, what they would disrupt, and how little effort it takes. We provide the mounting points, not the wiring. We recommend against it. We don't prevent it.

---

## 6. The Catalog

Once the student has multiple novels (pre-generated or self-generated), they browse and organize their library:

- Browse novels by cover and blurb
- Genre organization and tagging
- View pipeline artifacts for any novel (bible, beat sheet, chapter list)
- Sort by generation date, word count, trope combination

The catalog is the empire. The student sees their slop factory's output as a collection. The course discusses how real platforms add fake trending sections, simulated engagement metrics, and algorithmic recommendation — but the default catalog is just an honest library browser.

---

## 7. Export

### EPUB
- XHTML files in a zip (JSZip, client-side)
- Proper metadata, table of contents
- Cover image if available
- "An EPUB is just a website in a trenchcoat"

### DOCX
- XML in a zip (JSZip, client-side)
- Basic formatting, chapter breaks
- "A DOCX is XML that wished it was HTML"

### Deployable ZIP
- Reader HTML + novel JSON
- Ready to drag-and-drop into Cloudflare Pages
- No API keys anywhere in the package
- Static files only

Each export format is a mini-lesson in file format demystification.

---

## 8. Course Structure

### Chapter 1: The Anatomy
The student examines a pre-generated novel. See the tropes, the beat sheet, the bible behind it. Deconstruct why each chapter ends where it does. Discuss how platforms like GoodNovel use dark patterns to maximize engagement. "Here's why you kept tapping next chapter — and here's how the platform made sure you would."

**Skull 1: The Generator** — Awarded after completing the trope picker and generating (or examining) a bible and beat sheet.

### Chapter 2: At the Mountains of MadLibs
The trope picker. Four slots, drag tiles, see the bible update. The student understands that 1,296 combinations produce functionally the same story. The input space is finite. The output space is infinite. Every novel is different. Every novel is the same.

### Chapter 3: The Beat Sheet
Map the bible onto the 15-chapter arc. See Save the Cat's skeleton underneath. Edit the beats. Understand that every GoodNovel, every Marvel movie, every serialized drama uses this shape.

### Chapter 4: The Factory
Chapter generation pipeline. Watch chapters materialize. Edit, regenerate, iterate. The automate-everything button lives here. The Universal Paperclips moment.

**Skull 2: The Novel** — Awarded after generating (or examining) a complete 15-chapter novel.

### Chapter 5: The Reader
Build and customize the reader. Typography, color scheme, transitions, layout. The student produces a first-class reading experience. The course discusses what real platforms add on top — dark patterns, engagement tricks, manipulation — and why the default reader deliberately omits them.

**Skull 3: The Reader** — Awarded after customizing and previewing the reader with a novel loaded.

### Chapter 6: The Catalog
Multiple novels. Covers, blurbs, the library takes shape. Browse the collection. Discuss how platforms use fake metrics, trending sections, and algorithmic recommendation to drive engagement.

**Skull 4: The Catalog** — Awarded after building a multi-novel catalog.

### Chapter 7: The Package
Export: EPUB, DOCX, deployable ZIP. File format demystification. The student holds publication-ready artifacts.

**Skull 5: The Export** — Awarded after exporting in at least one format. The course is complete. All five skulls earned while everything is still local on the student's machine.

### The Certificate
Five generative skulls (algorithmically generated, unique per certificate).

"This certifies that [name] has completed Patchbay 501: The Eternal NaNoGenMo."

"What you do next is yours to carry."

"But at this point, you're legally allowed to say 'I am become slop.'"

### Post-Credits Appendix: Roads Not Taken (No Skulls)

Everything below is documentation, not instruction. No skulls. No achievements. Just facts about what exists beyond the course boundary.

**Deployment**
- Cloudflare Pages deployment guide (drag-and-drop upload, free, unlimited bandwidth, commercial use OK)
- How to connect a custom domain
- The entire deploy is: drag a folder, done

**Distribution Platforms**
- KDP documentation (3 books/day limit, AI disclosure checkbox, what it means for real authors, the 81-out-of-100 bestseller stat)
- WebNovel documentation (manual upload only, no API, natural friction barrier)
- YouTube pipeline sketch (TTS + generated images + ffmpeg, costs extra for TTS, left as exercise for the morally flexible)

**Monetization**
- How ad networks work (AdSense, lower-tier networks, approval process)
- The reader's pre-placed ad slots: where they are, what they disrupt, how to activate them
- How chapter-locking/paywall would work conceptually (the GoodNovel model: first 3 chapters free, rest behind coin purchases)
- How the reader's lifecycle hooks (onChapterChange, onCatalogOpen, onFirstChapter) support ad refresh in a single-page app
- Unit economics: what CPM rates look like, what kind of traffic you'd need, why the math usually doesn't work out for small operators
- "We strongly recommend against all of the above. But we built the slots because pretending the option doesn't exist would be dishonest."

**The Skull You Give Yourself**
- "You may consider adding another skull to your certificate if you do publish. We won't do it, though. It's all on you."

---

## 9. Pre-Generated Library

15-20 novels across major trope combinations, bundled as JSON. Each includes complete pipeline artifacts (bible, beat sheet, chapters) so the course can show every intermediate step.

### Recommended Combinations
Covering diverse settings and genre intersections:

1. Secret Heir + Public Accusation + Reveal True Identity + Contract Marriage
2. Hidden Master + Cast Out + Let Them Fail Without You + Enemy to Lover
3. Disguised Royalty + Betrayal by Trusted Person + Take What's Theirs + Forbidden Connection
4. Returned Exile + Stolen Credit + Show Up With Someone Better + Ex Returns
5. Retired Legend + Public Accusation + Reveal True Identity + Childhood Promise
6. Secret Benefactor + Framed + Withdraw What They Depend On + Fake Dating
7. Secret Heir + Wedding Ruined + Withdraw What They Depend On + Enemy to Lover
8. Hidden Master + Wedding Ruined + Systematic Dismantling + Enemy to Lover (the test combo from design session)
9. Disguised Royalty + Cast Out + Reveal True Identity + Contract Marriage
10. Returned Exile + Betrayal by Trusted Person + Let Them Fail Without You + Childhood Promise
11. Secret Heir + Framed + Take What's Theirs (no romance)
12. Retired Legend + Stolen Credit + Reveal True Identity + Forbidden Connection
13. Hidden Master + Public Accusation + Systematic Dismantling + Fake Dating
14. Secret Benefactor + Wedding Ruined + Withdraw What They Depend On + Ex Returns
15. Disguised Royalty + Framed + Systematic Dismantling + Forbidden Connection

Covers generated via NanoGPT image models. Fake author names, blurbs, and ratings generated alongside each novel.

### Size Budget
- ~15,000 words per novel × 15 novels = ~225,000 words
- ~1.5MB as compressed JSON
- Covers as compressed JPEGs: ~50KB each × 15 = ~750KB
- Total bundle: ~2.5MB
- Acceptable for a single HTML file with embedded data or a single fetch at load

---

## 10. Technical Architecture

### Single File Structure

```
index.html
├── Course UI (chapter navigation, skull tracking, progress)
├── Trope Picker (drag tiles, randomize)
├── Bible Editor (structured form, editable fields)
├── Beat Sheet Editor (timeline view, editable entries)
├── Chapter Generator (prompt assembly, API calls, streaming display)
├── Polish Engine (deterministic checks in JS, optional LLM review)
├── Reader Builder (typography, dark patterns, X-ray toggle)
├── Catalog View (multi-novel browse, fake analytics)
├── Export Engine (JSZip for EPUB/DOCX/ZIP)
├── Certificate Generator (canvas-drawn, generative skulls)
├── Pre-generated Library (embedded JSON or fetched on first load)
└── Provider Abstraction (Groq / NanoGPT / local / none)
```

### Provider Abstraction

Single interface, three backends. The student enters an API key and selects a provider. The pipeline code doesn't change — only the endpoint and model name.

```
Provider Interface:
  - generateText(prompt, options) → string
  - generateImage(prompt, options) → base64 (NanoGPT only)
  - isAvailable() → boolean
```

Groq and NanoGPT both support OpenAI-compatible endpoints, so the abstraction is thin.

### State Management

All state in localStorage/IndexedDB:
- Course progress (current chapter, skulls earned)
- Generated novels (bibles, beat sheets, chapters)
- Reader settings (dark pattern toggles, theme)
- Provider configuration (keys stored in memory only during session, or in localStorage at student's explicit choice)
- "Already saw the gauntlet" flag — wait, gauntlet removed. Just course progress.

### Versioning

Lightweight built-in version history:
- Each generation/edit snapshots the current state
- Roll back to any previous state
- Diff between versions
- Teaches versioning concept without Git overhead
- "Here's what version control is. Git is one implementation. Here's a minimal one in 50 lines of JS."

---

## 11. The Ethics

### Why This Course Should Exist
- The capability already exists. GoodNovel exists. The $497 grifter courses exist. The factories are running.
- Teaching the mechanism is the best inoculation against it. The kid who builds a slop pipeline will never fall for one.
- The "Let's Go Whaling" defense: the talk worked because it was honest. The audience left informed, not exploitative.
- The alternative is worse: people learn this from paid grifters who provide no ethical framework.

### Why This Course Might Be Dangerous
- A publicly available course with working code is a cookbook. Someone will use it.
- Every novel that lands on KDP makes it marginally harder for a human writer to get discovered.
- Contributing to the dead internet, even indirectly.

### The Course's Ethical Architecture
- **The course completes before deployment.** Five skulls, certificate, all earned while content is local.
- **We never publish.** We document publishing platforms. We don't automate or incentivize publishing to them.
- **We collect nothing.** No analytics, no referrals, no tracking. The course about manipulation is the least manipulative thing on the internet.
- **We're honest about what this is.** No euphemisms. The word "slop" is in the title.
- **The discomfort is the pedagogy.** The student should feel uncomfortable. That's the course working.

### Comparison: Malus
Malus.sh destroys a social contract — takes copyleft code and dissolves the licensing that protected it. It extracts value from specific humans who trusted the system. Patchbay 501 creates new garbage. The victims are diffuse (attention, culture, the information environment) but there's no individual whose work is stolen. Same knowledge, opposite intent: Malus obscures the mechanism to profit. The course reveals the mechanism to inoculate.

### The Line
"What you do next is yours to carry."

---

## 12. Game Jam Submission

### Requirements Met
- Browser-native: yes, single HTML file
- Instant load: yes, pre-generated library, no build step
- No login: yes, works with zero keys
- Interactive: yes, course progression, generation, building
- 90% AI-generated code: yes (the irony)

### Pitch
"Universal Paperclips but for AI-generated novels. Build a slop empire. Understand why you shouldn't. Five skulls. One HTML file. Zero cost."

### What Judges See
- Complete interactive experience without API keys
- Pre-generated library to browse
- Beautiful, customizable reader
- Export produces real EPUB/DOCX
- Certificate with generative skulls
- A game that's also a critique of the thing it simulates
- Pre-placed ad slots that are documented but deliberately empty

---

## 13. Build Priority

Given May 1 deadline:

### Week 1: Core Pipeline
- Trope picker UI
- Bible generation (Groq integration)
- Beat sheet generation
- Chapter generation with streaming display
- Basic chapter reader view

### Week 2: Reader & Catalog
- Full reader PWA (typography, transitions, progress, customization)
- Catalog view for multiple novels
- Ad slot architecture (hidden slots, lifecycle hooks, integration guide comment)
- Pre-generate the 15 novel library

### Week 3: Polish & Ship
- Export (EPUB, DOCX, ZIP)
- Certificate generator with skulls
- Course chapter flow and progression
- Provider abstraction (Groq / NanoGPT / none)
- Testing, polish, deploy to GitHub Pages
- Submit to jam

---

## 14. The Name

**Patchbay 501: The Eternal NaNoGenMo**
**Subtitle:** At the Mountains of MadLibs

NaNoGenMo (National Novel Generation Month) has run yearly since 2013 — code that generates 50k+ word novels. The human writing challenge (NaNoWriMo) died in 2025. The machine version lives on. "Eternal" because the code never stops running.

"At the Mountains of MadLibs" because the entire GoodNovel catalog is Mad Libs at novel scale. Fill in four blanks, get a novel.

**Certificate text:**
"This certifies that [name] has completed Patchbay 501: The Eternal NaNoGenMo."
"What you do next is yours to carry."
"But at this point, you're legally allowed to say 'I am become slop.'"

**Skulls:** Five, algorithmically generated, unique per certificate.
