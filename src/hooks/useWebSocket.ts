import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../stores/authStore'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000/ws'

type WSHandler = (payload: unknown) => void

export function useWebSocket() {
  const token = useAuthStore((s) => s.token)
  const qc = useQueryClient()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const handlersRef = useRef<Map<string, WSHandler[]>>(new Map())

  const connect = useCallback(() => {
    if (!token) return
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(`${WS_URL}?token=${token}`)
    wsRef.current = ws

    ws.onopen = () => {
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type: string; payload?: unknown }

        // Invalidate relevant queries based on event type
        if (msg.type === 'TRANSACTION_CREATED') {
          qc.invalidateQueries({ queryKey: ['dashboard'] })
          qc.invalidateQueries({ queryKey: ['top-products'] })
        }
        if (msg.type === 'SHIFT_OPENED' || msg.type === 'SHIFT_CLOSED') {
          qc.invalidateQueries({ queryKey: ['active-shift'] })
        }
        if (msg.type === 'PREORDER_UPDATED') {
          qc.invalidateQueries({ queryKey: ['pre-orders'] })
        }
        if (msg.type === 'LOW_STOCK_ALERT') {
          qc.invalidateQueries({ queryKey: ['ingredients'] })
          qc.invalidateQueries({ queryKey: ['dashboard'] })
        }

        // Call registered handlers
        const handlers = handlersRef.current.get(msg.type) ?? []
        handlers.forEach((h) => h(msg.payload))
      } catch {
        // ignore malformed
      }
    }

    ws.onclose = (event) => {
      if (event.code !== 4001) {
        // Reconnect after 3s unless unauthorized
        reconnectTimer.current = setTimeout(() => connect(), 3000)
      }
    }

    ws.onerror = () => ws.close()
  }, [token, qc])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  // Register event handler
  const on = useCallback((eventType: string, handler: WSHandler) => {
    const existing = handlersRef.current.get(eventType) ?? []
    handlersRef.current.set(eventType, [...existing, handler])

    return () => {
      const handlers = handlersRef.current.get(eventType) ?? []
      handlersRef.current.set(eventType, handlers.filter((h) => h !== handler))
    }
  }, [])

  const isConnected = wsRef.current?.readyState === WebSocket.OPEN

  return { on, isConnected }
}
