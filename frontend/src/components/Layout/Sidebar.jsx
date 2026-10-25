import { useState } from 'react'
import { useRepoStore } from '../../store/repoStore'
import FileTree from '../Explorer/FileTree'
import SearchBar from '../Search/SearchBar'
import SearchResults from '../Search/SearchResults'

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('explorer')
  const { repoId, repoMeta } = useRepoStore()

  return (
    <aside className="sidebar">
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
        >
          📁 Files
        </button>
        <button
          className={`sidebar-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔍 Search
        </button>
      </div>

      <div className="sidebar-content">
        {repoMeta && (
          <div style={{ marginBottom: 12, padding: '8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius)', fontSize: 12 }}>
            <div style={{ color: 'var(--color-purple-light)', fontWeight: 700, marginBottom: 4 }}>
              {repoMeta.fullName || `${repoMeta.owner}/${repoMeta.repo}`}
            </div>
            {repoMeta.description && (
              <div style={{ color: 'var(--text-secondary)', fontSize: 11, lineHeight: 1.4 }}>
                {repoMeta.description.slice(0, 100)}{repoMeta.description.length > 100 ? '…' : ''}
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 6, color: 'var(--text-dim)', fontSize: 11 }}>
              <span>⭐ {(repoMeta.stars || 0).toLocaleString()}</span>
              <span>🔀 {(repoMeta.forks || 0).toLocaleString()}</span>
              <span>📄 {repoMeta.totalFiles || 0} files</span>
            </div>
          </div>
        )}

        {activeTab === 'explorer' && <FileTree />}
        {activeTab === 'search' && (
          <>
            <SearchBar />
            <SearchResults />
          </>
        )}

        {!repoId && (
          <div className="no-data">
            <div style={{ fontSize: 28, marginBottom: 8 }}>🌌</div>
            <div>Enter a GitHub URL to begin exploring</div>
          </div>
        )}
      </div>
    </aside>
  )
}
