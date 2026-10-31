// End-to-end test of the BUILT file in a real browser (Chromium via Playwright).
//   npm run build && npm run test:e2e
// Set CHROME_PATH if Playwright's own browser is not installed.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const FILE = path.resolve(process.argv[2] || 'dist/ElectronicClassRecordFINAL.html');
const URL = pathToFileURL(FILE).href;
const exe = process.env.CHROME_PATH || (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined);

const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 }, acceptDownloads: true });
const errors = [];
let passed = 0;
const ok = (name) => { passed++; console.log('  ✓ ' + name + (errors.length ? '   [page errors so far: ' + errors.length + ']' : '')); };

async function open() {
  const p = await ctx.newPage();
  p.on('pageerror', (e) => { errors.push(e.message); if (!/matches is not a function/.test(e.message)) console.log('   !! ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')); });
  p.on('dialog', (d) => d.accept());
  await p.goto(URL);
  await p.waitForFunction(() => document.documentElement.classList.contains('rx-ready'));
  return p;
}
const idb = (p, key) => p.evaluate((k) => new Promise((res) => window.ecrGet(k, (e, v) => res(v))), key);
// The app's own "Teacher Profile" setup window opens after some logins; close it like a teacher would.
async function closeProfileIfOpen(p) {
  await p.waitForTimeout(700);
  if (await p.evaluate(() => getComputedStyle(document.getElementById('profile-overlay')).display !== 'none')) {
    await p.click('.pm-btn-cancel');
  }
}

console.log('Login');
let p = await open();
await p.waitForSelector('.rx-card');
assert.equal(await p.evaluate(() => getComputedStyle(document.getElementById('login-overlay')).display), 'none');
ok('React login shown, original overlay hidden');

const MASTER = await p.evaluate(() => window.MASTER_RESET_CODE);
const NAMES = await p.$$eval('#rx-name option', (o) => o.slice(1).map((x) => x.value));
assert.equal(NAMES.length, await p.evaluate(() => window.TEACHER_ACCOUNTS.length));
ok('dropdown lists all ' + NAMES.length + ' teachers from the original list');

const U = 'juliuscelio';
await p.selectOption('#rx-name', U);
assert.ok(await p.isVisible('#rx-confirm'));
assert.match(await p.textContent('.rx-notice'), /First time signing in/);
ok('first-time notice + confirm field');

await p.fill('#rx-pw', 'abc'); await p.fill('#rx-confirm', 'abc');
await p.click('.rx-btn-primary');
assert.match(await p.textContent('[data-testid=rx-error]'), /at least 4/);
await p.fill('#rx-pw', 'secret1'); await p.fill('#rx-confirm', 'secret2');
await p.click('.rx-btn-primary');
assert.match(await p.textContent('[data-testid=rx-error]'), /do not match/);
ok('password rules (min 4, must match)');

await p.fill('#rx-confirm', 'secret1');
await p.click('.rx-btn-primary');
await p.waitForSelector('[data-testid=rx-login]', { state: 'detached' });
const sess = await p.evaluate(() => JSON.parse(sessionStorage.getItem('ecr_session')));
assert.equal(sess.username, U);
assert.match(await p.textContent('#login-user-badge'), /Julius Celio/);
assert.equal((await idb(p, 'ecr_users_v1'))[U].password, 'secret1');
assert.equal(await idb(p, 'ecr_device_teacher_v1'), U);
ok('first-time sign-up logs in; legacy session, badge, saved user and device teacher all set');
assert.ok(await p.evaluate(() => getComputedStyle(document.getElementById('profile-overlay')).display !== 'none'));
ok('the app\'s own Teacher Profile setup still opens after a first sign-in');
await closeProfileIfOpen(p);

await p.reload();
await p.waitForFunction(() => document.documentElement.classList.contains('rx-ready'));
await p.waitForTimeout(300);
assert.equal(await p.locator('[data-testid=rx-login]').count(), 0);
ok('reload keeps the session (no login again)');

