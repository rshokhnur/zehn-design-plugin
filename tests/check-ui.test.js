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
  ['tsx', `<span className="rounded-full bg-ai-gradient blur-3xl" />`, false],
  ['tsx', `<div\n  className="flex"\n  onClick={go}\n>x</div>`, true],
  ['tsx', `<div\n  role="button"\n  onClick={go}\n/>`, false],
  ['tsx', `<Button\n  variant="secondary"\n  className="bg-violet"\n>Pick</Button>`, true],
  ['tsx', `<Button\n  variant="secondary"\n  className="mt-4 w-full"\n>Pick</Button>`, false],
  ['tsx', `<Button variant="secondary" className="bg-violet rounded-full">Pick</Button>`, true],
  ['tsx', `<Button variant="primary" className="ml-auto w-full sm:w-auto">Save</Button>`, false],
  ['tsx', `<IconButton icon="close-line" aria-label="Close" className="rounded-full" />`, false],
  ['tsx', `<div className="bg-gradient-to-r from-violet-500 to-pink" />`, true],
  ['tsx', `<span className="uppercase tracking-wide">New</span>`, true],
  ['tsx', `<div className="rounded-full px-4 h-8" onClick={go}>Save</div>`, true],
  ['tsx', `<div onClick={() => open(row)}>{row.name}</div>`, true],
  ['tsx', `<div role="button" tabIndex={0} onClick={go} onKeyDown={key}>Go</div>`, false],
  ['tsx', `<div aria-hidden className="absolute inset-0 bg-scrim" onClick={onClose} />`, false],
  ['tsx', `<div className="flex" onClick={(e) => e.stopPropagation()}>`, false],
  ['tsx', `<span className="h-8 w-8 rounded-full bg-surface-subtle" />`, false],
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
  // --- gradients, pills ---
  ['tsx', `<div className="bg-gradient-to-r from-primary-bg to-surface-base" />`, true],
  ['tsx', `<div className="bg-linear-to-r from-cyan-fill-2 to-surface-base" />`, true],
  ['tsx', `<div style={{ background: 'linear-gradient(90deg, var(--zm-surface-base), var(--zm-surface-subtle))' }} />`, true],
  ['css', `.hero { background-image: radial-gradient(var(--zm-surface-base), var(--zm-surface-subtle)); }`, true],
  ['tsx', `<div className="bg-gradient-to-r from-ai to-ai-bg" />`, false],
  ['tsx', `<Button className="rounded-full">Save</Button>`, true],
  ['tsx', `<input className="h-9 rounded-full px-3" />`, true],
  ['tsx', `<Avatar className="rounded-full" />`, false],
  ['tsx', `<IconButton className="rounded-full" aria-label="Close" />`, false],
  ['css', `.btn-primary {\n  border-radius: 9999px;\n}`, true],
  ['css', `.avatar {\n  border-radius: 9999px;\n}`, false],
  // --- radius / type / size scales (zehn mode) ---
  ['tsx', `<div className="rounded-3xl rounded-t-lg rounded-none rounded" />`, false],
  ['tsx', `<div className="rounded-t-md" />`, true],
  ['tsx', `<div className="text-md" />`, true],
  ['tsx', `<div className="font-medium" />`, true],
  ['css', `.panel { width: 437px; }`, true],
  ['css', `.panel { max-width: 520px; width: 100%; min-height: 48px; border-width: 3px; line-height: 20px; }`, false],
  ['tsx', `<div className="w-[437px]" />`, true],
  // --- strings that aren't classes ---
  ['tsx', `const id = 'p-101'`, false],
  ['tsx', `const tab = 'm-2'; const key = 'px-7'`, false],
  ['tsx', `const cls = 'px-7'`, true],
  // --- motion ---
  ['tsx', `<div className="transition-all duration-base" />`, true],
  ['css', `.a { transition: all var(--zm-duration-base); }`, true],
  ['tsx', `<div style={{ transitionProperty: 'all' }} />`, true],
  ['tsx', `<div className="transition-opacity duration-base ease-out hover:scale-press" />`, false],
  ['tsx', `<div className="transition-colors duration-500" />`, true],
  ['tsx', `<div className="transition-colors duration-150" />`, true],
  ['tsx', `<div className="transition-colors duration-[250ms]" />`, true],
  ['tsx', `<div className="transition-colors duration-[var(--zm-duration-fast)]" />`, false],
  ['css', `.a { transition: opacity 500ms var(--zm-ease-out); } .b { transition-duration: var(--zm-duration-slow); }`, true],
  ['css', `.a { transition: opacity var(--zm-duration-base) var(--zm-ease-out), transform 0.2s; }`, false],
  ['css', `.spinner { animation: spin 1s linear infinite; transition: opacity var(--zm-duration-fast); }`, false],
  ['tsx', `<motion.div animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: 'easeOut' }} />`, true],
  ['tsx', `<motion.div animate={{ opacity: 1 }} transition={{ duration: 0.2 }} />`, false],
  ['tsx', `<motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} />`, false],
  ['tsx', `toast.success('Saved', { duration: 4000 })`, false],
  ['css', `.a { transition: height var(--zm-duration-base); }`, true],
  ['css', `.a { transition-property: opacity, max-height; transition-duration: var(--zm-duration-base); }`, true],
  ['tsx', `<div style={{ transition: 'width 200ms' }} />`, true],
  ['tsx', `<div className="transition-[height,opacity] duration-base" />`, true],
  ['tsx', `<div className="transition-[opacity,transform] duration-base" />`, false],
  ['tsx', `<motion.div animate={{ height: 'auto', opacity: 1 }} />`, true],
  ['tsx', `<motion.div layout animate={{ height: 'auto' }} />`, false],
  ['tsx', `<span className="animate-bounce" />`, true],
  ['tsx', `<span className="animate-ping" />`, true],
  ['tsx', `<motion.div transition={{ type: 'spring', bounce: 0.5 }} />`, true],
  ['tsx', `<motion.div transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }} />`, false],
  ['tsx', `<div className="scale-0 data-[open]:scale-100" />`, true],
  ['css', `.a { transform: scale(0); transition: transform var(--zm-duration-base); }`, true],
  ['tsx', `<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} />`, true],
  ['tsx', `<motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} />`, false],
  ['tsx', `<motion.div animate={{ scale: 0 }} transition={{ duration: 0.2 }} /> {/* zehn-ignore: requested by Aziz, launch confetti */}`, false],
  // reduced motion (whole-file context)
  ['css', `@keyframes fade { from { opacity: 0; } to { opacity: 1; } }\n.a { animation: fade 200ms ease-out; }`, true],
  ['css', `@keyframes fade { from { opacity: 0; } to { opacity: 1; } }\n.a { animation: fade 200ms ease-out; }\n@media (prefers-reduced-motion: reduce) { .a { animation: none; } }`, false],
  ['tsx', `import { motion } from 'framer-motion';\nexport const Fade = () => <motion.div animate={{ opacity: 1 }} />;`, true],
  ['tsx', `import { motion, useReducedMotion } from 'motion/react';\nexport const Fade = () => { const r = useReducedMotion(); return <motion.div animate={{ opacity: 1 }} />; };`, false],
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
// A plain non-git folder that uses zehn tokens: the gate lets the hook run there.
const zcwd = path.join(dir, 'zehn-cwd'); fs.mkdirSync(zcwd); fs.writeFileSync(path.join(zcwd, 'tokens.css'), ':root { --zm-x: 1px; }\n');
function hook(payload) {
  return spawnSync('node', [CHECK], { input: JSON.stringify({ cwd: zcwd, ...payload }), encoding: 'utf8' }).status;
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
  expect('src/pages/L.tsx', `<div className="shadow-sm" />`, false, 'zehn shadow scale is not enforced on their system');
  expect('src/pages/L2.tsx', `<div className="rounded-md" />`, true, 'off-scale radius is flagged in project mode');
  expect('src/pages/L3.tsx', `<div className="font-medium" />`, true, 'font-medium is flagged in project mode');
  expect('src/pages/L4.tsx', `<div className="text-md" />`, true, 'off-scale text size is flagged in project mode');
  expect('src/styles/L5.module.css', `.card { border-radius: 6px; font-size: 13px; font-weight: 500; }`, true, 'CSS-module radius/size/weight is flagged in project mode');
  expect('src/styles/L6.module.css', `.card { width: 437px; }`, true, 'raw width is flagged in project mode');
  expect('src/pages/L7.tsx', `<div className="w-[437px]" />`, true, 'w-[437px] is flagged in project mode');
  expect('src/pages/L8.tsx', `const Card = styled.div\`\n  border-radius: 6px;\n  padding: 14px;\n\`;`, true, 'styled-components template lines are checked');
  expect('src/styles/L9.module.css', `.card { width: 100%; max-width: 520px; border-radius: 8px; font-size: 14px; font-weight: 600; }`, false, 'on-scale CSS passes in project mode');
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
  const dup = expect('src/pages/N.tsx', `export function PrimaryButton({ children }) {\n  return <button className="h-9">{children}</button>;\n}`, true, 'PrimaryButton rendering <button> is flagged');
  projectCases++;
  if (!/Looks like a new Button\. Use Button from @\/components\/ui\/button/.test(dup.stdout)) { fail++; console.log(`FAIL project: duplicate message\n${dup.stdout}`); }
  expect('src/shared/ui/StatusPill.tsx', `export const StatusPill = (props) => null;`, true, 'StatusPill (Badge synonym) exported from a shared folder is flagged');
  expect('src/pages/O.tsx', `export const StatusPill = (props) => null;`, false, 'StatusPill in a page that renders no raw element is not flagged');
  expect('src/pages/P.tsx', `const MyDialog = forwardRef(() => <div role="dialog" />);`, true, 'MyDialog rendering a raw dialog is flagged');
  expect('src/pages/P2.tsx', `const StyledButton = styled.button\`\n  height: 36px;\n\`;`, true, 'styled.button named like Button is flagged');
  expect('src/shared/ui/P3.tsx', `export function RequestsTableSkeleton() { return null; }\nexport function ButtonSkeleton() { return null; }`, false, 'skeleton compositions are not flagged');
  expect('src/pages/P4.tsx', `const CardTop = styled.div\`\n  display: flex;\n\`;\nconst Header = styled(Badge)\`\`;\nconst ButtonRow = styled.div\`\`;`, false, 'styled sub-parts are not flagged');
  expect('src/shared/ui/P5.tsx', `export const BadgeWrapper = styled.span\`\`;\nexport const ModalContainer = (p) => <div {...p} />;`, false, 'Wrapper/Container parts are not flagged');
  expect('src/pages/Q.tsx', `const ModalContext = createContext(null);`, false, 'a context named after a component is not flagged');
  expect('src/pages/R.tsx', `export function RequestsTable() { return null; }`, false, 'an unrelated component is not flagged');
  expect('src/components/ui/fancy-button.tsx', `export function FancyButton() { return null; }`, false, 'a new variant inside components.dir is not flagged');
  // hook: a new file whose name looks like a mapped component
  projectCases++;
  const hookNew = { tool_input: { file_path: path.join(app, 'src/shared/CustomBadge.tsx'), content: 'export default () => null;\n' }, tool_response: { type: 'create' } };
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
  const fz = path.join(fb, 'src/components/zehn/Button.tsx'); fs.writeFileSync(fz, '<button className="bg-primary-bg rounded-lg p-4" style={{ color: "var(--zm-text-primary)" }} />\n');
  projectCases++;
  if (spawnSync('node', [CHECK, fz], { encoding: 'utf8' }).status !== 0) { fail++; console.log('FAIL project: fallback zehn tokens / zehnDir not honored'); }
  // Inside the shared folder, raw elements belong to the components that wrap them; a new shared component builds on those.
  const sw = path.join(fb, 'src/components/zehn/SwatchPicker.tsx'); fs.writeFileSync(sw, '<input type="radio" className="bg-primary-bg" />\n<button className="rounded-lg" />\n');
  projectCases++;
  const swr = spawnSync('node', [CHECK, sw], { encoding: 'utf8' });
  if (swr.status === 0 || (swr.stdout.match(/raw-primitive/g) || []).length < 1) { fail++; console.log('FAIL project: raw elements in a new shared component were not flagged\n' + swr.stdout); }
}

