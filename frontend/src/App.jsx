import { useState } from 'react'
import { useRepoStore } from './store/repoStore'
import Header from './components/Layout/Header'
import Sidebar from './components/Layout/Sidebar'
import DependencyGraph from './components/Graph/DependencyGraph'
import CodePanel from './components/Explorer/CodePanel'
import HealthDashboard from './components/Health/HealthDashboard'
import PathfinderPanel from './components/Onboarding/PathfinderPanel'
import LoadingSpinner from './components/Layout/LoadingSpinner'

export default function App() {
  const { isLoading, repoId, viewMode, error } = useRepoStore()

  return (
    <div className="app-shell">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          {isLoading && <LoadingSpinner />}
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠</span>
              <span>{error}</span>
            </div>
          )}
          {!isLoading && repoId && (
            <>
              {viewMode === 'graph' && (
                <div className="graph-layout">
                  <div className="graph-area">
                    <DependencyGraph />
                  </div>
                  <div className="panel-area">
                    <CodePanel />
                  </div>
                </div>
              )}
              {viewMode === 'health' && <HealthDashboard />}
              {viewMode === 'onboarding' && <PathfinderPanel />}
            </>
          )}
          {!isLoading && !repoId && (
            <div className="welcome-screen">
              <div className="welcome-content">
                <div className="astral-logo">
                  <div className="star-ring">
                    <div className="star-core">✦</div>
                    <div className="orbit orbit-1" />
                    <div className="orbit orbit-2" />
                  </div>
                </div>
                <h1 className="welcome-title">RepoSketch</h1>
                <p className="welcome-subtitle">The Astral Cartographer</p>
                <p className="welcome-desc">
                  Navigate massive codebases like ancient star maps.<br />
                  Paste a GitHub URL above to begin your journey.
                </p>
                <div className="welcome-features">
                  <div className="feature-card">
                    <span className="feature-icon">🔭</span>
                    <span>Dependency Atlas</span>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🧬</span>
                    <span>AST Deep Parsing</span>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">♻</span>
                    <span>Circular Detection</span>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🏥</span>
                    <span>Health Scoring</span>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🗺</span>
                    <span>Onboarding Paths</span>
                  </div>
                  <div className="feature-card">
                    <span className="feature-icon">🔥</span>
                    <span>Complexity Heatmap</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
