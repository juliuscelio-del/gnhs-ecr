import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAXN, buildCSV, cleanName, countFilled, findDuplicates, pad, parseCSV, planImport, toArr, tooMany, trimTail,
} from '../src/roster-logic.js';

const SECTIONS = [
  { key: 'rizal', g: 7, n: 'Rizal' },
  { key: 'mabini', g: 8, n: 'Mabini' },
];

test('cleanName strips digits, collapses spaces, uppercases', () => {
  assert.equal(cleanName('  juan   dela  cruz 12 '), 'JUAN DELA CRUZ');
  assert.equal(cleanName(null), '');
});

test('toArr keeps blank rows in the middle, drops trailing blanks, caps at 30', () => {
  assert.deepEqual(toArr(['a', '', 'b', '', '']), ['A', '', 'B']);
  assert.equal(toArr(Array.from({ length: 40 }, (_, i) => 'n' + 'x'.repeat(i + 1))).length, MAXN);
});

test('pad always returns 30 rows', () => {
  assert.equal(pad(['A']).length, 30);
  assert.equal(pad(undefined).length, 30);
  assert.equal(pad(['A'])[0], 'A');
});

test('tooMany ignores trailing blanks only', () => {
  assert.equal(tooMany([...Array(30).fill('a'), '', '']), false);
  assert.equal(tooMany([...Array(31).fill('a')]), true);
});

test('countFilled / trimTail / findDuplicates', () => {
  assert.equal(countFilled(['A', '', ' ', 'B']), 2);
  assert.deepEqual(trimTail(['A', '', '']), ['A']);
  assert.deepEqual([...findDuplicates(['ann', 'BOB'], ['Ann'])], ['ANN']);
});

test('CSV round-trip (commas, quotes, BOM, CRLF)', () => {
  const data = {
    rizal: { male: ['DELA CRUZ, JUAN', 'O"NEIL'], female: ['', 'MARIA'] },
    mabini: { male: [], female: ['ANA'] },
  };
  const csv = buildCSV(SECTIONS, data);
  assert.ok(csv.startsWith('\uFEFFGrade,Section,Sex,Name\r\n'));
  const plan = planImport(parseCSV(csv), SECTIONS);
  assert.ok(!plan.error, plan.error);
  assert.deepEqual(plan.got.rizal.male, ['DELA CRUZ, JUAN', 'O"NEIL']);
  // an empty row is not exported, so MARIA moves up (same as the original app's export)
  assert.deepEqual(plan.got.rizal.female, ['MARIA']);
  assert.deepEqual(plan.got.mabini.female, ['ANA']);
});

test('planImport reports problems like the original', () => {
  assert.match(planImport([], SECTIONS).error, /empty/);
  assert.match(planImport([['a', 'b']], SECTIONS).error, /Grade,Section,Sex,Name/);
  const r = planImport(parseCSV('Grade,Section,Sex,Name\n7,Nowhere,Boy,X\n'), SECTIONS);
  assert.match(r.error, /No rows matched.*G7 Nowhere/);
  const r2 = planImport(parseCSV('Grade,Section,Sex,Name\n7,Rizal,Boy,A\n7,Rizal,??,B\n7,Zed,Girl,C\n'), SECTIONS);
  assert.deepEqual(r2.keys, ['rizal']);
  assert.equal(r2.bad, 1);
  assert.deepEqual(r2.skipped, ['G7 Zed']);
  const many = 'Grade,Section,Sex,Name\n' + Array.from({ length: 31 }, (_, i) => `7,Rizal,Boy,N${'x'.repeat(i + 1)}`).join('\n');
  assert.match(planImport(parseCSV(many), SECTIONS).error, /more than 30/);
});

test('"Grade 7" and boys/girls/m/f aliases are accepted', () => {
  const r = planImport(parseCSV('Grade,Section,Sex,Name\nGrade 7,rizal,M,A\nGrade 7,RIZAL,girls,B\n'), SECTIONS);
  assert.deepEqual(r.got.rizal, { male: ['A'], female: ['B'] });
});
