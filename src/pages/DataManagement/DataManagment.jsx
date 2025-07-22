import React, { useState, useEffect } from 'react'
import { Search, Upload, Edit, Trash2, Plus, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import { isUserAuthenticated, getAuthToken, clearAuthData } from '../../utils/authHelpers'
import Toast from '../../components/Toast'
import DeleteConfirmationAlert from '../../components/DeleteConfirmationAlert'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const DataManagement = () => {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState({ visible: false, entryId: null, entryTitle: null })
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [goToPage, setGoToPage] = useState('')

  const [formData, setFormData] = useState({
    district: '',
    totalChildren: '',
    outOfSchoolChildren: '',
    girlsPercentage: '',
    boysPercentage: '',
    povertyPercentage: '',
    disabilityPercentage: '',
    otherPercentage: '',
    programType: '',
    date: '',
    unioncouncil: '',
    villagecouncil: '',
    pk: '',
    national: '',
    location: '',
    tehsil: ''
  })

  // Map state
  const [mapPosition, setMapPosition] = useState([34.0151, 71.5249]) // Default to Peshawar, Pakistan
  const [markerPosition, setMarkerPosition] = useState(null)

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng
        setMarkerPosition([lat, lng])
        // Format coordinates and update location field
        const locationString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        handleInputChange('location', locationString)
      }
    })
    return null
  }

  // Interactive Map Component
  const InteractiveMap = () => {
    try {
      return (
        <div className="w-full h-64 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
          <MapContainer
            center={mapPosition}
            zoom={8}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapClickHandler />
            {markerPosition && (
              <Marker position={markerPosition} />
            )}
          </MapContainer>
        </div>
      )
    } catch (error) {
      console.error('Error rendering map:', error)
      return (
        <div className="w-full h-64 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Map could not be loaded</p>
            <p className="text-sm">Please check your internet connection</p>
          </div>
        </div>
      )
    }
  }

  // Transform form data to match backend schema with correct data types
  const transformFormDataForAPI = (data, markerPosition = null, isEdit = false) => {
    let lat = '';
    let log = '';
    if (isEdit && markerPosition && Array.isArray(markerPosition)) {
      lat = markerPosition[0];
      log = markerPosition[1];
    } else if (!isEdit && data.location) {
      const locationParts = data.location.split(',');
      if (locationParts.length === 2) {
        lat = parseFloat(locationParts[0].trim());
        log = parseFloat(locationParts[1].trim());
      }
    }
    return {
      district: data.district,
      totalChildren: parseInt(data.totalChildren) || 0,
      outOfSchoolChildren: parseInt(data.outOfSchoolChildren) || 0,
      girlsPercentage: parseFloat(data.girlsPercentage) || 0,
      boysPercentage: parseFloat(data.boysPercentage) || 0,
      povertyPercentage: parseFloat(data.povertyPercentage) || 0,
      disabilityPercentage: parseFloat(data.disabilityPercentage) || 0,
      otherPercentage: parseFloat(data.otherPercentage) || 0,
      programType: data.programType,
      date: data.date,
      unioncouncil: data.unioncouncil,
      villagecouncil: data.villagecouncil,
      pk: data.pk,
      national: data.national,
      lat: lat,
      log: log,
      tehsil: data.tehsil
    }
  }

  // API Functions
  const fetchAllEntries = async () => {
    setLoading(true)

    // Check authentication before making API call
    const token = localStorage.getItem('token')
    console.log('🔐 Auth check - Token exists:', !!token)
    if (!token) {
      console.error('❌ No authentication token found!')
      showToast('Authentication required. Please login.', 'error')
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Fetching entries from:', API_PATHS.ENTRIES.GET_ALL_ENTRIES)
      const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES)

      console.log('📥 Raw API Response:', response)
      console.log('📊 Response Data:', response.data)
      console.log('📊 Response Status:', response.status)

      // Check different possible data structures
      console.log('🔍 Checking data structure:')
      console.log('  - response.data:', response.data)
      console.log('  - response.data.entries:', response.data?.entries)
      console.log('  - response.data.data:', response.data?.data)
      console.log('  - Array.isArray(response.data):', Array.isArray(response.data))

      // Try different extraction methods
      let entriesData = []
      if (response.data?.entries && Array.isArray(response.data.entries)) {
        entriesData = response.data.entries
        console.log('✅ Found entries in response.data.entries')
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        entriesData = response.data.data
        console.log('✅ Found entries in response.data.data')
      } else if (Array.isArray(response.data)) {
        entriesData = response.data
        console.log('✅ Found entries directly in response.data')
      } else {
        console.log('❌ No valid entries array found in response')
        entriesData = []
      }

      console.log('📋 Extracted entries data:', entriesData)
      console.log('📋 Entries count:', entriesData.length)

      if (entriesData.length > 0) {
        console.log('📋 First entry sample:', entriesData[0])
        console.log('📋 Entry keys:', Object.keys(entriesData[0] || {}))
      }

      // Sort entries by creation date (newest first)
      const sortedEntries = entriesData.sort((a, b) => {
        // Try different possible date fields
        const dateA = new Date(a.createdAt || a.date || a.created_at || a.timestamp || 0)
        const dateB = new Date(b.createdAt || b.date || b.created_at || b.timestamp || 0)
        return dateB - dateA // Descending order (newest first)
      })

      console.log('📅 Sorted entries by date (newest first):', sortedEntries.length, 'entries')
      if (sortedEntries.length > 0) {
        console.log('📅 First entry date:', sortedEntries[0].createdAt || sortedEntries[0].date || 'No date field')
        console.log('📅 Last entry date:', sortedEntries[sortedEntries.length - 1].createdAt || sortedEntries[sortedEntries.length - 1].date || 'No date field')
      }

      setEntries(sortedEntries)
      console.log('✅ Entries set in state:', sortedEntries.length, 'entries')
    } catch (error) {
      console.error('❌ Error fetching entries:', error)
      console.error('❌ Error details:', error.response?.data)
      setEntries([])
      showToast('Failed to load entries', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createEntry = async (entryData) => {
    setLoading(true)
    try {
      console.log('📤 Creating entry with data:', entryData)
      const response = await axiosInstance.post(API_PATHS.ENTRIES.CREATE_ENTRY, entryData)
      console.log('✅ Created entry response:', response.data)
      await fetchAllEntries()
      // Reset to first page to show the new entry at the top
      setCurrentPage(1)
      showToast('Entry created successfully', 'success')
      return response.data
    } catch (error) {
      console.error('❌ Error creating entry:', error)
      console.error('❌ Error response:', error.response?.data)
      showToast('Failed to create entry', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateEntry = async (entryId, entryData) => {
    setLoading(true)
    try {
      console.log('📤 Updating entry', entryId, 'with data:', entryData)
      const response = await axiosInstance.put(API_PATHS.ENTRIES.UPDATE_ENTRY_BY_ID(entryId), entryData)
      console.log('✅ Updated entry response:', response.data)
      await fetchAllEntries()
      showToast('Entry updated successfully', 'success')
      return response.data
    } catch (error) {
      console.error('❌ Error updating entry:', error)
      console.error('❌ Error response:', error.response?.data)
      showToast('Failed to update entry', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteEntry = async (entryId) => {
    setLoading(true)
    try {
      await axiosInstance.delete(API_PATHS.ENTRIES.DELETE_ENTRY_BY_ID(entryId))
      console.log('Deleted entry:', entryId)
      await fetchAllEntries()
      showToast('Entry deleted successfully', 'success')
    } catch (error) {
      console.error('Error deleting entry:', error)
      const errorMessage = error.response?.data?.message || 'Failed to delete entry'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const getEntryById = async (entryId) => {
    setLoading(true)
    try {
      const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ENTRY_BY_ID(entryId))
      console.log('Fetched entry by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching entry by ID:', error)
      showToast('Failed to fetch entry details', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Utility Functions
  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  // Pagination utility functions
  const getPaginatedEntries = (entries) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return entries.slice(startIndex, endIndex)
  }

  const getTotalPages = (totalItems) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    console.log('📄 Page changed to:', newPage)
  }

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage)
    const totalPages = getTotalPages(filteredEntries.length)

    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
      setGoToPage('')
      console.log('📄 Navigated to page:', pageNumber)
    } else {
      showToast(`Please enter a page number between 1 and ${totalPages}`, 'error')
    }
  }

  const getPaginationInfo = (totalItems) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)
    return { startItem, endItem, totalItems }
  }

  // Check authentication and load entries on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      console.log('🚀 Initializing DataManagement component...')

      // Check authentication first
      const isAuth = checkAuthentication()

      if (isAuth) {
        console.log('✅ User is authenticated, loading data...')
        try {
          await fetchAllEntries()
        } catch (error) {
          console.error('Failed to load initial data:', error)
          setEntries([])
        }
      } else {
        console.log('❌ User is not authenticated')
        showToast('Please login to access data management', 'error')
      }
    }

    initializeComponent()
  }, [])

  // Debug entries state changes
  useEffect(() => {
    console.log('📊 Entries state changed:', {
      entriesCount: (entries || []).length,
      entries: entries,
      firstEntry: entries?.[0]
    })
  }, [entries])

  // Watch for manual location input changes and update marker
  useEffect(() => {
    if (formData.location) {
      const locationParts = formData.location.split(',')
      if (locationParts.length === 2) {
        const lat = parseFloat(locationParts[0].trim())
        const lng = parseFloat(locationParts[1].trim())
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setMarkerPosition([lat, lng])
        }
      }
    } else {
      setMarkerPosition(null)
    }
  }, [formData.location])

  const handleAddEntry = async () => {
    if (
      !formData.district ||
      !formData.totalChildren ||
      !formData.outOfSchoolChildren ||
      !formData.date ||
      !formData.povertyPercentage ||
      !formData.disabilityPercentage ||
      !formData.otherPercentage
    ) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    const totalChildren = parseInt(formData.totalChildren) || 0;
    const outOfSchoolChildren = parseInt(formData.outOfSchoolChildren) || 0;
    if (outOfSchoolChildren > totalChildren) {
      showToast('Out of School Children should not be greater than Total Children', 'error');
      return;
    } else if (outOfSchoolChildren < 0) {
      showToast('Out of School Children should not be negative', 'error');
      return;
    }

    // Validation: Girls + Boys <= 100
    const girls = parseFloat(formData.girlsPercentage) || 0;
    const boys = parseFloat(formData.boysPercentage) || 0;
    if (girls + boys > 100) {
      showToast('Girls % and Boys % combined should not exceed 100%', 'error');
      return;
    }
    if (girls + boys < 100) {
      showToast('Girls % and Boys % combined should be 100%', 'error');
      return;
    }

    // Validation: Poverty + Disability + Other <= 100
    const poverty = parseFloat(formData.povertyPercentage) || 0;
    const disability = parseFloat(formData.disabilityPercentage) || 0;
    const other = parseFloat(formData.otherPercentage) || 0;
    if (poverty + disability + other > 100) {
      showToast('Poverty %, Disability %, and Other % combined should not exceed 100%', 'error');
      return;
    }
    if (poverty + disability + other < 100) {
      showToast('Poverty %, Disability %, and Other % combined should be 100%', 'error');
      return;
    }

    try {
      let transformedData;
      if (isEditMode && editingEntryId) {
        // Use markerPosition for lat/log in update
        transformedData = transformFormDataForAPI(formData, markerPosition, true);
        await updateEntry(editingEntryId, transformedData);
        setIsEditMode(false);
        setEditingEntryId(null);
      } else {
        // Use form location for lat/log in add
        transformedData = transformFormDataForAPI(formData, null, false);
        await createEntry(transformedData);
      }

      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);

      handleReset();
      setShowForm(false);
    } catch (error) {
      console.error('Error in handleAddEntry:', error);
    }
  }

  const handleEditEntry = async (entryId) => {
    try {
      const entryData = await getEntryById(entryId)
      const entry = entryData.entry || entryData

      setFormData({
        district: entry.district || '',
        totalChildren: entry.totalChildren || '',
        outOfSchoolChildren: entry.outOfSchoolChildren || '',
        girlsPercentage: entry.girlsPercentage || '',
        boysPercentage: entry.boysPercentage || '',
        povertyPercentage: entry.povertyPercentage || '',
        disabilityPercentage: entry.disabilityPercentage || '',
        otherPercentage: entry.otherPercentage || '',
        programType: entry.programType || '',
        date: entry.date || '',
        unioncouncil: entry.unioncouncil || '',
        villagecouncil: entry.villagecouncil || '',
        pk: entry.pk || '',
        national: entry.national || '',
        location: entry.lat+","+entry.log || '',
        tehsil: entry.tehsil || ''
      })

      // Parse existing location coordinates and set marker position
      if (entry.location) {
        const locationParts = entry.location.split(',')
        if (locationParts.length === 2) {
          const lat = parseFloat(locationParts[0].trim())
          const lng = parseFloat(locationParts[1].trim())
          if (!isNaN(lat) && !isNaN(lng)) {
            setMarkerPosition([lat, lng])
          }
        }
      } else {
        setMarkerPosition(null)
      }

      setIsEditMode(true)
      setEditingEntryId(entryId)
      setShowForm(true)
    } catch (error) {
      console.error('Error in handleEditEntry:', error)
    }
  }

  const handleDeleteEntry = (entryId) => {
    // Find the entry to get its title for the confirmation message
    const entry = entries.find(e => (e.id || e._id) === entryId)
    const entryTitle = entry ? `${entry.district} - ${entry.programType}` : null

    setDeleteConfirmation({
      visible: true,
      entryId,
      entryTitle
    })
  }

  const confirmDelete = async () => {
    try {
      await deleteEntry(deleteConfirmation.entryId)
      setDeleteConfirmation({ visible: false, entryId: null, entryTitle: null })
    } catch (error) {
      console.error('Error in confirmDelete:', error)
      setDeleteConfirmation({ visible: false, entryId: null, entryTitle: null })
    }
  }

  const cancelDelete = () => {
    setDeleteConfirmation({ visible: false, entryId: null, entryTitle: null })
  }

  const handleReset = () => {
    setFormData({
      district: '',
      totalChildren: '',
      outOfSchoolChildren: '',
      girlsPercentage: '',
      boysPercentage: '',
      povertyPercentage: '',
      disabilityPercentage: '',
      otherPercentage: '',
      programType: '',
      date: '',
      unioncouncil: '',
      villagecouncil: '',
      pk: '',
      national: '',
      location: '',
      tehsil: ''
    })
    setMarkerPosition(null) // Reset map marker
    setShowSuccessMessage(false)
    setIsEditMode(false)
    setEditingEntryId(null)
  }

  const handleCancelEdit = () => {
    handleReset()
    setShowForm(false)
  }

  const handleShowForm = () => {
    setShowForm(true)
    setIsEditMode(false)
    setEditingEntryId(null)
  }

  const handleUploadCSV = () => {
    console.log('Uploading CSV')
  }

  // Authentication helpers
  const checkAuthentication = () => {
    const authStatus = isUserAuthenticated()
    const token = getAuthToken()
    console.log('🔐 Authentication Status:', { authStatus, hasToken: !!token })
    setIsAuthenticated(authStatus && !!token)
    return authStatus && !!token
  }

  const handleLogin = () => {
    navigate('/login')
  }



  // Debug entries state and filtering
  console.log('🔍 Debug Info:')
  console.log('  - entries state:', entries)
  console.log('  - entries length:', (entries || []).length)
  console.log('  - searchTerm:', searchTerm)
  console.log('  - currentPage:', currentPage)

  const filteredEntries = (entries || []).filter(entry => {
    if (!entry) {
      console.log('⚠️ Found null/undefined entry')
      return false
    }

    // If no search term, return all entries
    if (!searchTerm || searchTerm.trim() === '') {
      return true
    }

    const searchLower = searchTerm.toLowerCase()
    const matchesDistrict = entry?.district?.toLowerCase().includes(searchLower)
    const matchesProgram = entry?.programType?.toLowerCase().includes(searchLower)
    const matchesDate = entry?.date?.toLowerCase().includes(searchLower)

    const matches = matchesDistrict || matchesProgram || matchesDate

    if (matches) {
      console.log('✅ Entry matches search:', entry.district, entry.programType, entry.date)
    }

    return matches
  })

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
    console.log('� Search term changed, reset to page 1')
  }, [searchTerm])

  // Get paginated entries for current page
  const paginatedEntries = getPaginatedEntries(filteredEntries)
  const totalPages = getTotalPages(filteredEntries.length)
  const paginationInfo = getPaginationInfo(filteredEntries.length)

  console.log('📊 Filtered entries:', filteredEntries.length)
  console.log('📄 Paginated entries for page', currentPage, ':', paginatedEntries.length)
  console.log('📄 Total pages:', totalPages)
  console.log('📄 Pagination info:', paginationInfo)

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-6 px-2 md:px-6">
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(t => ({ ...t, visible: false }))}
        />
      )}

      <DeleteConfirmationAlert
        isVisible={deleteConfirmation.visible}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        entryTitle={deleteConfirmation.entryTitle}
      />

      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
              <p className="text-gray-600 mt-1">Manage your entries and data records</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isAuthenticated
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isAuthenticated ? '🔓 Authenticated' : '🔒 Not Authenticated'}
                </span>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full md:w-64"
                />
              </div>



              {!isAuthenticated ? (
                <button
                  onClick={handleLogin}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200"
                >
                  🔑 Login
                </button>
              ) : (
                <>
                  <button
                    onClick={handleShowForm}
                    className="bg-[#4A90E2] hover:bg-[#2c5aa0] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    Add Entry
                  </button>


                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="max-w-3xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {isEditMode ? 'Edit Entry' : 'Add New Entry'}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>


            <form className="w-full">

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                  placeholder="Mardan"
                />
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="flex flex-col gap-4">

         {/* Total Children */}
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Children</label>
                    <input
                      type="number"
                      value={formData.totalChildren}
                      onChange={(e) => handleInputChange('totalChildren', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="12000"
                      min="0"
                    />
                  </div>

                  {/* Girls % */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Girls %</label>
                    <input
                      type="number"
                      value={formData.girlsPercentage}
                      onChange={(e) => handleInputChange('girlsPercentage', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="60"
                      min="0"
                      max="100"
                    />
                  </div>

                  {/* Program Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program Type</label>
                    <input
                      type="text"
                      value={formData.programType}
                      onChange={(e) => handleInputChange('programType', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="e.g. Accelerated Learning Program"
                    />
                  </div>
                  {/* Union Council */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Union Council</label>
                    <input
                      type="text"
                      value={formData.unioncouncil}
                      onChange={(e) => handleInputChange('unioncouncil', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Union Council"
                    />
                  </div>
                  {/* PK */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PK constituency (Provincial Assembly)</label>
                    <input
                      type="text"
                      value={formData.pk}
                      onChange={(e) => handleInputChange('pk', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Provincial Assembly"
                    />
                  </div>
                  {/* Tehsil */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tehsil</label>
                    <input
                      type="text"
                      value={formData.tehsil}
                      onChange={(e) => handleInputChange('tehsil', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Tehsil"
                    />
                  </div>
                </div>
                {/* Right Column */}
                <div className="flex flex-col gap-4">
                       {/* Out-of-School Children */}
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Out-of-School Children</label>
                    <input
                      type="number"
                      value={formData.outOfSchoolChildren}
                      onChange={(e) => handleInputChange('outOfSchoolChildren', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="4500"
                      min="0"
                    />
                  </div>

                  {/* Boys % */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Boys %</label>
                    <input
                      type="number"
                      value={formData.boysPercentage}
                      onChange={(e) => handleInputChange('boysPercentage', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="40"
                      min="0"
                      max="100"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg shadow-sm"
                    />
                  </div>
                  {/* Village Council */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Village Council</label>
                    <input
                      type="text"
                      value={formData.villagecouncil}
                      onChange={(e) => handleInputChange('villagecouncil', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Village Council"
                    />
                  </div>
                  {/* National */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NA constituency (National Assembly)</label>
                    <input
                      type="text"
                      value={formData.national}
                      onChange={(e) => handleInputChange('national', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="National Assembly"
                    />
                  </div>
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Add GPS Location"
                      disabled={isEditMode}
                    />
                    {isEditMode ? (
                      <span className="text-xs text-gray-500">In edit mode, location can only be changed by selecting a new point on the map below.</span>
                    ) : (
                      <span className="text-xs text-gray-500">Enter coordinates or select a point on the map below.</span>
                    )}
                  </div>
                </div>
              </div>
               {/* Interactive Map */}
                <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Click on the map to select location
                        </label>
                        {markerPosition && (
                          <button
                            type="button"
                            onClick={() => {
                              setMarkerPosition(null)
                              handleInputChange('location', '')
                            }}
                            className="text-xs text-red-600 hover:text-red-800 underline"
                          >
                            Clear location
                          </button>
                        )}
                      </div>
                      <InteractiveMap />
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                          Click anywhere on the map to automatically populate coordinates
                        </p>
                        {markerPosition && (
                          <p className="text-xs text-green-600 font-medium">
                            📍 Location selected
                          </p>
                        )}
                      </div>
                    </div>

              {/* Row: Barriers */}
              <div className="flex flex-col md:flex-row md:space-x-6 mb-6 pt-4">
                <div className="flex-1 mb-4 md:mb-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Poverty %</label>
                  <input
                    type="number"
                    value={formData.povertyPercentage}
                    onChange={(e) => handleInputChange('povertyPercentage', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                    placeholder="45"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex-1 mb-4 md:mb-0">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disability %</label>
                  <input
                    type="number"
                    value={formData.disabilityPercentage}
                    onChange={(e) => handleInputChange('disabilityPercentage', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                    placeholder="15"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other %</label>
                  <input
                    type="number"
                    value={formData.otherPercentage}
                    onChange={(e) => handleInputChange('otherPercentage', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg placeholder-gray-400 shadow-sm"
                    placeholder="25"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="mb-4">
                  <span className="text-green-600 text-base">
                    {isEditMode ? 'Entry updated successfully!' : 'Entry added successfully!'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row md:space-x-4 mt-6">
                <button
                  onClick={handleAddEntry}
                  type="button"
                  disabled={loading}
                  className="w-full md:w-auto mb-2 md:mb-0 bg-[#4A90E2] hover:bg-[#2c5aa0] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-2 rounded-lg font-medium text-lg shadow-sm transition-colors duration-200 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {isEditMode ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Entry' : 'Add Entry'
                  )}
                </button>

                <button
                  onClick={handleReset}
                  type="button"
                  disabled={loading}
                  className="w-full md:w-auto mb-2 md:mb-0 bg-white border border-blue-200 hover:bg-blue-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-[#2c5aa0] px-8 py-2 rounded-lg font-medium text-lg shadow-sm transition-colors duration-200"
                >
                  Reset
                </button>

                <button
                  onClick={handleUploadCSV}
                  type="button"
                  disabled={loading}
                  className="w-full md:w-auto bg-white border border-blue-200 hover:bg-blue-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-[#2c5aa0] px-8 py-2 rounded-lg font-medium text-lg shadow-sm transition-colors duration-200 flex items-center justify-center"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload CSV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Entries Table */}
      {!showForm && (
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Data Entries ({filteredEntries.length} total{filteredEntries.length > itemsPerPage ? `, showing ${paginatedEntries.length} on page ${currentPage}` : ''})
              </h3>
              {loading && (
                <div className="flex items-center text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 mr-2"></div>
                  Loading...
                </div>
              )}
            </div>

            {/* Debug table rendering */}
            {console.log('🎨 Rendering table with:', {
              filteredEntriesLength: filteredEntries.length,
              entriesLength: (entries || []).length,
              showingEmptyState: filteredEntries.length === 0
            })}

            {!isAuthenticated ? (
              <div className="text-center py-12">
                <div className="text-red-400 text-lg mb-2">🔒 Authentication Required</div>
                <p className="text-gray-500 mb-4">
                  You need to be logged in to view and manage data entries.
                </p>
                <button
                  onClick={handleLogin}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Go to Login
                </button>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No entries found</div>
                <p className="text-gray-500">
                  {(entries || []).length === 0
                    ? "Start by adding your first entry"
                    : "Try adjusting your search criteria"
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">District</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Children</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Out of School</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Girls %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Boys %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poverty %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Disability %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Other %</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Union Council</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Village Council</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PK constituency (Provincial Assembly)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tehsil</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NA constituency (National Assembly)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedEntries.map((entry) => (
                      <tr key={entry.id || entry._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.district}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.totalChildren}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.outOfSchoolChildren}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.girlsPercentage}%</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.boysPercentage}%</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.povertyPercentage}%</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.disabilityPercentage}%</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.otherPercentage}%</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.programType}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.unioncouncil}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.villagecouncil}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.pk}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.tehsil}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.national}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.lat+" , "+entry.log}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEditEntry(entry.id || entry._id)}
                              disabled={loading}
                              className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id || entry._id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {isAuthenticated && filteredEntries.length > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Pagination Info */}
                <div className="text-sm text-gray-700">
                  Showing {paginationInfo.startItem}-{paginationInfo.endItem} of {paginationInfo.totalItems} entries
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current page
                      const showPage =
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)

                      if (!showPage && pageNum === 2 && currentPage > 4) {
                        return <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                      }
                      if (!showPage && pageNum === totalPages - 1 && currentPage < totalPages - 3) {
                        return <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                      }
                      if (!showPage) return null

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                {/* Go to Page */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Go to page:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={goToPage}
                    onChange={(e) => setGoToPage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
                    className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={currentPage.toString()}
                  />
                  <button
                    onClick={handleGoToPage}
                    disabled={!goToPage || loading}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Go
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DataManagement
