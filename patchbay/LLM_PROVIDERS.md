# Patchbay — LLM Provider Architecture

## The Problem

The workshops originally hardcoded NanoGPT as the sole LLM provider. NanoGPT is great (CORS-friendly, pay-per-prompt, OpenAI-compatible), but it requires a paid account. This creates a barrier for casual users who just want to try the workshops.

## CORS Testing (2025-02-18)

Tested browser CORS preflight (`OPTIONS` with `Origin` header) against candidate APIs:

| Provider | CORS `Access-Control-Allow-Origin` | Free Tier | API Format |
|---|---|---|---|
| **NanoGPT** | `*` ✅ | No (pay-per-use) | OpenAI-compatible |
| **Gemini** | ❌ No headers at all | Yes (gutted Dec 2025) | Custom |
| **OpenRouter** | `*` ✅ | 31 free models | OpenAI-compatible |
| **Groq** | `*` ✅ | Yes (rate-limited) | OpenAI-compatible |
| **Ollama** (localhost) | `*` ✅ (default) | N/A (local) | OpenAI-compatible |

Gemini was eliminated immediately — no CORS headers means no browser `fetch()` from a different origin, full stop. Would require a proxy server, which defeats the "single HTML file" philosophy.

Groq works but the free tier is rate-limited and there's no "free models" concept — just one pool of models with usage caps. Could be a future addition.

### OpenRouter Free Models (as of Feb 2025)

31 models at zero cost, including heavyweights:

- `meta-llama/llama-3.3-70b-instruct:free` (128k ctx)
- `deepseek/deepseek-r1-0528:free` (163k ctx)
- `google/gemma-3-27b-it:free` (131k ctx)
- `nousresearch/hermes-3-llama-3.1-405b:free` (131k ctx)
- `qwen/qwen3-coder:free` (262k ctx)
- `mistralai/mistral-small-3.1-24b-instruct:free` (128k ctx)

Free tier requires an account but no credit card.

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
  openrouter: {
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
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
- **OpenRouter:** `GET /v1/models` → detect free models by `:free` suffix or `pricing.prompt === '0'`, show free group first
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
- **OpenRouter:** https://openrouter.ai/keys (keys), `https://openrouter.ai/api/v1/` (base)
- **Ollama:** https://ollama.com (install), `http://localhost:11434/v1/` (base, default port)
- **WebLLM:** https://github.com/mlc-ai/web-llm (library), https://webllm.mlc.ai (demo)
- **Deployed:** https://endarthur.github.io/etc/patchbay/
