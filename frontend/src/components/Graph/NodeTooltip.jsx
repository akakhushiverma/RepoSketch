import { useEffect, useRef } from 'react'

const RISK_COLORS = {
  low: 'var(--color-green)',
  moderate: 'var(--color-gold)',
  high: 'var(--color-orange)',
  critical: 'var(--color-red)',
}

function getRisk(complexity) {
  if (complexity <= 5) return { label: 'Low', color: RISK_COLORS.low }
  if (complexity <= 10) return { label: 'Moderate', color: RISK_COLORS.moderate }
  if (complexity <= 20) return { label: 'High', color: RISK_COLORS.high }
  return { label: 'Critical', color: RISK_COLORS.critical }
}

export default function NodeTooltip({ node, x, y, circularFileSet }) {
  if (!node) return null

  const isCircular = circularFileSet && circularFileSet.has(node.id)
  const risk = getRisk(node.avgComplexity || 1)
  const topFns = (node.functions || []).slice(0, 4)

  // Keep tooltip within viewport
  const left = x + 12
  const top = y - 10

  return (
    <div
      className="node-tooltip"
      style={{ left, top }}
      aria-live="polite"
    >
      <div className="tooltip-filename">{node.name}</div>
      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 8, wordBreak: 'break-all' }}>
        {node.path}
      </div>

      <div className="tooltip-meta">
        <span className="tooltip-tag" style={{ color: 'var(--color-cyan)' }}>
          {node.language}
        </span>
        <span className="tooltip-tag">
          📏 {node.lines || 0} lines
        </span>
        <span className="tooltip-tag">
          🔗 {(node.inDegree || 0) + (node.outDegree || 0)} deps
        </span>
        <span className="tooltip-tag" style={{ color: risk.color }}>
          ⚡ {risk.label}
        </span>
      </div>

      <div style={{ fontSize: 11, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginBottom: 6 }}>
        <span style={{ color: 'var(--text-dim)' }}>Complexity</span>
        <span style={{ color: risk.color, fontWeight: 600 }}>{node.avgComplexity || 1}</span>
        <span style={{ color: 'var(--text-dim)' }}>Imports</span>
        <span>{node.importCount || 0}</span>
        <span style={{ color: 'var(--text-dim)' }}>Functions</span>
        <span>{(node.functions || []).length}</span>
        <span style={{ color: 'var(--text-dim)' }}>In-degree</span>
        <span style={{ color: 'var(--color-purple-light)' }}>{node.inDegree || 0}</span>
      </div>

      {topFns.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>TOP FUNCTIONS</div>
          {topFns.map((fn, i) => (
            <div key={i} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', padding: '1px 0' }}>
              <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                {fn.name}
              </span>
              <span style={{ color: getRisk(fn.complexity || 1).color, fontWeight: 600, fontSize: 10, marginLeft: 8, flexShrink: 0 }}>
                cc:{fn.complexity || 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {isCircular && (
        <div className="tooltip-circular-warning">
          ♻ Part of a circular dependency cycle!
        </div>
      )}
    </div>
  )
}
