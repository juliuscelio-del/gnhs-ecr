// Default sections for Grades 7–10
// Key is used internally; grade + name can be customized by the teacher

export const DEFAULT_SECTIONS = {
  rizal:       { grade: 7,  name: 'Section A', order: 1 },
  bonifacio:   { grade: 7,  name: 'Section B', order: 2 },
  'lapu-lapu': { grade: 7,  name: 'Section C', order: 3 },
  mabini:      { grade: 8,  name: 'Section A', order: 4 },
  aquino:      { grade: 8,  name: 'Section B', order: 5 },
  jacinto:     { grade: 8,  name: 'Section C', order: 6 },
  'juan-luna': { grade: 9,  name: 'Section A', order: 7 },
  'del-pilar': { grade: 9,  name: 'Section B', order: 8 },
  silang:      { grade: 10, name: 'Section A', order: 9 },
  dagohoy:     { grade: 10, name: 'Section B', order: 10 },
};

export const SECTION_KEYS = Object.keys(DEFAULT_SECTIONS);

export const GRADE_LEVELS = [7, 8, 9, 10];

// Default subject weights (can be customized per subject)
export const DEFAULT_WEIGHTS = {
  ww: 40,   // Written Works
  pt: 40,   // Performance Tasks
  qa: 20,   // Quarterly Assessment
};

// Number of score columns
export const SCORE_COLUMNS = {
  ww: 10,   // Written Works 1–10
  pt: 10,   // Performance Tasks 1–10
  qa: 3,    // QA1, QA2, QA3 (or single QA depending on setup)
};

export function getSectionLabel(key, sections = DEFAULT_SECTIONS) {
  const s = sections[key];
  if (!s) return key;
  return `Grade ${s.grade} – ${s.name}`;
}

export function getSectionsByGrade(sections = DEFAULT_SECTIONS) {
  const byGrade = {};
  GRADE_LEVELS.forEach(g => { byGrade[g] = []; });
  Object.entries(sections).forEach(([key, s]) => {
    if (byGrade[s.grade]) {
      byGrade[s.grade].push({ key, ...s });
    }
  });
  // sort by order
  Object.values(byGrade).forEach(list => list.sort((a, b) => a.order - b.order));
  return byGrade;
}
