import { useRef } from 'react'

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
      <header className="app-header">
        <h1 className="app-title">
          Proof<span className="accent">Mode</span>
        </h1>
        <p className="headline">Capture the agreement before it becomes a disagreement.</p>
      </header>

      <div className="card">
        <label className="photo-upload-area" htmlFor="photo-input">
          {photoPreview ? (
            <img src={photoPreview} alt="Preview" className="photo-preview" />
          ) : (
            <div className="photo-placeholder">
              <span className="photo-icon">📷</span>
              <span>Add photo (optional)</span>
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

        <textarea
          className="note-input"
          placeholder="Example: I lent Alex my USB-C charger. He'll return it after demos."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={4}
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
