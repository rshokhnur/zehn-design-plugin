#!/usr/bin/env node
// Regression cases for scripts/check-ui.js.  Run: node tests/check-ui.test.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const CHECK = path.resolve(__dirname, '../scripts/check-ui.js');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zehn-check-'));

// [extension, line, shouldFlag]
const CASES = [
  // --- must flag ---
  ['tsx', `<div className="bg-blue-500 p-4" />`, true],
  ['tsx', `<div className="p-[13px]" />`, true],
  ['tsx', `<div className="text-[#333]" />`, true],
  ['tsx', `<div className="w-[340px]" />`, true],
  ['tsx', `<div className="max-w-[700px]" />`, true],
  ['tsx', `<div className="z-[999]" />`, true],
  ['tsx', `<div className="px-7" />`, true],
  ['tsx', `<div className="rounded-md" />`, true],
  ['tsx', `<div className="shadow-lg" />`, true],
  ['tsx', `<div className="font-bold" />`, true],
  ['tsx', `<div className="bg-surface-nope" />`, true],
  ['tsx', `const c = cn('flex', 'text-gray-850')`, true],
  ['tsx', `<div style={{ color: '#ff0000' }} />`, true],
  ['tsx', `<div style={{ color: 'tomato' }} />`, true],
  ['tsx', `<div style={{ padding: 14 }} />`, true],
  ['tsx', `<div style={{ fontFamily: "'Montserrat', sans-serif" }} />`, true],
  ['tsx', `const border = '1px solid #333'`, true],
  ['tsx', `const c = 'rgba(.5, 0, 0, 1)'`, true],
  ['tsx', `const c = 'hsl(var(--h) 50% 50%)'`, true],
  ['tsx', `<div style={{ gap: 'var(--zm-space-13)' }} />`, true],
  ['tsx', `const x = 1 // zehn-ignore`, true],
  ['css', `.a { color: red; }`, true],
  ['css', `.a { background: white; }`, true],
  ['css', `.a { color: #333; }`, true],
  ['css', `.a { font-weight: 700; }`, true],
  ['css', `.a { font: 600 14px/20px Montserrat; }`, true],
  ['css', `.a { padding: 14px; }`, true],
  ['css', `.a { @apply bg-red-500; }`, true],
  ['swift', `Text("Hi").foregroundColor(.blue)`, true],
  ['swift', `Text("Hi").bold()`, true],
  ['swift', `VStack {}.padding(18)`, true],
  ['swift', `.font(.system(size: 28))`, true],
  ['dart', `color: Colors.blue,`, true],
  ['dart', `fontWeight: FontWeight.bold,`, true],
  ['dart', `padding: EdgeInsets.all(18),`, true],
  ['kt', `color = Color.Red,`, true],
  ['kt', `modifier = Modifier.padding(18.dp)`, true],
  ['tsx', `<div style={{ outline: '2px solid red' }} />`, true],
  ['tsx', `const s = { border: '1px solid tomato' }`, true],
  ['tsx', `<div style={{ color: 'green' }} />`, true],
  ['tsx', `<Button className="!px-2 hover:!bg-surface-subtle" />`, true],
  ['css', `.btn { padding: 8px !important; }`, true],
  ['tsx', `<button className="h-8 rounded-lg bg-primary-bg px-3">Save</button>`, true],
  ['tsx', `if (window.confirm('Delete?')) remove()`, true],
  ['swift', `Text("Title").font(.system(size: 22))`, true],
  // --- must NOT flag ---
  ['css', `.a { font-weight: 400; }`, false],
  ['css', `.a { font-weight: 600; }`, false],
  ['css', `#fade { opacity: 0; }`, false],
  ['css', `#add, #fade { display: none; }`, false],
  ['css', `.a { color: var(--zm-text-primary); padding: 16px 24px; }`, false],
  ['tsx', `<p>Fixes #123 and #abc</p>`, false],
  ['tsx', `const msg = "Fixes #123"`, false],
  ['tsx', `const help = "Use bg-blue-500 for links in the old app"`, false],
  ['tsx', `<a href="#fade">Top</a>`, false],
  ['tsx', `<div className="bg-black text-white px-3 h-14 rounded-lg p-4 gap-3 shadow-200" />`, false],
  ['tsx', `<div className="bg-primary-bg hover:bg-primary-bg-hover text-primary-fg border-border-default border-b" />`, false],
  ['tsx', `<div className="max-w-column-narrow w-modal h-topbar-height text-sm font-semibold bg-surface-subtle" />`, false],
  ['tsx', `<div className="text-left text-sm bg-cover border-2 border-x ring-2 bg-red-fill-2 text-status-danger" />`, false],
  ['tsx', `<div className="w-[var(--zm-side-panel)] motion-safe:animate-spin" />`, false],
  ['tsx', `<div style={{ padding: 16, borderRadius: 8, fontSize: 14 }} />`, false],
  ['tsx', `const c = '#2563EB' // zehn-ignore: requested by Aziz, brand campaign`, false],
  ['tsx', `<div className="bg-gray-50 text-gray-600" />`, false],
  ['swift', `Text("Hi").foregroundColor(ZehnColor.textPrimary).padding(16)`, false],
  ['swift', `.fontWeight(.semibold)`, false],
  ['dart', `padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),`, false],
  ['dart', `color: Colors.transparent,`, false],
  ['kt', `modifier = Modifier.padding(16.dp)`, false],
  ['tsx', `const HUES = { success: { color: 'green', icon: 'check' } }`, false],
  ['tsx', `<div className={cx('p-4', !open && 'hidden')} />`, false],
  ['swift', `Image(systemName: "star").font(.system(size: 22))`, false],
  ['tsx', `<Button variant="primary">Save</Button>`, false],
];