// ---- returning teacher on a fresh tab (same device storage, new session)
await p.close();
p = await open();
await p.waitForSelector('[data-testid=rx-welcome-name]');
assert.match(await p.textContent('[data-testid=rx-welcome-name]'), /Julius Celio/);
assert.equal(await p.locator('#rx-confirm').count(), 0);
ok('returning teacher sees "welcome back"');

for (let i = 1; i <= 3; i++) {
  await p.fill('#rx-pw', 'wrong' + i);
  await p.click('.rx-btn-primary');
  await p.waitForFunction((n) => document.querySelector('[data-testid=rx-error]')?.textContent.includes('(' + n + ' failed'), i);
}
assert.match(await p.textContent('[data-testid=rx-error]'), /Reset password\?/);
ok('wrong passwords counted; reset link appears after 3');

// ---- forgot password with the master code
await p.click('[data-testid=rx-error] button');
await p.waitForSelector('[data-testid=rx-forgot]');
await p.fill('#rx-code', 'not-the-code'); await p.keyboard.press('Enter');
assert.match(await p.textContent('.rx-modal .rx-error'), /Incorrect master reset code/);
await p.fill('#rx-code', MASTER); await p.keyboard.press('Enter');
await p.waitForSelector('.rx-ok');
await p.waitForSelector('[data-testid=rx-forgot]', { state: 'detached' });
assert.equal((await idb(p, 'ecr_users_v1'))[U].password, null);
assert.ok(await p.isVisible('#rx-confirm'));
ok('master code clears the password and switches to "create password"');

await p.fill('#rx-pw', 'newpass'); await p.fill('#rx-confirm', 'newpass');
await p.keyboard.press('Enter');
await p.waitForSelector('[data-testid=rx-login]', { state: 'detached' });
assert.equal((await idb(p, 'ecr_users_v1'))[U].password, 'newpass');
ok('new password saved and signed in');

// ---- returning teacher, correct password, and "Not you?"
await p.close();
p = await open();
await p.waitForSelector('[data-testid=rx-welcome-name]');
await p.fill('#rx-pw', 'newpass'); await p.keyboard.press('Enter');
await p.waitForSelector('[data-testid=rx-login]', { state: 'detached' });
ok('correct password signs in with Enter');
await p.close();
p = await open();
await p.waitForSelector('[data-testid=rx-welcome-name]');
await p.click('.rx-card .rx-link');
await p.waitForSelector('#rx-name');
assert.equal(await idb(p, 'ecr_device_teacher_v1'), null);
ok('"Not you?" forgets the device teacher');

// sign in again for the roster part
await p.selectOption('#rx-name', U);
await p.fill('#rx-pw', 'newpass'); await p.keyboard.press('Enter');
await p.waitForSelector('[data-testid=rx-login]', { state: 'detached' });
await closeProfileIfOpen(p);

console.log('Roster');
const before = await idb(p, 'ecr_classlist');
const embedded = await p.evaluate(() => window.ECR_EMBEDDED_CLASSLIST);
const baseline = JSON.parse(JSON.stringify(before || embedded || {}));
// The embedded list can be empty (no learners shipped in the HTML): treat missing sections as empty.
['rizal', 'bonifacio', 'mabini', 'aquino', 'jacinto', 'juan-luna', 'del-pilar', 'silang', 'dagohoy'].forEach((k) => {
  baseline[k] = baseline[k] || { male: [], female: [] };
  baseline[k].male = baseline[k].male || [];
  baseline[k].female = baseline[k].female || [];
});
await p.click('button:has-text("Roster")');
await p.waitForSelector('[data-testid=rx-roster]');
assert.equal(await p.locator('.rx-side button[data-testid^="rx-sec-"]').count(), 9);
ok('toolbar Roster button opens the React panel with 9 sections');

