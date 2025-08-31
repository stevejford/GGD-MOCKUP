const { WebSocketServer } = require('ws')

// Create WebSocket server
const wss = new WebSocketServer({ port: 8080 })

// Store active connections
const connections = new Set()

console.log('🚀 WebSocket server started on port 8080')

wss.on('connection', (ws) => {
  console.log('📡 New WebSocket connection established')
  connections.add(ws)

  // Start status broadcasting if this is the first connection
  if (connections.size === 1) {
    startStatusBroadcasting()
  }

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString())
      console.log('📨 Received:', data)
      
      // Handle different message types
      switch (data.type) {
        case 'subscribe':
          ws.send(JSON.stringify({
            type: 'subscribed',
            message: 'Successfully subscribed to real-time updates'
          }))
          break
        
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }))
          break
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error)
    }
  })

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed')
    connections.delete(ws)

    // Stop status broadcasting if no more connections
    if (connections.size === 0) {
      stopStatusBroadcasting()
    }
  })

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error)
    connections.delete(ws)
  })
})

// Broadcast function
function broadcastToClients(data) {
  if (connections.size === 0) return

  const message = JSON.stringify(data)
  console.log(`📢 Broadcasting to ${connections.size} clients:`, data.type)
  
  connections.forEach((ws) => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(message)
      } catch (error) {
        console.error('❌ Error sending message:', error)
        connections.delete(ws)
      }
    } else {
      connections.delete(ws)
    }
  })
}

// Periodic status updates when crawler is running
let statusInterval = null

async function checkAndBroadcastStatus() {
  try {
    // Check if we have any connections
    if (connections.size === 0) return

    // Fetch current scraper status
    const statusResponse = await fetch('http://localhost:3000/api/scrape/status', {
      headers: { 'Cache-Control': 'no-cache' }
    })

    if (statusResponse.ok) {
      const status = await statusResponse.json()

      // Only broadcast if crawler is running (to get live logs)
      if (status.running) {
        broadcastToClients({
          type: 'scrape_status_update',
          data: status,
          timestamp: new Date().toISOString()
        })
      }
    }

    // Also fetch and broadcast stats for the Real-Time Stats modal
    const statsResponse = await fetch('http://localhost:3000/api/scrape/stats', {
      headers: { 'Cache-Control': 'no-cache' }
    })

    if (statsResponse.ok) {
      const stats = await statsResponse.json()
      broadcastToClients({
        type: 'stats_update',
        data: stats,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    // Silently handle errors - API might not be ready yet
  }
}

// Start periodic status checks every 2 seconds for live updates
function startStatusBroadcasting() {
  if (statusInterval) return

  statusInterval = setInterval(checkAndBroadcastStatus, 2000)
  console.log('📡 Started periodic status broadcasting every 2 seconds')
}

// Stop periodic status checks
function stopStatusBroadcasting() {
  if (statusInterval) {
    clearInterval(statusInterval)
    statusInterval = null
    console.log('⏹️ Stopped periodic status broadcasting')
  }
}



// Export for use in Next.js API routes
module.exports = { broadcastToClients }

// Keep server alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...')
  wss.close(() => {
    console.log('✅ WebSocket server closed')
    process.exit(0)
  })
})
