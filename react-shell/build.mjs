// Builds ONE offline HTML file: your original ElectronicClassRecordFINAL.html with the
// React layer (login + roster) bundled inline just before </body>.
//   node build.mjs [--src ../ElectronicClassRecordFINAL.html] [--out dist/ElectronicClassRecordFINAL.html]
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
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

const html = fs.readFileSync(src, 'utf8');
if (html.includes('id="react-shell-bundle"')) {
  console.error('That HTML already contains the React bundle. Point --src at the ORIGINAL file.');
  process.exit(1);
}
// The embedded libraries in the original also contain "</body>" inside strings; the real one is the last.
const at = html.lastIndexOf('</body>');
if (at < 0) { console.error('No </body> found in ' + src); process.exit(1); }

const inject = '<div id="react-root"></div>\n<script id="react-shell-bundle">' + js + '</script>\n';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html.slice(0, at) + inject + html.slice(at));
console.log('Built ' + out + '  (' + (fs.statSync(out).size / 1024).toFixed(0) + ' KB; React layer ' + (js.length / 1024).toFixed(0) + ' KB)');