let fail = 0;
CASES.forEach(([ext, line, want], i) => {
  const f = path.join(dir, `case${i}.${ext}`);
  fs.writeFileSync(f, line + '\n');
  const r = spawnSync('node', [CHECK, f], { encoding: 'utf8' });
  const got = r.status === 1;
  if (got !== want) { fail++; console.log(`FAIL ${want ? 'missed' : 'false hit'} [${ext}] ${line}\n${r.stdout}`); }
});

// Hook mode: re-indented old violations are not blamed; new ones are.
function hook(payload) {
  return spawnSync('node', [CHECK], { input: JSON.stringify(payload), encoding: 'utf8' }).status;
}
const reindent = hook({ tool_input: { file_path: '/x/a.tsx', old_string: `<div className="bg-blue-600">`, new_string: `  <div className="bg-blue-600">\n  <Button>Hi</Button>` } });
if (reindent !== 0) { fail++; console.log('FAIL hook blamed a re-indented old line'); }
const fresh = hook({ tool_input: { file_path: '/x/a.tsx', old_string: `<b/>`, new_string: `<div className="bg-blue-600">` } });
if (fresh !== 2) { fail++; console.log('FAIL hook missed a new violation'); }
const patch = hook({ tool_input: { file_path: '/x/a.tsx' }, tool_response: { structuredPatch: [{ newStart: 4, lines: ['-  <div className="bg-red-500">', '+    <div className="bg-red-500">', '+    <p className="text-[#111]">x</p>'] }] } });
if (patch !== 2) { fail++; console.log('FAIL hook missed a violation in structuredPatch'); }

// Raw primitives are fine inside the zehn components themselves.
{
  const zdir = path.join(dir, 'components', 'zehn'); fs.mkdirSync(zdir, { recursive: true });
  const f = path.join(zdir, 'Button.tsx'); fs.writeFileSync(f, '<button className="h-8 rounded-lg px-3" />\n');
  if (spawnSync('node', [CHECK, f], { encoding: 'utf8' }).status !== 0) { fail++; console.log('FAIL raw <button> flagged inside components/zehn'); }
}

console.log(fail ? `${fail} failing` : `all ${CASES.length + 4} cases pass`);
fs.rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
