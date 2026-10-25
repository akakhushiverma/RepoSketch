import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useRepoStore } from '../../store/repoStore'
import GraphControls from './GraphControls'

/* ── Language colours ────────────────────────────────────────────────────── */
const LANG = {
  javascript: { color: '#fbbf24', glow: '#f59e0b', emoji: 'JS' },
  typescript: { color: '#60a5fa', glow: '#3b82f6', emoji: 'TS' },
  python:     { color: '#34d399', glow: '#10b981', emoji: 'PY' },
  java:       { color: '#fb923c', glow: '#f97316', emoji: 'JV' },
  ruby:       { color: '#f87171', glow: '#ef4444', emoji: 'RB' },
  go:         { color: '#22d3ee', glow: '#06b6d4', emoji: 'GO' },
  rust:       { color: '#fdba74', glow: '#fb923c', emoji: 'RS' },
  html:       { color: '#f97316', glow: '#ea580c', emoji: 'HT' },
  css:        { color: '#c084fc', glow: '#a855f7', emoji: 'CS' },
  scss:       { color: '#e879f9', glow: '#d946ef', emoji: 'SC' },
  json:       { color: '#94a3b8', glow: '#64748b', emoji: '{}' },
  markdown:   { color: '#64748b', glow: '#475569', emoji: 'MD' },
  vue:        { color: '#4ade80', glow: '#22c55e', emoji: 'VU' },
  svelte:     { color: '#fb7185', glow: '#f43f5e', emoji: 'SV' },
  unknown:    { color: '#475569', glow: '#334155', emoji: '??' },
}
const L = (lang) => LANG[lang] || LANG.unknown

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function nodeR(d, by = 'complexity') {
  if (by === 'complexity')  return 5  + Math.min((d.avgComplexity||1) * 0.9, 14)
  if (by === 'connections') return 5  + Math.min(((d.inDegree||0)+(d.outDegree||0)) * 1.1, 14)
  if (by === 'lines')       return 5  + Math.min((d.lines||0)/55, 14)
  return 8
}

