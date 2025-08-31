import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/layout'
import { Button, Card } from '@/components/ui'
import { OrganizationSchema } from '@/components/seo/JsonLd'

export const revalidate = 3600

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="relative h-[600px] overflow-hidden">
        <Image className="w-full h-full object-cover" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/3998becd13-a73dfabd59d7cb3838a8.png" alt="modern architectural home with integrated garage door" fill priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-4xl px-8">
            <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 leading-tight">Premium Garage Door Solutions Engineered for Trade Excellence</h1>
            <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">Delivering architectural excellence and technical precision for Australia&apos;s leading builders, architects, and trade professionals.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" aria-label="Request a quote"><Button variant="primary" className="px-8 py-4 text-lg">Request a Quote</Button></Link>
              <Link href="/our-work" aria-label="View our work"><Button variant="outlineLight" className="px-8 py-4 text-lg">View Our Work</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Trust */}
      <section className="bg-white py-12">
        <Container className="text-center">
          <p className="text-charcoal/70 text-sm mb-8 font-medium">TRUSTED PARTNER OF LEADING BRANDS</p>
          <div className="flex items-center justify-center gap-12 opacity-60 flex-wrap">
            {['B&D','Steel-Line','Gliderol','Danmar','Centurion','ATA'].map((b) => (
              <div key={b} className="text-2xl font-bold text-charcoal">{b}</div>
            ))}
          </div>
        </Container>
      </section>

      {/* Solutions for Professionals */}
      <section className="py-20 bg-[#F9F9F9]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-blue mb-4">Solutions for Professionals</h2>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">Tailored solutions designed for the unique requirements of trade professionals across the construction industry.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card padding="lg" className="text-center">
              <div className="mb-6">
                <Image className="w-full h-48 object-cover rounded-lg" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/c261880436-b20c515ee1a62d79c829.png" alt="volume builder" width={800} height={400} />
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-4">For Volume Builders</h3>
              <p className="text-charcoal mb-6 leading-relaxed">Streamlined processes, standardized specifications, and reliable delivery schedules to keep projects on track and on budget.</p>
              <Link href="/solutions/for-volume-builders"><Button variant="primary">Explore Solutions →</Button></Link>
            </Card>
            <Card padding="lg" className="text-center">
              <div className="mb-6">
                <Image className="w-full h-48 object-cover rounded-lg" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/b98e07230b-846c39ce3c1ae14bee2c.png" alt="architect" width={800} height={400} />
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-4">For Architects</h3>
              <p className="text-charcoal mb-6 leading-relaxed">Technical expertise, CAD resources, and custom manufacturing to bring architectural vision to life.</p>
              <Link href="/technical-resources"><Button variant="primary">Technical Resources →</Button></Link>
            </Card>
            <Card padding="lg" className="text-center">
              <div className="mb-6">
                <Image className="w-full h-48 object-cover rounded-lg" src="https://storage.googleapis.com/uxpilot-auth.appspot.com/f57575aaa3-bf34b08c95d88be9384c.png" alt="custom builder" width={800} height={400} />
              </div>
              <h3 className="text-2xl font-bold text-deep-blue mb-4">For Custom Builders</h3>
              <p className="text-charcoal mb-6 leading-relaxed">Bespoke solutions and collaborative partnerships to create distinctive architectural statements.</p>
              <Link href="/solutions/for-custom-home-builders"><Button variant="primary">Custom Solutions →</Button></Link>
            </Card>
          </div>
        </Container>
      </section>

      {/* Featured Products & Capabilities */}
      <section className="py-20 bg-white">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-blue mb-4">Featured Products & Capabilities</h2>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">Comprehensive solutions covering manufacturing, installation, and maintenance.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: 'Custom Manufacturing', img: 'f7acc3e657-246e46ee8841bafe9ea7.png', desc: 'Bespoke solutions engineered to your exact specifications with precision manufacturing capabilities.' },
              { title: 'Architectural Doors', img: '180c8a9bbe-37df39fffbb4f89c6e6e.png', desc: 'Premium residential solutions that integrate with contemporary designs.' },
              { title: 'Industrial Solutions', img: '76ede3eb5e-da70045a6d29da75472e.png', desc: 'Heavy-duty commercial and industrial doors built for demanding environments.' },
              { title: 'Smart Systems Integration', img: '4b7908a9c1-b11bff6ab45004578e4c.png', desc: 'Advanced automation and smart technology integration.' },
            ].map((item) => (
              <div key={item.title} className="group cursor-pointer">
                <div className="mb-6 overflow-hidden rounded-lg">
                  <Image className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${item.img}`} alt={item.title} width={800} height={400} />
                </div>
                <h3 className="text-xl font-bold text-charcoal mb-3">{item.title}</h3>
                <p className="text-charcoal/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Our Work */}
      <section className="py-20 bg-[#F9F9F9]">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-deep-blue mb-4">Our Work</h2>
            <p className="text-xl text-charcoal/80 max-w-3xl mx-auto">Showcasing excellence across residential, commercial, and industrial applications.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Luxury Residential Project', img: '5aceb97141-96d91fd9aca6a261508a.png', desc: "Custom architectural doors for premium residential development in Melbourne&apos;s east." },
              { title: 'Commercial Complex', img: 'dde1771d61-887a6a8c843554f9d7a7.png', desc: 'Large-scale commercial installation in Geelong CBD.' },
              { title: 'Industrial Facility', img: '4cf3a800b9-ab23de311e4281e780dc.png', desc: 'Heavy-duty doors for a manufacturing facility expansion.' },
            ].map((item) => (
              <Card key={item.title} className="overflow-hidden group cursor-pointer">
                <div className="overflow-hidden"><Image className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300" src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${item.img}`} alt={item.title} width={800} height={512} /></div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-charcoal mb-3">{item.title}</h3>
                  <p className="text-charcoal/70 mb-4">{item.desc}</p>
                  <span className="text-vibrant-orange font-medium">View Case Study →</span>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* Testimonial */}
      <section className="py-20 bg-deep-blue text-center">
        <Container>
          <blockquote className="text-3xl md:text-4xl text-white font-medium mb-8 leading-relaxed max-w-4xl mx-auto">&ldquo;Geelong Garage Doors consistently delivers exceptional quality and service. Their technical expertise and attention to detail have made them our preferred partner for premium residential projects.&rdquo;</blockquote>
          <div className="text-white">
            <p className="text-xl font-semibold mb-2">Sarah Mitchell</p>
            <p className="text-deep-blue-light">Principal Architect, Mitchell &amp; Associates</p>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white text-center">
        <Container>
          <h2 className="text-4xl md:text-5xl font-bold text-deep-blue mb-6">Ready to Elevate Your Next Project?</h2>
          <p className="text-xl text-charcoal/80 mb-8 max-w-2xl mx-auto">Partner with us to deliver exceptional garage door solutions that exceed your clients&apos; expectations and enhance your professional reputation.</p>
          <Link href="/contact"><Button variant="primary" className="px-12 py-4 text-xl">Get Your Quote Today</Button></Link>
        </Container>
      </section>

      <OrganizationSchema />
    </main>
  )
}
