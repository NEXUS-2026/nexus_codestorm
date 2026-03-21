import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { LogIn, Mail, Lock, AlertCircle, Package } from 'lucide-react'
import { login } from '../api'

export default function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data } = await login(formData.email, formData.password)
      
      if (data.success) {
        // Store token and user data
        localStorage.setItem('token', data.user.token)
        localStorage.setItem('user', JSON.stringify(data.user))
        
        // Navigate to dashboard
        navigate('/dashboard')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#02040a] text-gray-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Logo and title */}
        <div className="flex flex-col items-center gap-5 mb-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-sky-500 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-sky-400 to-sky-700 rounded-3xl flex items-center justify-center shadow-2xl border border-sky-400/30">
              <Package size={36} className="text-white drop-shadow-md" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tight">Welcome Back</h1>
            <p className="text-[15px] text-gray-400 mt-2 font-medium">Sign in to your warehouse account</p>
          </div>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-gray-900/60 backdrop-blur-2xl border border-gray-800/80 shadow-[0_8px_40px_rgba(0,0,0,0.8)] rounded-[2rem] p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-sky-500/50 to-transparent" />

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 animate-in fade-in">
              <p className="text-red-400 text-sm font-semibold text-center flex items-center justify-center gap-2">
                <AlertCircle size={16}/> {error}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 group">
            <label className="text-[11px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors group-focus-within:text-sky-400">
              <Mail size={13} className="text-gray-500 group-focus-within:text-sky-400 transition-colors" /> Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="your@email.com"
              className="w-full bg-gray-950/80 border border-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-2xl px-5 py-3.5 text-sm text-gray-100 outline-none transition-all duration-300 placeholder:text-gray-700 shadow-inner"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="flex flex-col gap-2 group">
            <label className="text-[11px] text-gray-400 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors group-focus-within:text-sky-400">
              <Lock size={13} className="text-gray-500 group-focus-within:text-sky-400 transition-colors" /> Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-gray-950/80 border border-gray-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-2xl px-5 py-3.5 text-sm text-gray-100 outline-none transition-all duration-300 placeholder:text-gray-700 shadow-inner"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white py-4 rounded-2xl text-[15px] font-black tracking-wide shadow-lg shadow-sky-600/20 transition-all duration-300 hover:shadow-sky-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none">
            {loading
              ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
              : <><LogIn size={18} /> SIGN IN</>}
          </button>

          <div className="text-center pt-4 border-t border-gray-800/50">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-sky-400 hover:text-sky-300 font-bold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