// Gate: outside zehn apps the hooks stay silent; inside they run.
let gateCases = 0;
{
  const sh = (cwd, ...a) => spawnSync('git', a, { cwd, encoding: 'utf8' });
  const mkrepo = (name, files) => {
    const r = path.join(dir, name); fs.mkdirSync(r, { recursive: true });
    for (const [rel, text] of Object.entries(files)) { const f = path.join(r, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text); }
    sh(r, 'init', '-q'); sh(r, 'add', '-A'); sh(r, '-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-qm', 'init');
    return r;
  };
  const bad = `<div className="bg-blue-500 p-[13px] transition-all" />\n`;
  const run = (args, payload) => spawnSync('node', [CHECK, ...args], { input: JSON.stringify(payload), encoding: 'utf8' });
  const check = (ok, why, r) => { gateCases++; if (!ok) { fail++; console.log(`FAIL gate: ${why}\n${r ? r.stdout + r.stderr : ''}`); } };
  // coffee-shop repo, user-wide install: nothing zehn in the repo
  const coffee = mkrepo('coffee', { 'package.json': '{"dependencies":{"react":"18"}}', 'src/index.css': ':root { --brand: #6f4e37; }\n' });
  const cf = path.join(coffee, 'src/Menu.tsx'); fs.writeFileSync(cf, bad);
  let r = run([], { cwd: coffee, session_id: 'gate-test', tool_input: { file_path: cf, content: bad }, tool_response: { type: 'create' } });
  check(r.status === 0 && !r.stdout && !r.stderr, 'hook ran in a non-zehn repo', r);
  r = run(['--stop'], { cwd: coffee, session_id: 'gate-test' });
  check(r.status === 0 && !r.stdout && !r.stderr, '--stop ran in a non-zehn repo', r);
  fs.rmSync(path.join(os.tmpdir(), 'zehn-design-gate-test-coffee.json'), { force: true });
  r = run(['--session-start'], { cwd: coffee, session_id: 'gate-test-coffee' });
  check(r.status === 0 && !fs.existsSync(path.join(os.tmpdir(), 'zehn-design-gate-test-coffee.json')), '--session-start snapshotted a non-zehn repo', r);
  r = spawnSync('node', [CHECK, cf], { encoding: 'utf8', cwd: coffee });
  check(r.status === 1 && /isn't a zehn app/.test(r.stdout), 'CLI in a non-zehn repo should still check and print a note', r);
  // the same repo with zehn tokens in a tracked stylesheet (found by git grep)
  const z1 = mkrepo('zehn-tokens', { 'web/styles/theme.css': ':root { --zm-surface-base: #fff; }\n' });
  const z1f = path.join(z1, 'src/Menu.tsx'); fs.mkdirSync(path.dirname(z1f)); fs.writeFileSync(z1f, bad);
  r = run([], { cwd: z1, tool_input: { file_path: z1f, content: bad }, tool_response: { type: 'create' } });
  check(r.status === 2, 'hook skipped a repo with --zm- tokens', r);
  // project-level plugin install
  const z2 = mkrepo('zehn-settings', { '.claude/settings.json': '{ "enabledPlugins": { "zehn-design@zehn": true } }' });
  const z2f = path.join(z2, 'src/Menu.tsx'); fs.mkdirSync(path.dirname(z2f)); fs.writeFileSync(z2f, bad);
  r = run([], { cwd: z2, tool_input: { file_path: z2f, content: bad }, tool_response: { type: 'create' } });
  check(r.status === 2, 'hook skipped a repo that enables zehn-design in .claude/settings.json', r);
  r = run(['--stop'], { cwd: z2, session_id: 'gate-test-z2' });
  check(r.status === 2 && /bg-blue-500/.test(r.stderr), '--stop skipped a zehn repo', r);

  // Design-system edits: one flag per file, zehn-ignore exempts, the plugin's own components are exempt.
  const ds = mkrepo('ds-app', {
    'zehn.project.json': JSON.stringify({ tokens: { sources: ['src/styles/theme.css'] }, components: { dir: 'src/shared/ui', map: { Button: { component: 'Button', import: '@/shared/ui/Button' }, Modal: { component: 'Dialog', import: '@/lib/overlay/Dialog' } } } }),
    'src/styles/theme.css': ':root { --hr-space-4: 16px; --hr-text: #111; }\n',
    'src/shared/ui/Button.tsx': 'export function Button() { return null; }\n',
    'src/lib/overlay/Dialog.tsx': 'export function Dialog() { return null; }\n',
  });
  // The design-system note informs without blocking, once per file per session.
  const sid = `ds-${process.pid}-${Date.now()}`;
  const edit = (rel, old, neu) => run([], { cwd: ds, session_id: sid, tool_input: { file_path: path.join(ds, rel), old_string: old, new_string: neu } });
  const dsNote = (dir) => new RegExp(`changed the shared design system \\(${dir.replace(/\//g, '\\/')}\\)`, 'g');
  r = edit('src/shared/ui/Button.tsx', 'return null;', 'const a = 1;\n  return a ? null : null;');
  check(r.status === 0 && (r.stdout.match(dsNote('src/shared/ui')) || []).length === 1, 'edit in components.dir should note once, without blocking', r);
  r = edit('src/shared/ui/Button.tsx', 'return null;', 'const c = 3;');
  check(r.status === 0 && !r.stdout, 'second edit of the same shared file should be silent', r);
  r = edit('src/lib/overlay/Dialog.tsx', 'return null;', 'return <div className="bg-blue-500" />;');
  check(r.status === 2 && dsNote('src/lib/overlay').test(r.stderr) && /bg-blue-500/.test(r.stderr), 'shared edit with a real issue blocks and carries the note', r);
  r = edit('src/shared/ui/Button.tsx', 'return null;', 'return 1; // zehn-ignore: requested by Aziz, new size');
  check(r.status === 0, 'zehn-ignore line in components.dir should pass', r);
  r = edit('src/pages/Home.tsx', 'a', 'const b = 2;');
  check(r.status === 0, 'edit outside the design system should pass', r);
  const plug = path.resolve(__dirname, '../components/react/__gate_probe.tsx');
  r = run([], { cwd: path.resolve(__dirname, '..'), tool_input: { file_path: plug, old_string: 'a', new_string: 'const b = 2;' } });
  check(r.status === 0, "the plugin's own components/react is exempt", r);
  const zapp = mkrepo('zehn-dir-app', { 'tokens.css': ':root { --zm-x: 1px; }\n' });
  r = run([], { cwd: zapp, session_id: sid, tool_input: { file_path: path.join(zapp, 'src/components/zehn/Button.tsx'), old_string: 'a', new_string: 'const b = 2;' } });
  check(r.status === 0 && dsNote('src/components/zehn').test(r.stdout), 'edit in a copied components/zehn should note', r);

  // cssVarPrefixes trap: with readable sources, a --hr- var must be declared.
  const pj = (o) => fs.writeFileSync(path.join(ds, 'zehn.project.json'), JSON.stringify(o));
  pj({ tokens: { sources: ['src/styles/theme.css'], cssVarPrefixes: ['--hr-', '--radix-'] }, components: { dir: 'src/shared/ui', map: {} } });
  const cli = (rel, text) => { const f = path.join(ds, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, text + '\n'); return spawnSync('node', [CHECK, f], { encoding: 'utf8' }); };
  r = cli('src/pages/V1.module.css', '.a { padding: var(--hr-space-5); }');
  check(r.status === 1 && /Did you mean --hr-space-4\?/.test(r.stdout), 'made-up --hr- var should be flagged with a suggestion', r);
  r = cli('src/pages/V2.module.css', '.a { padding: var(--hr-space-4); color: var(--hr-text); top: var(--radix-popper-anchor-height); }');
  check(r.status === 0, 'declared --hr- vars and a foreign --radix- prefix pass', r);
  pj({ tokens: { sources: [], cssVarPrefixes: ['--hr-'] }, components: { dir: 'src/shared/ui', map: {} } });
  r = cli('src/pages/V3.module.css', '.a { padding: var(--hr-anything); }');
  check(r.status === 0, 'with no sources the prefix allows the var', r);
  // project scale overrides and project motion settings
  pj({ tokens: { sources: [], radiusKeys: ['md', 'full'], fontWeights: [400, 500, 'semibold'], fontSizeKeys: ['sm', 'md', 'lg', '13'] },
    components: { dir: 'src/shared/ui', map: {} }, motion: { durations: [120, 240], reducedMotion: 'global' } });
  r = cli('src/pages/S1.tsx', '<div className="rounded-md font-medium text-md duration-240" style={{ fontSize: 13 }} />');
  check(r.status === 0, 'project radiusKeys/fontWeights/fontSizeKeys/durations are honored', r);
  r = cli('src/pages/S2.tsx', '<div className="rounded-lg" />');
  check(r.status === 1, 'a radius key outside tokens.radiusKeys is flagged', r);
  r = cli('src/pages/S3.tsx', '<div className="transition-opacity duration-200" />');
  check(r.status === 1 && /motion\.durations/.test(r.stdout), 'a duration outside motion.durations is flagged', r);
  r = cli('src/pages/S4.tsx', "import { motion } from 'framer-motion';\nexport const F = () => <motion.div animate={{ opacity: 1 }} />;");
  check(r.status === 0, 'motion.reducedMotion "global" skips the TSX reduced-motion rule', r);
  pj({ tokens: { sources: [] }, components: { dir: 'src/shared/ui', map: {} } });
  fs.writeFileSync(path.join(ds, 'tailwind.config.js'), "module.exports = { theme: { extend: { borderRadius: { md: 'calc(var(--radius) - 2px)', lg: 'var(--radius)' } } } };\n");
  r = cli('src/pages/S5.tsx', '<div className="rounded-md" />');
  check(r.status === 0, 'a radius key declared in tailwind.config.js passes', r);
}

console.log(fail ? `${fail} failing` : `all ${CASES.length + 4 + projectCases + gateCases} cases pass`);
fs.rmSync(dir, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
