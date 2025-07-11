import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'

const DeleteConfirmationAlert = ({ 
  isVisible, 
  onConfirm, 
  onCancel, 
  entryTitle = null,
  title = "Delete Entry",
  message = "Are you sure you want to delete this entry? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel"
}) => {
  const cancelButtonRef = useRef(null)
  const alertRef = useRef(null)

  // Focus management - focus cancel button when alert opens
  useEffect(() => {
    if (isVisible && cancelButtonRef.current) {
      cancelButtonRef.current.focus()
    }
  }, [isVisible])

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isVisible) return

      switch (event.key) {
        case 'Escape':
          event.preventDefault()
          onCancel()
          break
        case 'Enter':
          event.preventDefault()
          onConfirm()
          break
        case 'Tab':
          // Focus trap - keep focus within the alert
          const focusableElements = alertRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0]
            const lastElement = focusableElements[focusableElements.length - 1]
            
            if (event.shiftKey && document.activeElement === firstElement) {
              event.preventDefault()
              lastElement.focus()
            } else if (!event.shiftKey && document.activeElement === lastElement) {
              event.preventDefault()
              firstElement.focus()
            }
          }
          break
        default:
          break
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isVisible, onConfirm, onCancel])

  // Click outside handler
  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onCancel()
    }
  }

  if (!isVisible) return null

  const alertContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-alert-title"
      aria-describedby="delete-alert-description"
    >
      <div 
        ref={alertRef}
        className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md transform transition-all duration-300 scale-100 animate-modal-appear"
      >
        {/* Header */}
        <div className="flex items-center space-x-3 p-6 pb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 
              id="delete-alert-title"
              className="text-lg font-semibold text-gray-900"
            >
              {title}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p 
            id="delete-alert-description"
            className="text-sm text-gray-600 mb-1"
          >
            {entryTitle ? (
              <>
                Are you sure you want to delete <span className="font-medium text-gray-900">"{entryTitle}"</span>? This action cannot be undone.
              </>
            ) : (
              message
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row-reverse gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 focus:bg-red-700 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {confirmText}
          </button>
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 bg-gray-600 hover:bg-gray-700 focus:bg-gray-700 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  )

  // Render using portal to ensure proper z-index layering
  return createPortal(alertContent, document.body)
}

export default DeleteConfirmationAlert
