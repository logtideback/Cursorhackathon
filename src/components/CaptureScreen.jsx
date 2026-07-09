import { useRef } from 'react'
import { EXAMPLE_CHIPS } from '../utils/typeIcons'

export default function CaptureScreen({
  note,
  onNoteChange,
  photoPreview,
  onPhotoChange,
  onCreateProof,
  isCreating,
}) {
  const fileInputRef = useRef(null)

  function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => onPhotoChange(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="screen capture-screen">
      <header className="hero-header">
        <div className="hero-sparkles" aria-hidden="true">✦ ✧ ✦</div>
        <div className="hero-top">
          <div className="hero-mascot" aria-hidden="true">
            <span className="hero-mascot-shield">🛡️</span>
            <span className="hero-mascot-spark">✨</span>
          </div>
          <div className="hero-title-block">
            <span className="hero-pill">Agreement captured in 10 seconds</span>
            <h1 className="app-title">
              Proof<span className="accent">Mode</span>
            </h1>
          </div>
        </div>
        <h2 className="headline-punch">Lock in the agreement before anyone forgets.</h2>
        <p className="headline-sub">Capture the agreement before it becomes a disagreement.</p>
        <p className="hero-subtext">
          Turn quick promises, payments, meetups, and returns into reviewed proof cards.
        </p>

        <div className="example-chips">
          {EXAMPLE_CHIPS.map(({ label, note: chipNote }) => (
            <button
              key={label}
              type="button"
              className="example-chip"
              onClick={() => onNoteChange(chipNote)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="card glass-card game-card">
        <label className="photo-upload-area" htmlFor="photo-input">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">
              <span className="photo-icon">📷</span>
              <span className="photo-label">Add photo evidence</span>
              <span className="photo-hint">Optional — tap to capture</span>
            </div>
          )}
        </label>
        <input
          ref={fileInputRef}
          id="photo-input"
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden-input"
          onChange={handlePhotoSelect}
        />

        <label className="input-label" htmlFor="note-input">What was agreed?</label>
        <textarea
          id="note-input"
          className="note-input"
          placeholder="Example: I lent Alex my USB-C charger. He'll return it after demos."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
        />

        <button
          type="button"
          className="btn btn-primary btn-glow"
          onClick={onCreateProof}
          disabled={isCreating}
        >
          {isCreating ? 'Creating proof card…' : 'Create Proof Card ✨'}
        </button>
      </div>

      <p className="safety-note">AI can misread details. Review before saving or sharing.</p>
      <p className="explanation">
        ProofMode is not a legal contract. It helps you create a clear personal record and confirmation message.
      </p>
    </div>
  )
}