const firstKey = await p.$eval('.rx-side button[data-testid^="rx-sec-"]', (b) => b.dataset.testid.replace('rx-sec-', ''));
const nBoys = baseline[firstKey].male.filter(Boolean).length;
assert.match(await p.textContent('[data-testid=rx-col-male] .rx-count'), new RegExp('\\(' + nBoys + ' / 30\\)'));
const firstBoy = await p.inputValue('[data-testid=rx-col-male] .rx-row input');
assert.equal(firstBoy, baseline[firstKey].male[0] || '');
ok('shows the saved learners of the first section (' + firstKey + ': ' + nBoys + ' boys)');
await p.screenshot({ path: '/tmp/s2-roster.png' });

// edit a cell, add via paste, save
await p.fill('[data-testid=rx-col-female] .rx-row >> nth=0 >> input', 'test learner 9');
await p.click('[data-testid=rx-col-female] .rx-tool:has-text("Paste list")');
await p.fill('.rx-paste textarea', 'ana lopez\nbea cruz\n\nclara reyes');
await p.click('text=Use these names');
assert.equal(await p.inputValue('[data-testid=rx-col-female] .rx-row >> nth=2 >> input'), '');
assert.equal(await p.inputValue('[data-testid=rx-col-female] .rx-row >> nth=3 >> input'), 'CLARA REYES');
ok('paste list fills rows in order, blank line keeps an empty row');
assert.ok(await p.isVisible('text=Unsaved changes'));
await p.click('[data-testid=rx-save]');
await p.waitForFunction(() => /Saved/.test(document.querySelector('[data-testid=rx-msg]')?.textContent || ''));
const saved = await idb(p, 'ecr_classlist');
assert.deepEqual(saved[firstKey].female.slice(0, 4), ['ANA LOPEZ', 'BEA CRUZ', '', 'CLARA REYES']);
assert.equal(saved[firstKey].female.length, 30);
assert.equal(saved[firstKey].male.length, 30);
ok('Save writes 30-row arrays to ecr_classlist in the original shape');
const legacyInput = await p.inputValue(`#${firstKey}-cl-female-col input[data-cl-idx="3"]`);
assert.equal(legacyInput, 'CLARA REYES');
ok('the app\'s own class-list inputs were refreshed (' + firstKey + ' girl #4 = CLARA REYES)');

// export from React and compare with the ORIGINAL export
const [dl1] = await Promise.all([p.waitForEvent('download'), p.click('[data-testid=rx-roster] >> text=Export CSV')]);
const reactCsv = fs.readFileSync(await dl1.path(), 'utf8');
await p.evaluate(() => window.__legacyExport = true);
const legacyDlPromise = p.waitForEvent('download');
await p.evaluate(() => window.rosterExportCSV());
const legacyCsv = fs.readFileSync(await (await legacyDlPromise).path(), 'utf8');
assert.equal(reactCsv, legacyCsv);
ok('React "Export CSV" is byte-identical to the original app\'s export (' + reactCsv.split('\r\n').length + ' lines)');

// legacy import of the React CSV reproduces the same data (cross-compat)
fs.writeFileSync('/tmp/roster-from-react.csv', reactCsv);
const snapshot = await idb(p, 'ecr_classlist');
// The original modal is never shown while React is active, so open it (its select needs filling) just for this check.
await p.evaluate(() => window.__ecrLegacyOpenRoster());
await p.setInputFiles('#rst-import-input', '/tmp/roster-from-react.csv');
await p.waitForTimeout(600);
await p.evaluate(() => { document.getElementById('rst-overlay').style.display = 'none'; });
const afterLegacy = await idb(p, 'ecr_classlist');
for (const k of Object.keys(snapshot)) {
  assert.deepEqual(afterLegacy[k].male.filter(Boolean), snapshot[k].male.filter(Boolean), k + ' male');
  assert.deepEqual(afterLegacy[k].female.filter(Boolean), snapshot[k].female.filter(Boolean), k + ' female');
}
ok('original app can import the CSV exported by React (same learners)');

