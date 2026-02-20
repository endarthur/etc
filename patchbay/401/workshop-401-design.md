# 🕵️ Patchbay Workshop 401 — Raising the Soul of a New Machine

**An AI assistant you build, understand, and control.**

*"Your friend is about to install OpenClaw. This workshop is the vaccine."*

Title reference: Tracy Kidder, *The Soul of a New Machine* (1981, Pulitzer Prize).
A book about engineers building a computer, told from the human side.
Here, the student builds a machine that has memory, skills, a home folder — raising its soul step by step.

---

## Vision

Workshop 401 teaches AI agents by having the student build one from scratch — a personal assistant that lives in a folder, talks through Telegram, remembers things, organizes notes, and can learn new skills. By the end, the student has a genuinely useful tool AND understands exactly what commercial agent frameworks (OpenClaw/Moltbot, Claude Computer Use, etc.) are doing under the hood.

The workshop UI is a **miniature desktop operating system** — the agent's computer that you watch over its shoulder. When you text it from Telegram, you see the machine think.

### Pedagogical Philosophy

- **401 requires 101 + 201 + 301 as conceptual background.** Not literally (the workshop is self-contained), but the ideas build on: API calls (101), conversation loops (201), tool orchestration (301).
- **Build first, name later.** The student builds a loop with tools before anyone says "agent" or "ReAct."
- **The friend test.** If Arthur's friend can text his agent "lembra de comprar leite" from Telegram and see it saved to a grocery list in the workspace, the workshop has succeeded.
- **Safety as first-class content, not afterthought.** Every permission grant is visible, every tool call is logged, every skill is reviewed before installation. The student learns WHY agents need guardrails by experiencing the alternative.
- **Dual interface.** The agent is reachable from both the workshop's terminal AND Telegram. The desktop page is the "behind the curtain" view; Telegram is the "product" surface. Both feed the same loop.

---

## Target User

The same person from 101/201/301: a curious non-programmer who has seen AI demos, maybe uses ChatGPT, and is now hearing about "agents" and considering installing one. They should leave 401 understanding:

1. What an agent actually is (a loop, not magic)
2. Why giving AI access to your computer is a big deal
3. How to evaluate whether an agent framework (open-source or otherwise) is trustworthy
4. That they've already built something as useful as most existing offerings for the "second brain" use case

---

## UI Concept — The Agent's Desktop

### The Metaphor

The workshop is a miniature OS. The agent doesn't just run in a panel — it has a desktop, files, a terminal, apps. This maps directly to what commercial agents do (operate a computer), but here the computer is tiny, transparent, and safe.

The pedagogical trick: the desktop **populates as the student progresses through chapters**. Chapter 1 starts with just a terminal window on an empty desktop. By chapter 7, there's a dock full of apps, files scattered on the desktop, a memory viewer, a skills manager.

### Window System

Windows are draggable, resizable divs with title bars. Implemented similarly to 301's node dragging — mousedown/mousemove/mouseup on the title bar, resize handle at bottom-right corner.

```
┌─────────────────────────────────────────────────────────────┐
│ ≡ Patchbay 401                              🟢 ✈ [?] [PiP] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ Terminal ─────────────────────┐  📄 grocery_list.md     │
│  │ you> lembra de comprar leite   │  📄 ideias_projeto.md   │
│  │                                │  📁 skills/             │
│  │ 🧠 checking existing lists...  │                         │
│  │ 🔧 $ cat notes/grocery_list.md │  ┌─ Memory ──────────┐ │
│  │   - ovos                       │  │ nome: Ricardo     │ │
│  │   - pão                        │  │ dog: Rex          │ │
│  │ 🔧 $ echo "- leite" >>        │  │ mercado: terça    │ │
│  │     notes/grocery_list.md      │  │ ...               │ │
│  │ 👁 ✓ appended (4 items)        │  └───────────────────┘ │
│  │ 💬 Pronto! Adicionei leite.    │                         │
│  │    Agora tem 4 itens na lista. │                         │
│  │                                │                         │
│  │ 📱 what's on my grocery list?  │  (📱 = from Telegram)  │
│  │ 🧠 checking grocery list...    │                         │
│  │                                │                         │
│  │ [____________________________] │  (direct input here)   │
│  └────────────────────────────────┘                         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🖥 Terminal  📁 Files  🧠 Memory  ⚡ Skills  📋 Log  ⚙ Settings │
└─────────────────────────────────────────────────────────────┘

Status bar: 🟢 = agent idle, ✈ = Telegram connected
Terminal: accepts direct input AND shows Telegram messages (prefixed 📱)
```

