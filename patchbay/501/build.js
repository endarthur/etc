#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const src = (...p) => path.join(__dirname, 'src', ...p);
const read = (f) => fs.readFileSync(f, 'utf-8');

const template = read(src('template.html'));
const css = read(src('styles.css')).trimEnd();
const guide = read(src('guide.html')).trimEnd();
const readerHtml = read(src('reader.html')).trimEnd();
const jszipCode = read(src('vendor', 'jszip.min.js')).trimEnd();
// Inline reader template as a JS string constant for export.js.
// Escape </script> so HTML parser doesn't close the enclosing <script> tag.
const readerConst = 'const READER_TEMPLATE = ' +
  JSON.stringify(readerHtml).replace(/<\/script>/gi, '<\\/script>') + ';';

// Embed pre-generated library if compiled
const libB64Path = path.join(__dirname, 'dist', 'library-base.b64.txt');
let libraryConst = 'const LIBRARY_BASE_B64 = null;';
if (fs.existsSync(libB64Path)) {
  const b64 = read(libB64Path).trim();
  libraryConst = 'const LIBRARY_BASE_B64 = ' + JSON.stringify(b64) + ';';
  console.log('  including pre-gen library (%d KB base64)', Math.round(b64.length / 1024));
}

const APP_MODULES = [
  'core.js', 'providers.js', 'settings.js',
  'prompts.js', 'pipeline.js', 'covers.js', 'compositor.js', 'curation.js', 'reader-settings.js', 'export.js',
  'windows.js', 'guide.js', 'gating.js', 'cert.js',
  'library-loader.js', 'guide-state.js', 'reset.js',
  'init.js',
];
const app = readerConst + '\n\n' + libraryConst + '\n\n' + APP_MODULES.map(f => read(src(f)).trimEnd()).join('\n\n');

let output = template
  .replace('/* __INJECT_CSS__ */', () => css)
  .replace('/* __INJECT_JSZIP__ */', () => jszipCode)
  .replace('<!-- __INJECT_GUIDE__ -->', () => guide)
  .replace('// __INJECT_APP__', () => app);

fs.writeFileSync(path.join(__dirname, 'nanogeon.html'), output);
console.log('Built nanogeon.html (%d bytes)', Buffer.byteLength(output));
