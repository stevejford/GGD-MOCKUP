'use client'

import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs'
import Button from '@/components/ui/Button'

interface ClientAuthWrapperProps {
  ctaButton: {
    label: string
    href: string
  }
  phoneNumber?: string
  isMobile?: boolean
  onMobileMenuClose?: () => void
}

export default function ClientAuthWrapper({ 
  ctaButton, 
  phoneNumber, 
  isMobile = false, 
  onMobileMenuClose 
}: ClientAuthWrapperProps) {
  const [mounted, setMounted] = useState(false)

  // Only render after hydration to prevent SSR mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return (
      <div className={isMobile ? "space-y-4" : "flex items-center gap-4"}>
        {!isMobile && phoneNumber && (
          <a 
            href={`tel:${phoneNumber.replace(/\s/g, '')}`}
            className="text-white hover:text-deep-blue-light transition-colors text-sm font-medium"
          >
            {phoneNumber}
          </a>
        )}
        <Button 
          variant="primary" 
          size="md" 
          onClick={() => (window.location.href = ctaButton.href)}
          fullWidth={isMobile}
        >
          {ctaButton.label}
        </Button>
        {/* Placeholder for auth buttons */}
        <div className={isMobile ? "h-10" : "w-20 h-10"} />
      </div>
    )
  }

  // Desktop version
  if (!isMobile) {
    return (
      <div className="flex items-center gap-4">
        {phoneNumber && (
          <a 
            href={`tel:${phoneNumber.replace(/\s/g, '')}`}
            className="text-white hover:text-deep-blue-light transition-colors text-sm font-medium"
          >
            {phoneNumber}
          </a>
        )}
        <Button variant="primary" size="md" onClick={() => (window.location.href = ctaButton.href)}>
          {ctaButton.label}
        </Button>
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="secondary" size="md">Sign in</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton 
            afterSignOutUrl="/" 
            appearance={{ 
              elements: { 
                userButtonAvatarBox: 'ring-2 ring-vibrant-orange' 
              } 
            }} 
          />
        </SignedIn>
      </div>
    )
  }

  // Mobile version
  return (
    <div className="space-y-4">
      <Button
        variant="primary"
        size="md"
        fullWidth
        onClick={() => {
          window.location.href = ctaButton.href
          onMobileMenuClose?.()
        }}
      >
        {ctaButton.label}
      </Button>
      <SignedOut>
        <SignInButton mode="modal">
          <Button 
            variant="secondary" 
            size="md" 
            fullWidth 
            onClick={() => onMobileMenuClose?.()}
          >
            Sign in
          </Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center justify-between">
          <span className="text-deep-blue-light text-sm">Account</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </div>
  )
}
