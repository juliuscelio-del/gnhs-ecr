const LABELS = {
  q1: '1st Quarter',
  q2: '2nd Quarter',
  q3: '3rd Quarter',
  q4: '4th Quarter',
}

export default function QuarterTabs({ quarters, active, onChange }) {
  return (
    <div className="quarter-tabs">
      {quarters.map(q => (
        <button
          key={q}
          className={`quarter-tab ${active === q ? 'active' : ''}`}
          onClick={() => onChange(q)}
        >
          {LABELS[q] || q}
        </button>
      ))}
    </div>
  )
}
