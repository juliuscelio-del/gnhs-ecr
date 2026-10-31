import { useMemo } from 'react'
import {
  componentPercentage,
  computeQuarterlyGrade,
  getRemarks,
  formatGrade,
  isPassing,
} from '../utils/grades'
import { SCORE_COLUMNS } from '../data/sections'

function StudentRow({ student, gender, index, scores, maxes, weights, onScoreChange }) {
  const id = student.id
  const studentScores = scores[id] || {}

  // Build score arrays
  const wwScores = Array.from({ length: SCORE_COLUMNS.ww }, (_, i) => studentScores[`ww${i + 1}`] ?? '')
  const ptScores = Array.from({ length: SCORE_COLUMNS.pt }, (_, i) => studentScores[`pt${i + 1}`] ?? '')
  const qaScores = Array.from({ length: SCORE_COLUMNS.qa }, (_, i) => studentScores[`qa${i + 1}`] ?? '')

  const wwMax = Array.from({ length: SCORE_COLUMNS.ww }, (_, i) => maxes[`ww${i + 1}`] ?? '')
  const ptMax = Array.from({ length: SCORE_COLUMNS.pt }, (_, i) => maxes[`pt${i + 1}`] ?? '')
  const qaMax = Array.from({ length: SCORE_COLUMNS.qa }, (_, i) => maxes[`qa${i + 1}`] ?? '')

  const wwPct = componentPercentage(wwScores, wwMax)
  const ptPct = componentPercentage(ptScores, ptMax)
  const qaPct = componentPercentage(qaScores, qaMax)
  const qGrade = computeQuarterlyGrade(wwPct, ptPct, qaPct, weights)
  const remarks = getRemarks(qGrade)

  const handleChange = (field, value) => {
    // basic validation: only numbers or empty
    if (value !== '' && isNaN(parseFloat(value))) return
    onScoreChange(id, field, value)
  }

  return (
    <tr data-role="student">
      <td style={{ fontWeight: 600, color: '#64748b', width: 36 }}>{index + 1}</td>
      <td className="name-cell">{student.name || '—'}</td>

      {/* Written Works */}
      {wwScores.map((val, i) => (
        <td key={`ww${i}`}>
          <input
            className="score-input"
            type="text"
            inputMode="decimal"
            value={val}
            onChange={e => handleChange(`ww${i + 1}`, e.target.value)}
          />
        </td>
      ))}
      <td style={{ fontWeight: 600 }}>{wwPct != null ? formatGrade(wwPct, 1) : ''}</td>

      {/* Performance Tasks */}
      {ptScores.map((val, i) => (
        <td key={`pt${i}`}>
          <input
            className="score-input"
            type="text"
            inputMode="decimal"
            value={val}
            onChange={e => handleChange(`pt${i + 1}`, e.target.value)}
          />
        </td>
      ))}
      <td style={{ fontWeight: 600 }}>{ptPct != null ? formatGrade(ptPct, 1) : ''}</td>

      {/* Quarterly Assessment */}
      {qaScores.map((val, i) => (
        <td key={`qa${i}`}>
          <input
            className="score-input"
            type="text"
            inputMode="decimal"
            value={val}
            onChange={e => handleChange(`qa${i + 1}`, e.target.value)}
          />
        </td>
      ))}
      <td style={{ fontWeight: 600 }}>{qaPct != null ? formatGrade(qaPct, 1) : ''}</td>

      {/* Quarterly Grade */}
      <td className={qGrade != null ? (isPassing(qGrade) ? 'grade-pass' : 'grade-fail') : ''}>
        {qGrade != null ? formatGrade(qGrade, 2) : ''}
      </td>
      <td style={{ fontSize: 12 }}>{remarks.text}</td>
    </tr>
  )
}

