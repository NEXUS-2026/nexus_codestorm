import { createContext, useContext } from 'react'
import useWebSocket from '../hooks/useWebSocket'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  // imgRef is managed per-page, so onFrame is set dynamically via setOnFrame
  // We pass no-op defaults here; Dashboard overrides them via context methods
  const ws = useWebSocket({ onFrame: null, onSessionEnd: null })
  return (
    <SessionContext.Provider value={ws}>
      {children}
    </SessionContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => useContext(SessionContext)
