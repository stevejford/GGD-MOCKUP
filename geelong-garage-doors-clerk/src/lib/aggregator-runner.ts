import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import path from 'path'
import fs from 'fs'

type AggOptions = {
  brand?: string
  prune?: number
  minWords?: number
  bm25?: string
  bm25Threshold?: number
}

type AggStatus = {
  running: boolean
  pid?: number
  startedAt?: number
  endedAt?: number
  logPath?: string
  lastLogLines: string[]
  error?: string
}

class AggregatorRunner {
  private proc: ChildProcessWithoutNullStreams | null = null
  private logs: string[] = []
  private logStream: fs.WriteStream | null = null
  private startedAt?: number
  private endedAt?: number
  private logPath?: string
  private error?: string

  private getRoot() {
    const fromEnv = process.env.CRAWL_PY_ROOT
    if (fromEnv && fromEnv.trim()) return fromEnv
    return path.resolve(process.cwd(), '..', 'crawlforai')
  }

  start(opts: AggOptions = {}) {
    if (this.proc) throw new Error('Aggregation already running')
    this.logs = []
    this.error = undefined
    this.startedAt = Date.now()
    this.endedAt = undefined
    const cwd = this.getRoot()
    const py = process.env.PYTHON || 'python'
    const args = ['aggregate_markdown.py']
    if (opts.brand) args.push('--brand', opts.brand)
    if (typeof opts.prune === 'number') args.push('--prune', String(opts.prune))
    if (typeof opts.minWords === 'number') args.push('--minWords', String(opts.minWords))
    if (opts.bm25) args.push('--bm25', opts.bm25)
    if (typeof opts.bm25Threshold === 'number') args.push('--bm25Threshold', String(opts.bm25Threshold))

    const logsDir = path.join(cwd, 'logs')
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    this.logPath = path.join(logsDir, `aggregate-${stamp}.log`)
    this.logStream = fs.createWriteStream(this.logPath, { flags: 'a' })

    const proc = spawn(py, args, { cwd, env: process.env })
    this.proc = proc
    const onData = (buf: Buffer) => {
      const s = buf.toString()
      this.logs.push(...s.split(/\r?\n/).filter(Boolean))
      if (this.logs.length > 500) this.logs.splice(0, this.logs.length - 500)
      this.logStream?.write(s)
    }
    proc.stdout.on('data', onData)
    proc.stderr.on('data', onData)
    proc.on('error', (e) => { this.error = e.message })
    proc.on('close', () => { this.endedAt = Date.now(); this.proc = null; this.logStream?.end() })

    return { pid: proc.pid, logPath: this.logPath }
  }

  stop() {
    if (!this.proc) return false
    try { this.proc.kill('SIGTERM'); return true } catch { return false }
  }

  status(): AggStatus {
    return {
      running: !!this.proc,
      pid: this.proc?.pid,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      logPath: this.logPath,
      lastLogLines: this.logs.slice(-50),
      error: this.error,
    }
  }
}

export const aggregatorRunner = new AggregatorRunner()

