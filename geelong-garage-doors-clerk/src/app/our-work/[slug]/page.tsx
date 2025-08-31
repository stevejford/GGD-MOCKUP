import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Breadcrumb, Container } from '@/components/layout'
import { getCaseStudy, caseStudies } from '@/lib/case-studies-data'

export async function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }))
}

type CaseStudyPageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata(ctx: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await ctx.params
  const cs = getCaseStudy(slug)
  if (!cs) return { title: 'Case study not found' }
  const title = `${cs.title} | Our Work`
  const description = cs.summary
  const ogImage = `/og?title=${encodeURIComponent(cs.title)}`
  return {
    title,
    description,
    openGraph: { title, description, images: [ogImage], url: `/our-work/${cs.slug}` },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  }
}

export default async function CaseStudy(ctx: CaseStudyPageProps) {
  const { slug } = await ctx.params
  const cs = getCaseStudy(slug)
  if (!cs) notFound()

  const crumbs = [ { label: 'Home', href: '/' }, { label: 'Our Work', href: '/our-work' }, { label: cs.title, active: true } ]

  return (
    <main>
      <Breadcrumb items={crumbs} />
      <Container className="py-12 max-w-4xl">
        <div className="overflow-hidden rounded-lg mb-8">
          <Image className="w-full h-96 object-cover" src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${cs.image}`} alt={cs.title} width={1200} height={600} />
        </div>
        <h1 className="text-4xl font-bold text-charcoal mb-4">{cs.title}</h1>
        <p className="text-charcoal/80 leading-relaxed">{cs.summary}</p>
        {cs.body && <div className="text-charcoal/80 leading-relaxed mt-6">{cs.body}</div>}
      </Container>
    </main>
  )
}
