import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import { SessionProvider } from './context/SessionContext'

const Dashboard     = lazy(() => import('./pages/Dashboard'))
const Sessions      = lazy(() => import('./pages/Sessions'))
const OperatorStats = lazy(() => import('./pages/OperatorStats'))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-transparent relative z-10 w-full h-full">
      <span className="w-8 h-8 border-4 border-gray-800 border-t-[#4ed9a1] rounded-full animate-spin shadow-[0_0_15px_rgba(78,217,161,0.5)]" />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        {/* Eye-catching global background */}
        <div className="min-h-screen bg-[#02040a] text-gray-100 flex flex-col relative overflow-x-hidden selection:bg-[#4ed9a1]/30 selection:text-white">
          
          {/* Animated Ambient Light & Sophisticated Grid Pattern */}
          <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_60%,transparent_100%)]" />
          
          <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-[#4ed9a1]/[0.04] via-[#2d8060]/[0.02] to-transparent pointer-events-none z-0" />
          
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-sky-500/10 blur-[130px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '7s' }} />
          <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-[#4ed9a1]/10 blur-[150px] pointer-events-none z-0 animate-pulse" style={{ animationDuration: '6s' }} />
          
          {/* Main App Content */}
          <div className="relative z-10 flex flex-col flex-1 h-full min-h-screen">
            <Header />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"         element={<Dashboard />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/stats"    element={<OperatorStats />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </SessionProvider>
    </BrowserRouter>
  )
}
