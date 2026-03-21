import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Menu, X, Sparkles, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingNav() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
  ]

  const handleNavClick = (link) => {
    if (link.onClick) {
      link.onClick()
    } else if (link.href) {
      const element = document.querySelector(link.href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setMobileMenuOpen(false)
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link, idx) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                  onClick={() => handleNavClick(link)}
                  className="text-gray-300 hover:text-white transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-sky-400 to-purple-500 group-hover:w-full transition-all duration-300" />
                </motion.button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="px-5 py-2.5 text-gray-300 hover:text-white font-semibold text-sm transition-colors"
              >
                Sign In
              </motion.button>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
                className="group relative px-6 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-semibold text-sm overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles size={14} />
                  Get Started
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-[72px] left-0 right-0 z-40 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 md:hidden overflow-hidden"
          >
            <div className="px-6 py-6 space-y-4">
              {navLinks.map((link, idx) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleNavClick(link)}
                  className="block w-full text-left text-gray-300 hover:text-white py-2 transition-colors"
                >
                  {link.label}
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => {
                  navigate('/login')
                  setMobileMenuOpen(false)
                }}
                className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold text-sm text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </motion.button>
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                onClick={() => {
                  navigate('/signup')
                  setMobileMenuOpen(false)
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                Get Started
                <ArrowRight size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
