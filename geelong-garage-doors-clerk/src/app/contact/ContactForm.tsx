'use client'

import { useState } from 'react'
import { Button, Input, Select } from '@/components/ui'

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="p-6 bg-deep-blue-light rounded-lg">
        <p className="text-deep-blue">Thanks! We&apos;ll be in touch shortly.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Input label="Full Name" placeholder="Your name" fullWidth required />
      <Input label="Email" type="email" placeholder="name@company.com" fullWidth required />
      <Input label="Phone" type="tel" placeholder="0400 000 000" fullWidth />
      <Select label="Project Type" fullWidth options={[
        { value: 'residential', label: 'Residential' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'industrial', label: 'Industrial' },
      ]} placeholder="Select project type" />
      <div>
        <label className="text-sm font-medium text-charcoal mb-1 block">Message</label>
        <textarea className="w-full border border-gray-300 rounded px-4 py-2 min-h-[120px]" placeholder="Tell us about your project..." />
      </div>
      <Button variant="primary" type="submit">Submit</Button>
    </form>
  )
}

