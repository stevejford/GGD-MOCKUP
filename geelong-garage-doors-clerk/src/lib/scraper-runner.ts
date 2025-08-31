import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'
import fs from 'fs'
import { killProcessTree, isProcessRunning } from './process-cleanup'
import { logCrawlerEvent } from './logfire'

type ScrapeOptions = {
  brand?: string
  maxPages?: number
  downloadAssets?: boolean
  wait?: number
  delay?: number
}

type ScrapeStatus = {
  running: boolean
  pid?: number
  startedAt?: number
  endedAt?: number
  logPath?: string
  lastLogLines: string[]
  error?: string
}

class ScraperRunner {
  private proc: ChildProcessWithoutNullStreams | null = null
  private logs: string[] = []
  private logStream: fs.WriteStream | null = null
  private startedAt?: number
  private endedAt?: number
  private logPath?: string
  private error?: string

  private getCrawlPyRoot() {
    const fromEnv = process.env.CRAWL_PY_ROOT
    if (fromEnv && fromEnv.trim()) return fromEnv
    return path.resolve(process.cwd(), '..', 'crawlforai')
  }

  start(opts: ScrapeOptions = {}) {
    if (this.proc) throw new Error('Scrape already running')
    this.logs = []
    this.error = undefined
    this.startedAt = Date.now()
    this.endedAt = undefined

    // Log crawler start event
    logCrawlerEvent({
      type: 'crawler_start',
      timestamp: new Date().toISOString(),
      url: opts.brand || 'default'
    })
    const cwd = this.getCrawlPyRoot()
    const py = process.env.PYTHON || 'python'
    // Build args for crawl4ai_runner.py with optimized defaults
    const args = [
      'crawl4ai_runner.py',
      '--maxPages=0',
      '--progressive',      // Always use progressive mode
      '--stealth',          // Always use stealth mode
      '--captureNetwork',   // Always capture network data
      '--captureConsole',   // Always capture console logs
      '--headless'          // Always run headless
    ]

    if (opts.brand) args.push(`--brand=${opts.brand}`)
    if (opts.downloadAssets) args.push('--downloadAssets')
    if (opts.wait != null) args.push(`--wait=${opts.wait}`)
    if (opts.delay != null) args.push(`--delay=${opts.delay}`)

    // Prepare logs file
    const logsDir = path.join(cwd, 'logs')
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.logPath = path.join(logsDir, `scrape-${stamp}.log`)
    this.logStream = fs.createWriteStream(this.logPath, { flags: 'a' })

    console.log(`🚀 Starting crawler with command: ${py} ${args.join(' ')}`)
    console.log(`📁 Working directory: ${cwd}`)

    const proc = spawn(py, args, { cwd, env: process.env })
    this.proc = proc

    console.log(`🕷️ Crawler started with PID: ${proc.pid}`)

    const onData = (buf: Buffer) => {
      const s = buf.toString()
      const lines = s.split(/\r?\n/).filter(Boolean)

      // Log interesting activity to console for debugging
      lines.forEach(line => {
        if (line.includes('FETCH') || line.includes('✓') || line.includes('ERROR') ||
            line.includes('asset') || line.includes('Processing') || line.includes('Crawling')) {
          console.log(`🕷️ Crawler: ${line}`)

          // Send structured events to Logfire
          this.parseAndLogEvent(line)
        }
      })

      this.logs.push(...lines)
      if (this.logs.length > 1000) this.logs.splice(0, this.logs.length - 1000) // Keep more logs
      this.logStream?.write(s)
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)

    // Handle process errors (including EPIPE)
    proc.on('error', (e: any) => {
      if (e.code === 'EPIPE') {
        console.log('Crawler process pipe closed (normal when stopping)')
      } else {
        console.error('Crawler process error:', e)
        this.error = e.message
      }
    })

    // Handle process exit
    proc.on('close', (code, signal) => {
      this.endedAt = Date.now()
      this.proc = null
      this.logStream?.end()

      // Log crawler stop event
      // logCrawlerEvent({
      //   type: 'crawler_stop',
      //   timestamp: new Date().toISOString(),
      //   status: signal === 'SIGTERM' ? 'graceful' : signal === 'SIGKILL' ? 'forced' : `code_${code}`
      // })

      if (signal === 'SIGTERM') {
        console.log('Crawler stopped gracefully')
      } else if (signal === 'SIGKILL') {
        console.log('Crawler force stopped')
      } else if (code !== 0) {
        console.log(`Crawler exited with code ${code}`)
      }
    })

    return { pid: proc.pid, logPath: this.logPath }
  }