### Window Types

| Window | When it appears | Content |
|--------|----------------|---------|
| **Terminal** | Chapter 1 (always open) | Chat + agent trace. The primary interaction surface. Accepts direct input AND shows Telegram messages (📱 prefix). |
| **File Viewer** | Chapter 3 (double-click file) | Markdown rendered or raw text. Read-only for human. soul.md is editable here. |
| **Memory** | Chapter 4 (dock icon) | Live key-value viewer. Entries pulse amber when updated. |
| **Skills** | Chapter 5 (dock icon) | Installed skills list. Approval modal for new skills. |
| **Log** | Chapter 2 (dock icon) | Collapsed one-liners (timestamp, action, result). Click to expand: full request/response JSON, token counts in/out, latency ms, tool args/return values. A mini network inspector scoped to the agent loop. |
| **Inspector** | Chapter 1 (🔬 dock icon) | Tabs: **System Prompt** (editable textarea showing soul.md + injected context), **Tools** (JSON schema, editable), **History** (full messages array, read-only), **Raw** (last API request/response as JSON). The "view source" for the entire agent. |
| **Settings** | Chapter 0 (dock icon) | API keys, Telegram token, workspace folder, model selection. |

### Desktop Elements

- **Wallpaper**: subtle dark grid pattern (GCU aesthetic), maybe with a faint circuit/node pattern
- **File icons**: appear/disappear as agent creates/deletes files. Brief glow animation on write, lift animation on read
- **Dock**: bottom bar with app icons, chapter-gated (grayed out until unlocked)
- **Status bar**: top bar with agent status (idle / thinking / acting), Telegram connection indicator (🟢/🔴), workspace path
- **Desktop context menu**: right-click for "New Note" (creates via agent), "Refresh", "About"

### Terminal Design

The terminal is the heart. It's a hybrid: you type natural language (not commands), but the agent's work renders as terminal output. This demystifies the agent by showing it as "a thing that runs commands."

**Dual interface:** The terminal on the desktop page accepts direct input AND Telegram messages feed into the same agent loop. Both show the same trace. The student can talk to their agent from the workshop page, from Telegram on their phone, or both. Messages from Telegram are prefixed with `📱` in the terminal so you can tell them apart.

```
┌─ Terminal ──────────────────────────────── [_] [□] [×] ─┐
│                                                          │
│ 🟢 Agent ready. Workspace: ~/my-agent                    │
│ Connected to Telegram as @meu_assistente_bot             │
│                                                          │
│ 📱 organize my notes by topic                            │
│                                                          │
│ 🧠 Let me check what notes exist and categorize them.    │
│ 🔧 $ ls notes/                                          │
│   grocery_list.md  idea_app.md  idea_garden.md           │
│   meeting_friday.md  recipe_bolo.md                      │
│ 🔧 $ cat notes/idea_app.md                              │
│   App para rastrear plantas do jardim                    │
│ 🔧 $ cat notes/idea_garden.md                           │
│   Comprar mudas de tomate e manjericão                   │
│ 🔧 $ mkdir notes/ideias notes/casa notes/trabalho       │
│ 🔧 $ mv notes/idea_app.md notes/ideias/                 │
│ 🔧 $ mv notes/idea_garden.md notes/casa/                │
│ 🔧 $ mv notes/recipe_bolo.md notes/casa/                │
│ 🔧 $ mv notes/meeting_friday.md notes/trabalho/         │
│ 👁 ✓ Reorganized 4 files into 3 folders                  │
│ 💬 Pronto! Organizei assim:                              │
│    📁 ideias/ — app de plantas                           │
│    📁 casa/ — jardim, receita de bolo                    │
│    📁 trabalho/ — reunião de sexta                       │
│    📁 (kept grocery_list.md at top level)                 │
│                                                          │
│ you> _                                                   │
└──────────────────────────────────────────────────────────┘
```

### Visual Language for Agent Steps

| Icon | Meaning | Color | Terminal rendering |
|------|---------|-------|--------------------|
| 🧠 | Thinking/reasoning | dim white/gray | Italic, indented |
| 🔧 | Tool call | cyan | `$ command` syntax |
| 👁 | Observation/result | green | `✓` or `✗` prefix |
| 💬 | Reply to user | white (bright) | Normal weight |
| ⚠️ | Warning/error | amber | Bold |
| 🛑 | Blocked/refused | red | Bold, with explanation |

### Document-in-Picture (PiP)

