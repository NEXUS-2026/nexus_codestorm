import { NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-6">
      <span className="font-bold">📦 Warehouse Box Counter</span>
      <nav className="flex gap-4 text-sm">
        <NavLink to="/"         className={({ isActive }) => isActive ? 'text-sky-400' : 'text-gray-400'}>Dashboard</NavLink>
        <NavLink to="/sessions" className={({ isActive }) => isActive ? 'text-sky-400' : 'text-gray-400'}>Sessions</NavLink>
        <NavLink to="/stats"    className={({ isActive }) => isActive ? 'text-sky-400' : 'text-gray-400'}>Stats</NavLink>
      </nav>
    </header>
  )
}
