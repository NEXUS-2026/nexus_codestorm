import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Menu, X, Sparkles, ArrowRight, LogIn } from 'lucide-react'
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
    { label: 'About', href: '#about' },
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
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-gray-950/90 backdrop-blur-2xl border-b border-gray-800/80 shadow-2xl shadow-black/50'
            : 'bg-transparent'
        }`}
      >
        {/* Animated gradient line at top */}
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="relative">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-br from-sky-500 to-purple-600 rounded-xl blur-lg opacity-50" 
                />
                <div className="relative w-11 h-11 bg-gradient-to-br from-sky-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-sky-500/50 transition-shadow duration-300">
                  <Box size={22} className="text-white drop-shadow-md" />
                </div>
              </div>
              <span className="text-2xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Box
                </span>
                <span className="text-white">Guard</span>
              </span>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link, idx) => (
                <motion.button
                  key={link.label}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 + 0.3, duration: 0.5 }}
                  onClick={() => handleNavClick(link)}
                  className="relative px-5 py-2.5 text-gray-300 hover:text-white transition-colors font-semibold text-sm group"
                >
                  {link.label}
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-sky-400 via-blue-500 to-purple-500 group-hover:w-3/4 transition-all duration-300 rounded-full" />
                </motion.button>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')}
                className="group px-6 py-2.5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl font-semibold text-sm text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2"
              >
                <LogIn size={16} className="group-hover:rotate-12 transition-transform" />
                Sign In
              </motion.button>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
                className="group relative px-6 py-2.5 bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 rounded-xl font-bold text-sm overflow-hidden shadow-lg shadow-sky-500/30 hover:shadow-sky-500/50 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2 text-white">
                  <Sparkles size={16} className="group-hover:rotate-12 transition-transform" />
                  Get Started
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div 
                  animate={{ 
                    x: ['-100%', '100%']
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                />
              </motion.button>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-11 h-11 flex items-center justify-center rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 hover:text-white hover:border-sky-500/50 transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X size={22} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu size={22} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: [0.6, -0.05, 0.01, 0.99] }}
              className="fixed top-[88px] left-4 right-4 z-50 bg-gray-900/95 backdrop-blur-2xl border border-gray-800 rounded-2xl shadow-2xl md:hidden overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
              
              <div className="px-6 py-6 space-y-2">
                {navLinks.map((link, idx) => (
                  <motion.button
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.3 }}
                    onClick={() => handleNavClick(link)}
                    className="block w-full text-left text-gray-300 hover:text-white hover:bg-gray-800/50 px-4 py-3 rounded-xl transition-all duration-200 font-semibold"
                  >
                    {link.label}
                  </motion.button>
                ))}
                
                <div className="pt-4 border-t border-gray-800 space-y-3">
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    onClick={() => {
                      navigate('/login')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-6 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl font-semibold text-sm text-gray-300 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <LogIn size={16} />
                    Sign In
                  </motion.button>
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.3 }}
                    onClick={() => {
                      navigate('/signup')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-sky-500 via-blue-600 to-purple-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-500/30"
                  >
                    <Sparkles size={16} />
                    Get Started
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
