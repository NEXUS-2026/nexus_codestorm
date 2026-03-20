import { NavLink } from 'react-router-dom'
import { Package, LayoutDashboard, ClipboardList, BarChart2 } from 'lucide-react'

export default function Header() {
  const link = ({ isActive }) =>
    `flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
      isActive
        ? 'bg-sky-950 text-sky-400 border border-sky-800'
        : 'text-gray-500 hover:text-gray-300'
    }`

  return (
    <header className="bg-gray-900 border-b border-gray-800 px-5 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-sky-600 rounded-lg flex items-center justify-center">
          <Package size={14} className="text-white" />
        </div>
        <span className="text-sm font-bold text-white tracking-tight">Warehouse Counter</span>
      </div>

      <nav className="flex items-center gap-1">
        <NavLink to="/"         className={link}><LayoutDashboard size={13} /> Dashboard</NavLink>
        <NavLink to="/sessions" className={link}><ClipboardList size={13} /> Sessions</NavLink>
        <NavLink to="/stats"    className={link}><BarChart2 size={13} /> Stats</NavLink>
      </nav>
    </header>
  )
}