function MaxRow({ maxes, onMaxChange }) {
  const handle = (field, value) => {
    if (value !== '' && isNaN(parseFloat(value))) return
    onMaxChange(field, value)
  }

  return (
    <tr style={{ background: '#f1f5f9' }}>
      <td></td>
      <td className="name-cell" style={{ fontWeight: 700, fontSize: 12, color: '#64748b' }}>
        HIGHEST POSSIBLE SCORE
      </td>
      {Array.from({ length: SCORE_COLUMNS.ww }, (_, i) => (
        <td key={`mww${i}`}>
          <input
            className="score-input"
            type="text"
            inputMode="decimal"
            value={maxes[`ww${i + 1}`] ?? ''}
            onChange={e => handle(`ww${i + 1}`, e.target.value)}
            placeholder="—"
          />
        </td>
      ))}
      <td></td>
      {Array.from({ length: SCORE_COLUMNS.pt }, (_, i) => (
        <td key={`mpt${i}`}>
          <input
            className="score-input"
            type="text"
            inputMode="decimal"
            value={maxes[`pt${i + 1}`] ?? ''}
            onChange={e => handle(`pt${i + 1}`, e.target.value)}
            placeholder="—"
          />
        </td>
      ))}
      <td></td>
      {Array.from({ length: SCORE_COLUMNS.qa }, (_, i) => (
        <td key={`mqa${i}`}>
          <input
            className="score-input"
            type="text"
            inputMode="decimal"
            value={maxes[`qa${i + 1}`] ?? ''}
            onChange={e => handle(`qa${i + 1}`, e.target.value)}
            placeholder="—"
          />
        </td>
      ))}
      <td></td>
      <td></td>
      <td></td>
    </tr>
  )
}

export default function GradeSheet({
  sectionLabel,
  quarter,
  classList,
  scores,
  weights,
  onScoreChange,
  onMaxChange,
  onOpenRoster,
}) {
  const maxes = scores.__max || {}
  const male = classList.male || []
  const female = classList.female || []
  const hasStudents = male.length + female.length > 0

  const quarterLabel = {
    q1: '1st Quarter',
    q2: '2nd Quarter',
    q3: '3rd Quarter',
    q4: '4th Quarter',
  }[quarter] || quarter

  // Build header columns
  const wwHeaders = Array.from({ length: SCORE_COLUMNS.ww }, (_, i) => `WW${i + 1}`)
  const ptHeaders = Array.from({ length: SCORE_COLUMNS.pt }, (_, i) => `PT${i + 1}`)
  const qaHeaders = Array.from({ length: SCORE_COLUMNS.qa }, (_, i) => `QA${i + 1}`)

  return (
    <div className="card">
      <div className="card-title">
        <span>
          {sectionLabel} · {quarterLabel}
        </span>
        <button className="btn-ghost no-print" onClick={onOpenRoster}>
          ✎ Edit Roster
        </button>
      </div>

      {!hasStudents ? (
        <div className="empty-state">
          <p>No students in this section yet.</p>
          <button className="btn-primary" onClick={onOpenRoster}>
            Add Students to Roster
          </button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="grade-table">
            <thead>
              <tr>
                <th rowSpan={2}>#</th>
                <th rowSpan={2}>Learner&apos;s Name</th>
                <th colSpan={SCORE_COLUMNS.ww + 1}>Written Works ({weights.ww}%)</th>
                <th colSpan={SCORE_COLUMNS.pt + 1}>Performance Tasks ({weights.pt}%)</th>
                <th colSpan={SCORE_COLUMNS.qa + 1}>Quarterly Assessment ({weights.qa}%)</th>
                <th rowSpan={2}>Quarterly<br />Grade</th>
                <th rowSpan={2}>Remarks</th>
              </tr>
              <tr>
                {wwHeaders.map(h => <th key={h} className="subhead">{h}</th>)}
                <th className="subhead">%</th>
                {ptHeaders.map(h => <th key={h} className="subhead">{h}</th>)}
                <th className="subhead">%</th>
                {qaHeaders.map(h => <th key={h} className="subhead">{h}</th>)}
                <th className="subhead">%</th>
              </tr>
            </thead>
            <tbody>
              <MaxRow maxes={maxes} onMaxChange={onMaxChange} />

              {male.length > 0 && (
                <tr>
                  <td colSpan={999} className="gender-header">♂ Boys ({male.length})</td>
                </tr>
              )}
              {male.map((s, i) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  gender="male"
                  index={i}
                  scores={scores}
                  maxes={maxes}
                  weights={weights}
                  onScoreChange={onScoreChange}
                />
              ))}

              {female.length > 0 && (
                <tr>
                  <td colSpan={999} className="gender-header female">♀ Girls ({female.length})</td>
                </tr>
              )}
              {female.map((s, i) => (
                <StudentRow
                  key={s.id}
                  student={s}
                  gender="female"
                  index={i}
                  scores={scores}
                  maxes={maxes}
                  weights={weights}
                  onScoreChange={onScoreChange}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
