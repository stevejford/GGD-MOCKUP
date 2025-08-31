import Link from 'next/link'
import Image from 'next/image'
import { Container, Breadcrumb } from '@/components/layout'
import { Button, Card } from '@/components/ui'
import { ServiceSchema, BreadcrumbSchema } from '@/components/seo/JsonLd'

export const metadata = {
  title: 'Solutions for Architects',
  description: 'Technical expertise, CAD resources, and manufacturing to deliver design intent.',
  openGraph: { title: 'Solutions for Architects', description: 'Technical expertise, CAD resources, and manufacturing to deliver design intent.', images: ['/api/og?title=Architects'], url: '/solutions/for-architects' },
  twitter: { card: 'summary_large_image', title: 'Solutions for Architects', description: 'Technical expertise, CAD resources, and manufacturing to deliver design intent.', images: ['/api/og?title=Architects'] },
}

export default function ForArchitects() {
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: 'Solutions', href: '/solutions/for-volume-builders' },
    { label: 'Architects', active: true },
  ]

  return (
    <main>
      <Breadcrumb items={crumbs} />

      {/* Hero */}
      <section className="relative h-[600px] overflow-hidden">
        <Image className="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/334eb1f302-dbcb90c0cb2168d2ad77.png" alt="Architectural projects" fill priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-4xl px-8">
            <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">Specification Support for Architectural Excellence</h1>
            <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">Technical expertise, CAD resources, and manufacturing capabilities to deliver your design intent.</p>
            <Link href="/technical-resources"><Button variant="primary" className="px-8 py-4 text-lg">Technical Resources</Button></Link>
          </div>
        </div>
      </section>

      {/* Materials & Finishes */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-blue mb-4">Premium Materials &amp; Finishes</h2>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">Curated selection of durable, beautiful finishes for architectural compatibility.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Premium Steel', img: '359cd43b99-1ca529552df0f59f007f.png', desc: 'Durable steel with superior insulation and powder-coat finishes.' },
              { title: 'Natural Cedar', img: 'e8f95f7467-9e7d5725cd3e18281a77.png', desc: 'Sustainably sourced cedar that ages beautifully.' },
              { title: 'Marine Grade Aluminum', img: '4dc992fa7d-3fc05692af26164f6fca.png', desc: 'Corrosion-resistant aluminum for coastal environments.' },
              { title: 'Composite Blend', img: '94a69aa65d-94c078adfef0de359ccc.png', desc: 'Wood aesthetics with enhanced durability and minimal maintenance.' },
            ].map((m) => (
              <Card key={m.title} className="overflow-hidden group cursor-pointer border border-gray-200">
                <Image className="w-full h-48 object-cover" src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${m.img}`} alt={m.title} width={800} height={400} />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-charcoal mb-3">{m.title}</h3>
                  <p className="text-charcoal/70 text-sm leading-relaxed">{m.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20 bg-deep-blue text-center">
        <Container>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to Collaborate?</h2>
          <p className="text-xl text-deep-blue-light mb-8 max-w-2xl mx-auto">Let’s align specifications and manufacturing to deliver exceptional outcomes.</p>
          <Link href="/contact"><Button variant="primary" className="px-12 py-4 text-xl">Book a Consultation</Button></Link>
        </Container>
      </section>

      <ServiceSchema serviceName="Architect Garage Door Solutions" description="Specification support, product data, and integration for architectural garage door designs." />
      <BreadcrumbSchema items={crumbs.map(c => ({ name: c.label, url: c.href }))} />
    </main>
  )
}

