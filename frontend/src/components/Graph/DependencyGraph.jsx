import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useRepoStore } from '../../store/repoStore'
import GraphControls from './GraphControls'
import NodeTooltip from './NodeTooltip'

/* ── Language colour palette ─────────────────────────────────────────────── */
const LANG_COLORS = {
  javascript: '#f7df1e',
  typescript: '#60a5fa',
  python:     '#34d399',
  java:       '#fb923c',
  ruby:       '#f87171',
  go:         '#22d3ee',
  rust:       '#fdba74',
  html:       '#f97316',
  css:        '#c084fc',
  scss:       '#e879f9',
  json:       '#94a3b8',
  markdown:   '#64748b',
  vue:        '#4ade80',
  svelte:     '#fb7185',
  unknown:    '#475569',
}

/* ── Glow colours (softer versions of LANG_COLORS) ───────────────────────── */
const LANG_GLOW = {
  javascript: 'rgba(247,223,30,0.5)',
  typescript: 'rgba(96,165,250,0.5)',
  python:     'rgba(52,211,153,0.5)',
  java:       'rgba(251,146,60,0.5)',
  html:       'rgba(249,115,22,0.5)',
  css:        'rgba(192,132,252,0.5)',
  go:         'rgba(34,211,238,0.5)',
  rust:       'rgba(253,186,116,0.5)',
  unknown:    'rgba(100,116,139,0.4)',
}

function getLangColor(lang) { return LANG_COLORS[lang] || LANG_COLORS.unknown }
function getLangGlow(lang)  { return LANG_GLOW[lang]  || LANG_GLOW.unknown  }

/* ── Node radius (much smaller, tighter range) ───────────────────────────── */
function nodeRadius(d, settings) {
  const by = settings?.nodeSizeBy || 'complexity'
  if (by === 'complexity')   return 4 + Math.min((d.avgComplexity || 1) * 0.8, 12)
  if (by === 'connections')  return 4 + Math.min(((d.inDegree||0)+(d.outDegree||0)) * 0.9, 12)
  if (by === 'lines')        return 4 + Math.min((d.lines||0) / 60, 12)
  return 7
}

