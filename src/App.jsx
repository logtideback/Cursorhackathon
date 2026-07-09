import { useState, useEffect, useCallback } from 'react'
import CaptureScreen from './components/CaptureScreen'
import ProofCardView from './components/ProofCardView'
import MyProofsScreen from './components/MyProofsScreen'
import BottomNav from './components/BottomNav'
import { parseProofNote } from './utils/parser'
import { loadProofs, saveProofs, generateId } from './utils/storage'

export default function App() {
  const [activeTab, setActiveTab] = useState('capture')
  const [proofs, setProofs] = useState([])
  const [note, setNote] = useState('')
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [currentCard, setCurrentCard] = useState(null)
  const [viewingCard, setViewingCard] = useState(false)
  const [proofsFilter, setProofsFilter] = useState('open')
  const [copyFeedback, setCopyFeedback] = useState('')
  const [toast, setToast] = useState('')

  useEffect(() => {
    setProofs(loadProofs())
  }, [])

  const persistProofs = useCallback((updated) => {
    setProofs(updated)
    saveProofs(updated)
  }, [])

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 2500)
  }

  function handleCreateProof() {
    if (!note.trim()) {
      showToast('Please enter an agreement note')
      return
    }

    setIsCreating(true)
    setTimeout(() => {
      const parsed = parseProofNote(note)
      const card = {
        id: generateId(),
        ...parsed,
        photo: photoPreview,
        createdAt: new Date().toISOString(),
      }
      setCurrentCard(card)
      setViewingCard(true)
      setIsCreating(false)
    }, 1000)
  }

  function handleSaveCard(card) {
    const exists = proofs.find((p) => p.id === card.id)
    let updated
    if (exists) {
      updated = proofs.map((p) => (p.id === card.id ? card : p))
    } else {
      updated = [card, ...proofs]
    }
    persistProofs(updated)
    showToast('Proof saved!')
    setViewingCard(false)
    setCurrentCard(null)
    setNote('')
    setPhotoPreview(null)
    setActiveTab('proofs')
  }

  function handleEditCard(edited) {
    setCurrentCard(edited)
    showToast('Changes applied')
  }

  async function handleCopyMessage(message) {
    try {
      await navigator.clipboard.writeText(message)
      setCopyFeedback('Copied!')
      setTimeout(() => setCopyFeedback(''), 2000)
    } catch {
      setCopyFeedback('Select & copy manually')
      const textarea = document.createElement('textarea')
      textarea.value = message
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      try {
        document.execCommand('copy')
        setCopyFeedback('Copied!')
      } catch {
        setCopyFeedback('Copy failed — tap to select')
      }
      document.body.removeChild(textarea)
      setTimeout(() => setCopyFeedback(''), 3000)
    }
  }

  function handleMarkComplete(card) {
    const updated = proofs.map((p) =>
      p.id === card.id ? { ...p, status: 'Complete' } : p
    )
    persistProofs(updated)
    if (currentCard?.id === card.id) {
      setCurrentCard({ ...card, status: 'Complete' })
    }
    showToast('Marked complete')
  }

  function handleDelete(id) {
    const updated = proofs.filter((p) => p.id !== id)
    persistProofs(updated)
    showToast('Proof deleted')
  }

  function handleSelectProof(proof) {
    setCurrentCard(proof)
    setViewingCard(true)
  }

  function handleBackFromCard() {
    setViewingCard(false)
    setCurrentCard(null)
    setCopyFeedback('')
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    if (tab !== 'capture') {
      setViewingCard(false)
    }
  }

  return (
    <div className="app-shell">
      <main className="app-main">
        {viewingCard && currentCard ? (
          <ProofCardView
            card={currentCard}
            onSave={handleSaveCard}
            onCopy={handleCopyMessage}
            onMarkComplete={handleMarkComplete}
            onEdit={handleEditCard}
            onBack={handleBackFromCard}
            copyFeedback={copyFeedback}
          />
        ) : activeTab === 'capture' ? (
          <CaptureScreen
            note={note}
            onNoteChange={setNote}
            photoPreview={photoPreview}
            onPhotoChange={setPhotoPreview}
            onCreateProof={handleCreateProof}
            isCreating={isCreating}
          />
        ) : (
          <MyProofsScreen
            proofs={proofs}
            filter={proofsFilter}
            onFilterChange={setProofsFilter}
            onSelectProof={handleSelectProof}
            onMarkComplete={handleMarkComplete}
            onDelete={handleDelete}
          />
        )}
      </main>

      {!viewingCard && (
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
