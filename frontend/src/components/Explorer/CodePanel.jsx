import { useMemo } from 'react'
import { useRepoStore } from '../../store/repoStore'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const LANG_MAP = {
  javascript: 'javascript', typescript: 'typescript',
  python: 'python', java: 'java', go: 'go', rust: 'rust',
  html: 'html', css: 'css', json: 'json', markdown: 'markdown',
  ruby: 'ruby', yaml: 'yaml',
}

const RISK_COLORS = { low: '#10b981', moderate: '#f59e0b', high: '#f97316', critical: '#ef4444' }

function getRisk(c) {
  if (c <= 5) return { label: 'Low', color: RISK_COLORS.low }
  if (c <= 10) return { label: 'Moderate', color: RISK_COLORS.moderate }
  if (c <= 20) return { label: 'High', color: RISK_COLORS.high }
  return { label: 'Critical', color: RISK_COLORS.critical }
}

export default function CodePanel() {
  const { selectedFile, selectedFileContent, graphData, setSelectedNode } = useRepoStore()

  const nodeData = useMemo(
    () => graphData?.nodes?.find((n) => n.id === selectedFile),
    [graphData, selectedFile]
  )

  if (!selectedFile) {
    return (
      <div className="code-panel">
        <div className="no-data" style={{ marginTop: 60 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👈</div>
          <div>Click a node in the graph<br />or a file in the explorer</div>
        </div>
      </div>
    )
  }

  if (!selectedFileContent) {
    return (
      <div className="code-panel">
        <div className="code-panel-header">
          <div className="code-panel-filename">{selectedFile}</div>
        </div>
        <div className="no-data" style={{ marginTop: 40 }}>Loading file…</div>
      </div>
    )
  }

  const { content, language, tokens, lines } = selectedFileContent
  const functions = nodeData?.functions || []
  const imports = nodeData?.importCount || 0
  const avgComplexity = nodeData?.avgComplexity || 1
  const risk = getRisk(avgComplexity)
  const syntaxLang = LANG_MAP[language] || 'text'
  const filename = selectedFile.split('/').pop()

  return (
    <div className="code-panel">
      {/* Header */}
      <div className="code-panel-header">
        <div className="code-panel-filename">{filename}</div>
        <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, wordBreak: 'break-all' }}>
          {selectedFile}
        </div>
        <div className="code-panel-meta">
          <div className="code-panel-meta-item">
            <span>Lines</span>
            <span style={{ color: 'var(--text-primary)' }}>{lines}</span>
          </div>
          <div className="code-panel-meta-item">
            <span>Tokens</span>
            <span style={{ color: 'var(--color-cyan)' }}>{tokens?.toLocaleString()}</span>
          </div>
          <div className="code-panel-meta-item">
            <span>Lang</span>
            <span style={{ color: 'var(--color-gold)' }}>{language}</span>
          </div>
          <div className="code-panel-meta-item">
            <span>CC</span>
            <span style={{ color: risk.color, fontWeight: 700 }}>{avgComplexity} ({risk.label})</span>
          </div>
        </div>
      </div>

      {/* Functions list */}
      {functions.length > 0 && (
        <div className="code-panel-section">
          <div className="section-title">Functions ({functions.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {functions.slice(0, 10).map((fn, i) => {
              const fnRisk = getRisk(fn.complexity || 1)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                  <span style={{ color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)' }}>ƒ</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                    {fn.name}
                  </span>
                  <span style={{
                    background: `${fnRisk.color}22`, color: fnRisk.color,
                    borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 700,
                  }}>
                    cc:{fn.complexity || 1}
                  </span>
                  <span style={{ color: 'var(--text-dim)', fontSize: 10 }}>L{fn.startLine}</span>
                </div>
              )
            })}
            {functions.length > 10 && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>+{functions.length - 10} more…</div>
            )}
          </div>
        </div>
      )}

      {/* Imports */}
      {nodeData && (nodeData.importCount > 0) && (
        <div className="code-panel-section">
          <div className="section-title">Imports ({nodeData.importCount})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(graphData?.edges || [])
              .filter((e) => e.source === selectedFile)
              .slice(0, 8)
              .map((edge, i) => (
                <div
                  key={i}
                  style={{ fontSize: 11, color: 'var(--color-purple-light)', cursor: 'pointer', padding: '2px 0' }}
                  onClick={() => setSelectedNode(edge.target)}
                  title={`Go to ${edge.target}`}
                >
                  → {edge.target.split('/').slice(-2).join('/')}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Dependents */}
      {nodeData && (nodeData.inDegree > 0) && (
        <div className="code-panel-section">
          <div className="section-title">Imported by ({nodeData.inDegree})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(graphData?.edges || [])
              .filter((e) => e.target === selectedFile)
              .slice(0, 6)
              .map((edge, i) => (
                <div
                  key={i}
                  style={{ fontSize: 11, color: 'var(--color-gold)', cursor: 'pointer', padding: '2px 0' }}
                  onClick={() => setSelectedNode(edge.source)}
                  title={`Go to ${edge.source}`}
                >
                  ← {edge.source.split('/').slice(-2).join('/')}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Source code */}
      <div className="code-panel-body">
        <SyntaxHighlighter
          language={syntaxLang}
          style={vscDarkPlus}
          showLineNumbers
          lineNumberStyle={{ color: '#475569', fontSize: 11, userSelect: 'none' }}
          customStyle={{
            margin: 0, padding: '12px 0', background: 'transparent',
            fontSize: 12, lineHeight: 1.6,
          }}
          codeTagProps={{ style: { fontFamily: 'var(--font-mono)' } }}
        >
          {content || '// Empty file'}
        </SyntaxHighlighter>
      </div>
    </div>
  )
}
