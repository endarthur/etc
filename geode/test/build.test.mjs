// ─────────────────────────────────────────────────────────────────────────────
// GCU Geode — Build script tests (stripModuleSyntax)
// ─────────────────────────────────────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { stripModuleSyntax } = require('../build.js');

describe('stripModuleSyntax', () => {
  it('strips named import', () => {
    const input = "import { foo, bar } from './bar.js';";
    assert.equal(stripModuleSyntax(input).trim(), '');
  });

  it('strips default import', () => {
    const input = "import foo from './bar.js';";
    assert.equal(stripModuleSyntax(input).trim(), '');
  });

  it('strips namespace import', () => {
    const input = "import * as utils from './utils.js';";
    assert.equal(stripModuleSyntax(input).trim(), '');
  });

  it('strips export from function', () => {
    const input = 'export function foo() { return 1; }';
    assert.equal(stripModuleSyntax(input), 'function foo() { return 1; }');
  });

  it('strips export from const', () => {
    const input = 'export const X = 1;';
    assert.equal(stripModuleSyntax(input), 'const X = 1;');
  });

  it('strips export from let', () => {
    const input = 'export let penColor = 12;';
    assert.equal(stripModuleSyntax(input), 'let penColor = 12;');
  });

  it('strips export default', () => {
    const input = 'export default function main() {}';
    assert.equal(stripModuleSyntax(input), 'function main() {}');
  });

  it('strips export block', () => {
    const input = "export { a, b };";
    assert.equal(stripModuleSyntax(input).trim(), '');
  });

  it('strips re-export', () => {
    const input = "export { foo } from './bar.js';";
    assert.equal(stripModuleSyntax(input).trim(), '');
  });

  it('strips multi-line import', () => {
    const input = [
      "import {",
      "  foo, bar,",
      "  baz,",
      "} from './api.js';",
    ].join('\n');
    assert.equal(stripModuleSyntax(input).trim(), '');
  });

  it('leaves non-module lines untouched', () => {
    const input = "const x = 1;\nfunction foo() {}\n// a comment";
    assert.equal(stripModuleSyntax(input), input);
  });

  it('handles mixed content', () => {
    const input = [
      "import { a } from './a.js';",
      "import { b } from './b.js';",
      "",
      "export function doStuff() {",
      "  return a + b;",
      "}",
      "",
      "const internal = 42;",
    ].join('\n');

    const result = stripModuleSyntax(input);
    assert.ok(!result.includes('import'));
    assert.ok(result.includes('function doStuff()'));
    assert.ok(result.includes('const internal = 42;'));
  });
});
