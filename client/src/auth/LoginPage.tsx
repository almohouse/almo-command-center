import { useState } from 'react'
import { useAuth } from './AuthContext'
import { Lock, AlertCircle } from 'lucide-react'

export function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)
    
    setTimeout(() => {
      if (login(password)) {
        // Success - AuthProvider will update state
      } else {
        setError(true)
        setPassword('')
      }
      setLoading(false)
    }, 500)
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple mb-4">
            <span className="text-3xl">🏛️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">ALMO Command Center</h1>
          <p className="text-text-secondary mt-2">Enter access code to continue</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-2">Access Code</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••"
                className="w-full pl-10 pr-4 py-3 bg-glass border border-glass-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-accent-blue transition-colors"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-accent-red text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Incorrect access code</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-gradient-to-r from-accent-blue to-accent-purple text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Enter Command Center'}
          </button>
        </form>

        <p className="text-center text-text-tertiary text-xs mt-6">
          ALMO OS · Authorized Personnel Only
        </p>
      </div>
    </div>
  )
}
