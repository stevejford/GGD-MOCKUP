import Link from 'next/link'
import Image from 'next/image'
import { Breadcrumb, Container } from '@/components/layout'
import { Card } from '@/components/ui'
import { caseStudies } from '@/lib/case-studies-data'

export const revalidate = 3600

export default function OurWork() {
  const crumbs = [ { label: 'Home', href: '/' }, { label: 'Our Work', active: true } ]

  return (
    <main>
      <Breadcrumb items={crumbs} />
      <Container className="py-12 max-w-6xl">
        <h1 className="text-4xl font-bold mb-10">Our Work</h1>
        <div className="grid md:grid-cols-3 gap-8">
          {caseStudies.map((c) => (
            <Card key={c.slug} className="overflow-hidden group cursor-pointer">
              <div className="overflow-hidden"><Image className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${c.image}`} alt={c.title} width={800} height={512} /></div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-charcoal mb-2">{c.title}</h3>
                <p className="text-charcoal/70 text-sm mb-4">{c.summary}</p>
                <Link className="text-vibrant-orange font-medium" href={`/our-work/${c.slug}`}>View Case Study →</Link>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  )
}