// React import of a CSV (replace one section), then verify
const rz = await p.evaluate(() => window.ECR_SEC.rizal);
const csv = '\uFEFFGrade,Section,Sex,Name\r\n' + rz.g + ',' + rz.n + ',Boy,"DELA CRUZ, JUAN"\r\n' + rz.g + ',' + rz.n + ',Girl,MARIA SANTOS\r\n9,Nowhere,Boy,X\r\n';
fs.writeFileSync('/tmp/one-section.csv', csv);
await p.setInputFiles('[data-testid=rx-import]', '/tmp/one-section.csv');
await p.waitForFunction(() => /Imported 1 section/.test(document.querySelector('[data-testid=rx-msg]')?.textContent || ''));
const imp = await idb(p, 'ecr_classlist');
assert.deepEqual(imp.rizal.male.filter(Boolean), ['DELA CRUZ, JUAN']);
assert.deepEqual(imp.rizal.female.filter(Boolean), ['MARIA SANTOS']);
assert.match(await p.textContent('[data-testid=rx-msg]'), /Skipped.*G9 Nowhere/);
ok('React CSV import replaces only matching sections and reports skipped ones');

// switching with unsaved edits asks first; dismissing keeps the section
await p.fill('[data-testid=rx-col-male] .rx-row >> nth=0 >> input', 'changed');
let asked = 0;
p.removeAllListeners('dialog');
p.on('dialog', (d) => { asked++; d.dismiss(); });
await p.click('.rx-side button[data-testid^="rx-sec-"] >> nth=2');
assert.equal(asked, 1);
assert.ok(await p.locator('.rx-side button.rx-on').first().getAttribute('data-testid').then((t) => t.includes(firstKey)));
ok('unsaved changes are protected when switching section');
p.removeAllListeners('dialog');
p.on('dialog', (d) => d.accept());

// Escape closes (accepting discard)
await p.keyboard.press('Escape');
await p.waitForSelector('[data-testid=rx-roster]', { state: 'detached' });
ok('Escape closes the panel');

// persistence across reload
await p.reload();
await p.waitForFunction(() => document.documentElement.classList.contains('rx-ready'));
const afterReload = await idb(p, 'ecr_classlist');
assert.deepEqual(afterReload.rizal.female.filter(Boolean), ['MARIA SANTOS']);
ok('roster survives a reload');


// ---- delete (hide) and add (restore) sections
console.log('Add / Delete section');
const SEC = '.rx-side button[data-testid^="rx-sec-"]';
const tabVisible = (pg, key) => pg.evaluate((k) => { const b = document.querySelector(`button[onclick*="showSubjectTab('${k}'"]`); return !!b && getComputedStyle(b).display !== 'none'; }, key);
const panelVisible = (pg, key) => pg.evaluate((k) => getComputedStyle(document.getElementById(k + '-section')).display !== 'none', key);
const hiddenInIdb = async (pg) => (await idb(pg, 'ecr_hidden_sections')) || [];
const dataBefore = await idb(p, 'ecr_classlist');
await closeProfileIfOpen(p);

await p.click('button:has-text("Roster")');
await p.waitForSelector('[data-testid=rx-roster]');
await p.click('[data-testid=rx-sec-mabini]');
assert.ok(await tabVisible(p, 'mabini'));
await p.click('[data-testid=rx-delete-section]');
await p.waitForFunction(() => /Deleted/.test(document.querySelector('[data-testid=rx-msg]')?.textContent || ''));
assert.equal(await p.locator(SEC).count(), 8);
assert.equal(await p.locator('[data-testid=rx-sec-mabini]').count(), 0);
assert.equal(await tabVisible(p, 'mabini'), false);
assert.equal(await panelVisible(p, 'mabini'), false);
assert.equal(await p.evaluate(() => document.querySelector('#clear-section option[value="mabini"]').disabled), true);
assert.deepEqual(await hiddenInIdb(p), ['mabini']);
assert.deepEqual(await idb(p, 'ecr_classlist'), dataBefore);
ok('Delete hides the section (sidebar, tabs, panel, dropdown) and keeps all learner data');

