import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Gift, Loader2, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { selectIsAuthenticated } from '../features/authSlice'
import { useLoginMutation } from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login({ email, password }).unwrap()
      navigate('/')
    } catch (err) {
      setError(err?.data?.detail || err?.data?.message || 'Invalid email or password')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[400px] -right-[400px] w-[800px] h-[800px] rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute -bottom-[400px] -left-[400px] w-[800px] h-[800px] rounded-full bg-orange-400/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-teal-500/[0.02] blur-2xl" />
      </div>

      <div className="w-full max-w-[400px] relative z-10 animate-scale-in">
        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl mb-5 shadow-lg shadow-teal-500/20">
            <Gift className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="text-gray-400 mt-1.5 text-sm">Sign in to your admin console</p>
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit} className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-7 space-y-5 shadow-2xl">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20 animate-slide-up">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[13px] font-medium text-gray-300 mb-2">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@quickgift.ng"
              required
              autoFocus
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white text-sm placeholder-gray-500 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 pr-11 rounded-lg bg-gray-800/50 border border-gray-700/50 text-white text-sm placeholder-gray-500 focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 outline-none transition-all duration-150"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-600 mt-8">
          QuickGift Admin Console
        </p>
      </div>
    </div>
  )
}
