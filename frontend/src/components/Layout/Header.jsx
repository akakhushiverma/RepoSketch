import { useState } from 'react'
import { useRepoStore } from '../../store/repoStore'

const NAV_ITEMS = [
  { mode: 'graph',      icon: '✦', label: 'Atlas' },
  { mode: 'health',     icon: '◈', label: 'Health' },
  { mode: 'onboarding', icon: '◎', label: 'Explore' },
]

export default function Header() {
  const {
    repoUrl, setRepoUrl, ingestRepo,
    isLoading, repoId, repoMeta,
    viewMode, setViewMode, error,
  } = useRepoStore()
  const [localUrl, setLocalUrl] = useState('')

  const status  = isLoading ? 'loading' : error ? 'error' : repoId ? 'ready' : 'idle'
  const statusLabels = { idle: 'idle', loading: 'mapping…', ready: 'ready', error: 'error' }

  const handleSubmit = (e) => {
    e.preventDefault()
    const url = (localUrl || repoUrl).trim()
    if (!url) return
    setRepoUrl(url)
    ingestRepo(url)
  }

  return (
    <header className="app-header">
      {/* Logo */}
      <div className="header-logo">
        <div className="logo-icon-wrap">✦</div>
        <div>
          <div className="header-logo-text">RepoSketch</div>
          <div className="header-logo-sub">Astral Cartographer</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* URL form */}
      <form className="header-url-form" onSubmit={handleSubmit}>
        <div className="url-input-wrap">
          <span className="url-input-icon">⌥</span>
          <input
            className="header-url-input"
            type="text"
            placeholder="github.com/owner/repository"
            value={localUrl}
            onChange={e => setLocalUrl(e.target.value)}
            spellCheck={false}
            aria-label="GitHub repository URL"
          />
        </div>
        <button className="btn-explore" type="submit" disabled={isLoading}>
          {isLoading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />
              Mapping
            </span>
          ) : 'Explore ✦'}
        </button>
      </form>

      {/* Nav — only after repo loaded */}
      {repoId && (
        <>
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
          <nav className="header-nav" aria-label="View">
            {NAV_ITEMS.map(item => (
              <button
                key={item.mode}
                className={`nav-tab ${viewMode === item.mode ? 'active' : ''}`}
                onClick={() => setViewMode(item.mode)}
              >
                <span style={{ fontSize: 11 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Repo breadcrumb */}
      {repoMeta && (
        <div style={{
          fontSize: 11, color: 'var(--t3)',
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 999, padding: '4px 12px',
          flexShrink: 0, maxWidth: 200, overflow: 'hidden',
        }}>
          <span style={{ color: 'var(--violet-ll)', fontWeight: 600 }}>
            {repoMeta.fullName?.split('/')[0]}
          </span>
          <span style={{ color: 'var(--t4)' }}>/</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {repoMeta.fullName?.split('/')[1]}
          </span>
        </div>
      )}

      {/* Status */}
      <div className="status-pill">
        <div className={`status-dot ${status}`} />
        <span>{statusLabels[status]}</span>
      </div>
    </header>
  )
}
