import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useRepoStore } from '../../store/repoStore'
import GraphControls from './GraphControls'
import NodeTooltip from './NodeTooltip'

const LANG_COLORS = {
  javascript: '#f7df1e',
  typescript: '#3178c6',
  python: '#3572a5',
  java: '#b07219',
  ruby: '#cc342d',
  go: '#00add8',
  rust: '#dea584',
  html: '#e34c26',
  css: '#563d7c',
  json: '#888888',
  markdown: '#aaaaaa',
  unknown: '#666666',
}

export default function DependencyGraph() {
  const svgRef = useRef(null)
  const simRef = useRef(null)
  const { graphData, selectedFile, setSelectedNode, graphSettings, circularData } = useRepoStore()
  const [tooltip, setTooltip] = useState(null)

  const circularFileSet = new Set(
    (circularData?.affectedFiles || [])
  )

  const renderGraph = useCallback(() => {
    if (!graphData || !svgRef.current) return

    const { nodes: rawNodes, edges: rawEdges } = graphData
    if (!rawNodes || !rawNodes.length) return

    // Apply language filter
    const filteredNodes = graphSettings.filterLanguage === 'all'
      ? rawNodes
      : rawNodes.filter((n) => n.language === graphSettings.filterLanguage)

    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id))
    const filteredEdges = rawEdges.filter(
      (e) => filteredNodeIds.has(e.source) || filteredNodeIds.has(e.target)
    )

    // Clone for D3 mutation
    const nodes = filteredNodes.map((n) => ({ ...n }))
    const edges = filteredEdges.map((e) => ({ ...e }))

    const svgEl = svgRef.current
    const width = svgEl.clientWidth || 900
    const height = svgEl.clientHeight || 650

    // Clear previous render
    d3.select(svgEl).selectAll('*').remove()

    const svg = d3.select(svgEl)
      .attr('width', width)
      .attr('height', height)

    // Defs for arrow markers
    const defs = svg.append('defs')
    defs.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 14)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', 'rgba(139,92,246,0.6)')

    defs.append('marker')
      .attr('id', 'arrow-circular')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 14)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', '#ef4444')

    const zoom = d3.zoom()
      .scaleExtent([0.05, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    const container = svg.append('g').attr('class', 'graph-container')

    // Size by setting
    const nodeSizeScale = (node) => {
      const base = 5
      if (graphSettings.nodeSizeBy === 'complexity') {
        return base + Math.min((node.avgComplexity || 1) * 1.5, 20)
      }
      if (graphSettings.nodeSizeBy === 'connections') {
        return base + Math.min(((node.inDegree || 0) + (node.outDegree || 0)) * 1.5, 20)
      }
      if (graphSettings.nodeSizeBy === 'lines') {
        return base + Math.min((node.lines || 0) / 40, 20)
      }
      return base + 5
    }

    // Color by heat or language
    const nodeColor = (node) => {
      if (graphSettings.showHeatmap) {
        const heat = node.heat || 0
        return d3.interpolateRdYlGn(1 - heat)
      }
      if (circularFileSet.has(node.id)) return '#ef4444'
      return LANG_COLORS[node.language] || '#888'
    }

    // Simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id((d) => d.id)
        .distance(80)
        .strength(0.3)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => nodeSizeScale(d) + 4))

    simRef.current = simulation

    // Cluster hulls
    if (graphSettings.showClusters && graphData.clusters) {
      const clusterGroups = {}
      for (const node of nodes) {
        const cluster = node.path.split('/')[0] || 'root'
        if (!clusterGroups[cluster]) clusterGroups[cluster] = []
        clusterGroups[cluster].push(node)
      }

      const hullGroup = container.append('g').attr('class', 'hulls')
      const hullPaths = hullGroup.selectAll('path')
        .data(Object.entries(clusterGroups).filter(([, ns]) => ns.length > 2))
        .enter().append('path')
        .attr('fill', (d, i) => d3.schemeTableau10[i % 10])
        .attr('fill-opacity', 0.04)
        .attr('stroke', (d, i) => d3.schemeTableau10[i % 10])
        .attr('stroke-opacity', 0.15)
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 4')

      simulation.on('tick.hulls', () => {
        hullPaths.each(function ([, ns]) {
          const points = ns.map((n) => [n.x, n.y])
          if (points.length < 3) return
          try {
            const hull = d3.polygonHull(points)
            if (hull) {
              d3.select(this).attr(
                'd',
                `M${hull.map((p) => p.join(',')).join('L')}Z`
              )
            }
          } catch (_) {}
        })
      })
    }

    // Links
    const link = container.append('g').attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter().append('line')
      .attr('class', (d) => {
        const isCirc = circularFileSet.has(d.source?.id || d.source) &&
          circularFileSet.has(d.target?.id || d.target)
        return `graph-link ${isCirc ? 'circular' : ''}`
      })
      .attr('stroke', (d) => {
        const isCirc = circularFileSet.has(d.source?.id || d.source) &&
          circularFileSet.has(d.target?.id || d.target)
        return isCirc ? '#ef4444' : 'rgba(139,92,246,0.4)'
      })
      .attr('stroke-width', 1)
      .attr('marker-end', (d) => {
        const isCirc = circularFileSet.has(d.source?.id || d.source)
        return isCirc ? 'url(#arrow-circular)' : 'url(#arrow)'
      })

    // Nodes
    const nodeGroup = container.append('g').attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter().append('g')
      .attr('class', (d) => `graph-node ${selectedFile === d.id ? 'selected' : ''}`)
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x; d.fy = d.y
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null; d.fy = null
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        setSelectedNode(d.id)
      })
      .on('mouseover', (event, d) => {
        setTooltip({ node: d, x: event.clientX, y: event.clientY })
      })
      .on('mousemove', (event) => {
        setTooltip((prev) => prev ? { ...prev, x: event.clientX, y: event.clientY } : null)
      })
      .on('mouseout', () => setTooltip(null))

    nodeGroup.append('circle')
      .attr('r', (d) => nodeSizeScale(d))
      .attr('fill', (d) => nodeColor(d))
      .attr('stroke', (d) => selectedFile === d.id ? '#fff' : 'rgba(255,255,255,0.15)')
      .attr('stroke-width', (d) => selectedFile === d.id ? 2 : 0.5)

    // Labels
    if (graphSettings.showLabels) {
      nodeGroup.append('text')
        .attr('class', 'node-label')
        .attr('dy', (d) => nodeSizeScale(d) + 11)
        .attr('text-anchor', 'middle')
        .text((d) => d.name.length > 18 ? d.name.slice(0, 16) + '…' : d.name)
        .style('display', (d) => nodeSizeScale(d) >= 7 ? 'block' : 'none')
    }

    // Tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y)

      nodeGroup.attr('transform', (d) => `translate(${d.x},${d.y})`)
    })

    // Legend
    const legendData = Object.entries(LANG_COLORS).filter(([lang]) =>
      nodes.some((n) => n.language === lang)
    ).slice(0, 8)

    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 130}, 16)`)

    legend.append('rect')
      .attr('x', -8).attr('y', -8)
      .attr('width', 120).attr('height', legendData.length * 18 + 16)
      .attr('rx', 6)
      .attr('fill', 'rgba(10,10,30,0.85)')
      .attr('stroke', 'rgba(255,255,255,0.08)')

    legendData.forEach(([lang, color], i) => {
      const g = legend.append('g').attr('transform', `translate(0, ${i * 18})`)
      g.append('circle').attr('cx', 7).attr('cy', 7).attr('r', 5).attr('fill', color)
      g.append('text')
        .attr('x', 16).attr('y', 11)
        .attr('fill', '#94a3b8')
        .attr('font-size', 11)
        .text(lang)
    })

    // Zoom to fit
    setTimeout(() => {
      const bounds = container.node().getBBox()
      if (bounds.width && bounds.height) {
        const scale = Math.min(
          0.8,
          Math.min(width / (bounds.width + 60), height / (bounds.height + 60))
        )
        const tx = (width - bounds.width * scale) / 2 - bounds.x * scale
        const ty = (height - bounds.height * scale) / 2 - bounds.y * scale
        svg.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale))
      }
    }, 800)
  }, [graphData, graphSettings, selectedFile, circularFileSet, setSelectedNode])

  useEffect(() => {
    renderGraph()
  }, [renderGraph])

  // Handle resize
  useEffect(() => {
    const observer = new ResizeObserver(() => renderGraph())
    if (svgRef.current) observer.observe(svgRef.current.parentElement)
    return () => observer.disconnect()
  }, [renderGraph])

  if (!graphData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-dim)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔭</div>
          <div>Dependency Atlas will appear here</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        className="graph-svg"
        style={{ cursor: 'grab', display: 'block' }}
      />
      <GraphControls svgRef={svgRef} simRef={simRef} />
      {tooltip && <NodeTooltip node={tooltip.node} x={tooltip.x} y={tooltip.y} circularFileSet={circularFileSet} />}
    </div>
  )
}