When the workshop is installed as a PWA, a [PiP] button in the top bar pops out a tiny floating terminal (via Document Picture-in-Picture API). This floats above other windows on the user's actual desktop.

The PiP window has:
- Last ~10 lines of terminal output, auto-scrolling (status monitor)
- A tiny input line at the bottom — type a quick message without switching to the full workshop
- Agent status indicator (idle/thinking/acting)

Use case: you're browsing the web, pop the PiP, type "lembra de comprar leite," see the agent process it, keep browsing. Or text from Telegram on your phone and watch the trace in the floating window on your laptop.

Fallback for browsers without Document PiP support: a detachable window via `window.open()` with the same terminal view.

---

## Architecture

### LLM Backend

Same tri-provider pattern as 101/201/301:
- **NanoGPT** (cheap, good frontier models) — recommended for full experience
- **Groq** (free tier, fast LPU inference) — zero cost entry point, no credit card needed
- **Ollama** (local, free, private) — runs on your hardware, no API keys

None of these use Anthropic's API — the workshop targets people who aren't spending serious money on API keys. NanoGPT gives access to frontier-class open models (DeepSeek, Qwen, etc.) for pennies. Groq's free tier runs on custom LPU hardware with generous rate limits and no credit card required. Ollama runs everything locally.

The agent loop burns more tokens than 201's chat bot. The workshop should show a running token/cost counter to teach awareness.

**Dedicated chapter on local vs frontier:** Ollama running a 7B model on your laptop vs DeepSeek-V3 on NanoGPT. What can each do? Where does the small model fail at tool selection? When is local good enough? This is practical knowledge most "agent tutorials" skip entirely.

### Telegram Integration

Reuses the long-polling approach from 201. The bot receives messages, feeds them into the agent loop, sends replies back.

**Critical distinction: Commands vs Natural Language**

```
Commands (bypass LLM entirely):
  /start     — greeting, workspace status
  /status    — show agent state, memory stats, file count
  /files     — list workspace contents
  /skills    — list installed skills
  /memory    — dump memory.json
  /forget    — clear a memory key
  /logs      — recent activity log
  /help      — command reference
  /stop      — pause agent (stops processing NL)
  /nuke      — clear workspace (with confirmation)
  /export    — zip workspace contents

Natural Language (goes through LLM agent loop):
  "lembra de comprar leite"
  "organize my notes"
  "what's on my grocery list?"
  "cria um skill pra resumir textos longos"
```

The workshop explicitly teaches this: commands are deterministic, instant, free (no API calls). NL is probabilistic, slow, costs tokens. Some things SHOULD be commands. The `/stop` command is especially important — it's the emergency brake. If the agent is looping or doing something weird, `/stop` kills it immediately without going through the LLM.

Over Telegram, the agent should prefix its NL responses with a subtle indicator so the user knows it "thought" vs just executed:

```
User: /files
Bot:  📁 notes/ (3 files)
      📁 skills/ (2 files)
      📄 memory.json

User: what's on my grocery list?
Bot:  🧠 Sua lista de compras tem:
      - ovos
      - pão
      - café
      - leite
```

### File System Access API (FSAA) Workspace

On first launch, the workshop asks the user to pick (or create) a folder. This is the agent's entire world.

**Folder validation tiers:**

```
🛑 REFUSE (explain why):
   - Root directories (/, C:\)
   - Home directory (~, C:\Users\X)
   - System folders (Desktop, Documents, Downloads, AppData, .ssh, .config)
   - Any folder with >100 existing files
   - Any folder containing .git, node_modules, .env, package.json
   - Any folder with a path depth < 3 from root

⚠️ WARN (scary amber modal, require checkbox confirmation):
   - Any folder with 1-100 existing files
   - "This folder contains N files. The agent will be able to
      READ, WRITE, and DELETE any file in this folder.
      Are you absolutely sure?"
   - List first 10 filenames so user sees what's at risk

✅ ACCEPT (ideal path):
   - Empty folder, or folder with only .patchbay-agent-workspace marker
   - Workshop suggests: create a new folder called "my-agent" or similar
```

**The marker file: `.patchbay-agent-workspace`**

Created on first successful folder selection. Contains:
```json
{
  "created": "2026-02-18T...",
  "workshop": "patchbay-401",
  "version": "1.0.0",
  "owner": "user's chosen agent name"
}
```

On subsequent launches, if the user picks a folder that already has this marker, skip the scary warnings — it's a known workspace. This teaches the concept of workspace registration.

**FSAA permission lifecycle:**

