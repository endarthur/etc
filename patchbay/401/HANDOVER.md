# Patchbay Workshop 401 — Claude Code Handover

## What This Is

An interactive HTML workshop that teaches agent fundamentals by having the student **build** a personal AI assistant inside a miniature desktop OS. The student configures an LLM, picks a workspace folder, writes a system prompt (`soul.md`), and progressively adds tools, memory, and skills across 10 chapters. The workshop is a single HTML file (no build step, no server) designed as a PWA-installable page.

**Author**: Arthur (endarthur), geostatistician at Vale, open-source developer, Patchbay series creator.
**Series context**: 101 (APIs), 201 (Bots), 301 (Flows), 401 (Agents).

## Files

- **`workshop-401.html`** — The workshop itself (~1522 lines). Single-file HTML app.
- **`workshop-401-design.md`** — Full design document (~855 lines). Architecture, chapter outlines, UI specs, visual language, all design decisions.

## What's Built (Chapters 0–1)

### Working Right Now
- **Desktop OS shell** — Draggable/resizable windows, dock, status bar, dot-grid wallpaper
- **Settings window** — 5 LLM providers:
  - **NanoGPT** — fetches models from `/api/subscription/v1/models` (subscription-included only), falls back to curated list
  - **Groq** — fetches from `/openai/v1/models` (auth required), filters out non-chat models, falls back to known free-tier models. Free tier, no credit card, fast LPU inference
  - **Ollama** — manual model input + refresh from local `/api/tags`
  - **Custom** — any OpenAI-compatible endpoint (URL + key + model ID)
  - **Demo** — mock responses, no API needed, for UI testing
- **FSAA workspace** — File System Access API folder picker with safety gates:
  - Refuses system folders (Desktop, Documents, .ssh, etc.)
  - Warns on non-empty folders with scary checkbox confirmation
  - Refuses 100+ file folders
  - Creates: `soul.md`, `memory.json`, `notes/`, `skills/`, `logs/`, `.patchbay-agent-workspace`
- **Vault persistence (OPFS + Web Crypto + IndexedDB)** — just implemented, needs testing:
  - Secrets (API keys, tokens, provider config) stored in Origin Private File System
  - Optional passphrase protection using PBKDF2 → AES-GCM
  - Workspace `FileSystemDirectoryHandle` persisted in IndexedDB, re-granted via `requestPermission()` on next session
  - Boot flow: first visit → welcome splash; return without passphrase → auto-load + "Waking up..." animation; return with passphrase → unlock screen
  - Settings has Security section: set/change/remove passphrase, "Clear All Secrets & Reset"
  - Nothing touches localStorage. Nothing enters the workspace folder.
- **Terminal** — Styled trace output with colored left borders per line type:
  - 🧠 purple (thinking), 🔧 cyan (tool), 👁 green (observe), 💬 white (reply), 📱 blue (Telegram)
  - Sticky input bar at bottom, proper scrolling
  - `you›` prefix for direct input, `📱›` for Telegram messages
- **Inspector (🔬)** — 4 tabs: Soul (editable `soul.md`), Tools (JSON schema), History (messages array), Raw (last API req/res)
- **Log (📋)** — Clickable entries that expand to show full request/response JSON, token counts, latency
- **Agent loop** — Chapter 1 basic chat: system prompt from `soul.md`, conversation history, direct LLM call (no tools yet)
- **Chapter guide sidebar** — Toggleable via ≡, chapters 0–1 have content, 2–9 are locked

### Boot Flow (New)
```
page load → boot()
  ├─ no vault → splash: "Begin Chapter 0: Setup →"
  ├─ vault (no passphrase) → auto-load secrets + restore workspace handle → desktop
  └─ vault (has passphrase) → splash: passphrase input → decrypt → desktop
```

### Visual Language
- **Fonts**: JetBrains Mono (terminal/code), DM Sans (UI)
- **Colors**: --bg:#111114, --green:#4ade80, --cyan:#22d3ee, --amber:#fbbf24, --purple:#a78bfa, --blue:#60a5fa, --red:#f87171
- **Scrollbars**: Thin styled (webkit + Firefox)
- **Dark theme throughout**, dot-grid wallpaper on desktop

## What Needs Building Next

### Immediate (before Chapter 2)
1. **Test the vault persistence** — the OPFS + crypto + IDB code was just written and hasn't been tested in a browser. Need to verify:
   - First-time flow: welcome → settings → enter key → vault saves
   - Page reload without passphrase: auto-restores secrets + workspace
   - Set passphrase → reload → unlock screen → decrypt → desktop
   - Wrong passphrase → error message → retry
   - Reset → clears everything → welcome screen
   - Workspace handle restore via `requestPermission()` prompt
