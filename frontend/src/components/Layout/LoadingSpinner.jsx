import { useRepoStore } from '../../store/repoStore'

const STAGES = [
  { icon: '📡', label: 'Ingesting repository from GitHub…',     key: 0 },
  { icon: '🧬', label: 'Parsing Abstract Syntax Trees…',        key: 1 },
  { icon: '🕸', label: 'Building dependency graph…',            key: 2 },
  { icon: '🏥', label: 'Scoring architectural health…',         key: 3 },
  { icon: '🗺', label: 'Generating onboarding pathways…',       key: 4 },
  { icon: '✦',  label: 'Ready to explore!',                     key: 5 },
]

export default function LoadingSpinner() {
  const { loadingStage } = useRepoStore()
  const idx = STAGES.findIndex(s => s.label === loadingStage)
  const current = STAGES[Math.max(idx, 0)]

  return (
    <div className="loading-overlay" role="status">
      {/* Conic spinner */}
      <div className="loading-orb" aria-hidden="true" />

      <div style={{ marginTop: 4, textAlign: 'center' }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'var(--violet-ll)',
          marginBottom: 6, letterSpacing: '-0.01em',
        }}>
          Traversing the cosmos…
        </div>
        <div className="loading-stage">{loadingStage}</div>
      </div>

      {/* Stage dots */}
      <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
        {STAGES.slice(0, -1).map((s, i) => (
          <div key={i} style={{
            width: i < idx ? 20 : 7,
            height: 7,
            borderRadius: 999,
            background: i < idx
              ? 'var(--green-l)'
              : i === idx
              ? 'var(--violet-l)'
              : 'rgba(255,255,255,0.06)',
            border: `1px solid ${i === idx ? 'var(--violet-l)' : 'transparent'}`,
            transition: 'all 0.4s ease',
            boxShadow: i === idx ? 'var(--shadow-v)' : 'none',
          }} />
        ))}
      </div>

      {/* Stage list */}
      <div style={{
        marginTop: 24, display: 'flex', flexDirection: 'column', gap: 4,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 'var(--r-lg)',
        padding: '12px 20px',
        minWidth: 280,
      }}>
        {STAGES.slice(0, -1).map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            opacity: i <= idx ? 1 : 0.3,
            transition: 'opacity 0.3s',
            padding: '2px 0',
          }}>
            <span style={{ fontSize: 13, width: 20, textAlign: 'center' }}>
              {i < idx ? '✓' : i === idx ? s.icon : '○'}
            </span>
            <span style={{
              fontSize: 11.5,
              color: i < idx ? 'var(--green-l)' : i === idx ? 'var(--t1)' : 'var(--t4)',
              fontWeight: i === idx ? 600 : 400,
            }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
