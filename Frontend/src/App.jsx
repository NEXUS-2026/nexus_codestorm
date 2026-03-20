import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import OperatorStats from './pages/OperatorStats'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <Header />
        <Routes>
          <Route path="/"         element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/stats"    element={<OperatorStats />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
