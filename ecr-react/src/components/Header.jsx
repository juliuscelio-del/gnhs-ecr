export default function Header({ profile, onOpenProfile, onOpenRoster, onOpenWeights, onClearAll }) {
  return (
    <header className="header">
      <div>
        <h1>Electronic Class Record</h1>
        <div className="subtitle">
          Grades 7–10 · SY {profile.schoolYear || '2026–2027'}
          {profile.name ? ` · ${profile.name}` : ''}
          {profile.subject ? ` · ${profile.subject}` : ''}
        </div>
      </div>

      <div className="header-actions">
        <button className="btn-navy" onClick={onOpenProfile} title="Teacher profile">
          👤 Profile
        </button>
        <button className="btn-navy" onClick={onOpenRoster} title="Edit class lists">
          👥 Roster
        </button>
        <button className="btn-navy" onClick={onOpenWeights} title="Component weights">
          ⚖ Weights
        </button>
        <button className="btn-navy" onClick={onClearAll} title="Clear all data">
          🗑 Clear
        </button>
      </div>
    </header>
  )
}