2. **Fix any boot flow bugs** — the splash state transitions are new

### Chapter 2: Tools
- Add `save_note`, `read_note`, `list_files` tool definitions
- Wire tools into the LLM call (function calling / tool_use)
- Tool calls show in terminal trace with 🔧 prefix
- Inspector Tools tab shows live JSON schema
- Log entries for tool calls include args + return values
- Skill approval modal for later chapters
- This is the biggest chapter — goes from chat-only to actual agent

### Chapters 3–9
See `workshop-401-design.md` for full outlines. Summary:
- **3: The Workspace** — mkdir, move, delete (with confirmation gate), FSAA safety tiers
- **4: Memory** — memory.json persistent key-value store, context window vs persistence
- **5: Skills** — Builtin skills in skills/ folder, system prompt built from skill descriptions
- **6: Skill Creation** — Agent proposes skill JS, human reviews in approval modal
- **7: The Organizer** — Capstone: friend's use case (save ideas, grocery lists via Telegram)
- **8: What Comes Next** — OpenClaw, Computer Use, agent framework evaluation, trust spectrum
- **9: Going Local** — Ollama, frontier vs local tradeoff, privacy angle

### Telegram Integration
- Telegram Bot API polling (long-poll `/getUpdates`)
- Messages feed into same agent loop as terminal
- Terminal shows `📱› message` prefix
- Status bar shows Telegram connection state
- PiP mini-terminal includes tiny input line

### Other TODO
- Skill complexity cap (max line count, max API calls)
- Graduation path: export workspace + 50-line Node.js server
- Zip download for workspace backup
- Desktop file icons (double-click to open in file viewer)

## Architecture Patterns

### Agent Loop (ReAct)
```
user message → build system prompt from soul.md
            → add conversation history
            → add tool definitions (Ch.2+)
            → call LLM
            → if tool_call → execute tool → add result → call LLM again
            → if text response → display in terminal
```

### FSAA Safety Tiers
```
Tier 0 (block):  System folders — refused at picker
Tier 1 (warn):   Non-empty folders — checkbox confirmation
Tier 2 (safe):   Empty folders or known workspaces — immediate
```

### Workspace = Agent Identity
```
my-agent/
├── .patchbay-agent-workspace    ← marker + config
├── soul.md                      ← system prompt (editable)
├── memory.json                  ← persistent key-value
├── notes/                       ← user content
├── skills/                      ← capability definitions (.js)
└── logs/                        ← audit trail (JSONL)
```

### Key Design Decisions
- **soul.md** named to callback to Tracy Kidder's book title AND match OpenClaw's `soul.md` — so students recognize it in Chapter 8
- **No xterm.js** — our terminal is a styled div with colored borders, not a real terminal emulator. We don't need escape sequences.
- **Secrets never enter workspace** — OPFS vault is invisible to the agent, invisible to the filesystem
- **Demo provider exists** for UI testing without API keys
- **Model lists fetched from API with fallback** — NanoGPT subscription endpoint, Groq models endpoint (with auth), hardcoded fallbacks when API is unreachable

## Code Patterns

### Settings → Vault flow
```
oninput handler → saveSetting(key, val)
  → STATE[key] = val (immediate)
  → scheduleVaultSave() (debounced 400ms)
    → Vault.save(secrets, passphrase) → OPFS write
```

### Provider config rendering
Each provider has a `renderProviderConfig(p)` branch that generates the right form fields. NanoGPT/Groq auto-fetch models, Ollama has refresh, Custom has manual fields, Demo needs nothing.

### Window manager
Simple z-index stacking, mousedown drag/resize, dock toggles. Windows identified by `id="win-*"`, dock items mapped via `DOCK_MAP`.

## Notes for Claude Code

- The HTML file should be served locally for testing. Use `python3 -m http.server 8080` or similar — OPFS needs a secure context (localhost works, file:// is unreliable).
- Arthur's username is `endarthur` across platforms.
- The workshop is in English but the agent handles multilingual input natively (important: Arthur is Brazilian).
- The "Geoscientific Chaos Union" / "neo-dadaist engineering" vibe means the workshop can have personality, but the technical content must be rigorous.
- Previous workshops (101–301) exist but aren't in scope here. This is standalone.
- Arthur prefers English naming for projects, not Portuguese.
