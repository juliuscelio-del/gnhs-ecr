/**
 * Grade calculation helpers for DepEd-style Electronic Class Record
 * WW = Written Works, PT = Performance Tasks, QA = Quarterly Assessment
 */

import { DEFAULT_WEIGHTS } from '../data/sections';

/**
 * Compute the percentage for a component (WW, PT, or QA)
 * @param {number[]} scores - array of scores (empty string / null treated as missing)
 * @param {number[]} maxScores - corresponding max scores
 * @returns {number|null} percentage 0–100 or null if no valid scores
 */
export function componentPercentage(scores = [], maxScores = []) {
  let totalScore = 0;
  let totalMax = 0;
  let hasAny = false;

  for (let i = 0; i < scores.length; i++) {
    const s = parseFloat(scores[i]);
    const m = parseFloat(maxScores[i]);
    if (!isNaN(s) && !isNaN(m) && m > 0) {
      totalScore += s;
      totalMax += m;
      hasAny = true;
    }
  }

  if (!hasAny || totalMax === 0) return null;
  return (totalScore / totalMax) * 100;
}

/**
 * Compute quarterly grade from WW, PT, QA percentages and weights
 * @returns {number|null}
 */
export function computeQuarterlyGrade(wwPct, ptPct, qaPct, weights = DEFAULT_WEIGHTS) {
  const w = weights || DEFAULT_WEIGHTS;
  const parts = [];

  if (wwPct != null) parts.push({ pct: wwPct, weight: w.ww });
  if (ptPct  != null) parts.push({ pct: ptPct,  weight: w.pt  });
  if (qaPct  != null) parts.push({ pct: qaPct,  weight: w.qa  });

  if (parts.length === 0) return null;

  // Normalize weights of the components that have scores
  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return null;

  const weighted = parts.reduce((sum, p) => sum + (p.pct * p.weight), 0);
  return weighted / totalWeight;
}

/**
 * Final average of Q1 + Q2 + Q3 (or however many quarters exist)
 */
export function computeFinalAverage(quarterGrades = []) {
  const valid = quarterGrades
    .map(g => parseFloat(g))
    .filter(g => !isNaN(g));

  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.round(avg * 100) / 100; // 2 decimal places
}

/**
 * DepEd-style descriptor / remarks
 */
export function getRemarks(grade) {
  if (grade == null || grade === '') return { text: '', passed: null };
  const g = parseFloat(grade);
  if (isNaN(g)) return { text: '', passed: null };

  if (g >= 90) return { text: 'Outstanding', passed: true };
  if (g >= 85) return { text: 'Very Satisfactory', passed: true };
  if (g >= 80) return { text: 'Satisfactory', passed: true };
  if (g >= 75) return { text: 'Fairly Satisfactory', passed: true };
  return { text: 'Did Not Meet Expectations', passed: false };
}

export function isPassing(grade) {
  const g = parseFloat(grade);
  return !isNaN(g) && g >= 75;
}

/**
 * Safe number formatting for display
 */
export function formatGrade(value, decimals = 2) {
  if (value == null || value === '') return '';
  const n = parseFloat(value);
  if (isNaN(n)) return '';
  return n.toFixed(decimals);
}
