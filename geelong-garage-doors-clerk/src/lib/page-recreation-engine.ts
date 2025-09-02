import OpenAIContentEngine from './openai-content-engine'
import ContentRecreator from './content-recreator'
import { Descendant } from 'slate'
import fs from 'fs'
import path from 'path'

export interface PageRecreationOptions {
  brand: string
  file: string
  rewriteMethod: 'light' | 'medium' | 'heavy'
  contentType: 'blog' | 'product' | 'service'
  targetAudience: 'residential' | 'commercial' | 'trade'
  tone: 'professional' | 'friendly' | 'technical'
  includeAssets: boolean
  generateSlug: boolean
}

export interface RecreatedPage {
  title: string
  slug: string
  content_json: Descendant[]
  content_html: string
  content_markdown: string
  meta_description: string
  meta_keywords: string[]
  featured_image?: string
  assets: Array<{
    asset_type: 'image' | 'pdf' | 'document'
    original_url: string
    local_path: string
    alt_text?: string
    caption?: string
    file_size?: number
    mime_type?: string
    width?: number
    height?: number
  }>
  seo_score: number
  reading_time: number
  original_brand: string
  original_url: string
  original_file: string
}

export class PageRecreationEngine {
  private aiEngine: OpenAIContentEngine
  private contentRecreator: ContentRecreator

  constructor() {
    this.aiEngine = new OpenAIContentEngine()
    this.contentRecreator = new ContentRecreator()
  }

  /**
   * Recreate a competitor page with AI-powered rewriting
   */
  async recreatePage(options: PageRecreationOptions): Promise<RecreatedPage> {
    try {
      // 1. Get original page data
      const pageData = await this.contentRecreator.getPageData(options.brand, options.file)
      if (!pageData) {
        throw new Error(`Page not found: ${options.brand}/${options.file}`)
      }

      // 2. Get associated assets
      const assets = options.includeAssets ? await this.getPageAssets(options.brand, options.file) : []

      // 3. Apply rewrite method
      const rewrittenContent = await this.applyRewriteMethod(
        pageData.content,
        options.rewriteMethod,
        options.targetAudience,
        options.tone
      )

      // 4. Convert to different formats
      const contentFormats = await this.convertToFormats(rewrittenContent)

      // 5. Generate SEO metadata
      const seoData = await this.generateSEOMetadata(rewrittenContent, options.contentType)

      // 6. Process assets with brand integration
      const processedAssets = await this.processAssets(assets, options.brand)

      // 7. Generate slug
      const slug = options.generateSlug ? this.generateSlug(seoData.title) : pageData.slug || this.generateSlug(seoData.title)

      return {
        title: seoData.title,
        slug,
        content_json: contentFormats.json,
        content_html: contentFormats.html,
        content_markdown: contentFormats.markdown,
        meta_description: seoData.metaDescription,
        meta_keywords: seoData.keywords,
        featured_image: processedAssets.find(a => a.asset_type === 'image')?.local_path,
        assets: processedAssets,
        seo_score: seoData.score,
        reading_time: this.calculateReadingTime(rewrittenContent),
        original_brand: options.brand,
        original_url: pageData.url || '',
        original_file: options.file
      }
    } catch (error) {
      console.error('Page recreation error:', error)
      throw error
    }
  }

  /**
   * Apply different rewrite methods using AI
   */
  private async applyRewriteMethod(
    content: string,
    method: 'light' | 'medium' | 'heavy',
    audience: string,
    tone: string
  ): Promise<string> {
    const prompts = {
      light: `Lightly rewrite this content for Geelong Garage Doors. Keep the same structure and key information, but:
- Replace competitor branding with "Geelong Garage Doors"
- Update contact info to "(03) 5221 9222"
- Update service areas to "Geelong, Bellarine Peninsula, Surf Coast"
- Keep technical specifications exactly the same
- Maintain the same tone and style
- Make minimal changes to preserve original meaning`,

      medium: `Moderately rewrite this content for Geelong Garage Doors. Improve the content while maintaining core information:
- Replace competitor branding with "Geelong Garage Doors"
- Update contact info to "(03) 5221 9222"
- Update service areas to "Geelong, Bellarine Peninsula, Surf Coast"
- Improve readability and flow
- Enhance value propositions
- Keep technical specifications accurate
- Adjust tone to be ${tone} for ${audience} audience
- Add relevant calls-to-action`,

      heavy: `Completely rewrite this content for Geelong Garage Doors. Create original content inspired by the source:
- Use "Geelong Garage Doors" branding throughout
- Include contact info "(03) 5221 9222"
- Focus on service areas "Geelong, Bellarine Peninsula, Surf Coast"
- Restructure for better user experience
- Write in ${tone} tone for ${audience} audience
- Add compelling value propositions
- Include strong calls-to-action
- Maintain technical accuracy
- Create unique, engaging content that stands out from competitors`
    }

    return await this.aiEngine.rewriteContent(
      content,
      'Geelong Garage Doors',
      method
    )
  }

  /**
   * Convert content to different formats (JSON, HTML, Markdown)
   */
  private async convertToFormats(content: string): Promise<{
    json: Descendant[]
    html: string
    markdown: string
  }> {
    // Convert to Slate JSON format
    const json = this.convertToSlateJSON(content)
    
    // Convert to HTML with brand styling
    const html = this.convertToHTML(content)
    
    // Convert to Markdown
    const markdown = this.convertToMarkdown(content)

    return { json, html, markdown }
  }

