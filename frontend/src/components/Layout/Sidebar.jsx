import { useState } from 'react'
import { useRepoStore } from '../../store/repoStore'
import FileTree from '../Explorer/FileTree'
import SearchBar from '../Search/SearchBar'
import SearchResults from '../Search/SearchResults'

const TABS = [
  { id: 'explorer', icon: '◈', label: 'Files' },
  { id: 'search',   icon: '⌕', label: 'Search' },
]

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('explorer')
  const { repoId, repoMeta } = useRepoStore()

  return (
    <aside className="sidebar">
      {/* Tabs */}
      <div className="sidebar-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={{ fontSize: 12 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sidebar-content">
        {/* Repo card */}
        {repoMeta && (
          <div className="repo-card">
            <div className="repo-card-name">
              <span style={{
                width: 16, height: 16, borderRadius: 4,
                background: 'linear-gradient(135deg, var(--violet), var(--cyan-l))',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, flexShrink: 0,
              }}>✦</span>
              {repoMeta.fullName || 'Unknown Repo'}
            </div>
            {repoMeta.description && (
              <div className="repo-card-desc">
                {repoMeta.description.length > 80
                  ? repoMeta.description.slice(0, 78) + '…'
                  : repoMeta.description}
              </div>
            )}
            <div className="repo-card-stats">
              <div className="repo-stat">
                <span>⭐</span>
                <span style={{ fontWeight: 600, color: 'var(--gold-l)' }}>
                  {(repoMeta.stars || 0).toLocaleString()}
                </span>
              </div>
              <div className="repo-stat">
                <span>⑂</span>
                <span>{(repoMeta.forks || 0).toLocaleString()}</span>
              </div>
              <div className="repo-stat" style={{ marginLeft: 'auto' }}>
                <span style={{ color: 'var(--violet-ll)', fontWeight: 600 }}>
                  {repoMeta.totalFiles || 0}
                </span>
                <span> files</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'explorer' && (repoId ? <FileTree /> : <EmptyState />)}
        {activeTab === 'search' && (
          <>
            <SearchBar />
            {repoId ? <SearchResults /> : <EmptyState />}
          </>
        )}
      </div>
    </aside>
  )
}

function EmptyState() {
  return (
    <div className="no-data" style={{ paddingTop: 40 }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: 'rgba(124,58,237,0.08)',
        border: '1px solid rgba(124,58,237,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
        fontSize: 20,
      }}>
        🌌
      </div>
      <div style={{ color: 'var(--t3)', lineHeight: 1.7 }}>
        Enter a GitHub URL<br />above to start exploring
      </div>
    </div>
  )
}
