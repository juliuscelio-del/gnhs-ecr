// Thin adapter between React and the existing ElectronicClassRecordFINAL.html code.
// The legacy scripts run first and expose plain globals on `window`; everything the
// React side needs from them is funnelled through this file, so when a screen is
// later migrated away from legacy code only this file has to change.

import { MAXN, pad, sanitizeHidden, visibilityCSS } from './roster-logic.js';

// The first 9 are the original sections. 'lapu-lapu' is a fresh visible section, and 'spare-1'..'spare-5'
// are fresh sections that start hidden: the Roster's "Add section" button reveals them one at a time.
// These keys must match the sections that exist in ElectronicClassRecordFINAL.html.
export const KEYS = [
  'rizal', 'bonifacio', 'mabini', 'aquino', 'jacinto', 'juan-luna', 'del-pilar', 'silang', 'dagohoy',
  'lapu-lapu', 'spare-1', 'spare-2', 'spare-3', 'spare-4', 'spare-5',
];

function legacy(name) {
  const fn = window[name];
  if (typeof fn !== 'function') throw new Error('Legacy app function missing: ' + name);
  return fn;
}

// ---------------------------------------------------------------- storage (IndexedDB via legacy helpers)

export const ecrGet = (key) =>
  new Promise((resolve) => legacy('ecrGet')(key, (err, val) => resolve(err ? null : val)));

export const ecrSet = (key, value) =>
  new Promise((resolve, reject) => legacy('ecrSet')(key, value, (err) => (err ? reject(err) : resolve())));

// ---------------------------------------------------------------- users / login

export const teacherAccounts = () => window.TEACHER_ACCOUNTS || [];
export const loadUsers = () => new Promise((resolve) => legacy('_loadUsersAsync')(resolve));
export const saveUsers = (users) => new Promise((resolve) => legacy('_saveUsers')(users, resolve));
export const completeLogin = (user, username) => legacy('_completeLogin')(user, username);
export const masterResetCode = () => String(window.MASTER_RESET_CODE || '');
export const DEVICE_TEACHER_KEY = 'ecr_device_teacher_v1';

export function hasSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem('ecr_session') || 'null');
    return !!(s && s.username);
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------- sections + class list

export function secInfo(k) {
  const S = window.ECR_SEC || {};
  return S[k] || { g: 7, n: k };
}

export const sectionList = () => KEYS.map((k) => ({ key: k, g: secInfo(k).g, n: secInfo(k).n }));
export const sectionLabel = (s) => 'G' + s.g + ' \u2013 ' + s.n;

/** Saved class list, or the one embedded in the HTML on first run. Always has every section. */
export async function getClassList() {
  const saved = await ecrGet('ecr_classlist');
  const base = saved && typeof saved === 'object' ? saved : window.ECR_EMBEDDED_CLASSLIST || {};
  const d = JSON.parse(JSON.stringify(base));
  KEYS.forEach((k) => {
    if (!d[k]) d[k] = { male: [], female: [] };
    if (!d[k].male) d[k].male = [];
    if (!d[k].female) d[k].female = [];
  });
  return d;
}

/** Re-draw the legacy class-list inputs and let the app recompute, exactly like the old modal did. */
function applyToApp(d, changedKeys) {
  KEYS.forEach((k) => {
    ['male', 'female'].forEach((g) => {
      const id = k + '-cl-' + g + '-col';
      if (typeof window._buildCLColumn === 'function') window._buildCLColumn(id, k, g, g === 'female');
      const col = document.getElementById(id);
      if (!col) return;
      const arr = (d[k] && d[k][g]) || [];
      col.querySelectorAll('input[data-cl-idx]').forEach((inp) => {
        inp.value = arr[parseInt(inp.dataset.clIdx, 10)] || '';
      });
    });
  });
  changedKeys.forEach((k) => {
    if (typeof window.applyClassList === 'function') window.applyClassList(k);
  });
  const any = document.querySelector('.cl-panel input[data-cl-idx]');
  if (any) any.dispatchEvent(new Event('input', { bubbles: true }));
}

/** d: whole class list. Every section is stored as exactly MAXN rows per sex. */
export async function saveClassList(d, changedKeys) {
  KEYS.forEach((k) => {
    d[k] = { male: pad(d[k].male), female: pad(d[k].female) };
  });
  await ecrSet('ecr_classlist', d);
  applyToApp(d, changedKeys);
}

/** Persist renamed sections, then reload once so every label in the app updates (as before). */
export async function saveSectionNamesAndReload(all) {
  try { localStorage.setItem('ecr_secnames_v1', JSON.stringify(all)); } catch (e) { /* ignore */ }
  try { await ecrSet('ecr_secnames', all); } catch (e) { /* ignore */ }
  setTimeout(() => window.location.reload(), 400);
}

// ---------------------------------------------------------------- deleted (hidden) sections
// A deleted section is only hidden: its learners and scores stay in storage, so it can be added back.

const HIDDEN_LS = 'ecr_hidden_sections_v1';
const HIDDEN_IDB = 'ecr_hidden_sections';

/** Fast, synchronous read (localStorage mirror) so the page can hide sections before IndexedDB is ready. */
export function readHiddenSync() {
  try { return sanitizeHidden(JSON.parse(localStorage.getItem(HIDDEN_LS) || '[]'), KEYS); } catch (e) { return []; }
}

/** Authoritative read: IndexedDB first, falling back to the localStorage mirror. */
export async function getHiddenSections() {
  try {
    const v = await ecrGet(HIDDEN_IDB);
    if (Array.isArray(v)) return sanitizeHidden(v, KEYS);
  } catch (e) { /* IndexedDB helpers not ready yet */ }
  return readHiddenSync();
}

export async function saveHiddenSections(list) {
  const clean = sanitizeHidden(list, KEYS);
  try { localStorage.setItem(HIDDEN_LS, JSON.stringify(clean)); } catch (e) { /* ignore */ }
  try { await ecrSet(HIDDEN_IDB, clean); } catch (e) { /* the localStorage mirror still works */ }
  return clean;
}

/** Hide/show the sections in the page (tabs, panels, dropdown options) and leave a hidden tab if it was open. */
export function applySectionVisibility(hidden) {
  let el = document.getElementById('rx-hidden-sections');
  if (!el) {
    el = document.createElement('style');
    el.id = 'rx-hidden-sections';
    document.head.appendChild(el);
  }
  el.textContent = visibilityCSS(hidden);

  // Safari ignores display:none on <option>, so also disable/hide them directly.
  KEYS.forEach((k) => {
    document.querySelectorAll('option[value="' + k + '"]').forEach((o) => {
      const off = hidden.includes(k);
      o.hidden = off;
      o.disabled = off;
      if (off && o.selected && o.parentElement) {
        const next = [...o.parentElement.options].find((x) => !x.disabled);
        if (next) o.parentElement.value = next.value;
      }
    });
  });

  // If the open section was just hidden, jump to the first visible section's first tab.
  const open = KEYS.find((k) => {
    const p = document.getElementById(k + '-section');
    return p && p.classList.contains('active');
  });
  if (open && hidden.includes(open)) {
    const first = [...document.querySelectorAll('button[onclick*="showSubjectTab("]')]
      .find((b) => b.offsetParent !== null);
    if (first) first.click();
  }
}

export { MAXN };