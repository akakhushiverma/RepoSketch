import * as d3 from 'd3'
import { useRepoStore } from '../../store/repoStore'

export default function GraphControls({ svgRef, simRef }) {
  const { graphSettings, updateGraphSettings, graphData } = useRepoStore()

  const languages = graphData
    ? ['all', ...new Set(graphData.nodes.map((n) => n.language))]
    : ['all']

  const zoomBy = (factor) => {
    if (!svgRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(d3.zoom().scaleBy, factor)
  }

  const resetZoom = () => {
    if (!svgRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(d3.zoom().transform, d3.zoomIdentity)
  }

  const reheat = () => {
    if (simRef.current) {
      simRef.current.alpha(0.5).restart()
    }
  }

  return (
    <div className="graph-controls">
      {/* Zoom controls */}
      <div className="graph-controls-group">
        <button className="ctrl-btn" onClick={() => zoomBy(1.3)} title="Zoom in">＋ Zoom In</button>
        <button className="ctrl-btn" onClick={() => zoomBy(0.75)} title="Zoom out">－ Zoom Out</button>
        <button className="ctrl-btn" onClick={resetZoom} title="Reset view">⊙ Reset View</button>
        <button className="ctrl-btn" onClick={reheat} title="Re-run simulation">⟳ Re-simulate</button>
      </div>

      {/* Toggles */}
      <div className="graph-controls-group">
        <button
          className={`ctrl-btn ${graphSettings.showHeatmap ? 'active' : ''}`}
          onClick={() => updateGraphSettings({ showHeatmap: !graphSettings.showHeatmap })}
        >
          🔥 Heatmap
        </button>
        <button
          className={`ctrl-btn ${graphSettings.showClusters ? 'active' : ''}`}
          onClick={() => updateGraphSettings({ showClusters: !graphSettings.showClusters })}
        >
          🫧 Clusters
        </button>
        <button
          className={`ctrl-btn ${graphSettings.showLabels ? 'active' : ''}`}
          onClick={() => updateGraphSettings({ showLabels: !graphSettings.showLabels })}
        >
          🏷 Labels
        </button>
      </div>

      {/* Node size */}
      <div className="graph-controls-group">
        <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '2px 4px' }}>Node Size By</div>
        {['complexity', 'connections', 'lines'].map((opt) => (
          <button
            key={opt}
            className={`ctrl-btn ${graphSettings.nodeSizeBy === opt ? 'active' : ''}`}
            onClick={() => updateGraphSettings({ nodeSizeBy: opt })}
          >
            {opt === 'complexity' ? '🧠' : opt === 'connections' ? '🔗' : '📏'} {opt}
          </button>
        ))}
      </div>

      {/* Language filter */}
      <div className="graph-controls-group">
        <div style={{ fontSize: 10, color: 'var(--text-dim)', padding: '2px 4px' }}>Filter Language</div>
        <select
          value={graphSettings.filterLanguage}
          onChange={(e) => updateGraphSettings({ filterLanguage: e.target.value })}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-bright)',
            color: 'var(--text-primary)',
            borderRadius: 4,
            padding: '4px 6px',
            fontSize: 12,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
