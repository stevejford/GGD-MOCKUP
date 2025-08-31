import { currentUser } from '@clerk/nextjs/server'

const HARDCODED_EMAIL = 'stavejford1@gmail.com'

function allowedByEnv(primary?: string | null, allEmails: string[] = [], userId?: string | null) {
  const envEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  const envIds = (process.env.ADMIN_USER_IDS || '').split(',').map(s => s.trim()).filter(Boolean)
  if (primary && (primary === HARDCODED_EMAIL || envEmails.includes(primary))) return true
  if (allEmails.includes(HARDCODED_EMAIL)) return true
  if (envEmails.some(e => allEmails.includes(e))) return true
  if (envIds.length && userId && envIds.includes(userId)) return true
  return false
}

export async function isAdmin() {
  // Unprotect in development to simplify local work
  if (process.env.NODE_ENV === 'development') return true
  const user = await currentUser()
  if (!user) return false
  const primary = user.primaryEmailAddress?.emailAddress?.toLowerCase()
  const all = (user.emailAddresses || []).map(e => e.emailAddress?.toLowerCase?.()).filter(Boolean) as string[]
  return allowedByEnv(primary, all, user.id)
}
