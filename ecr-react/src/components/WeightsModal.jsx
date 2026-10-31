import { useState } from 'react'

export default function WeightsModal({ weights, onSave, onClose }) {
  const [form, setForm] = useState({ ...weights })

  const update = (field, value) => {
    const n = parseInt(value, 10)
    setForm(prev => ({ ...prev, [field]: isNaN(n) ? 0 : n }))
  }

  const total = (form.ww || 0) + (form.pt || 0) + (form.qa || 0)
  const valid = total === 100

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!valid) return
    onSave(form)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Component Weights</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          These percentages are used to compute the Quarterly Grade.
          Total must equal 100%.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Written Works (WW) %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.ww}
              onChange={e => update('ww', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Performance Tasks (PT) %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.pt}
              onChange={e => update('pt', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Quarterly Assessment (QA) %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.qa}
              onChange={e => update('qa', e.target.value)}
            />
          </div>

          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: valid ? '#f0fdf4' : '#fef2f2',
            color: valid ? '#16a34a' : '#dc2626',
            fontWeight: 600,
            fontSize: 13,
            marginBottom: 8,
          }}>
            Total: {total}% {valid ? '✓' : '— must be 100%'}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!valid}>
              Save Weights
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
