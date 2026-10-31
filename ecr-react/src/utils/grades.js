/**
 * Grade calculation — ported 1:1 from ElectronicClassRecordFINAL.html
 * (calcGrades, transmute, getDescriptor, transmutationTable).
 *
 * Flow per learner:
 *   PS (percentage score) = total / highest possible * 100
 *   WS (weighted score)   = PS * weight
 *   Initial grade         = WW.WS + PT.WS + QA.WS
 *   Final grade           = transmute(Initial grade)   (DepEd transmutation table)
 */

import { getWeightsForSubject } from '../data/sections';

// [low, high, transmuted grade]
export const TRANSMUTATION_TABLE = [
  [0, 4.67, 60], [4.68, 9.34, 61], [9.35, 14.0, 62], [14.01, 18.67, 63],
  [18.68, 23.34, 64], [23.35, 28.0, 65], [28.01, 32.67, 66], [32.68, 37.33, 67],
  [37.34, 42.0, 68], [42.01, 46.66, 69], [46.67, 51.33, 70], [51.34, 56.0, 71],
  [56.01, 60.66, 72], [60.67, 65.33, 73], [65.34, 69.99, 74], [70.0, 71.17, 75],
  [71.18, 72.35, 76], [72.36, 73.53, 77], [73.54, 74.71, 78], [74.72, 75.89, 79],
  [75.9, 77.07, 80], [77.08, 78.25, 81], [78.26, 79.43, 82], [79.44, 80.61, 83],
  [80.62, 81.79, 84], [81.8, 82.97, 85], [82.98, 84.15, 86], [84.16, 85.33, 87],
  [85.34, 86.51, 88], [86.52, 87.69, 89], [87.7, 88.87, 90], [88.88, 90.05, 91],
  [90.06, 91.23, 92], [91.24, 92.41, 93], [92.42, 93.59, 94], [93.6, 94.77, 95],
  [94.78, 95.95, 96], [95.96, 97.13, 97], [97.14, 98.31, 98], [98.32, 99.49, 99],
  [99.5, 100, 100],
];

export function transmute(score) {
  if (score === null || score === '' || score === undefined || isNaN(score)) return '';
  for (const [lo, hi, g] of TRANSMUTATION_TABLE) {
    if (score >= lo && score <= hi) return g;
  }
  if (score < TRANSMUTATION_TABLE[0][0]) return TRANSMUTATION_TABLE[0][2];
  if (score > TRANSMUTATION_TABLE[TRANSMUTATION_TABLE.length - 1][1]) {
    return TRANSMUTATION_TABLE[TRANSMUTATION_TABLE.length - 1][2];
  }
  return '';
}

/** DepEd descriptors used by the HTML version (not "Outstanding"/"Very Satisfactory"). */
export function getDescriptor(grade) {
  const n = parseFloat(grade);
  if (isNaN(n)) return { text: '', cls: '' };
  if (n >= 90) return { text: 'Advancing', cls: 'descriptor-advancing' };
  if (n >= 80) return { text: 'Benchmarking', cls: 'descriptor-benchmarking' };
  if (n >= 75) return { text: 'Connecting', cls: 'descriptor-connecting' };
  if (n >= 65) return { text: 'Developing', cls: 'descriptor-developing' };
  return { text: 'Emerging', cls: 'descriptor-emerging' };
}

export function isPassing(grade) {
  const g = parseFloat(grade);
  return !isNaN(g) && g >= 75;
}

const round2 = (n) => Math.round(n * 100) / 100;
const num = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

/**
 * @param {string[]} wwVals / ptVals / qaVals  raw learner entries
 * @param {Array}    wwMax  / ptMax  / qaMax    "highest possible score" row
 * @param {string}   subjectKey                 e.g. 'MATHEMATICS'
 * @param {object}   weightsMap                 optional user overrides {SUBJECT:{ww,pt,qa}}
 */
export function calcGrades(wwVals, ptVals, qaVals, wwMax, ptMax, qaMax, subjectKey, weightsMap) {
  const { ww: wwWt, pt: ptWt, qa: qaWt } = getWeightsForSubject(subjectKey, weightsMap);

  // A WW/PT column only counts when its max score is set (HTML: wwMax[i] ? ... : null)
  const wwM = wwMax.map(num);
  const ptM = ptMax.map(num);
  const wwTotal = sum(wwVals.map((v, i) => (wwM[i] ? parseFloat(v) || 0 : 0)));
  const ptTotal = sum(ptVals.map((v, i) => (ptM[i] ? parseFloat(v) || 0 : 0)));
  const wwMaxTotal = sum(wwM.filter(Boolean));
  const ptMaxTotal = sum(ptM.filter(Boolean));

  const wwPS = wwMaxTotal ? round2((wwTotal / wwMaxTotal) * 100) : 0;
  const ptPS = ptMaxTotal ? round2((ptTotal / ptMaxTotal) * 100) : 0;

  // QA: every entry counts, summed (ST1 + ST2 + TE)
  const qaTotal = sum(qaVals.map(num));
  const qaMaxTotal = sum(qaMax.map(num));
  const qaPS = qaMaxTotal ? round2((qaTotal / qaMaxTotal) * 100) : 0;

  const wwWS = round2(wwPS * wwWt);
  const ptWS = round2(ptPS * ptWt);
  const qaWS = round2(qaPS * qaWt);
  const init = round2(wwWS + ptWS + qaWS);
  const final = transmute(init);

  return { wwTotal, wwPS, wwWS, ptTotal, ptPS, ptWS, qaTotal, qaPS, qaWS, init, final, wwMaxTotal, ptMaxTotal, qaMaxTotal };
}

/** Totals shown on the "highest possible score" row. */
export function calcMaxTotals(wwMax, ptMax, qaMax) {
  return {
    ww: sum(wwMax.map(num).filter(Boolean)),
    pt: sum(ptMax.map(num).filter(Boolean)),
    qa: sum(qaMax.map(num)),
  };
}

/** Learner score is invalid when it exceeds a set max (HTML clears these inputs). */
export function exceedsMax(value, max) {
  const v = parseFloat(value);
  const m = parseFloat(max);
  return !isNaN(v) && !isNaN(m) && m > 0 && v > m;
}

/** Display helper: show 0, hide null/''/undefined. */
export function displayVal(v) {
  return v === 0 || v ? v : '';
}
