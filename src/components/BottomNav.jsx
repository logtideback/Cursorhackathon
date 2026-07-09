export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className="bottom-nav">
      <button
        type="button"
        className={`nav-item ${activeTab === 'capture' ? 'active' : ''}`}
        onClick={() => onTabChange('capture')}
      >
        <span className="nav-label">Capture</span>
      </button>
      <button
        type="button"
        className={`nav-item ${activeTab === 'proofs' ? 'active' : ''}`}
        onClick={() => onTabChange('proofs')}
      >
        <span className="nav-label">My Proofs</span>
      </button>
    </nav>
  )
}
