# Patchbay — LLM Provider Architecture

## The Problem

The workshops originally hardcoded NanoGPT as the sole LLM provider. NanoGPT is great (CORS-friendly, pay-per-prompt, OpenAI-compatible), but it requires a paid account. This creates a barrier for casual users who just want to try the workshops.

## CORS Testing (2025-02-18)

Tested browser CORS preflight (`OPTIONS` with `Origin` header) against candidate APIs:

| Provider | CORS `Access-Control-Allow-Origin` | Free Tier | API Format |
|---|---|---|---|
| **NanoGPT** | `*` ✅ | No (pay-per-use) | OpenAI-compatible |
| **Gemini** | ❌ No headers at all | Yes (gutted Dec 2025) | Custom |
| **OpenRouter** | `*` ✅ | 31 free models | OpenAI-compatible | *(removed — replaced by Groq)* |
| **Groq** | `*` ✅ | Yes (rate-limited) | OpenAI-compatible |
| **Ollama** (localhost) | `*` ✅ (default) | N/A (local) | OpenAI-compatible |

Gemini was eliminated immediately — no CORS headers means no browser `fetch()` from a different origin, full stop. Would require a proxy server, which defeats the "single HTML file" philosophy.

Groq replaced OpenRouter as the free-tier provider in Feb 2026. OpenRouter's free models proved unreliable in practice (degraded quality, excess capacity). Groq's free tier runs on dedicated LPU hardware with consistent speed, generous rate limits (up to 14.4K req/day for lighter models), and no credit card required.

### Groq Free Tier Models (as of Feb 2026)

All models available to free tier, rate-limited per model:

- `llama-3.3-70b-versatile` (131k ctx, 1K req/day, 100K tokens/day) — best quality
- `meta-llama/llama-4-scout-17b-16e-instruct` (1K req/day, 500K tokens/day)
- `qwen/qwen3-32b` (1K req/day, 500K tokens/day) — strong multilingual
- `llama-3.1-8b-instant` (131k ctx, 14.4K req/day, 500K tokens/day) — most generous limits
- `meta-llama/llama-4-maverick-17b-128e-instruct` (1K req/day, 500K tokens/day)
- `moonshotai/kimi-k2-instruct` (1K req/day, 300K tokens/day)

Free tier requires an account but no credit card. Models endpoint requires API key auth (`GET /openai/v1/models`).

### Ollama / Localhost

Browsers special-case `localhost` as a "potentially trustworthy origin," so an `https://` page (like GitHub Pages) _can_ fetch from `http://localhost`. Ollama ships with `Access-Control-Allow-Origin: *` by default. This means the workshops genuinely work offline if the user has Ollama running.

Ollama exposes an OpenAI-compatible API at `http://localhost:11434/v1/`, including `/v1/models` and `/v1/chat/completions`.

## Implementation

All three providers use the identical OpenAI chat completions format:

