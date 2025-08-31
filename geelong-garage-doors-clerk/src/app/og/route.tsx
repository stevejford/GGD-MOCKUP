import React from 'react'
import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'Geelong Garage Doors'

  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b1137',
          backgroundImage: 'linear-gradient(135deg, #2C3993 0%, #0b1137 100%)',
          color: 'white',
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: -2,
          textAlign: 'center',
          padding: '40px',
        },
      },
      React.createElement(
        'div',
        { style: { maxWidth: 1000, display: 'flex', flexDirection: 'column', gap: 24 } },
        React.createElement('div', { style: { fontSize: 28, color: '#F88229' } }, 'Geelong Garage Doors'),
        React.createElement('div', { style: { fontSize: 64, lineHeight: 1.1 } }, title)
      )
    ),
    { width: 1200, height: 630 }
  )
}
