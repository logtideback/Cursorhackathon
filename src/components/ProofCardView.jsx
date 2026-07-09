import { useState } from 'react'

const FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'people', label: 'People' },
  { key: 'agreement', label: 'Agreement' },
  { key: 'due', label: 'Due' },
  { key: 'status', label: 'Status' },
  { key: 'confidence', label: 'Confidence' },
]

export default function ProofCardView({
  card,
  onSave,
  onCopy,
  onMarkComplete,
  onEdit,
  onBack,
  copyFeedback,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ ...card })

  function handleEditField(key, value) {
    setEditData((prev) => ({ ...prev, [key]: value }))
  }

  function handleSaveEdit() {
    onEdit(editData)
    setIsEditing(false)
  }

  function handleCancelEdit() {
    setEditData({ ...card })
    setIsEditing(false)
  }

  const display = isEditing ? editData : card

  return (
    <div className="screen proof-card-screen">
      <button type="button" className="back-btn" onClick={onBack}>
        ← Back
      </button>

      <div className="card proof-card">
        <div className="proof-card-header">
          <div>
            <p className="extracted-label">AI extracted these details</p>
            <span className="review-badge">Review required</span>
          </div>
        </div>

        {display.photo && (
          <img src={display.photo} alt="Proof" className="proof-photo" />
        )}

        <div className="proof-fields">
          {FIELDS.map(({ key, label }) => (
            <div key={key} className="proof-field">
              <span className="field-label">{label}</span>
              {isEditing ? (
                key === 'status' ? (
                  <select
                    className="field-input"
                    value={editData.status}
                    onChange={(e) => handleEditField('status', e.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="Complete">Complete</option>
                  </select>
                ) : key === 'confidence' ? (
                  <select
                    className="field-input"
                    value={editData.confidence}
                    onChange={(e) => handleEditField('confidence', e.target.value)}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                ) : (
                  <input
                    className="field-input"
                    value={editData[key]}
                    onChange={(e) => handleEditField(key, e.target.value)}
                  />
                )
              ) : (
                <span className={`field-value ${key === 'status' ? `status-${display.status.toLowerCase()}` : ''} ${key === 'confidence' ? `confidence-${display.confidence.toLowerCase()}` : ''}`}>
                  {key === 'status' && (
                    <span className={`status-pill ${display.status.toLowerCase()}`}>
                      {display.status}
                    </span>
                  )}
                  {key === 'confidence' && (
                    <span className={`confidence-pill ${display.confidence.toLowerCase()}`}>
                      {display.confidence}
                    </span>
                  )}
                  {key !== 'status' && key !== 'confidence' && display[key]}
                </span>
              )}
            </div>
          ))}

          <div className="proof-field">
            <span className="field-label">Source note</span>
            <span className="field-value source-note">{display.sourceNote}</span>
          </div>

          <div className="proof-field">
            <span className="field-label">Suggested confirmation message</span>
            {isEditing ? (
              <textarea
                className="field-input message-input"
                value={editData.suggestedMessage}
                onChange={(e) => handleEditField('suggestedMessage', e.target.value)}
                rows={3}
              />
            ) : (
              <span className="field-value message-text">{display.suggestedMessage}</span>
            )}
          </div>
        </div>

        <p className="disclaimer">The app never sends or saves automatically.</p>

        <div className="proof-actions">
          {isEditing ? (
            <>
              <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>
                Save changes
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-primary btn-compact" onClick={() => onSave(card)}>
                Save
              </button>
              <button type="button" className="btn btn-secondary btn-compact" onClick={() => onCopy(card.suggestedMessage)}>
                {copyFeedback || 'Copy message'}
              </button>
              {card.status === 'Open' && (
                <button type="button" className="btn btn-success btn-compact" onClick={() => onMarkComplete(card)}>
                  Mark complete
                </button>
              )}
              <button type="button" className="btn btn-outline btn-compact" onClick={() => setIsEditing(true)}>
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
