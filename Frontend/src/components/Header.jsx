import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, BarChart3, Box, Radio } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSession } from '../context/SessionContext'

export default function Header() {
  const navigate = useNavigate()
  const { status } = useSession()
  const isLive = status === 'running'

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/sessions',  icon: ClipboardList,   label: 'Sessions' },
    { to: '/stats',     icon: BarChart3,       label: 'Analytics' },
  ]

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 z-50 bg-gray-900/50 backdrop-blur-xl border-b border-gray-800/50 shadow-lg"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3"
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-purple-600 rounded-xl blur-md opacity-50" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Box size={20} className="text-white" />
              </div>
            </div>
            <span className="text-2xl font-black">
              <span className="bg-gradient-to-r from-sky-400 to-purple-500 bg-clip-text text-transparent">
                WARE
              </span>
              <span className="text-white">gaurd</span>
            </span>
          </motion.button>

          {/* Live Session Indicator */}
          {isLive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Radio size={14} className="text-emerald-400" />
              </motion.div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Session Live
              </span>
            </motion.div>
          )}

          {/* Navigation */}
          <nav className="flex items-center gap-2">
            {links.map((link, idx) => {
              const Icon = link.icon
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-500/20 to-purple-500/20 text-white border border-sky-500/30'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 + 0.2 }}
                      className="flex items-center gap-2"
                    >
                      <Icon size={16} className={isActive ? 'text-sky-400' : ''} />
                      <span className="hidden sm:inline">{link.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-purple-500/10 rounded-xl -z-10"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.div>
                  )}
                </NavLink>
              )
            })}
          </nav>
        </div>
      </div>
    </motion.header>
  )
}
