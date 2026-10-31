import { useState, useEffect } from 'react'

function makeId() {
  return 's_' + Math.random().toString(36).slice(2, 10)
}

function RosterColumn({ title, list, onChange, gender }) {
  const updateName = (idx, name) => {
    const next = list.map((s, i) => (i === idx ? { ...s, name } : s))
    onChange(next)
  }

  const remove = (idx) => {
    onChange(list.filter((_, i) => i !== idx))
  }

  const add = () => {
    onChange([...list, { id: makeId(), name: '' }])
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <strong style={{ fontSize: 13 }}>{title} ({list.length})</strong>
        <button type="button" className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={add}>
          + Add
        </button>
      </div>
      <div className="roster-list">
        {list.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            No students yet
          </div>
        )}
        {list.map((s, idx) => (
          <div className="roster-item" key={s.id}>
            <span style={{ fontSize: 12, color: '#94a3b8', width: 20 }}>{idx + 1}.</span>
            <input
              value={s.name}
              placeholder="Student name"
              onChange={e => updateName(idx, e.target.value)}
              autoFocus={s.name === '' && idx === list.length - 1}
            />
            <button type="button" className="remove-btn" onClick={() => remove(idx)} title="Remove">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RosterModal({
  sectionKey,
  sectionLabel,
  classList,
  onSave,
  onClose,
}) {
  const [male, setMale] = useState([])
  const [female, setFemale] = useState([])
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setMale([...(classList.male || [])])
    setFemale([...(classList.female || [])])
    setDirty(false)
  }, [classList, sectionKey])

  const markDirty = (setter) => (next) => {
    setter(next)
    setDirty(true)
  }

  const handleSave = () => {
    // filter out empty names
    const cleanMale = male.filter(s => s.name.trim()).map(s => ({ ...s, name: s.name.trim() }))
    const cleanFemale = female.filter(s => s.name.trim()).map(s => ({ ...s, name: s.name.trim() }))
    onSave({ male: cleanMale, female: cleanFemale })
    setDirty(false)
    onClose()
  }

  const handleClose = () => {
    if (dirty && !window.confirm('You have unsaved changes. Discard them?')) return
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal wide">
        <h2>Class Roster — {sectionLabel}</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Add or edit student names. Boys and girls are listed separately (DepEd format).
        </p>

        <div className="roster-cols">
          <RosterColumn
            title="♂ Boys"
            list={male}
            onChange={markDirty(setMale)}
            gender="male"
          />
          <RosterColumn
            title="♀ Girls"
            list={female}
            onChange={markDirty(setFemale)}
            gender="female"
          />
        </div>

        <div className="modal-actions">
          <button className="btn-ghost" onClick={handleClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!dirty}>
            Save Roster
          </button>
        </div>
      </div>
    </div>
  )
}
