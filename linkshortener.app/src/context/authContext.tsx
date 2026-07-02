'use client';

import { doDelete, doGet, doPost } from '@/helpers/apiClient';
import { createContext, useContext, useState, useEffect } from 'react'

type User = {
  displayName: string
  email: string
}

type AuthContextType = {
  isAuthenticated: boolean
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await doGet<User>('/api/auth/getuserprofile') //TODO:: add the type for the response
        if (res.status === 200) {
          setUser(res.data ?? null)
        }
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const login = async (email: string, password: string) => {
    const res = await doPost('/api/auth/LoginUser', { body: { email, password } })
    if (res.status === 200) {
      // after login, fetch the user data
      const userRes = await doGet<User>('/api/auth/getuserprofile')
      if (userRes.status === 200) {
        setUser(userRes.data ?? null)
        return true
      }
    }
    return false
  }

  const logout = async () => {
    await doDelete('/api/auth/LogoutUser', {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: user !== null, user, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}