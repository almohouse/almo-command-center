import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const CORRECT_PASSWORD = import.meta.env.VITE_ACCESS_CODE || ''
const AUTH_KEY = 'almo_cc_auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY)
    if (stored === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const login = (password: string) => {
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem(AUTH_KEY, 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem(AUTH_KEY)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