export default function DependencyGraph() {
  const svgRef    = useRef(null)
  const simRef    = useRef(null)
  const zoomRef   = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const tooltipTimer = useRef(null)

  const {
    graphData, selectedFile, setSelectedNode,
    graphSettings, circularData,
  } = useRepoStore()

  const circularSet = new Set(circularData?.affectedFiles || [])

  /* ────────────────────────────────────────────────────────────────────────
   *  Main render
   * ────────────────────────────────────────────────────────────────────── */
  const renderGraph = useCallback(() => {
    if (!graphData || !svgRef.current) return
    const { nodes: rawNodes, edges: rawEdges } = graphData
    if (!rawNodes?.length) return

    /* filter by language */
    const filtered = graphSettings.filterLanguage === 'all'
      ? rawNodes
      : rawNodes.filter(n => n.language === graphSettings.filterLanguage)
    const filteredIds = new Set(filtered.map(n => n.id))
    const nodes = filtered.map(n => ({ ...n }))
    const edges = rawEdges
      .filter(e => filteredIds.has(e.source?.id ?? e.source) || filteredIds.has(e.target?.id ?? e.target))
      .map(e => ({ ...e }))

    const el    = svgRef.current
    const W     = el.clientWidth  || 960
    const H     = el.clientHeight || 680

    d3.select(el).selectAll('*').remove()

    /* ── SVG root ────────────────────────────────────────────────────────── */
    const svg = d3.select(el).attr('width', W).attr('height', H)

    /* ── Defs: filters + gradients + markers ─────────────────────────────── */
    const defs = svg.append('defs')

    // Subtle background grid (cosmetic)
    defs.append('pattern')
      .attr('id', 'grid').attr('width', 40).attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse')
      .append('path')
      .attr('d', 'M 40 0 L 0 0 0 40')
      .attr('fill', 'none').attr('stroke', 'rgba(255,255,255,0.03)').attr('stroke-width', 0.5)

    // Radial glow filter for selected node
    const selectedGlow = defs.append('filter').attr('id', 'glow-selected').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
    selectedGlow.append('feGaussianBlur').attr('stdDeviation', 4).attr('result', 'blur')
    const feMerge = selectedGlow.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'blur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Softer glow for hover
    const hoverGlow = defs.append('filter').attr('id', 'glow-hover').attr('x', '-40%').attr('y', '-40%').attr('width', '180%').attr('height', '180%')
    hoverGlow.append('feGaussianBlur').attr('stdDeviation', 3).attr('result', 'blur')
    const feMerge2 = hoverGlow.append('feMerge')
    feMerge2.append('feMergeNode').attr('in', 'blur')
    feMerge2.append('feMergeNode').attr('in', 'SourceGraphic')

    // Arrow markers — thin, compact
    const makeMarker = (id, color) => {
      defs.append('marker')
        .attr('id', id)
        .attr('viewBox', '0 -3 6 6').attr('refX', 12).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-3L6,0L0,3').attr('fill', color)
    }
    makeMarker('arr-normal',   'rgba(148,103,189,0.7)')
    makeMarker('arr-circular', '#ef4444')
    makeMarker('arr-hi',       '#a78bfa')

    // Radial gradient for each language (inner lighter, outer the lang colour)
    const uniqueLangs = [...new Set(nodes.map(n => n.language))]
    uniqueLangs.forEach(lang => {
      const c = getLangColor(lang)
      const g = defs.append('radialGradient')
        .attr('id', `rg-${lang}`).attr('cx', '35%').attr('cy', '35%').attr('r', '65%')
      g.append('stop').attr('offset', '0%').attr('stop-color', d3.color(c)?.brighter(1.2)?.toString() || '#fff')
      g.append('stop').attr('offset', '100%').attr('stop-color', c)
    })

    /* ── Zoom behaviour ─────────────────────────────────────────────────── */
    // Use a filter so CTRL+scroll or two-finger pinch zooms, but plain scroll pans
    const zoom = d3.zoom()
      .scaleExtent([0.08, 4])
      .filter(event => {
        // allow wheel only if ctrl key is held; always allow mouse drag / touch
        if (event.type === 'wheel') return event.ctrlKey || event.metaKey
        return !event.button
      })
      .on('zoom', event => container.attr('transform', event.transform))

    svg.call(zoom)
      .on('dblclick.zoom', null) // disable double-click zoom

    zoomRef.current = { zoom, svg }

    /* ── Background ─────────────────────────────────────────────────────── */
    svg.append('rect')
      .attr('width', W).attr('height', H)
      .attr('fill', 'url(#grid)')

    /* ── Container ──────────────────────────────────────────────────────── */
    const container = svg.append('g').attr('class', 'graph-container')

    /* ── Cluster hulls ───────────────────────────────────────────────────── */
    let hullPaths = null
    if (graphSettings.showClusters) {
      const groups = {}
      nodes.forEach(n => {
        const key = n.path.split('/')[0] || 'root'
        ;(groups[key] = groups[key] || []).push(n)
      })
      const entries = Object.entries(groups).filter(([, ns]) => ns.length > 1)
      const hullG = container.append('g').attr('class', 'hull-layer')
      hullPaths = hullG.selectAll('path')
        .data(entries)
        .enter().append('path')
        .attr('fill-opacity', 0.05)
        .attr('stroke-opacity', 0.2)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '5 4')
        .attr('rx', 10)
        .each(function(d, i) {
          const col = d3.schemeTableau10[i % 10]
          d3.select(this).attr('fill', col).attr('stroke', col)
        })
    }

    /* ── Links ───────────────────────────────────────────────────────────── */
    const linkG = container.append('g').attr('class', 'link-layer')
    const link = linkG.selectAll('line')
      .data(edges).enter().append('line')
      .attr('stroke-width', 0.8)
      .attr('stroke', d => {
        const sc = d.source?.id ?? d.source
        const tc = d.target?.id ?? d.target
        if (circularSet.has(sc) && circularSet.has(tc)) return 'rgba(239,68,68,0.6)'
        return 'rgba(148,103,189,0.25)'
      })
      .attr('stroke-dasharray', d => {
        const sc = d.source?.id ?? d.source
        if (circularSet.has(sc)) return '4 3'
        return null
      })
      .attr('marker-end', d => {
        const sc = d.source?.id ?? d.source
        const tc = d.target?.id ?? d.target
        if (circularSet.has(sc) && circularSet.has(tc)) return 'url(#arr-circular)'
        return 'url(#arr-normal)'
      })

    /* ── Nodes ───────────────────────────────────────────────────────────── */
    const nodeG = container.append('g').attr('class', 'node-layer')
    const nodeEl = nodeG.selectAll('g')
      .data(nodes).enter().append('g')
      .attr('class', 'gnode')
      .style('cursor', 'pointer')

    /* Drag — pin while dragging, release after */
    nodeEl.call(
      d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simRef.current?.alphaTarget(0.15).restart()
          d.fx = d.x; d.fy = d.y
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
        .on('end', (event, d) => {
          if (!event.active) simRef.current?.alphaTarget(0)
          // keep pinned (don't unset fx/fy) so node doesn't fly away
        })
    )

    /* Click */
    nodeEl.on('click', (event, d) => {
      event.stopPropagation()
      setSelectedNode(d.id)
      // re-centre graph on clicked node
      const scale = d3.zoomTransform(el).k
      const tx = W / 2 - d.x * scale
      const ty = H / 2 - d.y * scale
      d3.select(el).transition().duration(500)
        .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
    })

    /* Tooltip — show after short delay to avoid flicker */
    nodeEl
      .on('mouseover', (event, d) => {
        clearTimeout(tooltipTimer.current)
        tooltipTimer.current = setTimeout(() => {
          setTooltip({ node: d, x: event.clientX, y: event.clientY })
        }, 120)
        // brighten node
        d3.select(event.currentTarget).select('circle.main')
          .attr('filter', 'url(#glow-hover)')
          .attr('stroke-width', 1.5)
          .attr('stroke', '#fff')
        // highlight connected edges
        link.attr('stroke-opacity', e => {
          const sc = e.source?.id ?? e.source
          const tc = e.target?.id ?? e.target
          return (sc === d.id || tc === d.id) ? 1 : 0.08
        }).attr('stroke-width', e => {
          const sc = e.source?.id ?? e.source
          const tc = e.target?.id ?? e.target
          return (sc === d.id || tc === d.id) ? 1.8 : 0.5
        })
        // dim other nodes
        nodeEl.select('circle.main')
          .attr('opacity', n => n.id === d.id ? 1 : 0.35)
      })
      .on('mousemove', event => {
        setTooltip(prev => prev ? { ...prev, x: event.clientX, y: event.clientY } : null)
      })
      .on('mouseout', event => {
        clearTimeout(tooltipTimer.current)
        setTooltip(null)
        d3.select(event.currentTarget).select('circle.main')
          .attr('filter', n => n.id === selectedFile ? 'url(#glow-selected)' : null)
          .attr('stroke-width', n => n.id === selectedFile ? 2 : 0.8)
          .attr('stroke', n => n.id === selectedFile ? '#fff' : 'rgba(255,255,255,0.2)')
        link
          .attr('stroke-opacity', null)
          .attr('stroke-width', 0.8)
        nodeEl.select('circle.main').attr('opacity', 1)
      })

    /* ── Node visuals ────────────────────────────────────────────────────── */
    // Outer glow ring (only for nodes with high in-degree)
    nodeEl.filter(d => (d.inDegree || 0) > 3)
      .append('circle')
      .attr('class', 'ring')
      .attr('r', d => nodeRadius(d, graphSettings) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => getLangColor(d.language))
      .attr('stroke-width', 0.5)
      .attr('stroke-opacity', 0.4)

    // Main circle
    nodeEl.append('circle')
      .attr('class', 'main')
      .attr('r', d => nodeRadius(d, graphSettings))
      .attr('fill', d => {
        if (graphSettings.showHeatmap) return d3.interpolateRdYlGn(1 - (d.heat || 0))
        if (circularSet.has(d.id)) return '#ef4444'
        return `url(#rg-${d.language})`
      })
      .attr('stroke', d => d.id === selectedFile ? '#ffffff' : 'rgba(255,255,255,0.2)')
      .attr('stroke-width', d => d.id === selectedFile ? 2 : 0.8)
      .attr('filter', d => d.id === selectedFile ? 'url(#glow-selected)' : null)

    // Labels — only for nodes with ≥5 connections or large enough radius
    if (graphSettings.showLabels) {
      nodeEl
        .filter(d => (d.inDegree||0)+(d.outDegree||0) >= 2 || nodeRadius(d, graphSettings) >= 8)
        .append('text')
        .attr('class', 'nlabel')
        .attr('dy', d => nodeRadius(d, graphSettings) + 10)
        .attr('text-anchor', 'middle')
        .attr('fill', d => {
          const c = d3.color(getLangColor(d.language))
          c.opacity = 0.85
          return c.toString()
        })
        .attr('font-size', d => {
          const r = nodeRadius(d, graphSettings)
          return r >= 10 ? 10 : 9
        })
        .attr('font-family', 'system-ui, sans-serif')
        .attr('pointer-events', 'none')
        .attr('paint-order', 'stroke')
        .attr('stroke', 'rgba(5,5,15,0.9)')
        .attr('stroke-width', 3)
        .text(d => {
          const name = d.name || d.path.split('/').pop()
          return name.length > 16 ? name.slice(0, 14) + '…' : name
        })
    }

    /* ── Physics simulation ─────────────────────────────────────────────── */
    // Key fixes:
    // - Higher charge strength so nodes space out
    // - Lower alphaDecay so it settles faster without bouncing
    // - Higher velocityDecay (friction) so nodes don't fly on touch
    // - Bounded x/y forces keep nodes inside viewport
    const sim = d3.forceSimulation(nodes)
      .alphaDecay(0.04)          // settles in ~3s instead of 7s
      .velocityDecay(0.55)       // HIGH friction — stops the "moves a lot" issue
      .force('link', d3.forceLink(edges)
        .id(d => d.id)
        .distance(d => {
          // longer links for well-connected nodes
          const deg = ((d.source.inDegree||0)+(d.source.outDegree||0)
                      +(d.target.inDegree||0)+(d.target.outDegree||0))
          return 60 + Math.min(deg * 4, 80)
        })
        .strength(0.25)
      )
      .force('charge', d3.forceManyBody()
        .strength(d => -120 - Math.min((d.inDegree||0)+(d.outDegree||0), 10) * 15)
        .distanceMax(350)        // cap repulsion range — prevents global drift
        .distanceMin(10)
      )
      .force('center',    d3.forceCenter(W / 2, H / 2).strength(0.04))
      .force('collision', d3.forceCollide()
        .radius(d => nodeRadius(d, graphSettings) + 6)
        .strength(0.8)
        .iterations(3)
      )
      // Bounding box — keeps nodes in view
      .force('bound', () => {
        const pad = 40
        nodes.forEach(n => {
          if (n.x < pad)   { n.vx += (pad - n.x) * 0.08 }
          if (n.x > W-pad) { n.vx += (W - pad - n.x) * 0.08 }
          if (n.y < pad)   { n.vy += (pad - n.y) * 0.08 }
          if (n.y > H-pad) { n.vy += (H - pad - n.y) * 0.08 }
        })
      })

    simRef.current = sim

    /* Tick */
    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)

      nodeEl.attr('transform', d => `translate(${d.x},${d.y})`)

      if (hullPaths) {
        const groups = {}
        nodes.forEach(n => {
          const key = n.path.split('/')[0] || 'root'
          ;(groups[key] = groups[key] || []).push([n.x, n.y])
        })
        hullPaths.each(function([key]) {
          const pts = groups[key]
          if (!pts || pts.length < 3) return
          try {
            const hull = d3.polygonHull(pts)
            if (hull) {
              const pad = 18
              // expand hull outward
              const cx = d3.mean(hull, p => p[0])
              const cy = d3.mean(hull, p => p[1])
              const padded = hull.map(p => {
                const dx = p[0]-cx, dy = p[1]-cy
                const len = Math.hypot(dx,dy) || 1
                return [p[0]+dx/len*pad, p[1]+dy/len*pad]
              })
              d3.select(this).attr('d', `M${padded.map(p=>p.join(',')).join('L')}Z`)
            }
          } catch(_) {}
        })
      }
    })

    /* ── Legend ─────────────────────────────────────────────────────────── */
    const presentLangs = Object.entries(LANG_COLORS).filter(([l]) => nodes.some(n => n.language === l))
    const legendW = 118
    const legendH = presentLangs.length * 17 + 20

    const legendG = svg.append('g')
      .attr('transform', `translate(${W - legendW - 12}, 12)`)
      .attr('class', 'legend')

    legendG.append('rect')
      .attr('width', legendW).attr('height', legendH).attr('rx', 8)
      .attr('fill', 'rgba(10,10,28,0.88)')
      .attr('stroke', 'rgba(255,255,255,0.07)')

    presentLangs.forEach(([lang, col], i) => {
      const row = legendG.append('g').attr('transform', `translate(10, ${i*17+14})`)
      row.append('circle').attr('r', 4.5).attr('fill', col).attr('cx', 0).attr('cy', 0)
        .attr('filter', 'url(#glow-hover)')
      row.append('text')
        .attr('x', 12).attr('y', 4)
        .attr('fill', '#94a3b8').attr('font-size', 10.5)
        .attr('font-family', 'system-ui, sans-serif')
        .text(lang)
    })

    /* ── Auto fit-to-screen after simulation cools ───────────────────────── */
    sim.on('end', () => {
      try {
        const bounds = container.node().getBBox()
        if (!bounds.width || !bounds.height) return
        const scale = Math.min(0.92, Math.min((W-80)/bounds.width, (H-80)/bounds.height))
        const tx = (W - bounds.width*scale)/2 - bounds.x*scale
        const ty = (H - bounds.height*scale)/2 - bounds.y*scale
        d3.select(el).transition().duration(600)
          .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
      } catch(_) {}
    })

  }, [graphData, graphSettings, selectedFile, circularSet, setSelectedNode])

  useEffect(() => { renderGraph() }, [renderGraph])

  useEffect(() => {
    const ob = new ResizeObserver(() => renderGraph())
    if (svgRef.current?.parentElement) ob.observe(svgRef.current.parentElement)
    return () => ob.disconnect()
  }, [renderGraph])

  /* Click on background → deselect + unpin all */
  const handleBgClick = useCallback(() => {
    if (simRef.current) {
      simRef.current.nodes().forEach(n => { n.fx = null; n.fy = null })
    }
  }, [])

  if (!graphData) {
    return (
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'var(--text-dim)',flexDirection:'column',gap:12}}>
        <div style={{fontSize:52}}>🔭</div>
        <div style={{fontSize:14}}>Dependency Atlas will appear here</div>
        <div style={{fontSize:12,color:'var(--text-dim)',opacity:0.6}}>Enter a GitHub URL above to begin</div>
      </div>
    )
  }

  return (
    <div style={{position:'relative',width:'100%',height:'100%',background:'var(--bg-primary)'}}>
      <svg
        ref={svgRef}
        style={{display:'block',width:'100%',height:'100%',cursor:'grab'}}
        onClick={handleBgClick}
      />
      <GraphControls svgRef={svgRef} simRef={simRef} zoomRef={zoomRef} />
      {tooltip && (
        <NodeTooltip
          node={tooltip.node}
          x={tooltip.x}
          y={tooltip.y}
          circularFileSet={circularSet}
        />
      )}
      {/* Zoom hint */}
      <div style={{
        position:'absolute', bottom:8, right:8,
        fontSize:10, color:'var(--text-dim)', opacity:0.5,
        pointerEvents:'none', userSelect:'none',
      }}>
        Ctrl+Scroll to zoom · Drag nodes to pin
      </div>
    </div>
  )
}
