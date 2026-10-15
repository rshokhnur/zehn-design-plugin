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
  ['tsx', `<span className="bg-[#2563EB]">Promo</span> {/* zehn-ignore: requested by Aziz, spring campaign */}`, false],
  ['css', `.promo { color: #2563EB; } /* zehn-ignore: requested by Aziz, spring campaign */`, false],
  ['tsx', `<Button disabledReason="Only the owner can close this board.">Close board</Button>`, false],
  ['tsx', `<div className="aria-disabled:bg-disabled-bg aria-disabled:cursor-not-allowed" />`, false],
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

// Project mode: zehn.project.json enforces the app's own tokens and components.
let projectCases = 0;
{
  const app = path.join(dir, 'app');
  const put = (rel, text) => { const f = path.join(app, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); return f; };
  put('zehn.project.json', JSON.stringify({
    framework: 'react', styling: 'tailwind',
    tokens: { sources: ['src/styles/theme.css'], cssVarPrefixes: ['--radix-'], tailwindColors: ['primary', 'primary-foreground', 'muted-foreground', 'background', 'border', 'slate-500'], spacingKeys: ['0', '1', '2', '3', '4', '6', '8'] },
    components: { dir: 'src/components/ui', map: { Button: { component: 'Button', import: '@/components/ui/button' }, Badge: { component: 'Badge', import: '@/components/ui/badge' }, Modal: { component: 'Dialog', import: '@/components/ui/dialog' } } },
    screens: { 'table list': 'src/pages/Requests.tsx' },
    fallback: { zehnTokens: false, zehnDir: null },
  }));
  put('src/styles/theme.css', ':root { --primary: 222 47% 11%; --muted-foreground: 215 16% 47%; --brand-hex: #2563eb; }\n');
  const status = (rel, text) => spawnSync('node', [CHECK, put(rel, text + '\n')], { encoding: 'utf8' });
  const expect = (rel, text, want, why) => {
    projectCases++;
    const r = status(rel, text);
    if ((r.status === 1) !== want) { fail++; console.log(`FAIL project: ${why}\n${r.stdout}`); }
    return r;
  };
  // tokens
  expect('src/pages/A.tsx', `<div className="bg-primary text-muted-foreground border-border p-4 gap-2" />`, false, 'their color classes and spacing keys pass');
  expect('src/pages/B.tsx', `<div className="bg-surface-base" />`, true, 'zehn class without fallback tokens is flagged');
  expect('src/pages/C.tsx', `<div className="text-slate-500" />`, false, 'a default-palette key listed in their colors passes');
  expect('src/pages/D.tsx', `<div className="text-blue-500" />`, true, 'default palette not in their colors is flagged');
  expect('src/pages/E.tsx', `<div className="p-5" />`, true, 'spacing key outside spacingKeys is flagged');
  expect('src/pages/F.tsx', `<div style={{ color: 'hsl(var(--primary))' }} />`, false, 'declared var passes');
  expect('src/pages/G.tsx', `<div style={{ color: 'var(--primry)' }} />`, true, 'undeclared var is flagged');
  expect('src/pages/H.tsx', `<div style={{ top: 'var(--radix-popper-anchor-height)' }} />`, false, 'var with an allowed prefix passes');
  expect('src/pages/I.tsx', `<div style={{ color: 'var(--zm-text-primary)' }} />`, true, '--zm var without fallback tokens is flagged');
  expect('src/pages/J.tsx', `<div className="bg-[var(--primary)]" />`, false, 'arbitrary [var(--declared)] passes');
  expect('src/pages/K.tsx', `<div style={{ color: '#2563eb' }} />`, true, 'hex is flagged in app code');
  expect('src/pages/L.tsx', `<div className="rounded-md shadow-sm font-medium" />`, false, 'zehn radius/shadow/weight scale is not enforced on their system');
  {
    projectCases++;
    const src = path.join(app, 'src/styles/theme.css');
    if (spawnSync('node', [CHECK, src], { encoding: 'utf8' }).status !== 0) { fail++; console.log('FAIL project: token source file was checked'); }
  }
  // components
  expect('src/components/ui/button.tsx', `<button className="h-9 px-4" />`, false, 'raw <button> inside components.dir passes');
  const raw = expect('src/pages/M.tsx', `<button className="h-9 px-4" />`, true, 'raw <button> in app code is flagged');
  projectCases++;
  if (!/Use Button from @\/components\/ui\/button/.test(raw.stdout)) { fail++; console.log(`FAIL project: raw <button> message doesn't name the mapped component\n${raw.stdout}`); }
  const dup = expect('src/pages/N.tsx', `export function PrimaryButton({ children }) { return children; }`, true, 'PrimaryButton outside components.dir is flagged');
  projectCases++;
  if (!/Looks like a new Button\. Use Button from @\/components\/ui\/button/.test(dup.stdout)) { fail++; console.log(`FAIL project: duplicate message\n${dup.stdout}`); }
  expect('src/pages/O.tsx', `const StatusPill = (props) => null;`, true, 'StatusPill (Badge synonym) is flagged');
  expect('src/pages/P.tsx', `const MyDialog = forwardRef(() => null);`, true, 'MyDialog (their Modal component name) is flagged');
  expect('src/pages/Q.tsx', `const ModalContext = createContext(null);`, false, 'a context named after a component is not flagged');
  expect('src/pages/R.tsx', `export function RequestsTable() { return null; }`, false, 'an unrelated component is not flagged');
  expect('src/components/ui/fancy-button.tsx', `export function FancyButton() { return null; }`, false, 'a new variant inside components.dir is not flagged');
  // hook: a new file whose name looks like a mapped component
  projectCases++;
  const hookNew = { tool_input: { file_path: path.join(app, 'src/pages/CustomBadge.tsx'), content: 'export default () => null;\n' }, tool_response: { type: 'create' } };
  if (spawnSync('node', [CHECK], { input: JSON.stringify(hookNew), encoding: 'utf8' }).status !== 2) { fail++; console.log('FAIL project: hook missed a new CustomBadge.tsx file'); }
  // invalid JSON is fail-safe: zehn mode
  const bad = path.join(dir, 'bad');
  fs.mkdirSync(path.join(bad, 'src'), { recursive: true });
  fs.writeFileSync(path.join(bad, 'zehn.project.json'), '{ not json');
  projectCases++;
  const bf = path.join(bad, 'src/A.tsx'); fs.writeFileSync(bf, '<div className="bg-surface-base p-4" />\n');
  if (spawnSync('node', [CHECK, bf], { encoding: 'utf8' }).status !== 0) { fail++; console.log('FAIL project: invalid zehn.project.json did not fall back to zehn mode'); }
  // fallback zehn tokens + zehnDir
  const fb = path.join(dir, 'fb');
  fs.mkdirSync(path.join(fb, 'src/components/zehn'), { recursive: true });
  fs.writeFileSync(path.join(fb, 'zehn.project.json'), JSON.stringify({ tokens: { sources: [] }, components: { dir: 'src/ui', map: {} }, fallback: { zehnTokens: true, zehnDir: 'src/components/zehn' } }));
  const fz = path.join(fb, 'src/components/zehn/Thing.tsx'); fs.writeFileSync(fz, '<button className="bg-primary-bg rounded-lg p-4" style={{ color: "var(--zm-text-primary)" }} />\n');
  projectCases++;
  if (spawnSync('node', [CHECK, fz], { encoding: 'utf8' }).status !== 0) { fail++; console.log('FAIL project: fallback zehn tokens / zehnDir not honored'); }
}

console.log(fail ? `${fail} failing` : `all ${CASES.length + 4 + projectCases} cases pass`);
fs.rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
