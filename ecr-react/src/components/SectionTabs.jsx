import { getSectionsByGrade } from '../data/sections'

export default function SectionTabs({ sections, active, onChange }) {
  const byGrade = getSectionsByGrade(sections)

  return (
    <div className="section-tabs">
      {[7, 8, 9, 10].map(grade => {
        const list = byGrade[grade] || []
        if (list.length === 0) return null
        return (
          <div key={grade} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginRight: 4 }}>
              G{grade}
            </span>
            {list.map(s => (
              <button
                key={s.key}
                className={`section-tab ${active === s.key ? 'active' : ''}`}
                onClick={() => onChange(s.key)}
              >
                {s.name}
              </button>
            ))}
          </div>
        )
      })}
    </div>
  )
}
