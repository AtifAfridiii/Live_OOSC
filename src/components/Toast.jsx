import React, { useEffect } from 'react'

const Toast = ({ message, type = 'success', onClose, autoClose = true, duration = 3000 }) => {
  // type: 'success' | 'error' | 'info' | 'warning'
  const typeStyles = {
    success: 'bg-green-100 border-green-400 text-green-800',
    error: 'bg-red-100 border-red-400 text-red-800',
    info: 'bg-blue-100 border-blue-400 text-blue-800',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  }

  // Auto-close functionality
  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  return (
    <div
      className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-lg shadow-lg border-l-4 flex items-center space-x-3 transition-all duration-300 transform animate-slide-in-right ${typeStyles[type]}`}
      role="alert"
    >
      <span className="flex-1 text-base font-medium">{message}</span>

      {/* Close button */}
      <button
        onClick={onClose}
        className="ml-2 text-lg font-bold focus:outline-none hover:opacity-70 transition-opacity duration-200"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  )
}

export default Toast