  async stop() {
    if (!this.proc) return false

    const pid = this.proc.pid
    if (!pid) return false

    try {
      console.log(`Stopping crawler process ${pid}...`)

      // First try graceful shutdown
      this.proc.kill('SIGTERM')

      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Check if process is still running and force kill if needed
      if (await isProcessRunning(pid)) {
        console.log('Graceful shutdown failed, force killing process tree...')
        await killProcessTree(pid)
      }

      // Clean up local state
      this.proc = null
      this.endedAt = Date.now()

      console.log('Crawler process stopped successfully')
      return true
    } catch (error) {
      console.error('Failed to stop crawler:', error)
      // Still clean up local state
      this.proc = null
      this.endedAt = Date.now()
      return false
    }
  }

  // Check if process is actually running and clean up if needed
  async isRunning() {
    if (!this.proc || !this.proc.pid) return false

    const running = await isProcessRunning(this.proc.pid)

    if (!running) {
      // Process doesn't exist, clean up
      this.proc = null
      this.endedAt = Date.now()
    }

    return running
  }

  status(): ScrapeStatus {
    const isRunning = !!this.proc
    const status = {
      running: isRunning,
      pid: this.proc?.pid,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      logPath: this.logPath,
      lastLogLines: this.logs.slice(-100), // Show more recent logs
      error: this.error,
    }

    // Add debug info when running but no recent logs
    if (isRunning && this.logs.length === 0 && this.startedAt) {
      const runningTime = Date.now() - this.startedAt
      if (runningTime > 10000) { // More than 10 seconds with no logs
        console.log(`⚠️ Crawler running for ${Math.round(runningTime/1000)}s but no logs yet. PID: ${this.proc?.pid}`)
      }
    }

    return status
  }

  private parseAndLogEvent(line: string) {
    const timestamp = new Date().toISOString()

    try {
      // Parse different types of crawler events
      if (line.includes('[FETCH]')) {
        const urlMatch = line.match(/https?:\/\/[^\s]+/)
        if (urlMatch) {
          logCrawlerEvent({
            type: 'page_fetch',
            url: urlMatch[0],
            timestamp
          })
        }
      } else if (line.includes('| ✓ | ⏱:')) {
        // Page completion: "url | ✓ | ⏱: 13.29s"
        const urlMatch = line.match(/https?:\/\/[^\s|]+/)
        const timeMatch = line.match(/⏱:\s*([\d.]+)s/)
        const url = urlMatch ? urlMatch[0] : 'unknown'
        const duration = timeMatch ? parseFloat(timeMatch[1]) * 1000 : 0

        logCrawlerEvent({
          type: 'page_complete',
          url,
          duration,
          timestamp
        })
      } else if (line.includes('Using cached asset') || line.includes('Downloading asset')) {
        // Asset processing
        const urlMatch = line.match(/https?:\/\/[^\s]+/)
        const sizeMatch = line.match(/(\d+)\s*bytes?/i)
        const status = line.includes('cached') ? 'cached' : 'downloaded'

        logCrawlerEvent({
          type: 'asset_process',
          url: urlMatch ? urlMatch[0] : 'unknown',
          status,
          size: sizeMatch ? parseInt(sizeMatch[1]) : 0,
          timestamp
        })
      } else if (line.includes('ERROR') || line.includes('FAILED') || line.includes('Exception')) {
        // Error events
        const urlMatch = line.match(/https?:\/\/[^\s]+/)

        logCrawlerEvent({
          type: 'error',
          url: urlMatch ? urlMatch[0] : 'unknown',
          error: line.trim(),
          timestamp
        })
      }
    } catch (error) {
      // Don't let logging errors break the crawler
      console.error('Error parsing crawler event for Logfire:', error)
    }
  }
}

// Singleton in module scope (best effort; suitable for dev/admin usage)
export const scraperRunner = new ScraperRunner()

