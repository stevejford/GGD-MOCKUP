import OpenAI from 'openai'
import { Client } from 'pg'

export interface ContentAnalysis {
  topics: string[]
  keyPoints: string[]
  tone: string
  targetAudience: string
  contentGaps: string[]
  recommendations: string[]
}

export interface BlogPostGeneration {
  title: string
  metaDescription: string
  content: string
  tags: string[]
  targetKeywords: string[]
  readingTime: number
  seoScore: number
}

export interface SemanticSearchResult {
  id: number
  brand: string
  file: string
  content: string
  similarity: number
  url: string
  chunk_index: number
}

export interface ContentStrategy {
  suggestedTopics: Array<{
    topic: string
    priority: 'high' | 'medium' | 'low'
    reasoning: string
    competitorCoverage: string[]
    estimatedTraffic: string
  }>
  contentGaps: string[]
  competitiveAdvantages: string[]
  recommendedContentTypes: string[]
}

export class OpenAIContentEngine {
  private openai: OpenAI
  private dbConnection: string

  constructor(apiKey?: string, dbConnection?: string) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    })
    this.dbConnection = dbConnection || process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL || ''
  }

  /**
   * Generate embeddings for text using OpenAI
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limit input length
      })
      
      return response.data[0].embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      throw error
    }
  }

  /**
   * Perform semantic search across all embeddings
   */
  async semanticSearch(query: string, limit: number = 10, brand?: string): Promise<SemanticSearchResult[]> {
    if (!this.dbConnection) {
      throw new Error('Database connection not available')
    }

    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.generateEmbedding(query)
      
      const client = new Client({ connectionString: this.dbConnection })
      await client.connect()

      // Use cosine similarity for semantic search
      const brandFilter = brand ? 'AND brand = $2' : ''
      const params = brand ? [JSON.stringify(queryEmbedding), brand, limit] : [JSON.stringify(queryEmbedding), limit]
      const paramIndex = brand ? '$3' : '$2'

      const searchQuery = `
        SELECT 
          id, brand, file, content, url, chunk_index,
          1 - (embedding <=> $1::vector) as similarity
        FROM crawl_embeddings_vec 
        WHERE 1=1 ${brandFilter}
        ORDER BY embedding <=> $1::vector
        LIMIT ${paramIndex}
      `

      const result = await client.query(searchQuery, params)
      await client.end()

      return result.rows.map(row => ({
        id: row.id,
        brand: row.brand,
        file: row.file,
        content: row.content,
        similarity: parseFloat(row.similarity),
        url: row.url,
        chunk_index: row.chunk_index
      }))
    } catch (error) {
      console.error('Error performing semantic search:', error)
      throw error
    }
  }

  /**
   * Analyze competitor content using AI
   */
  async analyzeCompetitorContent(contents: string[]): Promise<ContentAnalysis> {
    try {
      const combinedContent = contents.join('\n\n---\n\n').substring(0, 15000)
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a content strategist analyzing garage door industry competitor content. 
            Analyze the provided content and identify key topics, messaging strategies, content gaps, and opportunities.
            Focus on garage doors, installation, maintenance, commercial/residential applications, and related services.`
          },
          {
            role: 'user',
            content: `Analyze this competitor content and provide insights:\n\n${combinedContent}`
          }
        ],
        functions: [
          {
            name: 'analyze_content',
            description: 'Analyze competitor content for strategic insights',
            parameters: {
              type: 'object',
              properties: {
                topics: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Main topics covered in the content'
                },
                keyPoints: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Key points and value propositions'
                },
                tone: {
                  type: 'string',
                  description: 'Overall tone and style of the content'
                },
                targetAudience: {
                  type: 'string',
                  description: 'Primary target audience'
                },
                contentGaps: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Missing topics or content opportunities'
                },
                recommendations: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Strategic recommendations for improvement'
                }
              },
              required: ['topics', 'keyPoints', 'tone', 'targetAudience', 'contentGaps', 'recommendations']
            }
          }
        ],
        function_call: { name: 'analyze_content' }
      })

      const functionCall = response.choices[0].message.function_call
      if (functionCall && functionCall.arguments) {
        return JSON.parse(functionCall.arguments) as ContentAnalysis
      }

      throw new Error('Failed to analyze content')
    } catch (error) {
      console.error('Error analyzing competitor content:', error)
      throw error
    }
  }

  /**
   * Generate intelligent blog post using AI
   */
  async generateBlogPost(
    topic: string, 
    competitorInsights: string[], 
    targetAudience: 'residential' | 'commercial' | 'trade' = 'residential',
    tone: 'professional' | 'friendly' | 'technical' = 'professional'
  ): Promise<BlogPostGeneration> {
    try {
      const context = competitorInsights.join('\n\n').substring(0, 10000)
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional content writer for Geelong Garage Doors, a premium B2B garage door supplier in Geelong, Victoria, Australia.
            
            Brand Guidelines:
            - Phone: (03) 5221 9222
            - Service Areas: Geelong, Bellarine Peninsula, Surf Coast
            - Target: Architects, Builders, Trade Professionals, Commercial Property Managers
            - Tone: ${tone}, authoritative, solution-focused
            - Focus: Premium quality, trade excellence, professional service
            
            Create original, high-quality content that provides genuine value while positioning Geelong Garage Doors as the premium choice for trade professionals.`
          },
          {
            role: 'user',
            content: `Create a comprehensive blog post about "${topic}" for ${targetAudience} audience.
            
            Use these competitor insights for reference (but create original content):
            ${context}
            
            Requirements:
            - 1500-2000 words
            - SEO optimized with natural keyword integration
            - Include practical tips and actionable advice
            - Add relevant calls-to-action for Geelong Garage Doors
            - Structure with clear headings and subheadings
            - Include meta description and tags`
          }
        ],
        functions: [
          {
            name: 'generate_blog_post',
            description: 'Generate a complete blog post with metadata',
            parameters: {
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  description: 'SEO-optimized blog post title'
                },
                metaDescription: {
                  type: 'string',
                  description: 'Meta description (150-160 characters)'
                },
                content: {
                  type: 'string',
                  description: 'Full blog post content in markdown format'
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Relevant tags for the post'
                },
                targetKeywords: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Primary keywords targeted in the post'
                },
                readingTime: {
                  type: 'number',
                  description: 'Estimated reading time in minutes'
                },
                seoScore: {
                  type: 'number',
                  description: 'Estimated SEO score out of 100'
                }
              },
              required: ['title', 'metaDescription', 'content', 'tags', 'targetKeywords', 'readingTime', 'seoScore']
            }
          }
        ],
        function_call: { name: 'generate_blog_post' }
      })

      const functionCall = response.choices[0].message.function_call
      if (functionCall && functionCall.arguments) {
        return JSON.parse(functionCall.arguments) as BlogPostGeneration
      }

      throw new Error('Failed to generate blog post')
    } catch (error) {
      console.error('Error generating blog post:', error)
      throw error
    }
  }

  /**
   * Rewrite content intelligently using AI
   */
  async rewriteContent(
    originalContent: string,
    targetBrand: string = 'Geelong Garage Doors',
    style: 'maintain' | 'improve' | 'professional' | 'friendly' = 'improve'
  ): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a professional copywriter specializing in the garage door industry. 
            Rewrite content to be original while maintaining the core information and structure.
            
            Guidelines:
            - Replace competitor branding with "${targetBrand}"
            - Maintain technical accuracy
            - Improve readability and flow
            - Add value where possible
            - Keep the same content structure
            - Ensure originality while preserving key information`
          },
          {
            role: 'user',
            content: `Rewrite this content with style "${style}":\n\n${originalContent.substring(0, 8000)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      return response.choices[0].message.content || originalContent
    } catch (error) {
      console.error('Error rewriting content:', error)
      return originalContent
    }
  }

  /**
   * Generate content strategy based on competitor analysis
   */
  async generateContentStrategy(competitorData: Array<{brand: string, topics: string[], contentCount: number}>): Promise<ContentStrategy> {
    try {
      const competitorSummary = competitorData.map(d => 
        `${d.brand}: ${d.contentCount} pieces covering ${d.topics.join(', ')}`
      ).join('\n')

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a content strategist for Geelong Garage Doors, analyzing the garage door industry landscape.
            Create a comprehensive content strategy that identifies opportunities and competitive advantages.`
          },
          {
            role: 'user',
            content: `Based on this competitor analysis, create a content strategy:\n\n${competitorSummary}`
          }
        ],
        functions: [
          {
            name: 'create_content_strategy',
            description: 'Generate a comprehensive content strategy',
            parameters: {
              type: 'object',
              properties: {
                suggestedTopics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      topic: { type: 'string' },
                      priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                      reasoning: { type: 'string' },
                      competitorCoverage: { type: 'array', items: { type: 'string' } },
                      estimatedTraffic: { type: 'string' }
                    }
                  }
                },
                contentGaps: {
                  type: 'array',
                  items: { type: 'string' }
                },
                competitiveAdvantages: {
                  type: 'array',
                  items: { type: 'string' }
                },
                recommendedContentTypes: {
                  type: 'array',
                  items: { type: 'string' }
                }
              },
              required: ['suggestedTopics', 'contentGaps', 'competitiveAdvantages', 'recommendedContentTypes']
            }
          }
        ],
        function_call: { name: 'create_content_strategy' }
      })

      const functionCall = response.choices[0].message.function_call
      if (functionCall && functionCall.arguments) {
        return JSON.parse(functionCall.arguments) as ContentStrategy
      }

      throw new Error('Failed to generate content strategy')
    } catch (error) {
      console.error('Error generating content strategy:', error)
      throw error
    }
  }
}

export default OpenAIContentEngine
