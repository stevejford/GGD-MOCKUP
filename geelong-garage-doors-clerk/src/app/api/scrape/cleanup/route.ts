export const runtime = 'nodejs'
import { isAdmin } from '@/lib/admin-guard'
import { cleanupPlaywrightProcesses } from '@/lib/process-cleanup'

export async function POST() {
  if (!(await isAdmin())) {
    return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }
  
  try {
    await cleanupPlaywrightProcesses()
    return Response.json({ 
      ok: true, 
      message: 'Cleanup completed successfully' 
    })
  } catch (error: any) {
    console.error('Cleanup failed:', error)
    return Response.json({ 
      ok: false, 
      error: error.message || 'Cleanup failed' 
    }, { status: 500 })
  }
}
