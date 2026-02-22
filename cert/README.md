# GCU Certificate System

Certificate validation page for Geoscientific Chaos Union workshops.
Hosted at `etc/cert/index.html` on GitHub Pages.

## Architecture

Single HTML file (`index.html`) with inline CSS/JS. Course and series config
is loaded from `courses.json`; issued certificates live in `certs.json`.
Renders a canvas-based A4 certificate with generative art (topographic contours
or block grid, depending on the series layout), downloadable as PDF.

All dependencies are vendored locally (no CDN):
- `qrcodegen-v1.8.0-es6.js` — QR code generation (Nayuki, MIT)
- `jspdf-2.5.2.umd.min.js` — PDF export (parallax, MIT)

## Certificate Entry Schema

Each entry in `certs.json`:

```json
{
  "name": "Full Name",
  "course": "PB-101",
  "date": "2026-02-15",
  "code": "PB-101-A3F9"
}
```

| Field    | Format                              | Notes                                    |
|----------|-------------------------------------|------------------------------------------|
| `name`   | Full name, proper case              | Matched with NFD normalization (accent-insensitive) |
| `course` | `{PREFIX}-{number}`                 | Must match a key in `courses.json`       |
| `date`   | `YYYY-MM-DD`                        | Date of completion                       |
| `code`   | `{PREFIX}-{number}-{4 hex chars}`   | Unique validation code                   |

## Code Generation Convention

Format: `{series prefix}-{course number}-{4 uppercase hex chars}`

Examples: `PB-101-A3F9`, `PB-201-B7E2`, `BM-301-C4D1`

The 4-hex suffix should be unique across all entries. It seeds the deterministic
PRNG that generates the certificate art, so each certificate looks different.

## Emitting a Certificate

To issue a certificate from a workshop:

1. Generate a unique code: `{PREFIX}-{courseNum}-{4 random hex}`
2. Append entry to `certs.json`
3. Commit and push (cert is live once GH Pages deploys)

Snippet for generating a code:
```js
const code = `${prefix}-${courseNum}-${Array.from(crypto.getRandomValues(new Uint8Array(2))).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
```

## Course Registry

Courses and series are defined in `courses.json`. Each course references a
series key. Current courses:

| Key      | Series    | Title                                    | Color     | Hours |
|----------|-----------|------------------------------------------|-----------|-------|
| PB-101   | patchbay  | API Workshop                             | `#d4a017` | 3     |
| PB-201   | patchbay  | Bot Workshop                             | `#3ec9d1` | 4     |
| PB-301   | patchbay  | Flow Workshop                            | `#6abf69` | 8     |
| PB-401   | patchbay  | Agent Workshop                           | `#a78bfa` | 10    |
| BM-301   | bm        | Decision Trees for Mining and Modelling  | `#4caf50` | 3     |

## Adding a New Course

1. Add entry under `courses` in `courses.json` with: `series`, `title` (en/pt),
   `desc` (en/pt arrays of bullet strings), `hours`, `color`
2. If new series: add under `series` in `courses.json` with `name`, `org`,
   `issuer`, `issuerTitle`, `layout`, `pageAccent`, `pageBg`

## Generative Art Layouts

Each series specifies a `layout` that determines the certificate background art:

| Layout   | Function             | Description                                |
|----------|----------------------|--------------------------------------------|
| `topo`   | `renderTopoContours` | Topographic contour lines (Patchbay series)|
| `blocks` | `renderBlockGrid`    | Block grid pattern (BM series)             |

The art is deterministic from the certificate code — same code always produces
the same visual.

## Layout Versioning

If rendering params change, existing certs would look different. To prevent this:
- Current params are documented as "Layout version 1" in the render functions
- When changing params, add a `v` field to new cert entries in `certs.json`
- Branch on `cert.v` in render code to preserve old layouts

## Validation Flow

1. User enters name + code (or arrives via URL fragment `#v=CODE&n=NAME`)
2. Page fetches `certs.json` and `courses.json`, matches (accent-insensitive name + code)
3. On match: renders certificate on canvas, generates QR code, enables PDF download
4. QR encodes the full share URL for direct validation
5. Preview mode available via `#preview=COURSE_KEY&n=Name`
