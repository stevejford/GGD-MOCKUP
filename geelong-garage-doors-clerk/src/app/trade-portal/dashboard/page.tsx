'use client'

import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs'

export default function Dashboard() {
  return (
    <main className="p-8">
      <SignedIn>
        <h1 className="text-2xl font-bold">Trade Portal Dashboard</h1>
        <p className="mt-2 text-gray-600">This route is protected. You are signed in.</p>
      </SignedIn>
      <SignedOut>
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
          <p className="text-lg">You must sign in to access the Trade Portal.</p>
          <SignInButton>
            <button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
    </main>
  )
}

