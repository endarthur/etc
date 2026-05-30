# Atlas de Sabores

A small, self-contained tool for exploring how ingredients pair — built from the
[Epicure](https://arxiv.org/abs/2605.22391) ingredient embeddings. Type an ingredient
and see what it goes with; build a pantry and check whether it hangs together; roam a
map where the clusters turned out to be cuisines. Works in Portuguese, English, Spanish,
and German.

**Live:** https://endarthur.github.io/etc/atlas/

It's one HTML file. No build step, no runtime dependencies, no server — the embeddings
are baked in and everything runs in the browser. Open `index.html` by double-clicking it
and it works offline.

## What it does

- **Explorar** — pick any of ~1,790 ingredients and see its nearest neighbours, ranked.
  Two extras live here: a **Tradição / Química / Mistura** toggle that re-ranks pairings
  by a different model (see below), and **flavor-push** buttons that nudge an ingredient
  along a sensory axis (sweet, umami, sour, spicy, herbal, smoky) to see what it drifts
  toward.
- **Despensa** — add several ingredients and get a 0–100 harmony score for the set, the
  loosest-fitting member called out, and suggestions for what would round it out. Pantries
  persist between visits and can be shared (see *Sharing*).
- **Ponte** — pick two ingredients; it finds what bridges them.
- **Mapa** — all the ingredients as a draggable, zoomable map. The 14 clusters
  self-organised into recognisable cuisines.
- **Sobre** — a plain-language explanation plus references for going deeper.

Every ingredient also carries a four-language dictionary card (PT · EN · ES · DE); tap a
language to copy that term.

## How it works

Each ingredient is a point in a 300-dimension space learned from millions of recipes.
Ingredients used in similar ways end up near each other, and that nearness is what the
tool calls "pairing" (measured by cosine similarity).

The numbers come from **Epicure**, which ships three embeddings of the same vocabulary:

- **Tradition** (co-occurrence) — what cooks actually put together.
- **Chemistry** — what shares aroma compounds.
- **Blend** — a balance of the two.

Switching between them answers a real question: do two ingredients pair out of *habit* or
out of *chemistry*? (Strawberry is a nice example — tradition pairs it with raspberry and
ice cream; chemistry pairs it with cream, peach, and apple.)

- **Harmony** is the average pairwise similarity of a set, scored relative to random pairs
  — so it's a *relative* reading, not an absolute truth.
- The **map** is a t-SNE projection of the Tradition embedding with automatic clustering.
- **Flavor-push** axes are estimated from anchor ingredients (sweet ≈ sugar/honey/vanilla
  minus salt/soy). They're an approximation, not the paper's own sensory directions.
- **Translations** are machine-translated (MyMemory) with the culinary terms reviewed by
  hand; the canonical English always stays visible so any translation is verifiable.

## What it isn't

These are statistical patterns from recipes, not rules of cooking. The underlying corpus
skews Western and English-language, so the Atlas knows soul-food collard greens far better
than Minas-style couve. And like any embedding it carries the biases of what it read — the
Epicure paper itself runs a WEAT test to measure exactly that. Treat it as a compass for
curiosity, not an authority.

## Sharing

Pantries are shared as **capsules** following the GCU
[`CAPSULES.md`](https://github.com/gentropic) convention: the pantry is serialised, deflated,
and packed into the URL fragment so the link carries its own content (no server, nothing to
store). On a phone the share button uses the native share sheet; elsewhere it copies the
link to the clipboard.

The decoded payload is a cradle-compatible capsule with a magic line:

```
!atlas1+<lang>;<model>\n<ingredient canonical name>\n<ingredient canonical name>\n…
```

- `atlas` / `1` — format name and major version.
- `<lang>` — `pt` | `en` | `es` | `de`.
- `<model>` — `cooc` | `chem` | `core`.
- body — one canonical ingredient name per line.

The tool emits the compact `i:d…` (base64url) form and accepts `i:`, `q:` (base45, for QR),
and the long `inline:deflate:…` form on input. Arriving via a shared link opens the pantry
as a *new* set — you choose whether to merge it into yours or open it on its own — and the
fragment is cleared so a reload doesn't re-import.

## Credits & licence

The embeddings and the science behind them are the work of others:

- **Epicure** — Radzikowski & Chen (2026), *Navigating the Emergent Geometry of Food
  Ingredient Embeddings*, [arXiv:2605.22391](https://arxiv.org/abs/2605.22391). The
  embedding data is used under **CC BY 4.0**; please preserve this attribution if you reuse it.
- Lineage worth reading: Ahn et al. (2011) on the flavour network
  ([arXiv:1111.6074](https://arxiv.org/abs/1111.6074)), FlavorDB (Garg et al. 2018),
  metapath2vec (Dong et al. 2017), word2vec (Mikolov et al. 2013), and t-SNE
  (van der Maaten & Hinton 2008). Full list in the app's *Sobre* tab.

The code in this repository is released under the **MIT Licence** (see `LICENSE`).

---

Built in the GCU single-file spirit — one HTML file, browser as runtime, zero dependencies,
fully auditable. An off-domain demo of the approach behind [gentropic.org](https://gentropic.org).
