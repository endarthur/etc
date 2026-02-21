#!/usr/bin/env node
/* ══════════════════════════════════════════════════
   GCUES Press — build script
   Inlines qrcodegen + jsQR into gcues_press.html
   ══════════════════════════════════════════════════ */
const fs = require('fs');
const path = require('path');

const read = (f) => fs.readFileSync(f, 'utf-8');

const template = read(path.join(__dirname, 'src', 'gcues_press.html'));
const qrcodegen = read(path.join(__dirname, '..', 'cert', 'qrcodegen-v1.8.0-es6.js')).trimEnd();
const jsQR = read(path.join(__dirname, 'src', 'jsQR.min.js')).trimEnd();

const output = template
  .replace('// __INJECT_QRCODEGEN__', () => qrcodegen)
  .replace('// __INJECT_JSQR__', () => jsQR);

fs.writeFileSync(path.join(__dirname, 'gcues_press.html'), output);
console.log('Built gcues_press.html (%d bytes)', Buffer.byteLength(output));
