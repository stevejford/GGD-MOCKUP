import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/layout'
import { brandsData } from '@/lib/brands-data'

export const metadata: Metadata = {
  title: 'Brands | Geelong Garage Doors',
  description: 'Explore our preferred garage door brands for commercial, industrial and architectural projects across Victoria.',
  alternates: { canonical: '/brands' },
  openGraph: { title: 'Brands', description: 'Our preferred brands', url: '/brands', images: ['/og?title=Brands'] },
}

export default function BrandsPage() {
  return (
    <main className="bg-gray-50">
      <section className="py-14 bg-white">
        <Container>
          <h1 className="text-4xl font-bold text-deep-blue mb-4">Brands</h1>
          <p className="text-charcoal max-w-3xl">We partner with trusted Australian and international brands to deliver reliable, compliant and good‑looking outcomes on site. Select a brand to learn more.</p>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandsData.map(b => (
              <Link key={b.slug} href={`/brands/${b.slug}`} className="block bg-white rounded-lg border border-deep-blue-light p-6 hover:shadow-md transition-shadow">
                <div className="mb-3 w-full h-16 relative">
                  <Image src={`/brands/${b.slug}.svg`} alt={`${b.name} logo`} fill className="object-contain" />
                </div>
                <h2 className="text-xl font-semibold text-deep-blue mb-2">{b.name}</h2>
                <p className="text-sm text-charcoal mb-3">{b.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {b.productTypes.map(pt => (
                    <span key={pt} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-charcoal">{pt}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </main>
  )
}
