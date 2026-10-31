import { TERM_LABELS } from '../data/sections'

export default function QuarterTabs({ quarters, active, onChange }) {
  return (
    <div className="quarter-tabs">
      {quarters.map(q => (
        <button
          key={q}
          className={`quarter-tab ${active === q ? 'active' : ''}`}
          onClick={() => onChange(q)}
        >
          {TERM_LABELS[q] || q}
        </button>
      ))}
    </div>
  )
}
