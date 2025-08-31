import type { Metadata } from 'next'
import { Container } from '@/components/layout'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Contact | Geelong Garage Doors',
  description: 'Get in touch to discuss your next project or request a quote.',
}

export default function Contact() {
  return (
    <main>
      <Container className="py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">Contact Us</h1>
        <ContactForm />
      </Container>
    </main>
  )
}

