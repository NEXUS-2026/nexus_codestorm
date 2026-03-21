import { NavLink } from 'react-router-dom'
import { Package, LayoutDashboard, ClipboardList, BarChart2, Radio } from 'lucide-react'
import { useSession } from '../context/SessionContext'

export default function Header() {
  const { status } = useSession()
  const isLive = status === 'running'

  const link = ({ isActive }) =>
    `flex items-center gap-1.5 text-[13px] font-bold px-4 py-2 rounded-xl transition-all duration-300 shadow-sm ${
      isActive
        ? 'bg-[#4ed9a1]/10 text-[#4ed9a1] border border-[#4ed9a1]/20 shadow-[0_0_10px_rgba(78,217,161,0.1)] scale-[1.02]'
        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 border border-transparent hover:scale-[1.02]'
    }`

  return (
    <header className="sticky top-0 z-50 bg-gray-950/40 backdrop-blur-2xl border-b border-gray-800/80 px-6 py-4 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-3">
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 bg-[#4ed9a1] rounded-xl blur-md opacity-40 group-hover:opacity-70 transition-opacity duration-300" />
          <div className="relative w-9 h-9 bg-gradient-to-br from-gray-800 to-gray-900 border border-[#2d8060]/50 rounded-xl flex items-center justify-center shadow-lg">
            <Package size={18} className="text-[#4ed9a1] drop-shadow-md group-hover:scale-110 transition-transform" />
          </div>
        </div>
        <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 tracking-wider uppercase drop-shadow-sm cursor-default">WAREgaurd</span>
      </div>

      {isLive && (
        <NavLink to="/"
          className="flex items-center gap-2 bg-[#2a6d54]/20 border border-[#2d8060]/50 px-4 py-2 rounded-full hover:bg-[#2a6d54]/30 transition-all duration-300 shadow-[0_0_15px_rgba(42,109,84,0.3)] animate-in fade-in zoom-in hover:scale-105 active:scale-95">
          <Radio size={14} className="text-[#4ed9a1] animate-pulse" />
          <span className="text-[11px] font-bold text-[#4ed9a1] uppercase tracking-widest drop-shadow-md">Session Live</span>
        </NavLink>
      )}

      <nav className="flex items-center gap-2">
        <NavLink to="/"         className={link}><LayoutDashboard size={14} /> Dashboard</NavLink>
        <NavLink to="/sessions" className={link}><ClipboardList size={14} /> Sessions</NavLink>
        <NavLink to="/stats"    className={link}><BarChart2 size={14} /> Stats</NavLink>
      </nav>
    </header>
  )
}
