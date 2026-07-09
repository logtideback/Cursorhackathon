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

  return (
    <div className="screen proofs-screen">
      <header className="proofs-header">
        <h2>My Proofs</h2>
      </header>

      <div className="filter-tabs">
        <button
          type="button"
          className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
          onClick={() => onFilterChange('open')}
        >
          Open
        </button>
        <button
          type="button"
          className={`filter-tab ${filter === 'complete' ? 'active' : ''}`}
          onClick={() => onFilterChange('complete')}
        >
          Complete
        </button>
      </div>

      <div className="proofs-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No {filter} proofs yet</p>
          </div>
        ) : (
          filtered.map((proof) => (
            <div key={proof.id} className="proof-list-item card">
              <button
                type="button"
                className="proof-list-content"
                onClick={() => onSelectProof(proof)}
              >
                <div className="proof-list-top">
                  <h3 className="proof-list-title">{proof.title}</h3>
                  <span className={`status-pill ${proof.status.toLowerCase()}`}>
                    {proof.status}
                  </span>
                </div>
                <p className="proof-list-people">{proof.people}</p>
                <p className="proof-list-due">Due: {proof.due}</p>
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
                  className="btn btn-small btn-danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(proof.id)
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
