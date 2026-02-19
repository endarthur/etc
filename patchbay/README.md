# Patchbay

**"Plug things into other things until something happens."**

A trilogy of single-file HTML workshops that teach API literacy from first principles. No frameworks, no build steps, no installs. Download, open, break stuff.

Live: https://endarthur.github.io/etc/patchbay/

## Philosophy

The target audience is anyone who's curious about APIs but has never made one talk. Could be a geologist who scripts in Python but has never seen a raw HTTP request. Could be a designer who wants to understand what the backend team is actually doing. Could be a student who's used ChatGPT but has no idea what happens between typing a message and getting a response.

Each workshop is a single self-contained HTML file. No server, no npm, no Docker. Open it in a browser and start clicking. The workshops are designed to be worked through in order — each one reframes what you learned in the previous one — but they also stand alone.

The aesthetic is "terminal with guardrails": dark background, monospace where it matters, but with enough color and structure that it doesn't feel hostile. IBM Plex Mono for code, IBM Plex Sans for prose, Fraunces for display headings.

## The Trilogy

### 101 — API Workshop (`api_workshop.html`, ~72KB)

**Concept:** What is an API call, mechanically?

Teaches GET and POST requests using two real APIs:
- **Dog CEO** (free, no key): Build a URL piece by piece, see the JSON response, understand query parameters
- **LLM Chat Completion** (configurable provider): Construct a POST request with headers, body, authentication — see every byte that goes over the wire

Culminates in **chaining**: the output of Dog CEO (a breed name) becomes the input to the LLM (a prompt asking for a fun fact). This is the fundamental pattern behind every app that talks to more than one service.

**Exports:** The exact request the student built can be exported as Python, standalone HTML, or cURL — runnable code they take home.

**Key panels:** URL builder with live preview, JSON syntax-highlighted request/response, headers explainer, model selector with metadata, temperature/max_tokens sliders.

### 201 — Bot Workshop (`bot_workshop.html`, ~76KB)

**Concept:** What happens when an API call triggers another API call automatically?

Builds a Telegram bot from scratch using only browser `fetch()`. The student:
1. Creates a bot via BotFather, pastes the token
2. Calls `getMe` to verify it works
3. Sets up a command menu via `setMyCommands`
4. Implements a **polling loop** that checks for messages, routes commands, and responds
5. Chains Dog CEO → LLM → Telegram `sendPhoto` for the `/dog` command
6. Adds `/ask` for freeform LLM conversation
7. Builds **custom commands** with prompt templates
8. Implements **memory** (the bot remembers things across messages)
9. Adds **tool use** via XML tags (the LLM can request dog photos and store memories)

**Key insight:** The bot is just a `while(true)` loop making the same API calls the student made by hand in Workshop 101, with `if/else` to route different commands. There's no magic.

**Features:** Access control (allowlist by Telegram user ID), live activity log with expandable raw request/response details, custom command editor with `{input}` template variables, memory panel, tool tag system.

### 301 — Flow Workshop (`flow_workshop.html`, ~228KB)

**Concept:** What if you could _see_ the program?

A visual node-based flow editor (built on Drawflow) where API calls are boxes and data flows along wires. 17 guided chapters introduce nodes incrementally:

| Ch | Topic | Nodes Introduced |
|----|-------|-----------------|
| 0 | The Assembly Line | Concept of nodes + wires |
| 1 | Manual Trigger | Manual Trigger |
| 2 | Display Result | Display Result |
| 3 | HTTP GET | HTTP GET Request |
| 4 | JSON Extract | JSON Extract |
| 5 | Template Strings | Template |
| 6 | The Dog Fact Pipeline | LLM Chat (5-node chain) |
| 7 | Debugging | Debug Log |
| 8 | Branching | If/Else, Compare |
| 9 | Variables | Set Variable, Read Variable |
| 10 | Loops & Timers | Delay, Counter (loops via wiring) |
| 11 | Merging Data | Merge |
| 12 | Telegram Integration | TG Send Message, TG Send Photo |
| 13 | Config & Secrets | Config panel, `$variable` resolution |
| 14 | Telegram Bot as Flow | Full bot recreation from 201 |
| 15 | Error Handling | Try/Catch |
| 16 | Free Build | Open sandbox, Easter egg |

**Key insight:** The student rebuilds the exact same Telegram bot from Workshop 201, but as a visible graph instead of imperative code. Same API calls, same logic, different representation. "Want a new command? Add a branch. Want to log messages? Tap a Set Variable in."

**Features:** 27 node types, drag-and-drop from sidebar palette, project save/load/export/import via localStorage, 6 example flows in gallery, node resize handles, auto-save every 30s, zoom controls, keyboard shortcuts (Delete to remove, right-click context), "Free Bird" Easter egg in the final chapter, Drawflow attribution.

## LLM Provider System

All three workshops support three LLM backends via a shared provider abstraction. They all use the OpenAI chat completions format (`POST /v1/chat/completions`), differing only in base URL and auth.

