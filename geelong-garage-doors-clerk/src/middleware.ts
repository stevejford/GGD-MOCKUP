import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isTradePortal = createRouteMatcher(['/trade-portal(.*)'])
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth()
  // Always protect trade portal
  if (isTradePortal(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }
  // Unprotect /admin in development to simplify local work
  if (process.env.NODE_ENV === 'development') {
    return
  }
  if (isAdminRoute(req) && !userId) {
    return redirectToSignIn({ returnBackUrl: req.url })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
