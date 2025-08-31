import { useEffect, useRef, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  data?: any
  message?: string
}

interface UseWebSocketOptions {
  url: string
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket({
  url,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastMessage, setLastMessage] = useState<any>(null)
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null)
  const isManualClose = useRef(false)

  const connect = useCallback(() => {
    // Prevent multiple connections
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    // Clear any existing reconnection timeout
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current)
      reconnectTimeoutId.current = null
    }

    setConnectionStatus('connecting')
    isManualClose.current = false

    try {
      ws.current = new WebSocket(url)

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected successfully')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
        onConnect?.()

        // Send subscription message
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'subscribe' }))
        }
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          setLastMessage(data)
          onMessage?.(data)
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error)
        }
      }

      ws.current.onclose = (event) => {
        console.log(`🔌 WebSocket disconnected: ${event.code} ${event.reason}`)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        ws.current = null
        onDisconnect?.()

        // Only attempt to reconnect if not manually closed and within retry limits
        if (!isManualClose.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`🔄 Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`)

          reconnectTimeoutId.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('❌ Max reconnection attempts reached')
          setConnectionStatus('error')
        }
      }

      ws.current.onerror = (error) => {
        // Only log meaningful errors, not generic connection failures during development
        if (ws.current?.readyState !== WebSocket.CLOSED && ws.current?.readyState !== WebSocket.CLOSING) {
          console.warn('⚠️ WebSocket connection issue - will attempt to reconnect')
        }
        setConnectionStatus('error')
        // Don't call onError for routine connection issues
        if (error && (error as any).type !== 'error') {
          onError?.(error)
        }
      }

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error)
      setConnectionStatus('error')
    }
  }, [url]) // Only depend on URL to prevent infinite loops

  const disconnect = useCallback(() => {
    isManualClose.current = true
    
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current)
      reconnectTimeoutId.current = null
    }

    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    
    setIsConnected(false)
    setConnectionStatus('disconnected')
  }, [])

  const sendMessage = useCallback((message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
      return true
    }
    return false
  }, [])

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return

    const heartbeat = setInterval(() => {
      sendMessage({ type: 'ping' })
    }, 30000) // Send ping every 30 seconds

    return () => clearInterval(heartbeat)
  }, [isConnected, sendMessage])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    connect,
    disconnect,
    sendMessage
  }
}
