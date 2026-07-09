import { useRef } from 'react'
import { EXAMPLE_CHIPS } from '../utils/typeIcons'

function BrandMark() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2L3 5.5V9.5C3 13.4 6.1 16.8 10 18C13.9 16.8 17 13.4 17 9.5V5.5L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M7.5 10L9.2 11.7L12.8 8.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

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
        <div className="hero-top">
          <BrandMark />
          <div className="hero-title-block">
            <span className="hero-pill">Mobile agreement capture</span>
            <h1 className="app-title">
              Proof<span className="accent">Mode</span>
            </h1>
          </div>
        </div>
        <h2 className="headline">Capture agreements before they become disputes.</h2>
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

      <div className="card glass-card">
        <label className="photo-upload-area" htmlFor="photo-input">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">
              <span className="photo-icon">📷</span>
              <span className="photo-label">Add photo evidence</span>
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
          rows={2}
        />

        <button
          type="button"
          className="btn btn-primary"
          onClick={onCreateProof}
          disabled={isCreating}
        >
          {isCreating ? 'Creating proof card…' : 'Create Proof Card'}
        </button>
      </div>

      <p className="safety-note">AI can misread details. Review before saving or sharing.</p>
      <p className="explanation">
        ProofMode is not a legal contract. It helps you create a clear personal record and confirmation message.
      </p>
    </div>
  )
}
