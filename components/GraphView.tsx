import { useMemo } from 'react'

type GraphNode = {
  id: string
}

type GraphLink = {
  source: string
  target: string
}

type GraphViewProps = {
  nodes: GraphNode[]
  links: GraphLink[]
}

function GraphView({ nodes, links }: GraphViewProps) {
  const layout = useMemo(() => {
    const width = 960
    const height = 520
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.max(120, Math.min(width, height) / 2 - 80)

    const positionedNodes = nodes.map((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(nodes.length, 1)
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    })

    const nodeById = new Map(positionedNodes.map((node) => [node.id, node]))

    return {
      width,
      height,
      nodes: positionedNodes,
      links: links
        .map((link) => ({
          source: nodeById.get(String(link.source)),
          target: nodeById.get(String(link.target))
        }))
        .filter((link) => link.source && link.target)
    }
  }, [nodes, links])

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="h-[520px] w-full">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
          </marker>
        </defs>

        {layout.links.map((link, index) => {
          if (!link.source || !link.target) {
            return null
          }

          return (
            <line
              key={`${link.source.id}-${link.target.id}-${index}`}
              x1={link.source.x}
              y1={link.source.y}
              x2={link.target.x}
              y2={link.target.y}
              stroke="#cbd5e1"
              strokeWidth={2}
              markerEnd="url(#arrow)"
            />
          )
        })}

        {layout.nodes.map((node) => (
          <g key={node.id}>
            <circle cx={node.x} cy={node.y} r={22} fill="#4f46e5" />
            <text x={node.x} y={node.y + 42} textAnchor="middle" className="fill-slate-700 text-[12px] font-medium">
              {node.id}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export { GraphView }
export type { GraphNode, GraphLink }
