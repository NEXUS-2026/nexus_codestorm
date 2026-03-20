import { useState, useRef, useCallback } from 'react'
import { WS_URL } from '../api'

export const STATUS = { IDLE: 'idle', RUNNING: 'running', STOPPED: 'stopped' }

export default function useWebSocket({ onFrame, onSessionEnd }) {
  const [status, setStatus]       = useState(STATUS.IDLE)
  const [count, setCount]         = useState(0)
  const [sessionId, setSessionId] = useState(null)
  const [error, setError]         = useState(null)
  const wsRef = useRef(null)

  const start = useCallback(({ batchId, operatorId, cameraIndex }) => {
    setError(null)
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({
        action: 'start',
        batch_id: batchId,
        operator_id: operatorId,
        camera_index: cameraIndex,
      }))
      setStatus(STATUS.RUNNING)
    }

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.error) { setError(data.error); setStatus(STATUS.IDLE); return }
      if (data.session_id) setSessionId(data.session_id)
      setCount(data.count ?? 0)
      if (data.frame) onFrame?.(data.frame)
      if (!data.session_active) {
        setStatus(STATUS.STOPPED)
        onSessionEnd?.()
      }
    }

    ws.onerror = () => {
      setError('Cannot connect to backend on port 5000.')
      setStatus(STATUS.IDLE)
    }
  }, [onFrame, onSessionEnd])

  const stop = useCallback(() => {
    wsRef.current?.close()
    setStatus(STATUS.STOPPED)
    onSessionEnd?.()
  }, [onSessionEnd])

  const reset = useCallback(() => {
    setStatus(STATUS.IDLE)
    setCount(0)
    setSessionId(null)
    setError(null)
  }, [])

  return { status, count, sessionId, error, start, stop, reset }
}
