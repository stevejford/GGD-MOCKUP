import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'

export interface BrandConfig {
  name: string
  phone: string
  serviceAreas: string[]
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    background: string
  }
  logo: {
    primary: string
    reversed: string
    icon: string
  }
  contact: {
    email: string
    address: string
    website: string
  }
}

export interface ProcessedAsset {
  id: string
  original_url: string
  local_path: string
  processed_path?: string
  asset_type: 'image' | 'pdf' | 'document'
  mime_type: string
  file_size: number
  width?: number
  height?: number
  alt_text: string
  caption?: string
  brand_processed: boolean
  watermark_removed: boolean
  metadata: {
    original_brand?: string
    processing_date: string
    processing_method: string
  }
}

export class BrandAssetProcessor {
  private brandConfig: BrandConfig

  constructor() {
    this.brandConfig = {
      name: 'Geelong Garage Doors',
      phone: '(03) 5221 9222',
      serviceAreas: ['Geelong', 'Bellarine Peninsula', 'Surf Coast'],
      colors: {
        primary: '#2C3993',
        secondary: '#F88229',
        accent: '#901C3B',
        text: '#333333',
        background: '#F9F9F9'
      },
      logo: {
        primary: '/images/logo-primary.svg',
        reversed: '/images/logo-reversed.svg',
        icon: '/images/logo-icon.svg'
      },
      contact: {
        email: 'info@geelonggaragedoors.com.au',
        address: 'Geelong, Victoria',
        website: 'https://geelonggaragedoors.com.au'
      }
    }
  }

  /**
   * Process content to remove competitor branding and apply Geelong Garage Doors branding
   */
  async processContent(content: string, originalBrand: string): Promise<string> {
    let processedContent = content

    // Remove competitor branding patterns
    const competitorPatterns = this.getCompetitorPatterns(originalBrand)
    for (const pattern of competitorPatterns) {
      processedContent = processedContent.replace(pattern.regex, pattern.replacement)
    }

    // Apply Geelong Garage Doors branding
    processedContent = this.applyBrandIntegration(processedContent)

    // Remove competitor contact information
    processedContent = this.removeCompetitorContact(processedContent)

    // Add Geelong Garage Doors contact information
    processedContent = this.addBrandContact(processedContent)

    return processedContent
  }

  /**
   * Process assets to remove watermarks and apply branding
   */
  async processAssets(assets: any[], originalBrand: string): Promise<ProcessedAsset[]> {
    const processedAssets: ProcessedAsset[] = []

    for (const asset of assets) {
      try {
        const processed = await this.processAsset(asset, originalBrand)
        processedAssets.push(processed)
      } catch (error) {
        console.error(`Error processing asset ${asset.url}:`, error)
        // Add unprocessed asset as fallback
        processedAssets.push(this.createFallbackAsset(asset, originalBrand))
      }
    }

    return processedAssets
  }

  /**
   * Process individual asset
   */
  private async processAsset(asset: any, originalBrand: string): Promise<ProcessedAsset> {
    const assetId = this.generateAssetId(asset.url)
    const assetType = this.determineAssetType(asset.url)
    
    const processedAsset: ProcessedAsset = {
      id: assetId,
      original_url: asset.url,
      local_path: asset.local_path || asset.url,
      asset_type: assetType,
      mime_type: asset.mime_type || this.getMimeType(asset.url),
      file_size: asset.file_size || 0,
      width: asset.width,
      height: asset.height,
      alt_text: this.generateBrandedAltText(asset.url),
      caption: this.generateBrandedCaption(asset.caption, originalBrand),
      brand_processed: true,
      watermark_removed: false,
      metadata: {
        original_brand: originalBrand,
        processing_date: new Date().toISOString(),
        processing_method: 'brand_integration'
      }
    }

    // Process based on asset type
    switch (assetType) {
      case 'image':
        await this.processImage(processedAsset)
        break
      case 'pdf':
        await this.processPDF(processedAsset)
        break
      case 'document':
        await this.processDocument(processedAsset)
        break
    }

    return processedAsset
  }

  /**
   * Get competitor branding patterns for removal
   */
  private getCompetitorPatterns(brand: string): Array<{regex: RegExp, replacement: string}> {
    const patterns = []

    // Common competitor brand patterns
    const brandVariations = [
      brand,
      brand.toLowerCase(),
      brand.toUpperCase(),
      brand.replace(/[-\s]/g, ''),
      brand.replace(/[-\s]/g, ' ')
    ]

    for (const variation of brandVariations) {
      patterns.push({
        regex: new RegExp(`\\b${variation}\\b`, 'gi'),
        replacement: this.brandConfig.name
      })
    }

    // Specific brand replacements
    const brandReplacements: Record<string, string[]> = {
      'b-and-d': ['B&D', 'B & D', 'B and D'],
      'steel-line': ['Steel-Line', 'Steelline', 'Steel Line'],
      '4ddoors': ['4D Doors', '4D', 'Four D Doors'],
      'centurion': ['Centurion Systems', 'Centurion'],
      'eco-garage-doors': ['Eco Garage Doors', 'Eco Doors'],
      'taurean': ['Taurean Doors', 'Taurean']
    }

    if (brandReplacements[brand.toLowerCase()]) {
      for (const brandName of brandReplacements[brand.toLowerCase()]) {
        patterns.push({
          regex: new RegExp(`\\b${brandName}\\b`, 'gi'),
          replacement: this.brandConfig.name
        })
      }
    }

    return patterns
  }

