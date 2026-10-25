import * as d3 from 'd3'
import { useRepoStore } from '../../store/repoStore'

export default function GraphControls({ svgRef, simRef, zoomRef }) {
  const { graphSettings, updateGraphSettings, graphData } = useRepoStore()

  const languages = graphData
    ? ['all', ...new Set(graphData.nodes.map(n => n.language)).values()]
    : ['all']

  const doZoom = (factor) => {
    if (!svgRef.current || !zoomRef.current) return
    const { zoom, svg } = zoomRef.current
    svg.transition().duration(280).call(zoom.scaleBy, factor)
  }

  const resetView = () => {
    if (!svgRef.current || !zoomRef.current) return
    const { zoom, svg } = zoomRef.current
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
  }

  const reheat = () => {
    if (simRef.current) simRef.current.alpha(0.4).restart()
  }

  const unpinAll = () => {
    if (simRef.current) {
      simRef.current.nodes().forEach(n => { n.fx = null; n.fy = null })
      simRef.current.alpha(0.3).restart()
    }
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      zIndex: 10,
      userSelect: 'none',
    }}>
      {/* Zoom + view */}
      <CtrlGroup>
        <CtrlBtn onClick={() => doZoom(1.35)} title="Zoom in">＋</CtrlBtn>
        <CtrlBtn onClick={() => doZoom(1/1.35)} title="Zoom out">－</CtrlBtn>
        <Divider />
        <CtrlBtn onClick={resetView} title="Reset view" wide>⊙ Reset</CtrlBtn>
        <CtrlBtn onClick={unpinAll} title="Unpin all nodes" wide>⇥ Unpin</CtrlBtn>
        <CtrlBtn onClick={reheat} title="Re-run simulation" wide>⟳ Resim</CtrlBtn>
      </CtrlGroup>

      {/* Toggles */}
      <CtrlGroup>
        <CtrlToggle
          active={graphSettings.showHeatmap}
          onClick={() => updateGraphSettings({ showHeatmap: !graphSettings.showHeatmap })}
        >🔥 Heat</CtrlToggle>
        <CtrlToggle
          active={graphSettings.showClusters}
          onClick={() => updateGraphSettings({ showClusters: !graphSettings.showClusters })}
        >⬡ Clusters</CtrlToggle>
        <CtrlToggle
          active={graphSettings.showLabels}
          onClick={() => updateGraphSettings({ showLabels: !graphSettings.showLabels })}
        >🏷 Labels</CtrlToggle>
      </CtrlGroup>

      {/* Node size */}
      <CtrlGroup label="Node size">
        {['complexity','connections','lines'].map(opt => (
          <CtrlToggle
            key={opt}
            active={graphSettings.nodeSizeBy === opt}
            onClick={() => updateGraphSettings({ nodeSizeBy: opt })}
          >
            {opt === 'complexity' ? '⚡' : opt === 'connections' ? '🔗' : '📏'} {opt}
          </CtrlToggle>
        ))}
      </CtrlGroup>

      {/* Language filter */}
      <CtrlGroup label="Language">
        <select
          value={graphSettings.filterLanguage}
          onChange={e => updateGraphSettings({ filterLanguage: e.target.value })}
          style={{
            background: 'rgba(15,15,40,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0',
            borderRadius: 6,
            padding: '5px 8px',
            fontSize: 11,
            cursor: 'pointer',
            width: '100%',
            outline: 'none',
          }}
        >
          {languages.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </CtrlGroup>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */
function CtrlGroup({ children, label }) {
  return (
    <div style={{
      background: 'rgba(10,10,28,0.92)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: '6px 7px',
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      backdropFilter: 'blur(8px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      minWidth: 110,
    }}>
      {label && (
        <div style={{fontSize: 9, color: '#475569', letterSpacing: '0.07em', textTransform:'uppercase', paddingLeft: 2, marginBottom: 1}}>
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

function CtrlBtn({ children, onClick, title, wide }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.08)',
        color: '#94a3b8',
        borderRadius: 6,
        padding: wide ? '4px 8px' : '4px 6px',
        fontSize: 11,
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.color='#e2e8f0' }}
      onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8' }}
    >
      {children}
    </button>
  )
}

function CtrlToggle({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(139,92,246,0.22)' : 'transparent',
        border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.07)'}`,
        color: active ? '#a78bfa' : '#64748b',
        borderRadius: 6,
        padding: '4px 8px',
        fontSize: 11,
        cursor: 'pointer',
        transition: 'all 0.15s',
        textAlign: 'left',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div style={{height:1, background:'rgba(255,255,255,0.05)', margin:'1px 0'}} />
}