  /**
   * Convert text content to Slate JSON format
   */
  private convertToSlateJSON(content: string): Descendant[] {
    const lines = content.split('\n').filter(line => line.trim())
    const nodes: Descendant[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      
      if (trimmed.startsWith('# ')) {
        nodes.push({
          type: 'heading',
          level: 1,
          children: [{ text: trimmed.substring(2) }]
        })
      } else if (trimmed.startsWith('## ')) {
        nodes.push({
          type: 'heading',
          level: 2,
          children: [{ text: trimmed.substring(3) }]
        })
      } else if (trimmed.startsWith('### ')) {
        nodes.push({
          type: 'heading',
          level: 3,
          children: [{ text: trimmed.substring(4) }]
        })
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        nodes.push({
          type: 'list-item',
          children: [{ text: trimmed.substring(2) }]
        })
      } else if (trimmed.startsWith('> ')) {
        nodes.push({
          type: 'quote',
          children: [{ text: trimmed.substring(2) }]
        })
      } else if (trimmed) {
        nodes.push({
          type: 'paragraph',
          children: [{ text: trimmed }]
        })
      }
    }

    return nodes.length > 0 ? nodes : [{ type: 'paragraph', children: [{ text: content }] }]
  }

  /**
   * Convert content to HTML with brand styling
   */
  private convertToHTML(content: string): string {
    let html = content
      .replace(/^# (.+)$/gm, '<h1 class="text-3xl font-bold text-deep-blue mb-6">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-deep-blue mb-4">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-deep-blue mb-3">$1</h3>')
      .replace(/^- (.+)$/gm, '<li class="mb-2 text-charcoal">$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-deep-blue-light pl-6 py-4 my-6 bg-deep-blue-light/30 rounded-r-lg italic text-charcoal">$1</blockquote>')
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-charcoal leading-relaxed">')

    // Wrap in paragraphs
    html = `<div class="content"><p class="mb-4 text-charcoal leading-relaxed">${html}</p></div>`
    
    // Clean up empty paragraphs
    html = html.replace(/<p[^>]*><\/p>/g, '')
    
    return html
  }

  /**
   * Convert content to Markdown
   */
  private convertToMarkdown(content: string): string {
    // Content is likely already in markdown-like format from AI
    return content
  }

  /**
   * Generate SEO metadata using AI
   */
  private async generateSEOMetadata(content: string, contentType: string): Promise<{
    title: string
    metaDescription: string
    keywords: string[]
    score: number
  }> {
    const prompt = `Analyze this content and generate SEO metadata for Geelong Garage Doors:

Content: ${content.substring(0, 2000)}...

Generate:
1. SEO-optimized title (50-60 characters)
2. Meta description (150-160 characters)
3. 5-8 relevant keywords
4. SEO score out of 100

Focus on garage door industry keywords for ${contentType} content in Geelong, Victoria.`

    try {
      const response = await this.aiEngine.generateBlogPost(
        'SEO Metadata Generation',
        [content],
        'commercial',
        'professional'
      )

      return {
        title: response.title,
        metaDescription: response.metaDescription,
        keywords: response.targetKeywords,
        score: response.seoScore
      }
    } catch (error) {
      // Fallback to basic metadata
      const title = content.split('\n')[0]?.replace(/^#+\s*/, '') || 'Garage Door Services'
      return {
        title: `${title} | Geelong Garage Doors`,
        metaDescription: `Professional garage door services in Geelong. Contact (03) 5221 9222 for expert installation, repair, and maintenance.`,
        keywords: ['garage doors', 'Geelong', 'installation', 'repair', 'maintenance'],
        score: 75
      }
    }
  }

  /**
   * Get page assets from the assets JSON file
   */
  private async getPageAssets(brand: string, file: string): Promise<any[]> {
    try {
      const assetsFile = file.replace('.md', '.assets.json')
      const assetsPath = path.join(process.env.CRAWL_MD_ROOT || '', brand, assetsFile)
      
      if (fs.existsSync(assetsPath)) {
        const assetsData = JSON.parse(fs.readFileSync(assetsPath, 'utf-8'))
        return assetsData.assets || []
      }
      
      return []
    } catch (error) {
      console.error('Error loading assets:', error)
      return []
    }
  }

  /**
   * Process assets with brand integration
   */
  private async processAssets(assets: any[], brand: string): Promise<any[]> {
    return assets.map(asset => ({
      asset_type: this.getAssetType(asset.url),
      original_url: asset.url,
      local_path: asset.local_path,
      alt_text: this.generateBrandedAltText(asset.url),
      caption: asset.caption,
      file_size: asset.file_size,
      mime_type: asset.mime_type,
      width: asset.width,
      height: asset.height
    }))
  }

  /**
   * Determine asset type from URL
   */
  private getAssetType(url: string): 'image' | 'pdf' | 'document' {
    const ext = url.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return 'image'
    } else if (ext === 'pdf') {
      return 'pdf'
    } else {
      return 'document'
    }
  }

  /**
   * Generate branded alt text for images
   */
  private generateBrandedAltText(url: string): string {
    const filename = url.split('/').pop()?.split('.')[0] || 'image'
    return `Geelong Garage Doors - ${filename.replace(/[-_]/g, ' ')}`
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Calculate reading time in minutes
   */
  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200
    const wordCount = content.split(/\s+/).length
    return Math.ceil(wordCount / wordsPerMinute)
  }
}

export default PageRecreationEngine