await p.keyboard.press('Escape');
await p.reload();
await p.waitForFunction(() => document.documentElement.classList.contains('rx-ready'));
await closeProfileIfOpen(p);
assert.equal(await tabVisible(p, 'mabini'), false);
assert.ok(await tabVisible(p, 'rizal'));
ok('a deleted section stays hidden after reload');

await p.click('button:has-text("Roster")');
await p.waitForSelector('[data-testid=rx-roster]');
assert.equal(await p.locator(SEC).count(), 8);
await p.click('[data-testid=rx-add-section]');
await p.click('[data-testid=rx-pick-mabini]');
await p.waitForFunction(() => /Added/.test(document.querySelector('[data-testid=rx-msg]')?.textContent || ''));
assert.equal(await p.locator(SEC).count(), 9);
assert.ok(await tabVisible(p, 'mabini'));
assert.deepEqual(await hiddenInIdb(p), []);
assert.match(await p.getAttribute('[data-testid=rx-sec-mabini]', 'class') || '', /rx-on/);
ok('Add section brings the deleted section back, selected and fully visible');

await p.click('[data-testid=rx-add-section]');
assert.match(await p.textContent('[data-testid=rx-msg]'), /Nothing to add/);
ok('Add section says so when nothing is deleted');

// the last remaining section can never be deleted
for (let i = 0; i < 8; i++) {
  await p.click(SEC + ' >> nth=0');
  await p.click('[data-testid=rx-delete-section]');
  await p.waitForFunction((n) => document.querySelectorAll('.rx-side button[data-testid^="rx-sec-"]').length === n, 8 - i);
}
assert.equal(await p.locator(SEC).count(), 1);
assert.equal(await p.isDisabled('[data-testid=rx-delete-section]'), true);
const lastKey = await p.$eval(SEC, (b) => b.dataset.testid.replace('rx-sec-', ''));
assert.ok(await tabVisible(p, lastKey));
ok('the last section cannot be deleted (button disabled, its tab stays visible)');

// restore everything for the remaining checks
for (let i = 0; i < 8; i++) {
  await p.click('[data-testid=rx-add-section]');
  await p.click('.rx-side-pick >> nth=0');
  await p.waitForFunction((n) => document.querySelectorAll('.rx-side button[data-testid^="rx-sec-"]').length === n, 2 + i);
}
assert.equal(await p.locator(SEC).count(), 9);
assert.deepEqual(await hiddenInIdb(p), []);
assert.deepEqual(await idb(p, 'ecr_classlist'), dataBefore);
ok('all sections restored with the learner data unchanged');
await p.keyboard.press('Escape');
await p.waitForSelector('[data-testid=rx-roster]', { state: 'detached' });

// graceful fallback: if React is gone the original modal must still open
const legacyFile = process.env.LEGACY || path.resolve('../ElectronicClassRecordFINAL.html');
if (fs.existsSync(legacyFile)) {
  const q = await ctx.newPage();
  await q.goto(pathToFileURL(legacyFile).href);
  await q.waitForTimeout(500);
  assert.equal(await q.locator('[data-testid=rx-login]').count(), 0);
  assert.notEqual(await q.evaluate(() => getComputedStyle(document.getElementById('login-overlay')).display), 'none');
  ok('the untouched original file still works on its own (legacy login visible)');
}

// The ORIGINAL app already logs "e.target.matches is not a function" whenever it fires a synthetic
// 'input' event on the document (same count with or without React). Ignore only that one known message.
const KNOWN = /(e\.target|inp)\.matches is not a function/;
const unexpected = errors.filter((m) => !KNOWN.test(m));
console.log('\nPage errors: ' + errors.length + ' (' + (errors.length - unexpected.length) + ' are the original app\'s known matches() bug)');
assert.deepEqual(unexpected, []);
console.log(passed + ' checks passed');
await browser.close();
