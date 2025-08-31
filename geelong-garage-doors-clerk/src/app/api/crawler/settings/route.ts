export const runtime = 'nodejs'
import { NextRequest } from 'next/server'
import { isAdmin } from '@/lib/admin-guard'
import fs from 'fs/promises'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'crawler-settings.json')

// Default settings
const DEFAULT_SETTINGS = {
  downloadAssets: false,
  wait: 3,
  delay: 2,
  maxPages: 0,
  concurrency: 5,
  // Default optimizations - enabled by default
  progressiveCrawling: true,
  stealthMode: true,
  networkCapture: true,
  consoleLogging: true,
  headlessMode: true
}

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(SETTINGS_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Load settings from file
async function loadSettings() {
  try {
    await ensureDataDir()
    const data = await fs.readFile(SETTINGS_FILE, 'utf8')
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

// Save settings to file
async function saveSettings(settings: any) {
  try {
    await ensureDataDir()
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2))
    return true
  } catch (error) {
    console.error('Failed to save settings:', error)
    return false
  }
}

// GET - Load settings
export async function GET(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const settings = await loadSettings()
    
    return Response.json({
      ok: true,
      settings
    })

  } catch (error: any) {
    console.error('Settings GET error:', error)
    return Response.json(
      { ok: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Save settings
export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { settings } = body

    if (!settings) {
      return Response.json({ 
        ok: false, 
        error: 'Missing settings in request body' 
      }, { status: 400 })
    }

    // Validate settings structure
    const validatedSettings = {
      downloadAssets: Boolean(settings.downloadAssets),
      wait: Math.max(0, Math.min(30, Number(settings.wait) || 3)),
      delay: Math.max(0, Math.min(10, Number(settings.delay) || 2)),
      maxPages: Math.max(0, Number(settings.maxPages) || 0),
      concurrency: Math.max(1, Math.min(20, Number(settings.concurrency) || 5)),
      progressiveCrawling: Boolean(settings.progressiveCrawling ?? true),
      stealthMode: Boolean(settings.stealthMode ?? true),
      networkCapture: Boolean(settings.networkCapture ?? true),
      consoleLogging: Boolean(settings.consoleLogging ?? true),
      headlessMode: Boolean(settings.headlessMode ?? true)
    }

    const success = await saveSettings(validatedSettings)
    
    if (!success) {
      return Response.json({
        ok: false,
        error: 'Failed to save settings'
      }, { status: 500 })
    }

    return Response.json({
      ok: true,
      settings: validatedSettings
    })

  } catch (error: any) {
    console.error('Settings POST error:', error)
    return Response.json(
      { ok: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
