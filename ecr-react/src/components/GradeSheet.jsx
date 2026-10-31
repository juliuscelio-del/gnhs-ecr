import { calcGrades, calcMaxTotals, exceedsMax, getDescriptor, displayVal } from '../utils/grades'
import { SCORE_COLUMNS, QA_LABELS, SUBJECT_OPTIONS, getWeightsForSubject } from '../data/sections'

const cols = (prefix, n) => Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`)
const pct = (f) => Math.round(f * 100)

function ScoreInput({ value, max, onChange, placeholder }) {
  return (
    <input
      className={`score-input ${exceedsMax(value, max) ? 'over-max' : ''}`}
      type="text"
      inputMode="decimal"
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
    />
  )
}

function StudentRow({ student, index, scores, maxes, subjectKey, weightsMap, onScoreChange }) {
  const id = student.id
  const s = scores[id] || {}
  const get = (k) => s[k] ?? ''

  const wwKeys = cols('ww', SCORE_COLUMNS.ww)
  const ptKeys = cols('pt', SCORE_COLUMNS.pt)
  const qaKeys = cols('qa', SCORE_COLUMNS.qa)

  const wwVals = wwKeys.map(get)
  const ptVals = ptKeys.map(get)
  const qaVals = qaKeys.map(get)

  const g = calcGrades(
    wwVals, ptVals, qaVals,
    wwKeys.map(k => maxes[k] ?? ''),
    ptKeys.map(k => maxes[k] ?? ''),
    qaKeys.map(k => maxes[k] ?? ''),
    subjectKey, weightsMap,
  )

  // HTML: Final + Descriptor stay blank until the row has a name AND at least one score
  const hasName = (student.name || '').trim() !== ''
  const hasAnyScore = [...wwVals, ...ptVals, ...qaVals].some(v => v !== '')
  const showFinal = hasName && hasAnyScore && g.final !== ''
  const desc = showFinal ? getDescriptor(g.final) : { text: '', cls: '' }

  const change = (key, max) => (value) => {
    if (value !== '' && isNaN(Number(value))) return
    // HTML rejects scores above the highest possible score
    if (exceedsMax(value, max)) return
    onScoreChange(id, key, value)
  }

  const renderGroup = (keys, label, total, ps, ws) => (
    <>
      {keys.map(k => (
        <td key={k}>
          <ScoreInput value={get(k)} max={maxes[k]} onChange={change(k, maxes[k])} />
        </td>
      ))}
      <td className="col-total">{displayVal(total)}</td>
      <td>{displayVal(ps)}</td>
      <td>{displayVal(ws)}</td>
    </>
  )

  return (
    <tr data-role="student">
      <td style={{ fontWeight: 600, color: '#64748b' }}>{index + 1}</td>
      <td className="name-cell">{student.name || '—'}</td>
      {renderGroup(wwKeys, 'ww', g.wwTotal, g.wwPS, g.wwWS)}
      {renderGroup(ptKeys, 'pt', g.ptTotal, g.ptPS, g.ptWS)}
      {renderGroup(qaKeys, 'qa', g.qaTotal, g.qaPS, g.qaWS)}
      <td className="grade-initial">{displayVal(g.init)}</td>
      <td className={showFinal ? (g.final >= 75 ? 'grade-final' : 'grade-low') : ''}>
        {showFinal ? g.final : ''}
      </td>
      <td className={desc.cls}>{desc.text}</td>
    </tr>
  )
}

function MaxRow({ maxes, onMaxChange }) {
  const wwKeys = cols('ww', SCORE_COLUMNS.ww)
  const ptKeys = cols('pt', SCORE_COLUMNS.pt)
  const qaKeys = cols('qa', SCORE_COLUMNS.qa)
  const totals = calcMaxTotals(
    wwKeys.map(k => maxes[k] ?? ''),
    ptKeys.map(k => maxes[k] ?? ''),
    qaKeys.map(k => maxes[k] ?? ''),
  )
  const handle = (key) => (value) => {
    if (value !== '' && isNaN(Number(value))) return
    onMaxChange(key, value)
  }
  const group = (keys, total) => (
    <>
      {keys.map(k => (
        <td key={k}>
          <ScoreInput value={maxes[k] ?? ''} onChange={handle(k)} placeholder="—" />
        </td>
      ))}
      <td className="col-total">{total || ''}</td>
      <td></td>
      <td></td>
    </>
  )
  return (
    <tr className="max-row">
      <td></td>
      <td className="name-cell">HIGHEST POSSIBLE SCORE</td>
      {group(wwKeys, totals.ww)}
      {group(ptKeys, totals.pt)}
      {group(qaKeys, totals.qa)}
      <td></td><td></td><td></td>
    </tr>
  )
}

export default function GradeSheet({
  sectionLabel, subjectKey, termLabel, classList, scores, weightsMap,
  onScoreChange, onMaxChange, onOpenRoster,
}) {
  const maxes = scores.__max || {}
  const male = classList.male || []
  const female = classList.female || []
  const hasStudents = male.length + female.length > 0
  const w = getWeightsForSubject(subjectKey, weightsMap)

  const head = (keys, labels) => keys.map((k, i) => <th key={k} className="subhead">{labels ? labels[i] : i + 1}</th>)
  const subHeads = (
    <>
      <th className="subhead">Total</th>
      <th className="subhead">PS</th>
      <th className="subhead">WS</th>
    </>
  )

  const table = (list, label, cls) => list.length > 0 && (
    <>
      <tr><td colSpan={999} className={`gender-header ${cls}`}>{label} ({list.length})</td></tr>
      {list.map((st, i) => (
        <StudentRow
          key={st.id} student={st} index={i} scores={scores} maxes={maxes}
          subjectKey={subjectKey} weightsMap={weightsMap} onScoreChange={onScoreChange}
        />
      ))}
    </>
  )

  return (
    <div className="card">
      <div className="card-title">
        <span>{sectionLabel} · {SUBJECT_OPTIONS[subjectKey] || subjectKey} · {termLabel}</span>
        <button className="btn-ghost no-print" onClick={onOpenRoster}>✎ Edit Roster</button>
      </div>

      {!hasStudents ? (
        <div className="empty-state">
          <p>No students in this section yet.</p>
          <button className="btn-primary" onClick={onOpenRoster}>Add Students to Roster</button>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="grade-table">
            <thead>
              <tr>
                <th rowSpan={2}>No.</th>
                <th rowSpan={2}>Learner&apos;s Name</th>
                <th colSpan={SCORE_COLUMNS.ww + 3} className="group-header">Written Works ({pct(w.ww)}%)</th>
                <th colSpan={SCORE_COLUMNS.pt + 3} className="group-header">Performance Task ({pct(w.pt)}%)</th>
                <th colSpan={SCORE_COLUMNS.qa + 3} className="group-header">Quarterly Assessment ({pct(w.qa)}%)</th>
                <th rowSpan={2}>Initial<br />Grade</th>
                <th rowSpan={2}>Final<br />Grade</th>
                <th rowSpan={2}>Descriptor</th>
              </tr>
              <tr>
                {head(cols('ww', SCORE_COLUMNS.ww))}{subHeads}
                {head(cols('pt', SCORE_COLUMNS.pt))}{subHeads}
                {head(cols('qa', SCORE_COLUMNS.qa), QA_LABELS)}{subHeads}
              </tr>
            </thead>
            <tbody>
              <MaxRow maxes={maxes} onMaxChange={onMaxChange} />
              {table(male, '♂ Male Learners', '')}
              {table(female, '♀ Female Learners', 'female')}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
