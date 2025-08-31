'use client'

import { useState, useMemo } from 'react'
import { Container, Breadcrumb } from '@/components/layout'
import { Card } from '@/components/ui'

const docs = [
  { title: 'Sectional Door Specification', tags: ['sectional', 'spec'], type: 'PDF' },
  { title: 'Roller Door Installation Guide', tags: ['roller', 'install'], type: 'PDF' },
  { title: 'Automation Motor Selection', tags: ['automation', 'motors'], type: 'PDF' },
  { title: 'Architect Detail - Cedar Finish', tags: ['architect', 'cedar'], type: 'DWG' },
]

export default function TechnicalResources() {
  const [query, setQuery] = useState('')
  const crumbs = [ { label: 'Home', href: '/' }, { label: 'Technical Resources', active: true } ]
  const filtered = useMemo(() => docs.filter(d => (query || '').toLowerCase().split(/\s+/).every(q => d.title.toLowerCase().includes(q) || d.tags.some(t => t.includes(q)))), [query])

  return (
    <main>
      <Breadcrumb items={crumbs} />
      <Container className="py-12 max-w-6xl">
        <h1 className="text-4xl font-bold mb-4">Technical Resources</h1>
        <div className="mb-8">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search documents..." className="border rounded px-4 py-3 w-full max-w-xl" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((d) => (
            <Card key={d.title} className="p-6">
              <div className="text-sm text-charcoal/60 mb-2">{d.type}</div>
              <h3 className="text-lg font-semibold text-charcoal mb-2">{d.title}</h3>
              <div className="text-sm text-charcoal/70">Tags: {d.tags.join(', ')}</div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  )
}

