import { useRepoStore } from '../../store/repoStore'

const STAGES = [
  { icon: '📡', text: 'Ingesting repository from GitHub…' },
  { icon: '🧬', text: 'Parsing Abstract Syntax Trees…' },
  { icon: '🕸', text: 'Building dependency graph…' },
  { icon: '🏥', text: 'Scoring architectural health…' },
  { icon: '🗺', text: 'Generating onboarding pathways…' },
  { icon: '✦', text: 'Ready to explore!' },
]

export default function LoadingSpinner() {
  const { loadingStage } = useRepoStore()

  const currentStage = STAGES.find((s) => s.text === loadingStage) || STAGES[0]

  return (
    <div className="loading-overlay" role="status" aria-label="Loading">
      <div className="loading-spinner" aria-hidden="true" />
      <div style={{ fontSize: 28, marginBottom: 8 }}>{currentStage.icon}</div>
      <div style={{ color: 'var(--color-purple-light)', fontWeight: 600, fontSize: 14 }}>
        Traversing the cosmos…
      </div>
      <div className="loading-stage">{loadingStage}</div>
      <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
        {STAGES.slice(0, -1).map((stage, i) => {
          const currentIdx = STAGES.findIndex((s) => s.text === loadingStage)
          const done = i < currentIdx
          const active = i === currentIdx
          return (
            <div
              key={i}
              style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: done
                  ? 'var(--color-green)'
                  : active
                  ? 'var(--color-purple)'
                  : 'var(--bg-elevated)',
                border: '1px solid var(--border-bright)',
                transition: 'background 0.3s',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
