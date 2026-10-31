/**
 * Simple storage layer for the Electronic Class Record.
 * Uses localStorage for now (easy to migrate to IndexedDB later).
 */

const PREFIX = 'ecr_v2_';

export function loadJSON(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    scheduleBackup();
    return true;
  } catch (e) {
    console.error('Failed to save', key, e);
    return false;
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(PREFIX + key);
    scheduleBackup();
  } catch {}
}


// ----- Electron bridge (window.electronAPI from preload.js) -----
// In a normal browser these are all no-ops.

const api = typeof window !== 'undefined' ? window.electronAPI : undefined;

function dumpAll() {
  const out = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) out[k] = localStorage.getItem(k);
  }
  return JSON.stringify(out);
}

let backupTimer = null;
function scheduleBackup() {
  if (!api) return;
  clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    try { api.writeData(dumpAll()); } catch (e) { console.error('Backup failed', e); }
  }, 500);
}

/** Call once before rendering. Restores from ecr-data.json if localStorage is empty. */
export async function initStorage() {
  if (!api) return;
  try {
    let hasData = false;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith(PREFIX)) { hasData = true; break; }
    }
    if (!hasData) {
      const raw = await api.readData();
      if (raw) {
        const obj = JSON.parse(raw);
        Object.entries(obj).forEach(([k, v]) => {
          if (k.startsWith(PREFIX)) localStorage.setItem(k, v);
        });
      }
    }
    // Main process asks for a last save when the window closes.
    api.onFinalSave(() => {
      try { api.writeDataSync(dumpAll()); } catch (e) {}
      api.saveDone();
    });
  } catch (e) {
    console.error('initStorage failed', e);
  }
}

// ----- Specific data helpers -----

export function loadSections() {
  return loadJSON('sections', null); // null means use defaults
}

export function saveSections(sections) {
  return saveJSON('sections', sections);
}

export function loadClassList(sectionKey) {
  return loadJSON(`classlist_${sectionKey}`, { male: [], female: [] });
}

export function saveClassList(sectionKey, list) {
  return saveJSON(`classlist_${sectionKey}`, list);
}

export function loadScores(sectionKey, subjectKey, term) {
  // term: 'q1' | 'q2' | 'q3'
  return loadJSON(`scores_${sectionKey}_${subjectKey}_${term}`, {});
}

export function saveScores(sectionKey, subjectKey, term, scores) {
  return saveJSON(`scores_${sectionKey}_${subjectKey}_${term}`, scores);
}

// Per-subject overrides: { MATHEMATICS: {ww:0.4, pt:0.4, qa:0.2}, ... } (fractions)
export function loadWeights() {
  return loadJSON('subject_weights', {});
}

export function saveWeights(weights) {
  return saveJSON('subject_weights', weights);
}

export function loadTeacherProfile() {
  return loadJSON('teacher_profile', {
    name: '',
    school: '',
    schoolYear: '2026–2027',
    subject: '',
  });
}

export function saveTeacherProfile(profile) {
  return saveJSON('teacher_profile', profile);
}

export function clearAllData() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  scheduleBackup();
}