| Provider | Key Required | Cost | Internet | Model Source |
|---|---|---|---|---|
| **NanoGPT** | Yes | Pay-per-prompt | Yes | 100+ models via aggregator |
| **Groq** | Yes (free account) | Free (rate-limited) | Yes | 6 free models on LPU hardware (Llama 3.3 70B, Llama 4, Qwen3, etc.) |
| **Local / Ollama** | No | Free | No | Whatever's `ollama pull`'d |

Workshops 101 and 201 have a single global provider selector. Workshop 301 has per-node provider selection (each LLM Chat node can target a different backend).

See [LLM_PROVIDERS.md](LLM_PROVIDERS.md) for CORS test results, implementation details, and the WebLLM/browser-side inference research.

## File Inventory

```
patchbay/
├── index.html             Landing page — card layout, hover effects, zip download
├── api_workshop.html      101 — GET, POST, chaining, code exports
├── bot_workshop.html      201 — Telegram bot with polling, memory, tool use
├── flow_workshop.html     301 — Visual flow editor, 17 chapters, 27 nodes
├── api_demo.html          Standalone API sandbox (older, NanoGPT-only)
├── LLM_PROVIDERS.md       LLM provider architecture + CORS research
└── README.md              This file
```

The landing page bundles all four workshop files into a `patchbay.zip` via JSZip (fetched from CDN). The zip works from GitHub Pages but not from `file://` due to CORS on the relative fetches.

`api_demo.html` predates the trilogy and hasn't been updated to the multi-provider system. It could be retired — the 101 workshop supersedes it entirely.

## Technical Notes

### Single-File Architecture

Each HTML file contains all CSS, JS, and content inline. No external stylesheets, no separate JS files, no asset loading (except CDN fonts and, for the flow workshop, the Drawflow library). This is deliberate:

- Download one file, open it, done
- Works offline (after font cache / with system font fallback)
- No build step, no broken imports, no CORS issues between files
- Easy to inspect — view source shows everything

The tradeoff is file size (the flow workshop is 228KB) but that's still smaller than most hero images.

### Shared Design Language

- **Fonts:** IBM Plex Mono (code), IBM Plex Sans (prose), Fraunces (display) — all from Google Fonts CDN
- **Colors:** Amber (`#e5a430`) for primary actions, cyan (`#3ec9d1`) for info/links, green (`#5ccc5c`) for success/output, red (`#cc4444`) for errors, purple (`#a78bfa`) for LLM nodes
- **Panels:** Dark surface (`#1e1e1c`) with traffic-light dots (macOS-style), monospace labels
- **Pattern:** Every interactive panel follows: label → hint text → input → live preview → send button → response area → raw JSON toggle

### Key Dependencies

| Workshop | External Dependencies |
|---|---|
| 101 API | Google Fonts (IBM Plex family + Fraunces) |
| 201 Bot | Google Fonts |
| 301 Flow | Google Fonts, Drawflow 0.0.59 (MIT, by Jero Soler) from CDN |
| Landing | Google Fonts, JSZip 3.10.1 from CDN (for zip download only) |

### localStorage Usage

- **101:** None
- **201:** Saves access control settings, custom commands, memory entries (`bot-workshop-*` keys)
- **301:** Saves projects with full flow state (`flow-workshop-projects` key), auto-saves every 30s

### Browser Compatibility

Tested in Chrome/Edge (primary target). Firefox and Safari should work for 101 and 201. The flow workshop uses Drawflow which has broad compatibility. WebGPU (if a future 102 is built) is Chrome/Edge only.

The `localhost` fetch from `https://` pages (for Ollama) works in all modern browsers — `localhost` is treated as a secure context.

## Future Ideas

### Workshop 102 — Browser-Side Inference (WebLLM)

Run a real neural network in the browser tab. Uses MLC-AI's WebLLM to compile transformer models to WebGPU shaders. SmolLM2-135M (~270MB) would be the smallest viable model. The download/init process is itself educational — watching weights load is a concrete answer to "what _is_ a model?"

Could explore tokenization, attention visualization, the difference between 135M and 70B parameters, why temperature works the way it does at the logit level. The student would see the same OpenAI-compatible API shape — same request, same response — but the inference happens in their own browser tab instead of crossing the internet.

### Workshop 401 — MCP / Tool Use

Formal tool calling with JSON schemas. The XML-tag tool system in 201 is a stepping stone; real tool use with structured schemas and multi-turn agent loops would be the next level. Could build an agent that chains arbitrary APIs based on user intent.

### Translations, Forks, Reposts

The workshops are English-only. Translations, forks, adaptations, and reposts are welcome — no permission needed. The single-file architecture makes forking straightforward: take the HTML, translate the prose, keep the code. If you do translate one, a PR or a heads-up would be appreciated but isn't required.

### Assessment / Exercises

Each chapter could end with a small challenge ("now wire X to Y and make it do Z") with a check button that validates the flow state. The flow workshop's project system already has the infrastructure for this.
