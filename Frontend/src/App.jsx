import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import { SessionProvider } from './context/SessionContext'

const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Sessions      = lazy(() => import('./pages/Sessions'))
const OperatorStats = lazy(() => import('./pages/OperatorStats'))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950">
      <span className="w-6 h-6 border-2 border-gray-700 border-t-sky-500 rounded-full animate-spin" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
          <Header />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/stats"    element={<OperatorStats />} />
            </Routes>
          </Suspense>
        </div>
      </SessionProvider>
    </BrowserRouter>
  )
}
