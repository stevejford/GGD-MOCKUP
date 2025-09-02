export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import { Client } from 'pg'
import { Descendant } from 'slate'

interface GeneratedContent {
  id?: number
  title: string
  slug: string
  content_type: 'blog' | 'product' | 'service'
  original_brand?: string
  original_url?: string
  original_file?: string
  rewrite_method: 'light' | 'medium' | 'heavy'
  status: 'draft' | 'pending_approval' | 'approved' | 'published' | 'rejected'
  content_json: Descendant[]
  content_html?: string
  content_markdown?: string
  meta_description?: string
  meta_keywords?: string[]
  featured_image?: string
  assets?: any[]
  internal_links?: any[]
  seo_score?: number
  reading_time?: number
  created_by?: string
}

export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const contentType = searchParams.get('content_type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const conn = process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL
    if (!conn) {
      return Response.json({ ok: false, error: 'Database connection not available' }, { status: 500 })
    }

    const client = new Client({ connectionString: conn })
    await client.connect()

    try {
      switch (action) {
        case 'list':
          let whereClause = 'WHERE 1=1'
          const params: any[] = []
          let paramIndex = 1

          if (status) {
            whereClause += ` AND status = $${paramIndex}`
            params.push(status)
            paramIndex++
          }

          if (contentType) {
            whereClause += ` AND content_type = $${paramIndex}`
            params.push(contentType)
            paramIndex++
          }

          const query = `
            SELECT 
              id, title, slug, content_type, original_brand, original_url,
              rewrite_method, status, meta_description, featured_image,
              seo_score, reading_time, created_by, created_at, updated_at,
              approved_by, approved_at, published_at
            FROM generated_content 
            ${whereClause}
            ORDER BY created_at DESC 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
          `
          params.push(limit, offset)

          const result = await client.query(query, params)
          
          // Get total count
          const countQuery = `SELECT COUNT(*) as total FROM generated_content ${whereClause}`
          const countResult = await client.query(countQuery, params.slice(0, -2))
          const total = parseInt(countResult.rows[0]?.total || '0')

          return Response.json({
            ok: true,
            content: result.rows,
            pagination: {
              total,
              limit,
              offset,
              hasMore: offset + limit < total
            }
          })

        case 'get':
          if (!id) {
            return Response.json({ ok: false, error: 'ID parameter required' }, { status: 400 })
          }

          const getQuery = `
            SELECT gc.*, 
                   COALESCE(
                     json_agg(
                       json_build_object(
                         'id', ca.id,
                         'asset_type', ca.asset_type,
                         'original_url', ca.original_url,
                         'local_path', ca.local_path,
                         'alt_text', ca.alt_text,
                         'caption', ca.caption,
                         'file_size', ca.file_size,
                         'mime_type', ca.mime_type,
                         'width', ca.width,
                         'height', ca.height
                       )
                     ) FILTER (WHERE ca.id IS NOT NULL), '[]'
                   ) as assets_data
            FROM generated_content gc
            LEFT JOIN content_assets ca ON gc.id = ca.content_id
            WHERE gc.id = $1
            GROUP BY gc.id
          `

          const getResult = await client.query(getQuery, [id])
          if (getResult.rows.length === 0) {
            return Response.json({ ok: false, error: 'Content not found' }, { status: 404 })
          }

          const content = getResult.rows[0]
          content.assets = content.assets_data
          delete content.assets_data

          return Response.json({ ok: true, content })

        case 'stats':
          const statsQuery = `
            SELECT 
              status,
              content_type,
              COUNT(*) as count
            FROM generated_content 
            GROUP BY status, content_type
            ORDER BY status, content_type
          `
          const statsResult = await client.query(statsQuery)
          
          const stats = {
            byStatus: {} as Record<string, number>,
            byType: {} as Record<string, number>,
            total: 0
          }

          statsResult.rows.forEach(row => {
            stats.byStatus[row.status] = (stats.byStatus[row.status] || 0) + parseInt(row.count)
            stats.byType[row.content_type] = (stats.byType[row.content_type] || 0) + parseInt(row.count)
            stats.total += parseInt(row.count)
          })

          return Response.json({ ok: true, stats })

        default:
          return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 })
      }
    } finally {
      await client.end()
    }

  } catch (error: any) {
    console.error('Content manager GET error:', error)
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
    const { action, content, assets } = body

    const conn = process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL
    if (!conn) {
      return Response.json({ ok: false, error: 'Database connection not available' }, { status: 500 })
    }

    const client = new Client({ connectionString: conn })
    await client.connect()

    try {
      switch (action) {
        case 'create':
          if (!content) {
            return Response.json({ ok: false, error: 'Content data required' }, { status: 400 })
          }

          const createQuery = `
            INSERT INTO generated_content (
              title, slug, content_type, original_brand, original_url, original_file,
              rewrite_method, status, content_json, content_html, content_markdown,
              meta_description, meta_keywords, featured_image, seo_score, reading_time, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING id
          `

          const createParams = [
            content.title,
            content.slug,
            content.content_type,
            content.original_brand,
            content.original_url,
            content.original_file,
            content.rewrite_method,
            content.status || 'draft',
            JSON.stringify(content.content_json),
            content.content_html,
            content.content_markdown,
            content.meta_description,
            content.meta_keywords,
            content.featured_image,
            content.seo_score || 0,
            content.reading_time || 0,
            content.created_by || 'system'
          ]

          const createResult = await client.query(createQuery, createParams)
          const contentId = createResult.rows[0].id

          // Insert assets if provided
          if (assets && assets.length > 0) {
            for (const asset of assets) {
              const assetQuery = `
                INSERT INTO content_assets (
                  content_id, asset_type, original_url, local_path, alt_text, caption,
                  file_size, mime_type, width, height
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              `
              await client.query(assetQuery, [
                contentId,
                asset.asset_type,
                asset.original_url,
                asset.local_path,
                asset.alt_text,
                asset.caption,
                asset.file_size,
                asset.mime_type,
                asset.width,
                asset.height
              ])
            }
          }

          return Response.json({ ok: true, contentId })

        case 'update':
          const { id, updates } = body
          if (!id || !updates) {
            return Response.json({ ok: false, error: 'ID and updates required' }, { status: 400 })
          }

          const updateFields = []
          const updateParams = []
          let paramIndex = 1

          // Build dynamic update query
          Object.entries(updates).forEach(([key, value]) => {
            if (key === 'content_json') {
              updateFields.push(`${key} = $${paramIndex}`)
              updateParams.push(JSON.stringify(value))
            } else if (key === 'meta_keywords') {
              updateFields.push(`${key} = $${paramIndex}`)
              updateParams.push(value)
            } else {
              updateFields.push(`${key} = $${paramIndex}`)
              updateParams.push(value)
            }
            paramIndex++
          })

          updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
          updateParams.push(id)

          const updateQuery = `
            UPDATE generated_content 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING id
          `

          const updateResult = await client.query(updateQuery, updateParams)
          if (updateResult.rows.length === 0) {
            return Response.json({ ok: false, error: 'Content not found' }, { status: 404 })
          }

          return Response.json({ ok: true, contentId: id })

        case 'delete':
          const { id: deleteId } = body
          if (!deleteId) {
            return Response.json({ ok: false, error: 'ID required' }, { status: 400 })
          }

          const deleteQuery = 'DELETE FROM generated_content WHERE id = $1 RETURNING id'
          const deleteResult = await client.query(deleteQuery, [deleteId])
          
          if (deleteResult.rows.length === 0) {
            return Response.json({ ok: false, error: 'Content not found' }, { status: 404 })
          }

          return Response.json({ ok: true, deleted: true })

        case 'change-status':
          const { id: statusId, status: newStatus, approvedBy } = body
          if (!statusId || !newStatus) {
            return Response.json({ ok: false, error: 'ID and status required' }, { status: 400 })
          }

          const statusQuery = `
            UPDATE generated_content 
            SET status = $1, 
                approved_by = $2,
                approved_at = CASE WHEN $1 = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END,
                published_at = CASE WHEN $1 = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING id, status
          `

          const statusResult = await client.query(statusQuery, [newStatus, approvedBy, statusId])
          if (statusResult.rows.length === 0) {
            return Response.json({ ok: false, error: 'Content not found' }, { status: 404 })
          }

          return Response.json({ ok: true, status: newStatus })

        default:
          return Response.json({ ok: false, error: 'Invalid action' }, { status: 400 })
      }
    } finally {
      await client.end()
    }

  } catch (error: any) {
    console.error('Content manager POST error:', error)
    return Response.json(
      { ok: false, error: error?.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
