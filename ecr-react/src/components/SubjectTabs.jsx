import { SUBJECT_OPTIONS } from '../data/sections'

export default function SubjectTabs({ subjects, active, onChange }) {
  return (
    <div className="quarter-tabs subject-tabs">
      {subjects.map(k => (
        <button
          key={k}
          className={`quarter-tab ${active === k ? 'active' : ''}`}
          onClick={() => onChange(k)}
        >
          {SUBJECT_OPTIONS[k] || k}
        </button>
      ))}
    </div>
  )
}
