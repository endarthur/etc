#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Build Script
// Strips ES module syntax from src/ modules and injects into template HTML.
// Same pattern as auditable: real ES modules for dev, single-file output.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC  = path.join(ROOT, 'src');
const OUT  = path.join(ROOT, 'index.html');

// Module lists — order matters (dependencies first)
const RUNTIME = [
  'runtime/api.js',
  'runtime/audio.js',
  'faceplate/screens.js',
  'runtime/gamepad.js',
  'runtime/vm.js',
];

const TEMPLATE = path.join(SRC, 'console', 'template.html');

// ── Module syntax stripping ─────────────────────────────────────────────────
function stripModuleSyntax(code) {
  return code
    .replace(/^import\s+\{[\s\S]*?\}\s*from\s*['"][^'"]*['"];?\s*$/gm, '')
    .replace(/^import\s+.*$/gm, '')
    .replace(/^export\s*\{[^}]*\}.*$/gm, '')
    .replace(/^export\s+(default\s+)?/gm, '');
}

// ── Build ───────────────────────────────────────────────────────────────────
function build() {
  console.log('geode build: starting…');

  // Read and strip each module
  const sections = [];
  for (const mod of RUNTIME) {
    const filePath = path.join(SRC, mod);
    if (!fs.existsSync(filePath)) {
      console.error(`  ERROR: missing module ${mod}`);
      process.exit(1);
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const stripped = stripModuleSyntax(raw);
    sections.push(`// -- ${mod} --\n${stripped}`);
    console.log(`  + ${mod} (${raw.length} bytes)`);
  }

  const injected = sections.join('\n\n');

  // Read template
  if (!fs.existsSync(TEMPLATE)) {
    console.error(`  ERROR: missing template ${TEMPLATE}`);
    process.exit(1);
  }
  const template = fs.readFileSync(TEMPLATE, 'utf-8');

  // Inject at marker
  const MARKER = '// __INJECT_MODULES__';
  if (!template.includes(MARKER)) {
    console.error(`  ERROR: template missing ${MARKER} marker`);
    process.exit(1);
  }
  const output = template.replace(MARKER, injected);

  // Write
  fs.writeFileSync(OUT, output, 'utf-8');
  console.log(`  → ${path.relative(ROOT, OUT)} (${output.length} bytes)`);
  console.log('geode build: done');
}

// ── Exports for testing ─────────────────────────────────────────────────────
if (typeof module !== 'undefined') {
  module.exports = { stripModuleSyntax };
}

// ── CLI ─────────────────────────────────────────────────────────────────────
if (require.main === module) {
  build();
}
