export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import ContentRecreator from '@/lib/content-recreator'
import OpenAIContentEngine from '@/lib/openai-content-engine'
import PageRecreationEngine from '@/lib/page-recreation-engine'

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const brand = searchParams.get('brand')
    const file = searchParams.get('file')
    const query = searchParams.get('query')
    const excludeBrand = searchParams.get('excludeBrand')
    const limit = parseInt(searchParams.get('limit') || '5')

    const recreator = new ContentRecreator()
    const aiEngine = new OpenAIContentEngine()
    const recreationEngine = new PageRecreationEngine()

    switch (action) {
      case 'brands':
        const brands = await recreator.getBrands()
        return Response.json({ ok: true, brands })

      case 'files':
        if (!brand) {
          return Response.json({ ok: false, error: 'Brand parameter required' }, { status: 400 })
        }
        const files = await recreator.getBrandFiles(brand)
        return Response.json({ ok: true, files })

      case 'page-data':
        if (!brand || !file) {
          return Response.json({ ok: false, error: 'Brand and file parameters required' }, { status: 400 })
        }
        const pageData = await recreator.getPageRecreationData(brand, file)
        if (!pageData) {
          return Response.json({ ok: false, error: 'Page data not found' }, { status: 404 })
        }
        return Response.json({ ok: true, data: pageData })

      case 'similar-content':
        if (!query) {
          return Response.json({ ok: false, error: 'Query parameter required' }, { status: 400 })
        }
        const similarContent = await recreator.findSimilarContent(query, excludeBrand || undefined, limit)
        return Response.json({ ok: true, content: similarContent })

      case 'semantic-search':
        if (!query) {
          return Response.json({ ok: false, error: 'Query parameter required' }, { status: 400 })
        }
        try {
          const semanticResults = await aiEngine.semanticSearch(query, limit, excludeBrand || undefined)
          return Response.json({ ok: true, results: semanticResults })
        } catch (error: any) {
          return Response.json({ ok: false, error: error.message }, { status: 500 })
        }

      case 'reword-suggestions':
        const content = searchParams.get('content')
        if (!content) {
          return Response.json({ ok: false, error: 'Content parameter required' }, { status: 400 })
        }
        const suggestions = recreator.generateRewordingSuggestions(content)
        return Response.json({ ok: true, suggestions })

      case 'ai-rewrite':
        const rewriteContent = searchParams.get('content')
        const style = searchParams.get('style') as 'maintain' | 'improve' | 'professional' | 'friendly' || 'improve'
        if (!rewriteContent) {
          return Response.json({ ok: false, error: 'Content parameter required' }, { status: 400 })
        }
        try {
          const rewrittenContent = await aiEngine.rewriteContent(rewriteContent, 'Geelong Garage Doors', style)
          return Response.json({ ok: true, rewrittenContent })
        } catch (error: any) {
          return Response.json({ ok: false, error: error.message }, { status: 500 })
        }

      default:
        return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Content recreator API error:', error)
    return Response.json(
      { ok: false, error: error?.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { action, brand, file, content, targetBrand, topic, audience, tone, competitorInsights } = body

    const recreator = new ContentRecreator()
    const aiEngine = new OpenAIContentEngine()
    const recreationEngine = new PageRecreationEngine()

    switch (action) {
      case 'create-reworded-page':
        if (!brand || !file || !content || !targetBrand) {
          return Response.json({ 
            ok: false, 
            error: 'Brand, file, content, and targetBrand parameters required' 
          }, { status: 400 })
        }

        // Get original page data
        const originalData = await recreator.getPageRecreationData(brand, file)
        if (!originalData) {
          return Response.json({ ok: false, error: 'Original page data not found' }, { status: 404 })
        }

        // Generate reworded suggestions
        const suggestions = recreator.generateRewordingSuggestions(content)
        
        // Create new page structure
        const rewordedPage = {
          originalBrand: brand,
          originalFile: file,
          originalUrl: originalData.url,
          targetBrand,
          rewordedContent: suggestions[0] || content, // Use first suggestion or original
          allSuggestions: suggestions,
          assets: originalData.assets,
          localAssetPaths: originalData.localAssetPaths,
          embeddings: originalData.embeddings,
          metadata: {
            title: originalData.title?.replace(new RegExp(brand, 'gi'), targetBrand),
            description: originalData.description?.replace(new RegExp(brand, 'gi'), targetBrand),
            h1: originalData.h1?.replace(new RegExp(brand, 'gi'), targetBrand)
          }
        }

        return Response.json({ ok: true, rewordedPage })

      case 'analyze-content-gaps':
        if (!targetBrand) {
          return Response.json({ ok: false, error: 'targetBrand parameter required' }, { status: 400 })
        }

        // Analyze what content types are missing for target brand
        const allBrands = await recreator.getBrands()
        const contentAnalysis = []

        for (const competitorBrand of allBrands) {
          if (competitorBrand === targetBrand) continue
          
          const files = await recreator.getBrandFiles(competitorBrand)
          for (const file of files.slice(0, 5)) { // Limit for demo
            const pageData = await recreator.getPageRecreationData(competitorBrand, file)
            if (pageData) {
              contentAnalysis.push({
                brand: competitorBrand,
                file,
                title: pageData.title,
                url: pageData.url,
                contentLength: pageData.markdownContent.length,
                assetCount: pageData.assets.image_urls.length,
                embeddingCount: pageData.embeddings.length
              })
            }
          }
        }

        return Response.json({ ok: true, analysis: contentAnalysis })

      case 'generate-blog-post':
        if (!topic) {
          return Response.json({ ok: false, error: 'topic parameter required' }, { status: 400 })
        }
        try {
          const blogPost = await aiEngine.generateBlogPost(
            topic,
            competitorInsights || [],
            audience || 'residential',
            tone || 'professional'
          )
          return Response.json({ ok: true, blogPost })
        } catch (error: any) {
          return Response.json({ ok: false, error: error.message }, { status: 500 })
        }

      case 'analyze-competitor-content':
        if (!competitorInsights || !Array.isArray(competitorInsights)) {
          return Response.json({ ok: false, error: 'competitorInsights array required' }, { status: 400 })
        }
        try {
          const analysis = await aiEngine.analyzeCompetitorContent(competitorInsights)
          return Response.json({ ok: true, analysis })
        } catch (error: any) {
          return Response.json({ ok: false, error: error.message }, { status: 500 })
        }

      case 'generate-content-strategy':
        const { competitorData } = body
        if (!competitorData || !Array.isArray(competitorData)) {
          return Response.json({ ok: false, error: 'competitorData array required' }, { status: 400 })
        }
        try {
          const strategy = await aiEngine.generateContentStrategy(competitorData)
          return Response.json({ ok: true, strategy })
        } catch (error: any) {
          return Response.json({ ok: false, error: error.message }, { status: 500 })
        }

      case 'ai-rewrite-content':
        if (!content) {
          return Response.json({ ok: false, error: 'content parameter required' }, { status: 400 })
        }
        try {
          const rewrittenContent = await aiEngine.rewriteContent(
            content,
            targetBrand || 'Geelong Garage Doors',
            body.style || 'improve'
          )
          return Response.json({ ok: true, rewrittenContent })
        } catch (error: any) {
          return Response.json({ ok: false, error: error.message }, { status: 500 })
        }

      case 'recreate-page':
        const { brand: recreateBrand, file: recreateFile, options } = body
        if (!recreateBrand || !recreateFile || !options) {
          return Response.json({ ok: false, error: 'brand, file, and options parameters required' }, { status: 400 })
        }
        try {
          const recreatedPage = await recreationEngine.recreatePage({
            brand: recreateBrand,
            file: recreateFile,
            rewriteMethod: options.rewriteMethod || 'medium',
            contentType: options.contentType || 'blog',
            targetAudience: options.targetAudience || 'residential',
            tone: options.tone || 'professional',
            includeAssets: options.includeAssets !== false,
            generateSlug: true
          })
          return Response.json({ ok: true, recreatedPage })
        } catch (error: any) {
          return Response.json({ ok: false, error: error.message }, { status: 500 })
        }

      default:
        return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Content recreator POST API error:', error)
    return Response.json(
      { ok: false, error: error?.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
