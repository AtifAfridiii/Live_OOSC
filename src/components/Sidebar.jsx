import React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  Database,
  Users,
  MapPin,
  FileText,
  LogOut,
  X
} from 'lucide-react'
import istock from "../assets/Logo/istock.png"

const Sidebar = ({ isOpen, onClose, onNavigate }) => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { icon: Home, label: 'Home', path: '/dashboard/overview' },
    { icon: Database, label: 'Data Management', path: '/dashboard/data-management' },
    { icon: Users, label: 'Programs', path: '/dashboard/programs' },
    { icon: MapPin, label: 'Districts', path: '/dashboard/districts' },
    { icon: FileText, label: 'Reports', path: '/dashboard/reports' },
    { icon: Users, label: 'Users', path: '/dashboard/users' },
  ]

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate()
    }
  }

  return (
    <>
      {/* Mobile Overlay - More transparent and only on mobile */}
      {/*
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      */}

      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-64 md:w-48 lg:w-64
        bg-[#2c5aa0] text-white flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-screen md:h-auto
      `}>
        {/* Logo/Header */}
        <div className="p-6 md:p-4 lg:p-6 border-b border-blue-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-[#2c5aa0] font-bold text-sm"><img src={istock} alt="logo" /></span>
              </div>
              <span className="font-medium text-sm">OOSC Edu App Track</span>
            </div>
            {/* Close button for mobile only */}
            <button
              onClick={onClose}
              className="md:hidden p-1 hover:bg-blue-600/20 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon
              return (
                <li key={index}>
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) => `
                      w-full flex items-center px-6 md:px-4 lg:px-6 py-3 text-sm font-medium transition-colors duration-200
                      ${isActive
                        ? 'bg-blue-500/20 text-white border-r-3 border-white'
                        : 'text-blue-100/80 hover:bg-blue-500/10 hover:text-white'
                      }
                    `}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-2 py-2 text-sm font-medium text-blue-100 hover:bg-blue-600 hover:text-white rounded transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="truncate">Log Out</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default Sidebar
