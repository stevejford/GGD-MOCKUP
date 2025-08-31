import { NextRequest } from 'next/server'
import { WebSocketServer } from 'ws'

// Global WebSocket server instance
let wss: WebSocketServer | null = null

// Store active connections
const connections = new Set<any>()

// Initialize WebSocket server if not already created
function initWebSocketServer() {
  if (wss) return wss

  wss = new WebSocketServer({ 
    port: 8080,
    path: '/api/ws'
  })

  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established')
    connections.add(ws)

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString())
        console.log('Received WebSocket message:', data)
        
        // Handle different message types
        switch (data.type) {
          case 'subscribe':
            // Client wants to subscribe to updates
            ws.send(JSON.stringify({
              type: 'subscribed',
              message: 'Successfully subscribed to real-time updates'
            }))
            break
          
          case 'ping':
            // Heartbeat
            ws.send(JSON.stringify({ type: 'pong' }))
            break
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    })

    ws.on('close', () => {
      console.log('WebSocket connection closed')
      connections.delete(ws)
    })

    ws.on('error', (error) => {
      console.error('WebSocket error:', error)
      connections.delete(ws)
    })
  })

  console.log('WebSocket server initialized on port 8080')
  return wss
}

// Broadcast function to send data to all connected clients
export function broadcastToClients(data: any) {
  if (!wss || connections.size === 0) return

  const message = JSON.stringify(data)
  
  connections.forEach((ws) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(message)
      } catch (error) {
        console.error('Error sending WebSocket message:', error)
        connections.delete(ws)
      }
    } else {
      connections.delete(ws)
    }
  })
}

export async function GET(req: NextRequest) {
  try {
    // Initialize WebSocket server
    initWebSocketServer()
    
    return new Response(JSON.stringify({ 
      status: 'WebSocket server running',
      port: 8080,
      connections: connections.size
    }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('WebSocket server error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to initialize WebSocket server' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
