import React, { useState, useEffect } from 'react'
import {  Bell, User, Menu } from 'lucide-react'
import { getUserData } from '../utils/authHelpers'

const Header = ({ onMenuClick }) => {
  const [user, setUser] = useState(null)

  // Get user data on component mount and when localStorage changes
  useEffect(() => {
    const loadUserData = () => {
      const userData = getUserData()
      setUser(userData)
    }

    loadUserData()

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        loadUserData()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Function to get user's first letter for avatar
  const getUserInitial = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase()
    }
    return null
  }
  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Mobile Menu Button & Breadcrumb */}
        <div className="flex items-center space-x-4">
          {/* Hamburger Menu - Mobile Only (hidden on tablet and desktop) */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="hidden sm:inline">Dashboard</span>
            <span className="hidden sm:inline text-gray-400">›</span>
            <span className="text-gray-900 font-medium">Overview</span>
          </div>
        </div>

        {/* Right side - Search, Notifications, Profile */}
        <div className="flex items-center space-x-2 md:space-x-4">



          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:shadow-md">
              {getUserInitial() ? (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                  <span className="text-white text-sm font-semibold">
                    {getUserInitial()}
                  </span>
                </div>
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
            {/* <button className="hidden sm:block text-gray-700 hover:text-gray-900 transition-colors duration-200">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button> */}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