The browser will prompt for permission each session (security feature, can't bypass). The workshop explains this: "Your browser is protecting you. Every time you open the workshop, it asks again — this is good. Commercial agents that run as system services DON'T ask again, which is why they're riskier."

### Workspace Structure

```
my-agent/
├── .patchbay-agent-workspace          ← marker + config
├── soul.md                            ← persona, instructions, personality
├── memory.json                        ← persistent key-value store
├── notes/                             ← user content
│   ├── grocery_list.md
│   ├── ideias/
│   │   └── app_plantas.md
│   └── ...
├── skills/                            ← capability definitions
│   ├── _builtin_save_note.js          ← ships with workshop
│   ├── _builtin_read_note.js
│   ├── _builtin_list_files.js
│   ├── _builtin_search_notes.js
│   ├── _builtin_manage_memory.js
│   └── grocery_manager.js             ← agent-created (approved)
└── logs/                              ← activity log
    ├── 2026-02-18.jsonl
    └── 2026-02-19.jsonl
```

**soul.md** is the system prompt — the persona, instructions, and personality of the agent. The student edits it directly (file viewer or Inspector) and the agent loop reads it fresh each turn, so changes take effect immediately. Chapter 1 starts with a bare skeleton ("You are a helpful assistant that lives in a folder.") and by Chapter 7 it has grown organically to include memory context, skill descriptions, language preferences, and personality.

The name is a deliberate callback to the workshop title (Tracy Kidder's *The Soul of a New Machine*) and happens to match OpenClaw's `soul.md` — so when the student encounters OpenClaw in Chapter 8, they'll recognize the concept immediately. That's the vaccine working.

### Sandbox for Agent-Created Skills

Skills are JS files with a specific structure:

```javascript
// skill: grocery_manager
// description: Manages grocery/shopping lists with categories
// trigger: when user mentions groceries, shopping, supermarket, mercado

export default {
  name: "grocery_manager",
  description: "Manages grocery/shopping lists with categories",
  
  async run({ workspace, memory, args }) {
    const list = await workspace.read("notes/grocery_list.md") || "";
    const items = list.split("\n").filter(l => l.startsWith("- "));
    
    if (args.action === "add") {
      const newList = list + `\n- ${args.item}`;
      await workspace.write("notes/grocery_list.md", newList);
      return { added: args.item, total: items.length + 1 };
    }
    
    if (args.action === "list") {
      return { items, total: items.length };
    }
  }
};
```

**The sandbox API available to skills:**

```javascript
const skillAPI = {
  // Workspace (scoped to the agent folder)
  workspace: {
    read(path),              // read file contents
    write(path, content),    // write/overwrite file
    append(path, content),   // append to file
    list(path),              // list directory
    exists(path),            // check if file exists
    mkdir(path),             // create directory
    remove(path),            // delete file (with log)
    move(from, to),          // rename/move
  },
  
  // Memory (key-value)
  memory: {
    get(key),
    set(key, value),
    delete(key),
    keys(),
    search(query),           // fuzzy search over values
  },
  
  // Network (restricted)
  fetch(url),                // HTTP GET/POST (same CORS limits as browser)
  
  // LLM (nested call — an agent's skill can ask the LLM)
  llm(prompt),
  
  // Utilities
  Date, JSON, Math,
  console: { log, warn, error },  // goes to the log panel
};

// NOT available (and attempting to access them is a teaching moment):
// - document, window, globalThis
// - eval, Function
// - import, require  
// - localStorage, IndexedDB (use workspace/memory instead)
// - process, child_process, fs (use workspace instead)
```

Skills run inside a `new Function()` with only the sandbox object in scope. If a skill tries to access `window` or `document`, it gets an error — and the workshop uses this moment to teach: "This is why sandboxing matters. The skill tried to escape its box."

### The Agent Loop (ReAct)

```
┌─────────┐
│  INPUT   │◄─── Telegram message or Terminal input
└────┬─────┘
     │
     ▼
┌─────────┐     ┌──────────────┐
│  THINK   │────►│ System prompt │ Contains: persona, available tools,
└────┬─────┘     │ + memory      │ active skills, workspace summary,
     │           │ + recent log  │ conversation history
     │           └──────────────┘
     ▼
 ┌───────┐  yes  ┌─────────┐
 │ Tool?  │─────►│  ACT    │──► Execute tool / skill
 └───┬────┘      └────┬────┘
     │ no             │
     │           ┌────▼────┐
     │           │ OBSERVE  │──► Read result, add to context
     │           └────┬────┘
     │                │
     │           ┌────▼────┐
     │           │ Continue?│──► Back to THINK (max N iterations)
     │           └────┬────┘
     │                │ no
     ▼                ▼
┌─────────────────────────┐
│         REPLY           │──► Send to Telegram + Terminal
└─────────────────────────┘
```

**Safety rails on the loop:**

- **Max iterations**: configurable, default 5. If the agent loops 5 times without replying, force a reply. Teach: "Agents can get stuck. This is the seatbelt."
- **Token budget**: per-turn token limit. Show the cost accumulating.
- **Dangerous action gate**: file deletion requires confirmation in the terminal. Skill creation requires approval modal. The agent can propose, but the human decides.
- **Rate limiting**: max 1 LLM call per 2 seconds. Prevents runaway loops from burning credits.

---

## Chapters

### Chapter 0 — Setup
**Dock state:** ⚙ Settings only
**Desktop state:** Empty, just wallpaper

Configure: LLM provider + key, Telegram bot token (from 201, or create new), workspace folder selection (FSAA).

The folder picker flow:
1. "Create or choose a folder for your agent"
2. User picks folder → validation
3. If valid: create marker file, create `notes/`, `skills/`, `logs/` dirs
4. Success: "Your agent has a home. Everything it does happens inside this folder."

### Chapter 1 — The Loop
**Dock state:** 🖥 Terminal + ⚙ Settings
**Desktop state:** Empty + terminal window

The simplest possible agent: an LLM that loops. No tools yet. Just: user says something → model responds → user says something → model responds. BUT: render the "think" step explicitly.

```
you> olá!
🧠 The user is greeting me. I should respond warmly.
💬 Olá! Sou seu assistente. Como posso ajudar?
```

The student sees: every response has a thinking step. The model isn't just echoing — it reasons. This is the foundation.

**Key concept taught:** The system prompt. The student sees (and can edit) the system prompt that defines the agent's persona. Change it, watch behavior change.

### Chapter 2 — Tools
**Dock state:** 🖥 Terminal + 📋 Log + ⚙ Settings
**Desktop state:** Terminal + log window available

Add one tool: `save_note(filename, content)`. The model can now decide to call it.

```
you> preciso lembrar de ligar pro dentista amanhã
🧠 The user wants to remember something. I should save this as a note.
🔧 $ save_note("notes/lembrete_dentista.md", "Ligar pro dentista")
👁 ✓ Created notes/lembrete_dentista.md
💬 Anotado! Salvei um lembrete sobre o dentista.
```

A file icon appears on the desktop. The student double-clicks it and sees the content.

Then add `read_note`, `list_files`. Now the agent can save AND retrieve.

```
you> o que eu preciso fazer?
🧠 Let me check what notes exist.
🔧 $ list_files("notes/")
👁 lembrete_dentista.md, grocery_list.md
🔧 $ read_note("notes/lembrete_dentista.md")
👁 "Ligar pro dentista"
🔧 $ read_note("notes/grocery_list.md")
👁 "- ovos\n- pão"
💬 Você tem duas coisas pendentes:
   1. Ligar pro dentista
   2. Compras: ovos e pão
```

**Key concept taught:** The model CHOSE to call those tools. Nobody wired a graph (like 301). The model read the tool descriptions and decided. This is the fundamental difference.

**Key concept taught:** The log window shows every action as JSONL. This is the audit trail. "If you can't see what the agent did, you can't trust it."

### Chapter 3 — The Workspace
**Dock state:** 🖥 Terminal + 📁 Files + 📋 Log + ⚙ Settings
**Desktop state:** File icons appear, files browser in dock

Expand the toolset: `mkdir`, `move_file`, `delete_file`, `search_notes`.

The student asks the agent to organize files. Files move around on the desktop. Folders appear. The agent creates structure.

**Key concept taught:** `delete_file` has a confirmation gate. The terminal shows:

```
🔧 $ delete_file("notes/old_note.md")
⚠️ Agent wants to DELETE notes/old_note.md
   Contents: "Ideia antiga que não uso mais"
   [Allow] [Deny]
```

If the student clicks Allow, the file disappears from the desktop. If Deny, the agent gets an error and has to handle it gracefully.

"This is the moment. An agent asked to delete your data. You said no. OpenClaw doesn't ask."

### Chapter 4 — Memory
**Dock state:** 🖥 Terminal + 📁 Files + 🧠 Memory + 📋 Log + ⚙ Settings
**Desktop state:** Full, memory panel available

Add `memory.json` — a persistent key-value store the agent reads on startup.

```
you> meu cachorro se chama Rex
🧠 The user is sharing personal info. I should remember this.
🔧 $ memory_set("dog_name", "Rex")
👁 ✓ Memorized: dog_name = Rex
💬 Boa! Vou lembrar que o Rex é seu cachorro. 🐕

(... next session ...)

you> como era o nome do meu cachorro mesmo?
🧠 Let me check memory for pet info.
🔧 $ memory_get("dog_name")
👁 "Rex"
💬 Seu cachorro é o Rex!
```

The Memory panel shows entries appearing/updating in real time.

**Key concept taught:** Context window vs persistent memory. The LLM forgets between sessions. Memory.json survives. The student sees the system prompt getting the memory injected: "You know the following about the user: dog_name=Rex, mercado=terça..."

### Chapter 5 — Skills
**Dock state:** 🖥 Terminal + 📁 Files + 🧠 Memory + ⚡ Skills + 📋 Log + ⚙ Settings
**Desktop state:** Full dock

Introduce the skills folder. Builtin skills are pre-installed:
- `_builtin_save_note.js`
- `_builtin_read_note.js`
- `_builtin_list_files.js`
- `_builtin_search_notes.js`
- `_builtin_manage_memory.js`

The student sees: these are just files. They define what tools the agent has. Add a file → agent gets a new capability. Delete a file → capability gone. This is how OpenClaw's skills work.

**Key concept taught:** The system prompt is dynamically built from the skills folder. Each skill's name + description gets injected. The model reads these and knows what it can do.

### Chapter 6 — Skill Creation
The capstone safety lesson.

```
you> cria um skill pra gerenciar minha lista de compras com categorias

🧠 The user wants a specialized grocery skill. I'll propose one.
⚡ SKILL PROPOSAL: grocery_manager
   "Manages grocery lists with categories (frutas, limpeza, etc.)"
   
   ┌─ Approval Required ─────────────────────────────────┐
   │                                                      │
   │  ⚡ New Skill: grocery_manager                       │
   │                                                      │
   │  Description:                                        │
   │  Manages grocery/shopping lists with add, remove,    │
   │  categorize, and list operations.                    │
   │                                                      │
   │  APIs used:                                          │
   │    ✅ workspace.read                                 │
   │    ✅ workspace.write                                │
   │    ✅ workspace.exists                               │
   │    ⬜ memory (not used)                              │
   │    ⬜ fetch (not used)                               │
   │    ⬜ llm (not used)                                 │
   │                                                      │
   │  Code:                                               │
   │  ┌────────────────────────────────────────────────┐  │
   │  │ async run({ workspace, args }) {               │  │
   │  │   const list = await workspace.read(           │  │
   │  │     "notes/grocery_list.md") || "";            │  │
   │  │   ...                                          │  │
   │  └────────────────────────────────────────────────┘  │
   │                                                      │
   │  [ ✅ Approve & Install ]    [ 🛑 Reject ]          │
   │                                                      │
   └──────────────────────────────────────────────────────┘
```

**Key concept taught:** Code review. "You just reviewed an AI-generated program before letting it run. This is what responsible agent deployment looks like. Most people skip this step."

If the student approves, the skill file appears in `skills/` on the desktop. The agent can now use it.

If the student rejects, the agent handles it: "Ok, sem problema. Quer que eu tente uma versão diferente?"

### Chapter 7 — The Organizer (Capstone)
Everything together. The friend's use case:

"Meu principal uso seria um segundo cérebro. Lembrar de coisas e organizá-las pra mim. Tipo, mando uma msg com uma ideia, uma lista de supermercado etc. Ele vai salvando e organizando."

The student uses their agent for real: saves ideas, manages lists, asks questions about their own notes, lets the agent reorganize things. By this point the agent has memory, skills, file access, and a working Telegram interface.

This chapter is less teaching and more *using*. A few prompts to try, but mostly free exploration.

### Chapter 8 — What Comes Next
**No new features. All teaching.**

- What agent frameworks like OpenClaw/Moltbot actually do (same loop, bigger toolbox, less guardrails) — these are open-source tools, not mysterious black boxes
- What "computer use" means (screenshot → click — Anthropic and others offer APIs where an AI literally sees your screen and controls your mouse. Impressive and terrifying.)
- How to evaluate any agent framework: what permissions does it request? Can you see the logs? Can you revoke access? Is there a confirmation gate?
- The spectrum of trust: your workshop agent (sandboxed folder) → OpenClaw (configured permissions) → full computer use (everything)
- "You built this. You understand it. You can run it. You might not need anything else."

### Chapter 9 — Going Local
**Ollama and the frontier/local tradeoff.**

- Install Ollama, pull a model (qwen2.5:7b or similar)
- Point the workshop at localhost:11434
- Run the same agent tasks from earlier chapters — what works? What breaks?
- Small models struggle with: complex tool selection, multi-step planning, structured JSON output
- Small models handle fine: simple save/retrieve, single-tool tasks, memory lookups
- When is local good enough? When do you need a frontier model?
- Privacy angle: everything stays on your machine. No API keys, no token costs, no data leaving your network.
- "Your agent now runs entirely offline. No company sees your grocery list."

---

## PWA Configuration

### manifest.json
```json
{
  "name": "Patchbay 401 — Raising the Soul of a New Machine",
  "short_name": "Soul 401",
  "description": "An AI assistant you build, understand, and control",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1a1a1e",
  "background_color": "#1a1a1e",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker

Cache-first for the HTML + assets. The workshop should work offline except for LLM calls and Telegram polling.

The service worker also enables background sync: if the user sends a Telegram message while the workshop tab is in the background, the SW can wake it up (with limitations).

### Document Picture-in-Picture

```javascript
// Pop out a mini terminal
async function popOutTerminal() {
  const pipWindow = await documentPictureInPicture.requestWindow({
    width: 400,
    height: 300,
  });
  // Clone minimal terminal view into pip window
  // Auto-scrolls, shows last ~10 lines
  // No input (use Telegram instead)
}
```

The PiP terminal is a "status monitor" — you see the agent working while you do other things. Text from your phone, watch the trace on your desktop. This is the full experience.

---

## Telegram Command Architecture

### Command Categories

**Deterministic commands (no LLM, instant, free):**
```
/start      — Welcome message + workspace status
/status     — Agent state, uptime, memory entries, file count, token usage
/files      — List workspace (tree view)
/cat <path> — Read a specific file
/skills     — List installed skills with descriptions
/memory     — Dump memory.json formatted
/forget <k> — Delete a memory key
/log [n]    — Last N log entries (default 5)
/help       — Full command reference
/stop       — Pause agent processing (safety brake)
/resume     — Resume after /stop
/export     — Generate and send workspace zip
/nuke       — Clear workspace (requires /nuke CONFIRM)
```

**NL passthrough (goes through agent loop):**
Everything else. Any message that doesn't start with `/` enters the ReAct loop.

**Workshop teaches this explicitly:**

"Commands are like light switches — deterministic, instant, reliable.
Natural language is like asking someone — probabilistic, slow, creative.
Use commands for CHECKING state. Use NL for DOING things.
`/files` is free and instant. 'What files do I have?' costs tokens and takes 3 seconds.
Both work. One is better."

### Telegram-specific Agent Behaviors

- **Voice notes**: Show as playable audio + "Transcrição não disponível (futuro!)" for now
- **Images**: Show as thumbnails + "Não consigo ver imagens ainda" (honest limitation)
- **Group chats**: Refuse to join. Agents should be private. Teach why.
- **Forwarded messages**: Agent notes these as "forwarded" in context — useful for "save this article someone sent me"

---

## Visual Design

### Color Palette (extends Patchbay/GCU vocabulary)

```
--bg:           #1a1a1e     (desktop wallpaper base)
--surface:      #252529     (window backgrounds)
--window-title: #2a2a2e     (title bars)
--border:       #3a3a42
--text:         #e8e8ec
--text-dim:     #888890
--text-faint:   #555560
--green:        #4ade80     (agent reply, success)
--cyan:         #22d3ee     (tool calls, commands)
--amber:        #fbbf24     (warnings, memory updates)
--red:          #f87171     (errors, dangerous actions)
--purple:       #a78bfa     (thinking steps)
--blue:         #60a5fa     (observations)
```

### Typography

```
--display: 'Space Grotesk', sans-serif    (window titles, headers)
--mono:    'JetBrains Mono', monospace    (terminal, code, file contents)
--body:    'Inter', sans-serif            (settings, descriptions)
```

### Desktop Wallpaper

Faint dot grid on dark background. Clean, minimal, professional.

### Animations

- **File appear**: scale 0→1 with slight bounce, 300ms
- **File read**: icon lifts slightly + glow, 200ms
- **File write**: amber pulse on icon, 300ms
- **File delete**: fade out + slight shrink, 300ms
- **Memory update**: amber wave across memory panel entry
- **Skill install**: slide into skills panel + brief sparkle
- **Window open**: scale 0.9→1 + fade, 200ms
- **Thinking**: slow purple pulse on terminal line
- **Tool call**: cyan flash on the `$` prefix
- **PiP detach**: window "lifts off" the desktop

---

## Technical Considerations

### File Size

The main concern. Estimated budget:
- HTML/CSS/JS: ~80KB (comparable to Arborist at 4500 lines)
- Fonts: loaded from CDN (or subset embedded)
- No heavy libraries (no D3, no Three.js, no TensorFlow)
- Total: should stay under 200KB for the HTML file itself

External CDN dependencies:
- xterm.js (~150KB) — optional, could use a simple div-based terminal instead
- highlight.js (~30KB) — for code preview in skill approval

Actually: a div-based terminal with monospace font is probably better than xterm.js. Simpler, lighter, and we don't need real terminal emulation — just styled text output. The "terminal" aesthetic is CSS, not a library.

### State Management

All state lives in two places:
1. **Workspace folder** (FSAA) — files, skills, memory, logs
2. **Session state** (JS variables) — conversation history, current loop state, UI state

No IndexedDB, no localStorage for critical data. The folder IS the database. This is pedagogically clean: "want to back up your agent? Copy the folder."

Settings (API keys, Telegram token) live in localStorage since they're not workspace-specific.

### Error Handling

Agents fail a lot. The workshop must handle this gracefully:
- LLM API error → show in terminal with amber warning, suggest checking key
- Tool execution error → show in terminal, agent sees the error and can adapt
- FSAA permission revoked → big modal: "Connection to workspace lost. Click to reconnect."
- Telegram disconnect → status bar goes red, auto-reconnect with backoff
- Skill runtime error → caught and shown in terminal, skill marked as "errored"

### Security Considerations

- Skills run in `new Function()` scope, not `eval()` (slightly safer, can control scope)
- No skill can access DOM, window, or globals
- File operations are all async and go through a logging layer
- The log is append-only (agent can't delete logs)
- Memory.json has a max size (1MB) to prevent runaway writes
- Rate limiting on LLM calls prevents cost spirals
- `/stop` is always available as escape hatch

---

## Resolved Design Decisions

1. **Workspace sync**: Yes — offer zip download of workspace. Useful for backup and for eventual migration to a server-based agent.

2. **Multi-device**: The workspace is on one computer. If the student texts from Telegram, the workshop page must be open. Explain this limitation clearly. A real server-side agent would solve this — that's the "graduation path."

3. **Language**: English for the UI/workshop text. The agent itself handles multilingual input fine — DeepSeek, Qwen, etc. all handle Portuguese. The student can talk to their agent in whatever language they want.

4. **Desktop wallpaper**: Faint dot grid. Clean, minimal.

5. **OpenClaw framing**: Open-source agent framework, not "commercial." The risk isn't monetization — it's that powerful tools in the hands of users who don't understand them can cause harm.

## Open Questions

1. **Collaboration with 301**: A Flow Workshop flow that triggers an agent action? Probably belongs in a future 501 if ever.

2. **Graduation path**: If the student outgrows the workshop, what's the next step? "Export your workspace, here's a 50-line Node.js server that runs the same agent loop 24/7." This bridges to OpenClaw territory properly.

3. **Skill complexity cap**: Should agent-created skills have a max line count? A max number of API calls? This prevents the agent from writing a 200-line skill that's impossible to review.

---

## File Structure

```
patchbay-401/
├── index.html              ← main workshop (single file, WA)
├── manifest.json           ← PWA manifest
├── sw.js                   ← service worker
├── icon-192.png            ← PWA icon
├── icon-512.png            ← PWA icon
└── README.md
```

The `index.html` is the workshop. Everything else is PWA scaffolding.
The workshop itself remains a single HTML file that works without the PWA wrapper.

---

## Name

**Patchbay Workshop 401 — Raising the Soul of a New Machine**

Reference: Tracy Kidder, *The Soul of a New Machine* (1981, Pulitzer Prize for General Nonfiction). A book about Data General engineers building a minicomputer, told as a human story about the people who built it. The title works on every level:

- The student literally raises a machine from nothing — empty folder to thinking agent
- Each chapter adds a piece of the "soul" — memory, skills, personality, judgment
- The reference lands for those who know it, and works as evocative language for those who don't
- It's warm and humanistic, not dystopian — which matches the workshop's tone

Subhead: "An AI assistant you build, understand, and control."

---

*Part of the Patchbay workshop series. Geoscientific Chaos Union.*