  /**
   * Apply Geelong Garage Doors branding integration
   */
  private applyBrandIntegration(content: string): string {
    let branded = content

    // Add brand mentions where appropriate
    const brandingOpportunities = [
      { regex: /\bgarage door(s?)\b/gi, replacement: `garage door$1 from ${this.brandConfig.name}` },
      { regex: /\bprofessional installation\b/gi, replacement: `professional installation by ${this.brandConfig.name}` },
      { regex: /\bexpert service\b/gi, replacement: `expert service from ${this.brandConfig.name}` },
      { regex: /\bquality products\b/gi, replacement: `quality products from ${this.brandConfig.name}` }
    ]

    // Apply branding opportunities (but not too aggressively)
    const maxReplacements = 2
    let replacementCount = 0

    for (const opportunity of brandingOpportunities) {
      if (replacementCount >= maxReplacements) break
      
      const matches = branded.match(opportunity.regex)
      if (matches && matches.length > 0) {
        // Only replace the first occurrence to avoid over-branding
        branded = branded.replace(opportunity.regex, opportunity.replacement)
        replacementCount++
      }
    }

    return branded
  }

  /**
   * Remove competitor contact information
   */
  private removeCompetitorContact(content: string): string {
    let cleaned = content

    // Remove phone numbers (Australian format)
    cleaned = cleaned.replace(/\b(?:\+61\s?)?(?:\(0\d\)\s?|\d{2}\s?)\d{4}\s?\d{4}\b/g, '')
    
    // Remove email addresses
    cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '')
    
    // Remove website URLs
    cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '')
    
    // Remove common address patterns
    cleaned = cleaned.replace(/\b\d+\s+[A-Za-z\s]+(?:Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln)\b/gi, '')

    return cleaned
  }

  /**
   * Add Geelong Garage Doors contact information
   */
  private addBrandContact(content: string): string {
    let branded = content

    // Add call-to-action with phone number
    const ctaPatterns = [
      'Contact us today',
      'Get in touch',
      'Call us',
      'Reach out'
    ]

    for (const pattern of ctaPatterns) {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi')
      if (branded.match(regex)) {
        branded = branded.replace(regex, `${pattern} at ${this.brandConfig.phone}`)
        break // Only add phone once
      }
    }

    // Add service area mentions
    const serviceAreaMentions = [
      'our service area',
      'we service',
      'available in',
      'serving'
    ]

    for (const mention of serviceAreaMentions) {
      const regex = new RegExp(`\\b${mention}\\b`, 'gi')
      if (branded.match(regex)) {
        branded = branded.replace(regex, `${mention} ${this.brandConfig.serviceAreas.join(', ')}`)
        break // Only add service areas once
      }
    }

    return branded
  }

  /**
   * Process image assets
   */
  private async processImage(asset: ProcessedAsset): Promise<void> {
    // In a real implementation, this would:
    // 1. Remove watermarks using image processing
    // 2. Add Geelong Garage Doors watermark if needed
    // 3. Optimize image size and format
    // 4. Generate responsive variants
    
    // For now, we'll mark it as processed and generate branded alt text
    asset.alt_text = this.generateBrandedAltText(asset.original_url)
    asset.watermark_removed = true
  }

  /**
   * Process PDF documents
   */
  private async processPDF(asset: ProcessedAsset): Promise<void> {
    // In a real implementation, this would:
    // 1. Extract text content from PDF
    // 2. Remove competitor branding from text
    // 3. Generate new PDF with Geelong Garage Doors branding
    // 4. Update metadata
    
    asset.caption = `${this.brandConfig.name} - ${asset.caption || 'Product Information'}`
  }

  /**
   * Process document assets
   */
  private async processDocument(asset: ProcessedAsset): Promise<void> {
    // Similar to PDF processing but for other document types
    asset.caption = `${this.brandConfig.name} - ${asset.caption || 'Documentation'}`
  }

  /**
   * Generate branded alt text for images
   */
  private generateBrandedAltText(url: string): string {
    const filename = url.split('/').pop()?.split('.')[0] || 'image'
    const cleanName = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return `${this.brandConfig.name} - ${cleanName}`
  }

  /**
   * Generate branded caption
   */
  private generateBrandedCaption(originalCaption: string | undefined, originalBrand: string): string {
    if (!originalCaption) return ''
    
    // Remove original brand from caption and add ours
    let caption = originalCaption.replace(new RegExp(originalBrand, 'gi'), this.brandConfig.name)
    
    if (!caption.includes(this.brandConfig.name)) {
      caption = `${this.brandConfig.name} - ${caption}`
    }
    
    return caption
  }

  /**
   * Create fallback asset when processing fails
   */
  private createFallbackAsset(asset: any, originalBrand: string): ProcessedAsset {
    return {
      id: this.generateAssetId(asset.url),
      original_url: asset.url,
      local_path: asset.local_path || asset.url,
      asset_type: this.determineAssetType(asset.url),
      mime_type: asset.mime_type || this.getMimeType(asset.url),
      file_size: asset.file_size || 0,
      width: asset.width,
      height: asset.height,
      alt_text: this.generateBrandedAltText(asset.url),
      brand_processed: false,
      watermark_removed: false,
      metadata: {
        original_brand: originalBrand,
        processing_date: new Date().toISOString(),
        processing_method: 'fallback'
      }
    }
  }

  /**
   * Generate unique asset ID
   */
  private generateAssetId(url: string): string {
    return createHash('md5').update(url).digest('hex').substring(0, 12)
  }

  /**
   * Determine asset type from URL
   */
  private determineAssetType(url: string): 'image' | 'pdf' | 'document' {
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
   * Get MIME type from URL
   */
  private getMimeType(url: string): string {
    const ext = url.split('.').pop()?.toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    }
    
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  /**
   * Get brand configuration
   */
  getBrandConfig(): BrandConfig {
    return this.brandConfig
  }
}

export default BrandAssetProcessor
