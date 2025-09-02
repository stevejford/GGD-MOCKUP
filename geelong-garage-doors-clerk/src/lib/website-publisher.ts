import fs from 'fs'
import path from 'path'
import { Descendant } from 'slate'

export interface PublishingOptions {
  contentId: number
  title: string
  slug: string
  contentType: 'blog' | 'product' | 'service'
  contentJson: Descendant[]
  contentHtml: string
  metaDescription: string
  metaKeywords: string[]
  featuredImage?: string
  assets: any[]
  publishPath?: string
}

export interface PublishedPage {
  filePath: string
  url: string
  routePath: string
  generatedAt: string
  contentId: number
}

export class WebsitePublisher {
  private appDir: string
  private publicDir: string

  constructor() {
    this.appDir = path.join(process.cwd(), 'src', 'app')
    this.publicDir = path.join(process.cwd(), 'public')
  }

  /**
   * Publish approved content as Next.js pages
   */
  async publishContent(options: PublishingOptions): Promise<PublishedPage> {
    try {
      const routePath = this.generateRoutePath(options.contentType, options.slug)
      const filePath = path.join(this.appDir, routePath, 'page.tsx')
      
      // Ensure directory exists
      const dirPath = path.dirname(filePath)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      // Generate page component
      const pageContent = this.generatePageComponent(options)
      
      // Write page file
      fs.writeFileSync(filePath, pageContent, 'utf-8')

      // Generate metadata file
      const metadataPath = path.join(dirPath, 'metadata.json')
      const metadata = {
        contentId: options.contentId,
        title: options.title,
        slug: options.slug,
        contentType: options.contentType,
        metaDescription: options.metaDescription,
        metaKeywords: options.metaKeywords,
        featuredImage: options.featuredImage,
        publishedAt: new Date().toISOString(),
        routePath
      }
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')

      // Copy assets to public directory
      await this.copyAssets(options.assets, options.slug)

      // Update sitemap (if exists)
      await this.updateSitemap(routePath, options.title, metadata.publishedAt)

      return {
        filePath,
        url: `/${routePath}`,
        routePath,
        generatedAt: new Date().toISOString(),
        contentId: options.contentId
      }
    } catch (error) {
      console.error('Error publishing content:', error)
      throw error
    }
  }

  /**
   * Generate route path based on content type and slug
   */
  private generateRoutePath(contentType: string, slug: string): string {
    switch (contentType) {
      case 'blog':
        return `blog/${slug}`
      case 'product':
        return `products/${slug}`
      case 'service':
        return `services/${slug}`
      default:
        return slug
    }
  }

