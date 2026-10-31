import { useState } from 'react'
import { SUBJECT_OPTIONS, getWeightsForSubject } from '../data/sections'

// Edits per-subject weights. Shown as whole percents, stored as fractions (like the HTML).
export default function WeightsModal({ weightsMap, subjects, onSave, onClose }) {
  const keys = subjects && subjects.length ? subjects : Object.keys(SUBJECT_OPTIONS)
  const [form, setForm] = useState(() => {
    const f = {}
    keys.forEach(k => {
      const w = getWeightsForSubject(k, weightsMap)
      f[k] = { ww: Math.round(w.ww * 100), pt: Math.round(w.pt * 100), qa: Math.round(w.qa * 100) }
    })
    return f
  })

  const update = (k, field, value) => {
    const n = parseInt(value, 10)
    setForm(prev => ({ ...prev, [k]: { ...prev[k], [field]: isNaN(n) ? 0 : n } }))
  }
  const total = (k) => form[k].ww + form[k].pt + form[k].qa
  const allValid = keys.every(k => total(k) === 100)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!allValid) return
    const out = { ...(weightsMap || {}) }
    keys.forEach(k => {
      out[k] = { ww: form[k].ww / 100, pt: form[k].pt / 100, qa: form[k].qa / 100 }
    })
    onSave(out)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>Subject Weights</h2>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b' }}>
          Written Works / Performance Task / Quarterly Assessment weight per subject. Each row must total 100%.
        </p>
        <form onSubmit={handleSubmit}>
          <table className="weights-table">
            <thead>
              <tr><th>Subject</th><th>WW %</th><th>PT %</th><th>QA %</th><th>Total</th></tr>
            </thead>
            <tbody>
              {keys.map(k => (
                <tr key={k}>
                  <td style={{ textAlign: 'left' }}>{SUBJECT_OPTIONS[k] || k}</td>
                  {['ww', 'pt', 'qa'].map(f => (
                    <td key={f}>
                      <input type="number" min="0" max="100" value={form[k][f]}
                        onChange={e => update(k, f, e.target.value)} style={{ width: 60 }} />
                    </td>
                  ))}
                  <td style={{ fontWeight: 700, color: total(k) === 100 ? '#16a34a' : '#dc2626' }}>
                    {total(k)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={!allValid}>Save Weights</button>
          </div>
        </form>
      </div>
    </div>
  )
}
