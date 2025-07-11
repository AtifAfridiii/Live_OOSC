import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedAuth = localStorage.getItem('isAuthenticated') === 'true'
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('token')

        setIsAuthenticated(storedAuth)
        setUser(storedUser ? JSON.parse(storedUser) : null)
        setToken(storedToken)
      } catch (error) {
        console.error('Error initializing auth state:', error)
        // Clear corrupted data
        logout()
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = (userData, authToken) => {
    try {
      // Update state
      setUser(userData)
      setToken(authToken)
      setIsAuthenticated(true)

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(userData))
      localStorage.setItem('isAuthenticated', 'true')
      if (authToken) {
        localStorage.setItem('token', authToken)
      }

      console.log('User logged in:', userData)
    } catch (error) {
      console.error('Error during login:', error)
      throw error
    }
  }

  const logout = () => {
    try {
      // Clear state
      setUser(null)
      setToken(null)
      setIsAuthenticated(false)

      // Clear localStorage
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('isAuthenticated')

      console.log('User logged out')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
