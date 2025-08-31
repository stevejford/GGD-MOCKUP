import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Clean up orphaned Playwright processes on Windows
 * This helps prevent EPIPE errors when processes are not properly terminated
 */
export async function cleanupPlaywrightProcesses(): Promise<void> {
  try {
    if (process.platform === 'win32') {
      // On Windows, kill any orphaned playwright processes
      await execAsync('taskkill /F /IM "playwright.exe" 2>nul || exit 0')
      await execAsync('taskkill /F /IM "chrome.exe" /FI "WINDOWTITLE eq about:blank*" 2>nul || exit 0')
      await execAsync('taskkill /F /IM "msedge.exe" /FI "WINDOWTITLE eq about:blank*" 2>nul || exit 0')
      console.log('Cleaned up orphaned browser processes')
    } else {
      // On Unix-like systems
      await execAsync('pkill -f "playwright" 2>/dev/null || true')
      await execAsync('pkill -f "chrome.*--remote-debugging-port" 2>/dev/null || true')
      console.log('Cleaned up orphaned browser processes')
    }
  } catch (error) {
    // Ignore errors - this is best effort cleanup
    console.log('Process cleanup completed (some processes may not have been running)')
  }
}

/**
 * Kill a specific process tree by PID
 */
export async function killProcessTree(pid: number): Promise<void> {
  try {
    if (process.platform === 'win32') {
      // On Windows, kill the process tree
      await execAsync(`taskkill /F /T /PID ${pid} 2>nul || exit 0`)
    } else {
      // On Unix-like systems, kill the process group
      await execAsync(`kill -TERM -${pid} 2>/dev/null || true`)
      
      // Wait a bit, then force kill if still running
      setTimeout(async () => {
        try {
          await execAsync(`kill -KILL -${pid} 2>/dev/null || true`)
        } catch {
          // Ignore errors
        }
      }, 3000)
    }
    console.log(`Killed process tree for PID ${pid}`)
  } catch (error) {
    console.log(`Process ${pid} cleanup completed`)
  }
}

/**
 * Check if a process is running by PID
 */
export async function isProcessRunning(pid: number): Promise<boolean> {
  try {
    if (process.platform === 'win32') {
      const { stdout } = await execAsync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`)
      return stdout.includes(`"${pid}"`)
    } else {
      await execAsync(`kill -0 ${pid}`)
      return true
    }
  } catch {
    return false
  }
}
