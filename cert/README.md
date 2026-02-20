# GCU Certificate System

Certificate validation page for Geoscientific Chaos Union workshops.
Hosted at `etc/cert/index.html` on GitHub Pages.

## Architecture

Single HTML file (`index.html`) with inline CSS/JS. Validates certificate codes
against `certs.json` and renders a canvas-based A4 certificate with generative
topographic contour art, downloadable as PDF.

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

| Field    | Format                          | Notes                                    |
|----------|---------------------------------|------------------------------------------|
| `name`   | Full name, proper case          | Matched with NFD normalization (accent-insensitive) |
| `course` | `PB-{number}`                   | Must match a key in `COURSES` config     |
| `date`   | `YYYY-MM-DD`                    | Date of completion                       |
| `code`   | `PB-{number}-{4 hex chars}`     | Unique validation code                   |

## Code Generation Convention

Format: `{series prefix}-{course number}-{4 uppercase hex chars}`

Examples: `PB-101-A3F9`, `PB-201-B7E2`, `PB-401-D8A4`

The 4-hex suffix should be unique across all entries. It seeds the deterministic
PRNG that generates the topographic contour art, so each certificate looks different.

## Emitting a Certificate

To issue a certificate from a workshop:

1. Generate a unique code: `PB-{courseNum}-{4 random hex}`
2. Append entry to `certs.json`
3. Commit and push (cert is live once GH Pages deploys)

Snippet for generating a code:
```js
const code = `PB-${courseNum}-${Array.from(crypto.getRandomValues(new Uint8Array(2))).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
```

## Course Registry

Courses are defined in `COURSES` inside `index.html`. Each must reference a
series from `SERIES`. Current courses:

| Key      | Title                | Color     | Hours |
|----------|----------------------|-----------|-------|
| PB-101   | API Workshop         | `#d4a017` | 3     |
| PB-201   | Bot Workshop         | `#3ec9d1` | 4     |
| PB-301   | Flow Workshop        | `#6abf69` | 8     |
| PB-401   | Agent Workshop       | `#a78bfa` | 10    |

## Adding a New Course

1. Add entry to `COURSES` in `index.html` with: `series`, `title` (en/pt),
   `desc` (en/pt arrays of bullet strings), `hours`, `color`
2. If new series: add to `SERIES` with `name`, `org`, `issuer`, `issuerTitle`,
   `layout`, `pageAccent`, `pageBg`

## Layout Versioning

The contour rendering parameters are baked into issued certificates. The visual
output is deterministic from the code — same code always produces the same art.

If rendering params change, existing certs would look different. To prevent this:
- Current params are documented as "Layout version 1" in `renderTopoContours`
- When changing params, add a `v` field to new cert entries in `certs.json`
- Branch on `cert.v` in render code to preserve old layouts

## Validation Flow

1. User enters name + code (or arrives via URL fragment `#v=CODE&n=NAME`)
2. Page fetches `certs.json` and matches (accent-insensitive name + code)
3. On match: renders certificate on canvas, generates QR code, enables PDF download
4. QR encodes the full share URL for direct validation
