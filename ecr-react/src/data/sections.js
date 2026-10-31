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

// Subjects offered per section (same keys as the HTML SUBJECT_OPTIONS_DISPLAY)
export const SUBJECT_OPTIONS = {
  ENGLISH: 'English',
  FILIPINO: 'Filipino',
  MATHEMATICS: 'Mathematics',
  SCIENCE: 'Science',
  TLE: 'TLE',
  AP: 'AP',
  'VALUES EDUCATION': 'Values Education',
  MAPEH: 'MAPEH',
  MAPEH_MA: 'MAPEH – Music & Arts',
  MAPEH_PEH: 'MAPEH – PE & Health',
};

// The HTML grade sheets ship with these two subject tabs per section
export const DEFAULT_SUBJECTS = ['MATHEMATICS', 'SCIENCE'];

// Default component weights per subject — fractions, exactly as in the HTML
export const DEFAULT_WEIGHTS = {
  ENGLISH: { ww: 0.3, pt: 0.5, qa: 0.2 },
  FILIPINO: { ww: 0.3, pt: 0.5, qa: 0.2 },
  MATHEMATICS: { ww: 0.4, pt: 0.4, qa: 0.2 },
  SCIENCE: { ww: 0.4, pt: 0.4, qa: 0.2 },
  TLE: { ww: 0.2, pt: 0.6, qa: 0.2 },
  AP: { ww: 0.4, pt: 0.4, qa: 0.2 },
  'VALUES EDUCATION': { ww: 0.4, pt: 0.4, qa: 0.2 },
  MAPEH: { ww: 0.2, pt: 0.6, qa: 0.2 },
  MAPEH_MA: { ww: 0.2, pt: 0.6, qa: 0.2 },
  MAPEH_PEH: { ww: 0.2, pt: 0.6, qa: 0.2 },
};

export const FALLBACK_WEIGHTS = { ww: 0.4, pt: 0.4, qa: 0.2 };

/** User overrides (if any) win over defaults; unknown subjects fall back to 40/40/20. */
export function getWeightsForSubject(subjectKey, overrides) {
  const merged = { ...DEFAULT_WEIGHTS, ...(overrides || {}) };
  return merged[subjectKey] || FALLBACK_WEIGHTS;
}

// Score columns per HTML grade sheet: WW 1-5, PT 1-3, QA = ST1, ST2, TE
export const SCORE_COLUMNS = {
  ww: 5,
  pt: 3,
  qa: 3,
};
export const QA_LABELS = ['ST1', 'ST2', 'TE'];

// The HTML has three terms (1st / 2nd / 3rd), not four quarters
export const TERMS = ['q1', 'q2', 'q3'];
export const TERM_LABELS = { q1: '1st Term', q2: '2nd Term', q3: '3rd Term' };

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
