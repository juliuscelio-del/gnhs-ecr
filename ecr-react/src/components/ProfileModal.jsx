import { useState } from 'react'

export default function ProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ ...profile })

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Teacher Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Teacher Name</label>
            <input
              value={form.name || ''}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>
          <div className="form-group">
            <label>School</label>
            <input
              value={form.school || ''}
              onChange={e => update('school', e.target.value)}
              placeholder="School name"
            />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input
              value={form.subject || ''}
              onChange={e => update('subject', e.target.value)}
              placeholder="e.g. Mathematics"
            />
          </div>
          <div className="form-group">
            <label>School Year</label>
            <input
              value={form.schoolYear || ''}
              onChange={e => update('schoolYear', e.target.value)}
              placeholder="2026–2027"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Profile</button>
          </div>
        </form>
      </div>
    </div>
  )
}
