import { useState } from 'react'
import { useRepoStore } from '../../store/repoStore'

export default function Header() {
  const { repoUrl, setRepoUrl, ingestRepo, isLoading, repoId, viewMode, setViewMode, error } = useRepoStore()
  const [localUrl, setLocalUrl] = useState('')

  const statusClass = isLoading ? 'loading' : error ? 'error' : repoId ? 'ready' : 'idle'

  const handleSubmit = (e) => {
    e.preventDefault()
    const url = localUrl.trim() || repoUrl.trim()
    if (!url) return
    setRepoUrl(url)
    ingestRepo(url)
  }

  return (
    <header className="app-header">
      <div className="header-logo">
        <span className="header-logo-icon">✦</span>
        <span className="header-logo-text">RepoSketch</span>
      </div>

      <form className="header-url-form" onSubmit={handleSubmit}>
        <input
          className="header-url-input"
          type="text"
          placeholder="https://github.com/owner/repository"
          value={localUrl}
          onChange={(e) => setLocalUrl(e.target.value)}
          spellCheck={false}
          aria-label="GitHub repository URL"
        />
        <button className="btn-analyze" type="submit" disabled={isLoading}>
          {isLoading ? 'Mapping…' : 'Explore ✦'}
        </button>
      </form>

      {repoId && (
        <nav className="header-nav" aria-label="View mode">
          <button
            className={`nav-tab ${viewMode === 'graph' ? 'active' : ''}`}
            onClick={() => setViewMode('graph')}
          >
            🔭 Atlas
          </button>
          <button
            className={`nav-tab ${viewMode === 'health' ? 'active' : ''}`}
            onClick={() => setViewMode('health')}
          >
            🏥 Health
          </button>
          <button
            className={`nav-tab ${viewMode === 'onboarding' ? 'active' : ''}`}
            onClick={() => setViewMode('onboarding')}
          >
            🗺 Onboard
          </button>
        </nav>
      )}

      <div className={`status-dot ${statusClass}`} title={statusClass} aria-label={`Status: ${statusClass}`} />
    </header>
  )
}