```
POST {base_url}/v1/chat/completions
Authorization: Bearer {key}    ← omitted for local
Content-Type: application/json

{
  "model": "...",
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."}
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

The only differences are the base URL and whether an auth header is needed.

### Provider Config Object

Each workshop defines:

```javascript
const LLM_PROVIDERS = {
  nanogpt: {
    name: 'NanoGPT',
    baseUrl: 'https://nano-gpt.com/api/v1',
    hint: '...',
    needsKey: true,
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    hint: '...',
    needsKey: true,
  },
  local: {
    name: 'Local (Ollama)',
    baseUrl: 'http://localhost:11434/v1',
    hint: '...',
    needsKey: false,
  }
};
```

Helper functions:

- `getProvider()` → reads the dropdown value
- `getChatUrl()` → `{baseUrl}/chat/completions`
- `onProviderChange()` → updates hint text, toggles key field visibility, reloads model list

### Model Loading Per Provider

- **NanoGPT:** `GET /v1/models?detailed=true` → filter by `subscription.included`, group by detected provider family, star featured models
- **Groq:** `GET /openai/v1/models` (requires API key auth) → filter out non-chat models (whisper, guard, orpheus), flat list sorted alphabetically
- **Local:** `GET /v1/models` → flat list of whatever's pulled, fallback message if Ollama isn't running

### Per-Workshop Differences

| Workshop | Provider scope | Key field | Notes |
|---|---|---|---|
| **101 API** | Global (one dropdown for the page) | Hidden when local | Exports (Python, HTML, cURL) use dynamic URLs |
| **201 Bot** | Global | Hidden when local | `callLLM()` conditionally adds auth; start validation skips key check for local |
| **301 Flow** | Per-node (`df-provider` in each LLM Chat node) | Always visible (placeholder says "not needed for local") | Each node in a flow can target a different provider |

The flow workshop has per-node providers because a single flow might wire nodes to different backends (e.g., a cheap local model for classification, a cloud model for generation).

## Future: In-Browser LLM (WebLLM)

Tested viability of running a real model in the browser tab itself via [WebLLM](https://github.com/mlc-ai/web-llm) (MLC-AI):

**How it works:** Compiles transformer models to WebGPU shaders. Downloads model weights on first run, caches in browser storage. Inference runs on GPU.

**Viable models:**
- SmolLM2-135M (~270MB download) — smallest, marginal quality
- SmolLM2-360M (~720MB) — slightly better
- Qwen2.5-0.5B (~1GB) — probably the minimum for coherent conversation
- Llama 3.2 1B (~2GB) — decent but large download
- Phi-3.5-mini 3.8B (~4GB) — good quality but impractical for workshop

**Practical assessment:**
- First-run download is hundreds of MB (cached after)
- 135M models produce semi-coherent output at best
- WebGPU is Chrome/Edge only (Firefox behind flag, Safari partial)
- True offline after download — genuinely works on a plane
- The download/init process is itself educational ("what _is_ a model?")

**Recommendation:** Better as a standalone **Workshop 102** ("Your Browser Is a Neural Network") rather than a fourth provider option. It's a fundamentally different UX (download progress bar, model warm-up, quality caveats) that would clutter the existing provider dropdown. As a dedicated workshop it could explore what a model _is_ at the weight level — tokenization, attention, the whole pipeline — while the student watches it happen in real time in their browser tab.

### WebLLM API Shape

WebLLM exposes an OpenAI-compatible interface:

```javascript
import { CreateMLCEngine } from "@mlc-ai/web-llm";

const engine = await CreateMLCEngine("SmolLM2-135M-Instruct-q4f16_1-MLC", {
  initProgressCallback: (progress) => console.log(progress.text)
});

const reply = await engine.chat.completions.create({
  messages: [{ role: "user", content: "Tell me about golden retrievers" }],
  temperature: 0.7,
  max_tokens: 256,
});
```

So the request/response shapes are the same as the cloud providers — only the transport layer differs (in-process function call vs. HTTP fetch). A Workshop 102 could use this to show that "API" is just a calling convention, and the same conversation can happen over HTTP to a datacenter, over localhost to your own machine, or entirely inside the browser tab.

## File Inventory

```
patchbay/
├── index.html           Landing page with hover effects + zip download
├── api_workshop.html    101 — API basics (GET + POST + chaining)
├── bot_workshop.html    201 — Telegram bot with polling loop
├── flow_workshop.html   301 — Visual flow editor (Drawflow)
└── api_demo.html        Standalone API sandbox (still NanoGPT-only*)
```

*`api_demo.html` was not updated in this pass since it's not part of the main trilogy or the zip bundle. It could be updated to match, or retired in favor of the 101 workshop which supersedes it.

## Key URLs

- **NanoGPT:** https://nano-gpt.com/api (keys), `https://nano-gpt.com/api/v1/` (base)
- **Groq:** https://console.groq.com/keys (keys), `https://api.groq.com/openai/v1/` (base)
- **Ollama:** https://ollama.com (install), `http://localhost:11434/v1/` (base, default port)
- **WebLLM:** https://github.com/mlc-ai/web-llm (library), https://webllm.mlc.ai (demo)
- **Deployed:** https://endarthur.github.io/etc/patchbay/
