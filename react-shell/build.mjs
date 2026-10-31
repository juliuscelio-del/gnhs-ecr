// Builds ONE offline HTML file: your ElectronicClassRecordFINAL.html with the
// React layer (login + roster) bundled inline just before </body>.
//   node build.mjs [--src ../ElectronicClassRecordFINAL.html] [--out dist/ElectronicClassRecordFINAL.html]
//
// NOTE: --src must be the HTML that already contains the extra sections (use the ElectronicClassRecordFINAL.html I gave you).
// The roster's section list is also patched below, so you do not need to touch src/.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const arg = (name, def) => {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
};
const src = path.resolve(arg('src', '../ElectronicClassRecordFINAL.html'));
const out = path.resolve(arg('out', 'dist/ElectronicClassRecordFINAL.html'));

if (!fs.existsSync(src)) {
  console.error('Cannot find the original HTML at ' + src + '\nPass --src <path>.');
  process.exit(1);
}

const result = await build({
  entryPoints: ['src/main.jsx'],
  bundle: true,
  minify: true,
  write: false,
  format: 'iife',
  target: ['es2019'],
  jsx: 'automatic',
  charset: 'utf8',
  legalComments: 'none',
  loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
});

// An inline <script> must never contain a literal "</script".
let js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// Extra sections the roster must know about (they must also exist in the HTML --src file).
const EXTRA_SECTIONS = ['lapu-lapu', 'spare-1', 'spare-2', 'spare-3', 'spare-4', 'spare-5'];
const LAST = '"silang","dagohoy"]';
if (js.includes('"' + EXTRA_SECTIONS[0] + '"')) {
  console.log('Roster list in src/ already has the extra sections - nothing to add.');
} else {
  if (js.split(LAST).length !== 2) {
    console.error('Could not find the roster section list in the React bundle.');
    process.exit(1);
  }
  js = js.replace(LAST, '"silang","dagohoy",' + EXTRA_SECTIONS.map(k => '"' + k + '"').join(',') + ']');
  console.log('Added ' + EXTRA_SECTIONS.length + ' extra sections to the roster list.');
}

let html = fs.readFileSync(src, 'utf8');
// If the HTML already has an older React bundle in it (a previously BUILT file), remove that
// bundle first, so the result is always "original + the current React layer", never two layers.
const OLD_START = '<div id="react-root"></div>\n<script id="react-shell-bundle">';
if (html.includes('id="react-shell-bundle"')) {
  const a = html.indexOf(OLD_START);
  const b = a < 0 ? -1 : html.indexOf('</script>\n', a);
  if (a < 0 || b < 0) {
    console.error('The HTML contains an old React bundle in an unexpected shape. Point --src at the ORIGINAL file.');
    process.exit(1);
  }
  html = html.slice(0, a) + html.slice(b + '</script>\n'.length);
  console.log('Note: removed the older React bundle found in the source HTML before building.');
}
// The embedded libraries in the original also contain "</body>" inside strings; the real one is the last.
const at = html.lastIndexOf('</body>');
if (at < 0) { console.error('No </body> found in ' + src); process.exit(1); }

const inject = '<div id="react-root"></div>\n<script id="react-shell-bundle">' + js + '</script>\n';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html.slice(0, at) + inject + html.slice(at));
console.log('Built ' + out + '  (' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB; React layer ' + (js.length / 1024).toFixed(0) + ' KB)');
