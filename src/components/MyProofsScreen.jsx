import { getTypeIcon, getTypeAccent } from '../utils/typeIcons'

export default function MyProofsScreen({
  proofs,
  filter,
  onFilterChange,
  onSelectProof,
  onMarkComplete,
  onDelete,
}) {
  const filtered = proofs.filter((p) =>
    filter === 'open' ? p.status === 'Open' : p.status === 'Complete'
  )

  const openCount = proofs.filter((p) => p.status === 'Open').length
  const completeCount = proofs.filter((p) => p.status === 'Complete').length
  const totalCount = proofs.length

  return (
    <div className="screen proofs-screen">
      <header className="proofs-header">
        <div className="vault-header">
          <span className="vault-icon" aria-hidden="true">🧾</span>
          <div>
            <h2>Your Proof Vault</h2>
            <p className="proofs-subtitle">Your agreement collection</p>
          </div>
        </div>
      </header>

      <div className="stats-row">
        <div className="stat-card stat-open">
          <span className="stat-value">{openCount}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-card stat-complete">
          <span className="stat-value">{completeCount}</span>
          <span className="stat-label">Complete</span>
        </div>
        <div className="stat-card stat-total">
          <span className="stat-value">{totalCount}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      <div className="filter-tabs game-tabs">
        <button
          type="button"
          className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
          onClick={() => onFilterChange('open')}
        >
          ⚡ Open
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'complete' ? 'active' : ''}`}
          onClick={() => onFilterChange('complete')}
        >
          ✓ Complete
        </button>
      </div>

      <div className="proofs-list">
        {filtered.length === 0 ? (
          <div className="empty-state card glass-card">
            <span className="empty-icon">🎒</span>
            <p className="empty-title">No proofs here yet</p>
            <p className="empty-text">Capture your next agreement</p>
          </div>
        ) : (
          filtered.map((proof) => {
            const accent = getTypeAccent(proof.type)
            const icon = getTypeIcon(proof.type)
            return (
              <div key={proof.id} className={`proof-list-item card glass-card type-card-${accent}`}>
                <div className="proof-list-accent" aria-hidden="true" />
                <button
                  type="button"
                  className="proof-list-content"
                  onClick={() => onSelectProof(proof)}
                >
                  <div className="proof-list-main">
                    <span className="proof-list-type-icon" aria-hidden="true">{icon}</span>
                    <div className="proof-list-body">
                      <div className="proof-list-top">
                        <h3 className="proof-list-title">{proof.title}</h3>
                        <span className={`status-pill ${proof.status.toLowerCase()}`}>
                          {proof.status}
                        </span>
                      </div>
                      <p className="proof-list-type">{proof.type}</p>
                      <p className="proof-list-people">{proof.people}</p>
                      <p className="proof-list-due">Due: {proof.due}</p>
                    </div>
                  </div>
                </button>
                <div className="proof-list-actions">
                  {proof.status === 'Open' && (
                    <button
                      type="button"
                      className="btn btn-small btn-success"
                      onClick={(e) => {
                        e.stopPropagation()
                        onMarkComplete(proof)
                      }}
                    >
                      ✓ Complete
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-small btn-danger-soft"
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(proof.id)
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
