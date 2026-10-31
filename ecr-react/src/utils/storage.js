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
    return true;
  } catch (e) {
    console.error('Failed to save', key, e);
    return false;
  }
}

export function removeKey(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
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

export function loadScores(sectionKey, quarter) {
  // quarter: 'q1' | 'q2' | 'q3' | 'q4'
  return loadJSON(`scores_${sectionKey}_${quarter}`, {});
}

export function saveScores(sectionKey, quarter, scores) {
  return saveJSON(`scores_${sectionKey}_${quarter}`, scores);
}

export function loadWeights() {
  return loadJSON('weights', null);
}

export function saveWeights(weights) {
  return saveJSON('weights', weights);
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
}
