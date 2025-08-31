'use client'

import { SignUp } from '@clerk/nextjs'
import { Container } from '@/components/layout'

export default function Page() {
  return (
    <main className="py-16">
      <Container className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-6 text-deep-blue">Create your Trade Portal account</h1>
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <SignUp
            routing="path"
            path="/sign-up"
            appearance={{
              variables: {
                colorPrimary: '#F88229',
                colorText: '#333333',
                colorTextOnPrimaryBackground: '#ffffff',
                fontFamily: 'var(--font-montserrat, Inter, system-ui, sans-serif)'
              },
              elements: {
                formButtonPrimary: 'bg-vibrant-orange hover:bg-vibrant-orange-hover',
                card: 'shadow-none'
              }
            }}
          />
        </div>
      </Container>
    </main>
  )
}

