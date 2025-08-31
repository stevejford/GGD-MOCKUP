import { NextRequest } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import fs from 'fs/promises'
import path from 'path'
import { isAdmin } from '@/lib/admin-guard'
import { broadcastToClients } from '@/app/api/ws/route'

export const runtime = 'nodejs'

function getPathEnv(name: string, fallbackRel: string) {
  const val = process.env[name]
  const resolved = val && val.trim() ? val : path.resolve(process.cwd(), fallbackRel)
  return resolved
}

export async function GET(_req: NextRequest) {
  try {
    const user = await currentUser()
    const admin = await isAdmin()
    const primary = user?.primaryEmailAddress?.emailAddress || null
    const emails = (user?.emailAddresses || []).map(e => e.emailAddress)

    const mdRoot = getPathEnv('CRAWL_MD_ROOT', '../crawlforai/output_markdown')
    const pyRoot = getPathEnv('CRAWL_PY_ROOT', '../crawlforai')

    const mdExists = await fs
      .access(mdRoot)
      .then(() => true)
      .catch(() => false)
    const pyExists = await fs
      .access(pyRoot)
      .then(() => true)
      .catch(() => false)

    const dbUrl = process.env.CRAWLER_DATABASE_URL || process.env.DATABASE_URL || ''
    const hasDb = !!dbUrl
    const dbMissingPassword = hasDb && /^postgres(ql)?:\/\/.+@/.test(dbUrl) && !/^postgres(ql)?:\/\/[^:]+:/.test(dbUrl)

    const healthData = {
      ok: true,
      loggedIn: !!user,
      isAdmin: admin,
      userId: user?.id || null,
      primaryEmail: primary,
      emails,
      adminEmailsEnv: process.env.ADMIN_EMAILS || '',
      paths: {
        CRAWL_MD_ROOT: { value: mdRoot, exists: mdExists },
        CRAWL_PY_ROOT: { value: pyRoot, exists: pyExists },
      },
      db: {
        hasDb,
        missingPassword: dbMissingPassword,
      },
    }

    // Broadcast health data to WebSocket clients
    broadcastToClients({
      type: 'health_update',
      data: healthData,
      timestamp: new Date().toISOString()
    })

    return Response.json(healthData)
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message || 'health error' }, { status: 500 })
  }
}

