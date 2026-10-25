import { useRepoStore } from './store/repoStore'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import DependencyGraph from './components/Graph/DependencyGraph'
import CodePanel from './components/Explorer/CodePanel'
import HealthDashboard from './components/Health/HealthDashboard'
import PathfinderPanel from './components/Onboarding/PathfinderPanel'
import LoadingSpinner from './components/Layout/LoadingSpinner'

const EXAMPLE_REPOS = [
  'facebook/react',
  'vercel/next.js',
  'vitejs/vite',
  'expressjs/express',
]

const FEATURES = [
  { icon: '🔭', label: 'Dependency Atlas' },
  { icon: '🧬', label: 'AST Parsing' },
  { icon: '♻', label: 'Circular Deps' },
  { icon: '🏥', label: 'Health Score' },
  { icon: '🗺', label: 'Onboarding Map' },
  { icon: '🔥', label: 'Complexity Heatmap' },
  { icon: '💥', label: 'Blast Radius' },
  { icon: '⚡', label: 'Live Search' },
]

export default function App() {
  const { isLoading, repoId, viewMode, error, ingestRepo } = useRepoStore()

  const handleExample = (slug) => {
    ingestRepo(`https://github.com/${slug}`)
  }

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {isLoading && <LoadingSpinner />}

          {error && (
            <div className="error-banner">
              <span style={{ fontSize: 15 }}>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {!isLoading && repoId && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', animation: 'fade-in 0.4s ease' }}>
              {viewMode === 'graph' && (
                <div className="graph-layout">
                  <div className="graph-area"><DependencyGraph /></div>
                  <div className="panel-area"><CodePanel /></div>
                </div>
              )}
              {viewMode === 'health' && <HealthDashboard />}
              {viewMode === 'onboarding' && <PathfinderPanel />}
            </div>
          )}

          {!isLoading && !repoId && (
            <div className="welcome-screen">
              <div className="welcome-content">
                {/* Animated orb */}
                <div className="hero-logo">
                  <div className="hero-orb">
                    <div className="hero-orb-inner">
                      <span className="hero-orb-glyph">✦</span>
                    </div>
                  </div>
                </div>

                <h1 className="welcome-title">RepoSketch</h1>
                <p className="welcome-subtitle">The Astral Cartographer</p>

                <p className="welcome-desc">
                  Massive codebases are <strong>sprawling galaxies</strong>.<br />
                  We map every star, every orbit, every black hole.
                </p>

                {/* Feature pills */}
                <div className="welcome-features">
                  {FEATURES.map(f => (
                    <div key={f.label} className="feature-pill">
                      <span className="feature-pill-icon">{f.icon}</span>
                      <span>{f.label}</span>
                    </div>
                  ))}
                </div>

                {/* Example repos */}
                <div className="example-repos">
                  <span className="example-label">Try →</span>
                  {EXAMPLE_REPOS.map(slug => (
                    <button
                      key={slug}
                      className="example-chip"
                      onClick={() => handleExample(slug)}
                    >
                      {slug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
