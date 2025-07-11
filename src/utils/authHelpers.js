/**
 * Authentication helper utilities
 */

/**
 * Safely set authentication data in localStorage
 * @param {Object} userData - User data object
 * @param {string} token - Authentication token
 */
export const setAuthData = (userData, token = null) => {
  try {
    localStorage.setItem('user', JSON.stringify(userData))
    if (token) {
      localStorage.setItem('token', token)
    }
    // Set authentication flag last to ensure all data is saved
    localStorage.setItem('isAuthenticated', 'true')
    
    console.log('Authentication data saved successfully')
    return true
  } catch (error) {
    console.error('Error saving authentication data:', error)
    return false
  }
}

/**
 * Safely clear authentication data from localStorage
 */
export const clearAuthData = () => {
  try {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('isAuthenticated')
    
    console.log('Authentication data cleared successfully')
    return true
  } catch (error) {
    console.error('Error clearing authentication data:', error)
    return false
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isUserAuthenticated = () => {
  try {
    return localStorage.getItem('isAuthenticated') === 'true'
  } catch (error) {
    console.error('Error checking authentication status:', error)
    return false
  }
}

/**
 * Get user data from localStorage
 * @returns {Object|null}
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  } catch (error) {
    console.error('Error getting user data:', error)
    return null
  }
}

/**
 * Get authentication token from localStorage
 * @returns {string|null}
 */
export const getAuthToken = () => {
  try {
    return localStorage.getItem('token')
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

/**
 * Handle authentication errors and extract meaningful messages
 * @param {Error} error - The error object
 * @returns {Object} - Formatted error object
 */
export const handleAuthError = (error) => {
  console.error('Authentication error:', error)
  
  if (error.response && error.response.data) {
    if (error.response.data.errors) {
      return { errors: error.response.data.errors }
    } else if (error.response.data.message) {
      return { general: error.response.data.message }
    }
  }
  
  // Default error messages based on status code
  if (error.response) {
    switch (error.response.status) {
      case 401:
        return { general: 'Invalid credentials. Please try again.' }
      case 422:
        return { general: 'Please check your input and try again.' }
      case 500:
        return { general: 'Server error. Please try again later.' }
      default:
        return { general: 'Authentication failed. Please try again.' }
    }
  }
  
  return { general: 'Network error. Please check your connection and try again.' }
}