  /**
   * Generate Next.js page component
   */
  private generatePageComponent(options: PublishingOptions): string {
    const { title, contentHtml, metaDescription, metaKeywords, featuredImage } = options

    return `import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: '${title} | Geelong Garage Doors',
  description: '${metaDescription}',
  keywords: [${metaKeywords.map(k => `'${k}'`).join(', ')}],
  openGraph: {
    title: '${title} | Geelong Garage Doors',
    description: '${metaDescription}',
    type: 'article',${featuredImage ? `\n    images: ['${featuredImage}'],` : ''}
  },
  twitter: {
    card: 'summary_large_image',
    title: '${title} | Geelong Garage Doors',
    description: '${metaDescription}',${featuredImage ? `\n    images: ['${featuredImage}'],` : ''}
  }
}

export default function ${this.toPascalCase(options.slug)}Page() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-deep-blue text-white py-16">
        <div className="max-w-container mx-auto px-container">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              ${title}
            </h1>
            <p className="text-xl text-deep-blue-light leading-relaxed">
              ${metaDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="max-w-container mx-auto px-container">
          <div className="max-w-4xl mx-auto">
            ${featuredImage ? `
            <div className="mb-12">
              <Image
                src="${featuredImage}"
                alt="${title}"
                width={800}
                height={400}
                className="w-full h-auto rounded-lg shadow-lg"
                priority
              />
            </div>` : ''}
            
            <div className="prose prose-lg max-w-none">
              <div 
                className="content-html"
                dangerouslySetInnerHTML={{ __html: \`${contentHtml.replace(/`/g, '\\`')}\` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-vibrant-orange-light py-16">
        <div className="max-w-container mx-auto px-container text-center">
          <h2 className="text-3xl font-bold text-deep-blue mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-charcoal mb-8 max-w-2xl mx-auto">
            Contact Geelong Garage Doors today for expert ${options.contentType} services 
            in Geelong, Bellarine Peninsula, and Surf Coast.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:(03) 5221 9222"
              className="bg-vibrant-orange text-white px-8 py-4 rounded-lg font-semibold hover:bg-vibrant-orange-hover transition-colors"
            >
              📞 Call (03) 5221 9222
            </a>
            <a
              href="/contact"
              className="bg-deep-blue text-white px-8 py-4 rounded-lg font-semibold hover:bg-deep-blue-hover transition-colors"
            >
              💬 Get Free Quote
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}`
  }

  /**
   * Copy assets to public directory
   */
  private async copyAssets(assets: any[], slug: string): Promise<void> {
    if (!assets || assets.length === 0) return

    const assetsDir = path.join(this.publicDir, 'content-assets', slug)
    
    // Ensure assets directory exists
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true })
    }

    for (const asset of assets) {
      try {
        if (asset.local_path && fs.existsSync(asset.local_path)) {
          const filename = path.basename(asset.local_path)
          const destPath = path.join(assetsDir, filename)
          
          // Copy file
          fs.copyFileSync(asset.local_path, destPath)
          
          // Update asset path to public URL
          asset.public_url = `/content-assets/${slug}/${filename}`
        }
      } catch (error) {
        console.error(`Error copying asset ${asset.local_path}:`, error)
      }
    }
  }

  /**
   * Update sitemap with new page
   */
  private async updateSitemap(routePath: string, title: string, publishedAt: string): Promise<void> {
    try {
      const sitemapPath = path.join(this.appDir, 'sitemap.ts')
      
      if (fs.existsSync(sitemapPath)) {
        let sitemapContent = fs.readFileSync(sitemapPath, 'utf-8')
        
        // Add new URL to sitemap
        const newEntry = `
  {
    url: 'https://geelonggaragedoors.com.au/${routePath}',
    lastModified: '${publishedAt}',
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  },`

        // Insert before the closing bracket
        const insertPoint = sitemapContent.lastIndexOf(']')
        if (insertPoint !== -1) {
          sitemapContent = sitemapContent.slice(0, insertPoint) + newEntry + sitemapContent.slice(insertPoint)
          fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8')
        }
      }
    } catch (error) {
      console.error('Error updating sitemap:', error)
    }
  }

  /**
   * Generate blog index page
   */
  async generateBlogIndex(blogPosts: Array<{
    slug: string
    title: string
    metaDescription: string
    featuredImage?: string
    publishedAt: string
    contentType: string
  }>): Promise<void> {
    const blogIndexPath = path.join(this.appDir, 'blog', 'page.tsx')
    
    // Ensure directory exists
    const dirPath = path.dirname(blogIndexPath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    const blogIndexContent = `import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Blog | Geelong Garage Doors - Expert Tips & Industry Insights',
  description: 'Stay informed with expert garage door tips, maintenance guides, and industry insights from Geelong Garage Doors professionals.',
  keywords: ['garage door blog', 'maintenance tips', 'installation guides', 'Geelong', 'garage door advice']
}

const blogPosts = ${JSON.stringify(blogPosts, null, 2)}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-deep-blue text-white py-16">
        <div className="max-w-container mx-auto px-container">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Garage Door Blog
            </h1>
            <p className="text-xl text-deep-blue-light leading-relaxed">
              Expert tips, maintenance guides, and industry insights from Geelong's garage door professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16">
        <div className="max-w-container mx-auto px-container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article key={post.slug} className="bg-white rounded-lg shadow-sm border border-deep-blue-light overflow-hidden hover:shadow-md transition-shadow">
                {post.featuredImage && (
                  <div className="aspect-video relative">
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-deep-blue mb-3 line-clamp-2">
                    <Link href={\`/blog/\${post.slug}\`} className="hover:text-deep-blue-hover">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-charcoal/80 text-sm mb-4 line-clamp-3">
                    {post.metaDescription}
                  </p>
                  <div className="flex justify-between items-center text-sm text-charcoal/60">
                    <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    <Link 
                      href={\`/blog/\${post.slug}\`}
                      className="text-vibrant-orange hover:text-vibrant-orange-hover font-medium"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}`

    fs.writeFileSync(blogIndexPath, blogIndexContent, 'utf-8')
  }

  /**
   * Convert string to PascalCase for component names
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^(.)/, (_, char) => char.toUpperCase())
  }

  /**
   * Unpublish content (remove generated files)
   */
  async unpublishContent(routePath: string): Promise<void> {
    try {
      const filePath = path.join(this.appDir, routePath)
      
      if (fs.existsSync(filePath)) {
        fs.rmSync(filePath, { recursive: true, force: true })
      }

      // Remove from sitemap
      await this.removeFromSitemap(routePath)
    } catch (error) {
      console.error('Error unpublishing content:', error)
      throw error
    }
  }

  /**
   * Remove URL from sitemap
   */
  private async removeFromSitemap(routePath: string): Promise<void> {
    try {
      const sitemapPath = path.join(this.appDir, 'sitemap.ts')
      
      if (fs.existsSync(sitemapPath)) {
        let sitemapContent = fs.readFileSync(sitemapPath, 'utf-8')
        
        // Remove the URL entry
        const urlPattern = new RegExp(`\\s*{[^}]*url: 'https://geelonggaragedoors\\.com\\.au/${routePath}'[^}]*},?`, 'g')
        sitemapContent = sitemapContent.replace(urlPattern, '')
        
        fs.writeFileSync(sitemapPath, sitemapContent, 'utf-8')
      }
    } catch (error) {
      console.error('Error removing from sitemap:', error)
    }
  }
}

export default WebsitePublisher
