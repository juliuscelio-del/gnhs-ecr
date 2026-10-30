// Pure helpers for the Roster. No React, no DOM, so they can be unit-tested in Node.
// Behaviour deliberately mirrors the original roster modal in ElectronicClassRecordFINAL.html
// so the data saved under "ecr_classlist" keeps exactly the same shape.

export const MAXN = 30;

/** Remove digits, collapse spaces, trim, UPPERCASE (same as the original app). */
export function cleanName(s) {
  return String(s || '').replace(/[0-9]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

export const splitLines = (text) => String(text || '').split(/\r?\n/);

/** Drop trailing blanks only. Blank rows in the middle are kept (they hold a learner's place). */
export function trimTail(a) {
  const out = (a || []).map((x) => x || '');
  while (out.length && !out[out.length - 1]) out.pop();
  return out;
}

/** Cleaned names, trailing blanks removed, capped at MAXN. */
export function toArr(lines) {
  return trimTail((lines || []).map(cleanName)).slice(0, MAXN);
}

/** Always MAXN entries, '' for empty rows. */
export function pad(a) {
  const out = [];
  for (let i = 0; i < MAXN; i++) out.push(a && a[i] ? a[i] : '');
  return out;
}

export const countFilled = (a) => (a || []).filter((x) => x && String(x).trim()).length;

/** True when the cleaned list (ignoring trailing blanks) is longer than MAXN. */
export const tooMany = (lines) => trimTail((lines || []).map(cleanName)).length > MAXN;

/** Names that appear more than once (case-insensitive) across the given lists. */
export function findDuplicates(...lists) {
  const seen = new Map();
  lists.flat().forEach((n) => {
    const k = cleanName(n);
    if (k) seen.set(k, (seen.get(k) || 0) + 1);
  });
  return new Set([...seen].filter(([, c]) => c > 1).map(([k]) => k));
}

// ---------------------------------------------------------------- CSV

const csvEsc = (v) => {
  v = String(v);
  return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
};

/**
 * sections: [{key, g, n}]   data: { [key]: {male:[], female:[]} }
 * Output format is identical to the app's own "Export CSV" (BOM + CRLF).
 */
export function buildCSV(sections, data) {
  const rows = [['Grade', 'Section', 'Sex', 'Name']];
  sections.forEach((s) => {
    const d = data[s.key] || { male: [], female: [] };
    trimTail(d.male).forEach((n) => { if (n) rows.push([String(s.g), s.n, 'Boy', n]); });
    trimTail(d.female).forEach((n) => { if (n) rows.push([String(s.g), s.n, 'Girl', n]); });
  });
  return '\uFEFF' + rows.map((r) => r.map(csvEsc).join(',')).join('\r\n');
}

export function parseCSV(text) {
  text = String(text || '').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cur); cur = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); cur = ''; rows.push(row); row = [];
    } else cur += c;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows.filter((r) => r.some((x) => String(x).trim()));
}

/**
 * Turn parsed CSV rows into a replace-plan.
 * Returns { error } or { got, keys, skipped, bad } where got = { key: {male:[], female:[]} }.
 */
export function planImport(rows, sections) {
  if (!rows.length) return { error: 'That CSV is empty.' };
  const h = rows[0].map((x) => String(x).trim().toLowerCase());
  const ig = h.indexOf('grade'), is = h.indexOf('section'), ix = h.indexOf('sex'), inn = h.indexOf('name');
  if (ig < 0 || is < 0 || ix < 0 || inn < 0) return { error: 'First row must be: Grade,Section,Sex,Name' };

  const byLabel = {};
  sections.forEach((s) => { byLabel[String(s.g) + '|' + s.n.toLowerCase()] = s.key; });

  const got = {}, skipped = {};
  let bad = 0;
  rows.slice(1).forEach((r) => {
    const g = String(r[ig] || '').replace(/grade/i, '').trim();
    const sn = String(r[is] || '').trim();
    const sx = String(r[ix] || '').trim().toLowerCase();
    const nm = cleanName(r[inn]);
    if (!nm) return;
    const key = byLabel[g + '|' + sn.toLowerCase()];
    if (!key) { skipped['G' + g + ' ' + sn] = 1; return; }
    const gender = /^(boy|boys|m|male)$/.test(sx) ? 'male' : /^(girl|girls|f|female)$/.test(sx) ? 'female' : null;
    if (!gender) { bad++; return; }
    if (!got[key]) got[key] = { male: [], female: [] };
    got[key][gender].push(nm);
  });

  const keys = Object.keys(got);
  if (!keys.length) {
    return { error: 'No rows matched the sections in this app. Skipped: ' + Object.keys(skipped).join(', ') };
  }
  for (const k of keys) {
    if (got[k].male.length > MAXN || got[k].female.length > MAXN) {
      return { error: 'A section in the CSV has more than ' + MAXN + ' boys or girls.' };
    }
  }
  return { got, keys, skipped: Object.keys(skipped), bad };
}
