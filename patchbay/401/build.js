#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const src = (...p) => path.join(__dirname, 'src', ...p);
const read = (f) => fs.readFileSync(f, 'utf-8');

const template = read(src('template.html'));
const css = read(src('styles.css')).trimEnd();
const guide = read(src('guide.html')).trimEnd();

const APP_MODULES = [
  'core.js', 'vault.js', 'providers.js', 'boot.js', 'settings.js',
  'workspace.js', 'llm.js', 'routing.js', 'agent.js',
  'terminal.js', 'inspector.js', 'log.js',
  'windows.js', 'guide.js',
  'tools.js', 'desktop.js', 'memory.js', 'skills.js',
  'routing-ui.js', 'telegram.js', 'scheduler.js', 'cert.js', 'init.js',
];
const app = APP_MODULES.map(f => read(src(f)).trimEnd()).join('\n\n');

let output = template
  .replace('/* __INJECT_CSS__ */', () => css)
  .replace('<!-- __INJECT_GUIDE__ -->', () => guide)
  .replace('// __INJECT_APP__', () => app);

fs.writeFileSync(path.join(__dirname, 'agent_workshop.html'), output);
console.log('Built agent_workshop.html (%d bytes)', Buffer.byteLength(output));
