import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Breadcrumb, Container } from '@/components/layout'
import { getCategories, getByCategory } from '@/lib/products-data'

export async function generateStaticParams() {
  return getCategories().map((categorySlug) => ({ categorySlug }))
}

type ProductCategoryPageProps = { params: Promise<{ categorySlug: string }> }

export async function generateMetadata(ctx: ProductCategoryPageProps): Promise<Metadata> {
  const { categorySlug } = await ctx.params
  const title = `${categorySlug} Garage Doors`
  const description = `Explore ${categorySlug} garage doors and options.`
  const ogImage = `/og?title=${encodeURIComponent(title)}`
  return {
    title,
    description,
    openGraph: { title, description, images: [ogImage], url: `/products/${categorySlug}` },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  }
}

export default async function ProductCategoryPage(ctx: ProductCategoryPageProps) {
  const { categorySlug } = await ctx.params
  const products = getByCategory(categorySlug)
  const crumbs = [ { label: 'Home', href: '/' }, { label: 'Products', href: '/products/sectional' }, { label: categorySlug, active: true } ]

  return (
    <main>
      <Breadcrumb items={crumbs} />
      <Container className="py-12 max-w-5xl">
        <h1 className="text-4xl font-bold mb-8 capitalize">{categorySlug} Garage Doors</h1>
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((p) => (
            <Link key={p.slug} href={`/products/${p.category}/${p.slug}`} className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="overflow-hidden">
                <Image
                  src={`https://storage.googleapis.com/uxpilot-auth.appspot.com/${p.hero}`}
                  alt={p.title}
                  width={800}
                  height={400}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-charcoal mb-2">{p.title}</h3>
                <p className="text-charcoal/70 text-sm leading-relaxed">{p.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold text-deep-blue mb-4">Preferred Brands</h2>
          <div className="flex flex-wrap items-center gap-6">
            {[
              { slug: 'b-and-d', name: 'B&D Doors' },
              { slug: 'steel-line', name: 'Steel-Line' },
              { slug: 'eco-garage-doors', name: 'ECO Garage Doors' },
              { slug: '4ddoors', name: '4Ddoors' },
              { slug: 'taurean', name: 'Taurean' },
              { slug: 'centurion', name: 'Centurion' },
            ].map(b => (
              <Link key={b.slug} href={`/brands/${b.slug}`} className="relative w-36 h-12 inline-block">
                <Image src={`/brands/${b.slug}.svg`} alt={`${b.name} logo`} fill className="object-contain" />
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Link href="/brands" className="text-vibrant-orange hover:underline">Explore all brands →</Link>
          </div>
        </div>
      </Container>
    </main>
  )
}
