# GCUES

**Geoscientific Chaos Union Entertainment System** — a QR cartridge scanner, runner, and press.

Phone cameras refuse to open `data:text/html` QR codes. GCUES is the missing runtime: a PWA that scans QR codes, detects `data:text/html` payloads, and runs them in a sandboxed iframe. It saves scanned cartridges to IndexedDB for replay and can export them as standalone .html files.

## How it works

A GCUES cartridge is a `data:text/html` URI encoded in a QR code. The console scans it, decodes it, and loads the raw HTML into a sandboxed iframe. That's it — any self-contained HTML page is a valid cartridge.

- **Scanner**: `BarcodeDetector` API (native Chrome/Android), continuous scan at ~150ms
- **Runner**: `<iframe srcdoc="..." sandbox="allow-scripts allow-modals">`
- **Library**: IndexedDB with rename, export, delete
- **Trust prompt**: new cartridges show hash art + metadata + warning before running
- **Immersive mode**: hides all UI, cartridge fills the screen
- **PWA**: installable, works offline, supports Android share target

## Cartridge format

Two modes, both producing `data:text/html` URIs:

| Mode | Budget | Best for |
|------|--------|----------|
| **Raw** | ~2,200 bytes HTML | Tiny apps where URL-encoding is efficient |
| **Compressed** | ~4-5 KB HTML | Larger apps via deflate-raw + base64 + self-extracting bootstrap |

Compressed mode uses the browser's native `CompressionStream`/`DecompressionStream` API. The bootstrap wrapper (~200 bytes) inflates the payload and replaces the page. Metadata comments are preserved outside the compressed payload for scanner visibility.

Optional metadata comment in cartridge HTML:
```html
<!-- gcues title: My Game; author: GCU; desc: A short description -->
```

## GCUES Press

`gcues_press.html` is the cartridge authoring tool:

- Three-column desktop layout: source editor, overlay controls, card preview
- Metadata editor with bidirectional sync (title, author, desc)
- Card text with minimal markup: `# title`, `~ subtitle`, `**bold**`, `*italic*`
- Hash art identicon: deterministic 8x8 mirrored grid from SHA-256 hash
- Card sizes: TCG (63.5x88.9mm), Tarot (70x120mm), custom W×H
- Adjustable safe zone buffer for print shop requirements
- BG/FG color theming across the entire card
- Raw and compressed modes with byte budget tracking
- QR settings: ECC level, mask, version range, colors, scale
- Image overlay with interactive handles (move, resize, rotate)
- Scan readability testing via jsQR at multiple scale variations
- Find-best-mask: tests all 8 QR masks with overlay and picks the most readable
- PDF card download (page 2 data page optional)
- Example cartridges, minifier, auto-press, data URI copy/test/download
- Auto-decodes `data:text/html` URIs pasted into the source editor

For print production, open the PDF in Affinity/Illustrator to convert to CMYK and export as PDF/X.

Built from `src/gcues_press.html` via `node build.js`, which injects vendored qrcodegen, jsQR, and jsPDF.

## Files

```
index.html           — the console (single file, PWA)
gcues_press.html     — built press tool
src/gcues_press.html — press source template
build.js             — injects vendored libs into press template
src/jsQR.min.js      — vendored jsQR (Apache-2.0)
src/jsQR.js          — vendored jsQR source
manifest.json        — PWA manifest
sw.js                — service worker (cache-first app shell)
test-uris.txt        — example cartridge data URIs for testing
```

## Prior art and credits

GCUES builds on ideas from:

- **[MattKC — Snake in a QR code](https://mattkc.com/etc/snakeqr/)** (2020) — proved HTML apps fit trivially in QR codes
- **[QRGame](https://github.com/thisaislan/qrgame)** (thisaislan, 2021) — Android QR cartridge scanner with proprietary JS format; GCUES uses standard HTML instead
- **[Backdooms](https://github.com/Kuberwastaken/backdooms)** (Kuberwastaken, 2025) — self-extracting compressed HTML game in a QR code; the compression pipeline GCUES Press adopts

Libraries:

- **[qrcodegen](https://www.nayuki.io/page/qr-code-generator-library)** by Nayuki (MIT) — QR code generation
- **[jsQR](https://github.com/cozmo/jsQR)** by Cosmo Wolfe (Apache-2.0) — QR code decoding for readability testing
- **[jsPDF](https://github.com/parallax/jsPDF)** by parallax (MIT) — PDF card generation
- Compression via native [`CompressionStream`](https://developer.mozilla.org/en-US/docs/Web/API/CompressionStream)

## Author

arthur endlein correia ([endarthur](https://github.com/endarthur))
geoscientific chaos union — https://gentropic.org
