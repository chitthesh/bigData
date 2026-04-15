import type { NextPage } from 'next'
import Head from 'next/head'
import { useEffect, useState } from 'react'

import { EmptyState } from '../components/EmptyState'
import { GraphLink, GraphNode, GraphView } from '../components/GraphView'
import { SectionHeader } from '../components/SectionHeader'

const GraphPage: NextPage = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])

  async function loadGraph() {
    const response = await fetch('/api/graph')
    if (!response.ok) {
      throw new Error('Failed to load graph')
    }

    const data = await response.json()
    setNodes(Array.isArray(data.nodes) ? data.nodes : [])
    setLinks(Array.isArray(data.links) ? data.links : [])
  }

  useEffect(() => {
    loadGraph().catch((err) => console.error(err))
  }, [])

  return (
    <div className="space-y-6">
      <Head>
        <title>Graph Visualization</title>
      </Head>

      <SectionHeader title="Graph Visualization" description="Explore the entire friendship graph." />

      {nodes.length ? (
        <GraphView nodes={nodes} links={links} />
      ) : (
        <EmptyState title="No graph data" message="Create friendships to see the visualization." />
      )}
    </div>
  )
}

export default GraphPage