/* Animated starfield canvas drawn behind SVG */
function drawStarfield(canvas) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width, H = canvas.height
  ctx.clearRect(0, 0, W, H)
  const stars = Array.from({length: 120}, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    r: Math.random() * 1.2 + 0.2,
    a: Math.random(),
  }))
  stars.forEach(s => {
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200,210,255,${s.a * 0.5})`
    ctx.fill()
  })
}

/* ══════════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ══════════════════════════════════════════════════════════════════════════ */
export default function DependencyGraph() {
  const svgRef    = useRef(null)
  const canvasRef = useRef(null)
  const simRef    = useRef(null)
  const zoomRef   = useRef(null)
  const [tooltip, setTooltip] = useState(null)
  const ttTimer   = useRef(null)

  const { graphData, selectedFile, setSelectedNode, graphSettings, circularData } = useRepoStore()
  const circularSet = new Set(circularData?.affectedFiles || [])

  /* ── RENDER ────────────────────────────────────────────────────────────── */
  const render = useCallback(() => {
    if (!graphData || !svgRef.current) return
    const { nodes: rawNodes, edges: rawEdges } = graphData
    if (!rawNodes?.length) return

    /* filter */
    const filtered = graphSettings.filterLanguage === 'all'
      ? rawNodes : rawNodes.filter(n => n.language === graphSettings.filterLanguage)
    const fIds  = new Set(filtered.map(n => n.id))
    const nodes = filtered.map(n => ({ ...n }))
    const edges = rawEdges
      .filter(e => fIds.has(e.source?.id ?? e.source) || fIds.has(e.target?.id ?? e.target))
      .map(e => ({ ...e }))

    const el = svgRef.current
    const W  = el.clientWidth  || 960
    const H  = el.clientHeight || 680

    /* starfield */
    if (canvasRef.current) {
      canvasRef.current.width  = W
      canvasRef.current.height = H
      drawStarfield(canvasRef.current)
    }

    d3.select(el).selectAll('*').remove()
    const svg = d3.select(el).attr('width', W).attr('height', H)

    /* ── DEFS ──────────────────────────────────────────────────────────── */
    const defs = svg.append('defs')

    // Big radial background glow in center
    const bgGrad = defs.append('radialGradient').attr('id','bg-glow')
      .attr('cx','50%').attr('cy','50%').attr('r','50%')
    bgGrad.append('stop').attr('offset','0%').attr('stop-color','#1a0a3e').attr('stop-opacity',0.6)
    bgGrad.append('stop').attr('offset','100%').attr('stop-color','transparent').attr('stop-opacity',0)

    // Per-language radial gradients
    const uniqueLangs = [...new Set(nodes.map(n=>n.language))]
    uniqueLangs.forEach(lang => {
      const { color, glow } = L(lang)
      const g = defs.append('radialGradient')
        .attr('id', `ng-${lang}`).attr('cx','35%').attr('cy','30%').attr('r','70%')
      g.append('stop').attr('offset','0%').attr('stop-color', d3.color(color)?.brighter(1.5)?.toString() || '#fff')
      g.append('stop').attr('offset','60%').attr('stop-color', color)
      g.append('stop').attr('offset','100%').attr('stop-color', d3.color(glow)?.darker(0.5)?.toString() || glow)
    })

    // Outer glow blur filter
    const mkFilter = (id, std, opacity=1) => {
      const f = defs.append('filter').attr('id', id)
        .attr('x','-60%').attr('y','-60%').attr('width','220%').attr('height','220%')
      f.append('feGaussianBlur').attr('in','SourceGraphic').attr('stdDeviation', std).attr('result','blur')
      const fm = f.append('feMerge')
      fm.append('feMergeNode').attr('in','blur')
      fm.append('feMergeNode').attr('in','SourceGraphic')
    }
    mkFilter('glow-soft', 3)
    mkFilter('glow-strong', 6)
    mkFilter('glow-xl', 10)

    // Selected ring pulse filter
    const selF = defs.append('filter').attr('id','sel-glow')
      .attr('x','-80%').attr('y','-80%').attr('width','260%').attr('height','260%')
    selF.append('feGaussianBlur').attr('in','SourceGraphic').attr('stdDeviation', 8).attr('result','b1')
    selF.append('feGaussianBlur').attr('in','SourceGraphic').attr('stdDeviation', 4).attr('result','b2')
    const selMerge = selF.append('feMerge')
    selMerge.append('feMergeNode').attr('in','b1')
    selMerge.append('feMergeNode').attr('in','b2')
    selMerge.append('feMergeNode').attr('in','SourceGraphic')

    // Arrow markers — elegant thin
    const mkMarker = (id, color, opacity=0.8) => {
      defs.append('marker').attr('id', id)
        .attr('viewBox','0 -3 7 6').attr('refX', 14).attr('refY', 0)
        .attr('markerWidth', 5).attr('markerHeight', 5).attr('orient','auto')
        .append('path').attr('d','M0,-3L7,0L0,3').attr('fill', color).attr('fill-opacity', opacity)
    }
    mkMarker('arr',      '#8b5cf6', 0.7)
    mkMarker('arr-circ', '#ef4444', 0.9)
    mkMarker('arr-hi',   '#a78bfa', 1.0)

    /* ── ZOOM ──────────────────────────────────────────────────────────── */
    const zoom = d3.zoom().scaleExtent([0.07, 5])
      .filter(ev => ev.type === 'wheel' ? (ev.ctrlKey||ev.metaKey) : !ev.button)
      .on('zoom', ev => root.attr('transform', ev.transform))
    svg.call(zoom).on('dblclick.zoom', null)
    zoomRef.current = { zoom, svg }

    /* ── LAYERS ────────────────────────────────────────────────────────── */
    svg.append('rect').attr('width',W).attr('height',H).attr('fill','url(#bg-glow)')
    const root = svg.append('g')

    /* ── CLUSTER NEBULAE ─────────────────────────────────────────────────
     *  Instead of plain hulls: soft blurry ellipse "nebulae" per cluster
     * ──────────────────────────────────────────────────────────────────── */
    let nebulaData = []
    if (graphSettings.showClusters) {
      const groups = {}
      nodes.forEach(n => {
        const key = n.path.split('/')[0] || 'root'
        ;(groups[key] = groups[key] || []).push(n)
      })
      nebulaData = Object.entries(groups).filter(([,ns]) => ns.length > 1)
    }

    const nebulaLayer = root.append('g').attr('class','nebulae')
    const nebulaEls = nebulaLayer.selectAll('ellipse')
      .data(nebulaData).enter().append('ellipse')
      .attr('fill', (d,i) => d3.schemeTableau10[i % 10])
      .attr('fill-opacity', 0)   // start invisible, update on tick
      .attr('filter', 'url(#glow-xl)')

    /* ── EDGES ──────────────────────────────────────────────────────────
     *  Curved bezier paths instead of straight lines
     * ──────────────────────────────────────────────────────────────────── */
    const edgeLayer = root.append('g').attr('class','edges')

    const edgePath = edgeLayer.selectAll('path')
      .data(edges).enter().append('path')
      .attr('fill','none')
      .attr('stroke-width', d => {
        const w = (d.weight || 1)
        return Math.min(0.5 + w * 0.3, 2)
      })
      .attr('stroke', d => {
        const sc = d.source?.id ?? d.source
        const tc = d.target?.id ?? d.target
        if (circularSet.has(sc) && circularSet.has(tc)) return 'rgba(239,68,68,0.5)'
        return 'rgba(139,92,246,0.2)'
      })
      .attr('stroke-dasharray', d => {
        const sc = d.source?.id ?? d.source
        return circularSet.has(sc) ? '5 3' : null
      })
      .attr('marker-end', d => {
        const sc = d.source?.id ?? d.source
        const tc = d.target?.id ?? d.target
        return (circularSet.has(sc) && circularSet.has(tc)) ? 'url(#arr-circ)' : 'url(#arr)'
      })
      .attr('opacity', 0.8)

    /* ── NODES ──────────────────────────────────────────────────────────── */
    const nodeLayer = root.append('g').attr('class','nodes')
    const nodeEl = nodeLayer.selectAll('g').data(nodes).enter().append('g')
      .attr('class','gnode').style('cursor','pointer')

    /* Drag */
    nodeEl.call(d3.drag()
      .on('start', (ev,d) => { if(!ev.active) simRef.current?.alphaTarget(0.12).restart(); d.fx=d.x; d.fy=d.y })
      .on('drag',  (ev,d) => { d.fx=ev.x; d.fy=ev.y })
      .on('end',   (ev,d) => { if(!ev.active) simRef.current?.alphaTarget(0) })
    )

    /* Click → select + fly to */
    nodeEl.on('click', (ev,d) => {
      ev.stopPropagation()
      setSelectedNode(d.id)
      const k = d3.zoomTransform(el).k
      const tx = W/2 - d.x*k
      const ty = H/2 - d.y*k
      d3.select(el).transition().duration(600).ease(d3.easeCubicOut)
        .call(zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(k))
    })

    /* Hover */
    nodeEl
      .on('mouseover', (ev,d) => {
        clearTimeout(ttTimer.current)
        ttTimer.current = setTimeout(() => setTooltip({node:d, x:ev.clientX, y:ev.clientY}), 80)

        // Highlight self
        d3.select(ev.currentTarget).select('.main-circle')
          .attr('filter','url(#glow-strong)')
          .attr('stroke','#ffffff').attr('stroke-width', 2)

        // Highlight connected edges, dim others
        edgePath
          .attr('opacity', e => {
            const sc = e.source?.id ?? e.source
            const tc = e.target?.id ?? e.target
            return (sc===d.id||tc===d.id) ? 1 : 0.06
          })
          .attr('stroke', e => {
            const sc = e.source?.id ?? e.source
            const tc = e.target?.id ?? e.target
            if (sc===d.id||tc===d.id) {
              const peer = sc===d.id ? (e.target?.id??e.target) : sc
              const peerNode = nodes.find(n=>n.id===peer)
              return peerNode ? L(peerNode.language).color : '#a78bfa'
            }
            return 'rgba(139,92,246,0.08)'
          })
          .attr('stroke-width', e => {
            const sc = e.source?.id ?? e.source
            const tc = e.target?.id ?? e.target
            return (sc===d.id||tc===d.id) ? 2 : 0.4
          })
          .attr('marker-end', e => {
            const sc = e.source?.id ?? e.source
            const tc = e.target?.id ?? e.target
            return (sc===d.id||tc===d.id) ? 'url(#arr-hi)' : 'url(#arr)'
          })

        // Dim unrelated nodes
        nodeEl.select('.main-circle')
          .attr('opacity', n => n.id===d.id ? 1 : 0.2)
        nodeEl.select('.label-text')
          .attr('opacity', n => {
            const isConn = edges.some(e => {
              const sc=e.source?.id??e.source; const tc=e.target?.id??e.target
              return (sc===d.id&&tc===n.id)||(tc===d.id&&sc===n.id)
            })
            return (n.id===d.id||isConn) ? 1 : 0.15
          })
      })
      .on('mousemove', ev => setTooltip(p => p ? {...p, x:ev.clientX, y:ev.clientY} : null))
      .on('mouseout', () => {
        clearTimeout(ttTimer.current)
        setTooltip(null)
        nodeEl.select('.main-circle')
          .attr('filter', n => n.id===selectedFile ? 'url(#sel-glow)' : 'url(#glow-soft)')
          .attr('stroke', n => n.id===selectedFile ? '#fff' : 'rgba(255,255,255,0.15)')
          .attr('stroke-width', n => n.id===selectedFile ? 2.5 : 0.8)
          .attr('opacity', 1)
        edgePath
          .attr('opacity', 0.8)
          .attr('stroke', d => {
            const sc=d.source?.id??d.source; const tc=d.target?.id??d.target
            return (circularSet.has(sc)&&circularSet.has(tc)) ? 'rgba(239,68,68,0.5)' : 'rgba(139,92,246,0.2)'
          })
          .attr('stroke-width', d => Math.min(0.5+(d.weight||1)*0.3, 2))
          .attr('marker-end', d => {
            const sc=d.source?.id??d.source; const tc=d.target?.id??d.target
            return (circularSet.has(sc)&&circularSet.has(tc)) ? 'url(#arr-circ)' : 'url(#arr)'
          })
        nodeEl.select('.label-text').attr('opacity', 1)
      })

    /* ── Node visuals ──────────────────────────────────────────────────── */

    // Pulsing outer corona (for high-degree / selected nodes)
    nodeEl.filter(d => (d.inDegree||0) > 2 || d.id===selectedFile)
      .append('circle').attr('class','corona')
      .attr('r', d => nodeR(d, graphSettings.nodeSizeBy) + 5)
      .attr('fill','none')
      .attr('stroke', d => L(d.language).color)
      .attr('stroke-width', 0.8)
      .attr('stroke-opacity', 0.35)

    // Halo (soft outer glow)
    nodeEl.append('circle').attr('class','halo')
      .attr('r', d => nodeR(d, graphSettings.nodeSizeBy) + 2)
      .attr('fill', d => {
        if (graphSettings.showHeatmap) return d3.interpolateRdYlGn(1-(d.heat||0))
        return L(d.language).glow
      })
      .attr('fill-opacity', 0.18)
      .attr('stroke','none')

    // Main planet circle
    nodeEl.append('circle').attr('class','main-circle')
      .attr('r', d => nodeR(d, graphSettings.nodeSizeBy))
      .attr('fill', d => {
        if (graphSettings.showHeatmap) return d3.interpolateRdYlGn(1-(d.heat||0))
        if (circularSet.has(d.id)) return '#ef4444'
        return `url(#ng-${d.language})`
      })
      .attr('stroke', d => d.id===selectedFile ? '#ffffff' : 'rgba(255,255,255,0.15)')
      .attr('stroke-width', d => d.id===selectedFile ? 2.5 : 0.8)
      .attr('filter', d => d.id===selectedFile ? 'url(#sel-glow)' : 'url(#glow-soft)')

    // Specular highlight (tiny white dot top-left — "shiny planet" effect)
    nodeEl.append('circle').attr('class','specular')
      .attr('r', d => Math.max(nodeR(d, graphSettings.nodeSizeBy)*0.22, 1.2))
      .attr('cx', d => -nodeR(d, graphSettings.nodeSizeBy)*0.28)
      .attr('cy', d => -nodeR(d, graphSettings.nodeSizeBy)*0.28)
      .attr('fill','rgba(255,255,255,0.55)')
      .attr('pointer-events','none')

    // Labels — only for important/large nodes
    if (graphSettings.showLabels) {
      nodeEl.filter(d =>
        nodeR(d, graphSettings.nodeSizeBy) >= 7 ||
        (d.inDegree||0) + (d.outDegree||0) >= 3
      )
      .append('text').attr('class','label-text')
        .attr('dy', d => nodeR(d, graphSettings.nodeSizeBy) + 12)
        .attr('text-anchor','middle')
        .attr('font-size', d => nodeR(d, graphSettings.nodeSizeBy) >= 10 ? 10 : 9)
        .attr('font-family','system-ui, -apple-system, sans-serif')
        .attr('font-weight', 500)
        .attr('fill', d => L(d.language).color)
        .attr('fill-opacity', 0.9)
        .attr('paint-order','stroke')
        .attr('stroke','rgba(5,5,18,0.95)')
        .attr('stroke-width', 3)
        .attr('pointer-events','none')
        .text(d => {
          const name = d.name || d.path.split('/').pop()
          return name.length > 15 ? name.slice(0,13)+'…' : name
        })
    }

    /* ── SIMULATION ────────────────────────────────────────────────────── */
    const sim = d3.forceSimulation(nodes)
      .alphaDecay(0.035)
      .velocityDecay(0.6)
      .force('link', d3.forceLink(edges).id(d=>d.id)
        .distance(d => {
          const degS = (d.source.inDegree||0)+(d.source.outDegree||0)
          const degT = (d.target.inDegree||0)+(d.target.outDegree||0)
          return 55 + Math.min((degS+degT)*3, 90)
        })
        .strength(0.22)
      )
      .force('charge', d3.forceManyBody()
        .strength(d => -100 - Math.min((d.inDegree||0)+(d.outDegree||0), 12)*12)
        .distanceMax(380).distanceMin(8)
      )
      .force('center', d3.forceCenter(W/2, H/2).strength(0.03))
      .force('collision', d3.forceCollide()
        .radius(d => nodeR(d, graphSettings.nodeSizeBy) + 8)
        .strength(0.85).iterations(3)
      )
      .force('bound', () => {
        const p = 50
        nodes.forEach(n => {
          if (n.x < p)   n.vx += (p-n.x)*0.07
          if (n.x > W-p) n.vx += (W-p-n.x)*0.07
          if (n.y < p)   n.vy += (p-n.y)*0.07
          if (n.y > H-p) n.vy += (H-p-n.y)*0.07
        })
      })

    simRef.current = sim

    /* Tick */
    sim.on('tick', () => {
      // Curved edges (quadratic bezier)
      edgePath.attr('d', d => {
        const sx = d.source.x, sy = d.source.y
        const tx = d.target.x, ty = d.target.y
        const dx = tx-sx, dy = ty-sy
        const dist = Math.hypot(dx,dy) || 1
        // perpendicular offset for curve
        const curve = Math.min(dist*0.25, 40)
        const mx = (sx+tx)/2 - dy/dist*curve
        const my = (sy+ty)/2 + dx/dist*curve
        return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`
      })

      nodeEl.attr('transform', d => `translate(${d.x},${d.y})`)

      // Update nebulae
      const groups = {}
      nodes.forEach(n => {
        const key = n.path.split('/')[0] || 'root'
        ;(groups[key] = groups[key] || []).push(n)
      })
      nebulaEls.each(function([key, ns]) {
        const xs = ns.map(n=>n.x), ys = ns.map(n=>n.y)
        const cx = d3.mean(xs), cy = d3.mean(ys)
        const rx = (d3.max(xs)-d3.min(xs))/2 + 30
        const ry = (d3.max(ys)-d3.min(ys))/2 + 30
        d3.select(this)
          .attr('cx', cx).attr('cy', cy)
          .attr('rx', Math.max(rx,25)).attr('ry', Math.max(ry,25))
          .attr('fill-opacity', 0.05)
      })
    })

    /* Auto fit after settle */
    sim.on('end', () => {
      try {
        const b = root.node().getBBox()
        if (!b.width || !b.height) return
        const s = Math.min(0.9, Math.min((W-60)/b.width, (H-60)/b.height))
        const tx = (W-b.width*s)/2 - b.x*s
        const ty = (H-b.height*s)/2 - b.y*s
        d3.select(el).transition().duration(700).ease(d3.easeCubicInOut)
          .call(zoom.transform, d3.zoomIdentity.translate(tx,ty).scale(s))
      } catch(_) {}
    })

    /* ── LEGEND ─────────────────────────────────────────────────────────── */
    const langs = uniqueLangs.filter(l => nodes.some(n=>n.language===l))
    const lW = 124, lH = langs.length * 18 + 22

    const lg = svg.append('g').attr('transform',`translate(${W-lW-12},12)`)
    lg.append('rect').attr('width',lW).attr('height',lH).attr('rx',10)
      .attr('fill','rgba(5,5,18,0.9)').attr('stroke','rgba(255,255,255,0.07)')

    langs.forEach((lang,i) => {
      const { color, glow } = L(lang)
      const row = lg.append('g').attr('transform',`translate(12,${i*18+16})`)

      // Glowing dot
      row.append('circle').attr('r',5).attr('fill',color)
        .attr('filter','url(#glow-soft)')
      // Mini halo
      row.append('circle').attr('r',8).attr('fill',glow).attr('fill-opacity',0.12).attr('stroke','none')
      row.append('text').attr('x',14).attr('y',4)
        .attr('fill','#94a3b8').attr('font-size',10.5)
        .attr('font-family','system-ui,sans-serif').text(lang)
    })

    /* Stats badge */
    const sb = svg.append('g').attr('transform',`translate(12,12)`)
    sb.append('rect').attr('width',130).attr('height',52).attr('rx',10)
      .attr('fill','rgba(5,5,18,0.9)').attr('stroke','rgba(255,255,255,0.07)')
    sb.append('text').attr('x',12).attr('y',18).attr('fill','#a78bfa')
      .attr('font-size',10).attr('font-family','system-ui,sans-serif')
      .attr('font-weight',700).text('DEPENDENCY ATLAS')
    sb.append('text').attr('x',12).attr('y',34).attr('fill','#64748b')
      .attr('font-size',10).attr('font-family','system-ui,sans-serif')
      .text(`${nodes.length} files · ${edges.length} links`)
    sb.append('text').attr('x',12).attr('y',47).attr('fill','#475569')
      .attr('font-size',9).attr('font-family','system-ui,sans-serif')
      .text(langs.length + ' languages')

  }, [graphData, graphSettings, selectedFile, circularSet, setSelectedNode])

  useEffect(() => { render() }, [render])
  useEffect(() => {
    const ob = new ResizeObserver(() => render())
    if (svgRef.current?.parentElement) ob.observe(svgRef.current.parentElement)
    return () => ob.disconnect()
  }, [render])

  const handleBgClick = useCallback(() => {
    if (simRef.current) simRef.current.nodes().forEach(n => { n.fx=null; n.fy=null })
  }, [])

  if (!graphData) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:16,color:'#475569'}}>
      <div style={{fontSize:56,filter:'drop-shadow(0 0 20px rgba(139,92,246,0.6))'}}>✦</div>
      <div style={{fontSize:15,color:'#94a3b8',fontWeight:600}}>Dependency Atlas</div>
      <div style={{fontSize:12,color:'#475569'}}>Enter a GitHub URL above to begin mapping</div>
    </div>
  )

  return (
    <div style={{position:'relative',width:'100%',height:'100%',background:'#05050f',overflow:'hidden'}}>
      {/* Static starfield behind graph */}
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,pointerEvents:'none',opacity:0.6}} />
      <svg
        ref={svgRef}
        style={{position:'absolute',inset:0,display:'block',width:'100%',height:'100%',cursor:'grab'}}
        onClick={handleBgClick}
      />
      <GraphControls svgRef={svgRef} simRef={simRef} zoomRef={zoomRef} />
      {tooltip && <GalaxyTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} circularSet={circularSet} />}
      <div style={{position:'absolute',bottom:8,right:8,fontSize:10,color:'#334155',pointerEvents:'none',userSelect:'none'}}>
        Ctrl+Scroll to zoom · Drag to pin · Click bg to unpin
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 *  BEAUTIFUL TOOLTIP
 * ════════════════════════════════════════════════════════════════════════════ */
function GalaxyTooltip({ node, x, y, circularSet }) {
  if (!node) return null
  const isCirc = circularSet?.has(node.id)
  const { color, glow } = L(node.language)
  const risk = getRisk(node.avgComplexity || 1)
  const fns = [...(node.functions||[])].sort((a,b)=>(b.complexity||1)-(a.complexity||1)).slice(0,5)
  const vpW = window.innerWidth, vpH = window.innerHeight
  const TW=268, TH=260
  const left = x+16+TW>vpW ? x-TW-16 : x+16
  const top  = y+TH>vpH   ? y-TH      : y

  return (
    <div style={{
      position:'fixed', left, top, width:TW,
      background:'rgba(6,6,20,0.96)',
      border:`1px solid ${color}30`,
      borderRadius:14,
      padding:'14px 16px',
      fontSize:12,
      pointerEvents:'none',
      zIndex:9999,
      boxShadow:`0 0 0 1px ${color}18, 0 8px 40px rgba(0,0,0,0.7), 0 0 30px ${glow}18`,
      backdropFilter:'blur(16px)',
    }}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
        <div style={{
          width:32,height:32,borderRadius:8,
          background:`radial-gradient(circle at 35% 30%, ${d3.color(color)?.brighter(1.5)?.toString()||'#fff'}, ${color})`,
          display:'flex',alignItems:'center',justifyContent:'center',
          fontSize:9,fontWeight:800,color:'rgba(0,0,0,0.7)',letterSpacing:0.5,
          boxShadow:`0 0 12px ${glow}80`,
          flexShrink:0,
        }}>
          {L(node.language).emoji}
        </div>
        <div style={{overflow:'hidden'}}>
          <div style={{fontWeight:700,color:'#f1f5f9',fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {node.name || node.path.split('/').pop()}
          </div>
          <div style={{fontSize:10,color:'#475569',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {node.path}
          </div>
        </div>
      </div>

      {/* Tags */}
      <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:10}}>
        <Chip c={color}>{node.language}</Chip>
        <Chip c={risk.color} bg={risk.bg}>⚡ {risk.label} (cc:{node.avgComplexity||1})</Chip>
        {isCirc && <Chip c='#ef4444' bg='rgba(239,68,68,0.1)'>♻ Circular</Chip>}
        {(node.inDegree||0) > 4 && <Chip c='#a78bfa' bg='rgba(167,139,250,0.1)'>⚓ Core</Chip>}
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'6px 8px',marginBottom:10}}>
        <StatBox label="Lines"  value={node.lines||0}           c='#e2e8f0'/>
        <StatBox label="Imports" value={node.importCount||0}    c='#60a5fa'/>
        <StatBox label="Funcs"  value={(node.functions||[]).length} c='#34d399'/>
        <StatBox label="In ↓"   value={node.inDegree||0}        c='#a78bfa'/>
        <StatBox label="Out ↑"  value={node.outDegree||0}       c='#f472b6'/>
        <StatBox label="CC avg" value={node.avgComplexity||1}   c={risk.color}/>
      </div>

      {/* Top functions */}
      {fns.length > 0 && (
        <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:9}}>
          <div style={{fontSize:9,color:'#334155',letterSpacing:'0.09em',textTransform:'uppercase',marginBottom:6}}>
            Hot Functions
          </div>
          {fns.map((fn,i) => {
            const fr = getRisk(fn.complexity||1)
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'2px 0'}}>
                <span style={{color:'#60a5fa',fontSize:9,fontFamily:'monospace',flexShrink:0}}>ƒ</span>
                <span style={{flex:1,color:'#94a3b8',fontSize:10.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{fn.name}</span>
                <div style={{
                  background:fr.bg,color:fr.color,
                  borderRadius:4,padding:'1px 5px',fontSize:9.5,fontWeight:700,flexShrink:0,
                }}>{fn.complexity||1}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Chip({children,c,bg}) {
  return <span style={{
    background:bg||`${c}18`,color:c,
    border:`1px solid ${c}28`,
    borderRadius:999,padding:'2px 8px',fontSize:10,fontWeight:600,
  }}>{children}</span>
}
function StatBox({label,value,c}) {
  return (
    <div style={{background:'rgba(255,255,255,0.03)',borderRadius:6,padding:'5px 7px'}}>
      <div style={{fontSize:9,color:'#334155',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>{label}</div>
      <div style={{fontSize:15,fontWeight:700,color:c,lineHeight:1}}>{value}</div>
    </div>
  )
}
function getRisk(c) {
  if (c<=3)  return {label:'Low',      color:'#34d399',bg:'rgba(52,211,153,0.1)'}
  if (c<=7)  return {label:'Moderate', color:'#fbbf24',bg:'rgba(251,191,36,0.1)'}
  if (c<=15) return {label:'High',     color:'#f97316',bg:'rgba(249,115,22,0.1)'}
  return           {label:'Critical',  color:'#ef4444',bg:'rgba(239,68,68,0.1)'}
}
