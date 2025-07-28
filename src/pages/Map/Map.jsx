import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import { Search, MapPin, Filter, Download, RefreshCw, Eye, Navigation, ChevronDown } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import Toast from '../../components/Toast'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Custom marker icons
const defaultIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// School icon (blue with graduation cap symbol)
const schoolIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#2563eb"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      <!-- Graduation cap -->
      <path d="M6 11.5L12.5 8.5L19 11.5L12.5 14.5L6 11.5Z" fill="#2563eb"/>
      <rect x="11.5" y="11.5" width="2" height="4" fill="#2563eb"/>
      <path d="M18 12v3c0 1-2.5 2-5.5 2s-5.5-1-5.5-2v-3" stroke="#2563eb" stroke-width="0.8" fill="none"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41]
})

// Madrasa icon (green with mosque dome and minaret)
const madrasaIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#16a34a"/>
      <circle cx="12.5" cy="12.5" r="8" fill="white"/>
      <!-- Mosque dome -->
      <path d="M12.5 7.5C10.5 7.5 9 9 9 11v6h7v-6C16 9 14.5 7.5 12.5 7.5Z" fill="#16a34a"/>
      <ellipse cx="12.5" cy="11" rx="3.5" ry="2" fill="#16a34a"/>
      <!-- Minaret -->
      <rect x="17" y="8" width="1" height="6" fill="#16a34a"/>
      <circle cx="17.5" cy="7.5" r="0.8" fill="#16a34a"/>
      <!-- Crescent -->
      <path d="M12.5 6.5C12.8 6.2 13.2 6.2 13.5 6.5C13.2 6.8 12.8 6.8 12.5 6.5Z" fill="#16a34a"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [41, 41]
})

// Selected school icon (larger, red background)
const selectedSchoolIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="30" height="48" viewBox="0 0 30 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 15 15 33 15 33s15-18 15-33C30 6.7 23.3 0 15 0z" fill="#ef4444"/>
      <circle cx="15" cy="15" r="10" fill="white"/>
      <!-- Graduation cap -->
      <path d="M7 14L15 10L23 14L15 18L7 14Z" fill="#ef4444"/>
      <rect x="14" y="14" width="2" height="5" fill="#ef4444"/>
      <path d="M22 15v4c0 1.2-3 2.4-7 2.4s-7-1.2-7-2.4v-4" stroke="#ef4444" stroke-width="1" fill="none"/>
    </svg>
  `),
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [48, 48]
})

// Selected madrasa icon (larger, red background)
const selectedMadrasaIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="30" height="48" viewBox="0 0 30 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 0C6.7 0 0 6.7 0 15c0 15 15 33 15 33s15-18 15-33C30 6.7 23.3 0 15 0z" fill="#ef4444"/>
      <circle cx="15" cy="15" r="10" fill="white"/>
      <!-- Mosque dome -->
      <path d="M15 9C12.5 9 10.5 11 10.5 13.5v7.5h9v-7.5C19.5 11 17.5 9 15 9Z" fill="#ef4444"/>
      <ellipse cx="15" cy="13.5" rx="4.5" ry="2.5" fill="#ef4444"/>
      <!-- Minaret -->
      <rect x="21" y="10" width="1.2" height="7" fill="#ef4444"/>
      <circle cx="21.6" cy="9" r="1" fill="#ef4444"/>
      <!-- Crescent -->
      <path d="M15 7.5C15.4 7.1 15.9 7.1 16.3 7.5C15.9 7.9 15.4 7.9 15 7.5Z" fill="#ef4444"/>
    </svg>
  `),
  iconSize: [30, 48],
  iconAnchor: [15, 48],
  popupAnchor: [1, -40],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [48, 48]
})

// Dimmed school icon
const dimmedSchoolIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="20" height="33" viewBox="0 0 20 33" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.5 0 0 4.5 0 10c0 10 10 23 10 23s10-13 10-23C20 4.5 15.5 0 10 0z" fill="#9ca3af" opacity="0.6"/>
      <circle cx="10" cy="10" r="6.5" fill="white" opacity="0.8"/>
      <!-- Graduation cap -->
      <path d="M5 9.5L10 7L15 9.5L10 12L5 9.5Z" fill="#9ca3af" opacity="0.6"/>
      <rect x="9.2" y="9.5" width="1.6" height="3.2" fill="#9ca3af" opacity="0.6"/>
      <path d="M14 10.5v2.5c0 0.8-2 1.6-4 1.6s-4-0.8-4-1.6v-2.5" stroke="#9ca3af" stroke-width="0.6" fill="none" opacity="0.6"/>
    </svg>
  `),
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [33, 33],
  shadowAnchor: [10, 33]
})

// Dimmed madrasa icon
const dimmedMadrasaIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="20" height="33" viewBox="0 0 20 33" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 0C4.5 0 0 4.5 0 10c0 10 10 23 10 23s10-13 10-23C20 4.5 15.5 0 10 0z" fill="#9ca3af" opacity="0.6"/>
      <circle cx="10" cy="10" r="6.5" fill="white" opacity="0.8"/>
      <!-- Mosque dome -->
      <path d="M10 6.5C8.2 6.5 6.8 7.9 6.8 9.7v5h6.4v-5C13.2 7.9 11.8 6.5 10 6.5Z" fill="#9ca3af" opacity="0.6"/>
      <ellipse cx="10" cy="9.7" rx="3.2" ry="1.6" fill="#9ca3af" opacity="0.6"/>
      <!-- Minaret -->
      <rect x="14.5" y="7.5" width="0.8" height="4.5" fill="#9ca3af" opacity="0.6"/>
      <circle cx="14.9" cy="6.8" r="0.6" fill="#9ca3af" opacity="0.6"/>
      <!-- Crescent -->
      <path d="M10 5.8C10.3 5.5 10.6 5.5 10.9 5.8C10.6 6.1 10.3 6.1 10 5.8Z" fill="#9ca3af" opacity="0.6"/>
    </svg>
  `),
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  shadowSize: [33, 33],
  shadowAnchor: [10, 33]
})

// Map event handler component for tracking map changes
const MapEventHandler = ({ setMapCenter, setMapZoom }) => {
  useMapEvents({
    moveend: (e) => {
      const map = e.target
      setMapCenter([map.getCenter().lat, map.getCenter().lng])
    },
    zoomend: (e) => {
      const map = e.target
      setMapZoom(map.getZoom())
    }
  })
  return null
}

// Map controller for smooth transitions
const MapController = ({ center, zoom }) => {
  const map = useMapEvents({})

  React.useEffect(() => {
    // Prevent running before map is initialized
    if (!map || typeof map.getCenter !== 'function' || typeof map.getZoom !== 'function') return;
    if (center && zoom) {
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      // Only fly if center/zoom are different
      if (
        currentCenter.lat !== center[0] ||
        currentCenter.lng !== center[1] ||
        currentZoom !== zoom
      ) {
        map.flyTo(center, zoom, {
          duration: 1.5,
          easeLinearity: 0.25
        })
      }
    }
  }, [center, zoom, map])

  return null
}

// Function to get the appropriate icon based on school type and selection state
const getMarkerIcon = (district, selectedDistrictName) => {
  const schoolType = district.schoolType || 'School'
  const isSelected = selectedDistrictName !== 'all' && district.district === selectedDistrictName
  const isDimmed = selectedDistrictName !== 'all' && district.district !== selectedDistrictName

  if (isDimmed) {
    // Return dimmed icons based on school type
    return schoolType === 'Madrasa' ? dimmedMadrasaIcon : dimmedSchoolIcon
  } else if (isSelected) {
    // Return selected icons based on school type
    return schoolType === 'Madrasa' ? selectedMadrasaIcon : selectedSchoolIcon
  } else {
    // Return normal icons based on school type
    return schoolType === 'Madrasa' ? madrasaIcon : schoolIcon
  }
}

const Map = () => {
  // State management
  const [districts, setDistricts] = useState([])
  const [filteredDistricts, setFilteredDistricts] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedDistrictName, setSelectedDistrictName] = useState('all') // For dropdown - now using district name
  const [uniqueDistricts, setUniqueDistricts] = useState([]) // For dropdown options
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [mapCenter, setMapCenter] = useState([34.0151, 71.5249]) // Default to Peshawar, Pakistan
  const [mapZoom, setMapZoom] = useState(8)

  // Table filter dropdown state
  const [tableDistrictFilter, setTableDistrictFilter] = useState('all')

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' })

  const showToast = (message, type = 'info') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast({ show: false, message: '', type: 'info' }), 3000)
  }

  // Fetch district data from API
  const fetchDistrictData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES)

      // Handle different response structures
      let entriesData = []
      if (response.data?.entries && Array.isArray(response.data.entries)) {
        entriesData = response.data.entries
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        entriesData = response.data.data
      } else if (Array.isArray(response.data)) {
        entriesData = response.data
      }

      // Transform and filter data to only include entries with valid coordinates
      const validDistricts = entriesData
        .filter(entry => {
          const hasValidCoords = entry.lat !== undefined && entry.log !== undefined &&
                               entry.lat !== null && entry.log !== null &&
                               entry.lat !== '' && entry.log !== '' &&
                               !isNaN(parseFloat(entry.lat)) && !isNaN(parseFloat(entry.log))
          return hasValidCoords
        })
        .map(entry => ({
          id: entry.id || entry._id,
          district: entry.district || 'Unknown District',
          coordinates: [parseFloat(entry.lat), parseFloat(entry.log)],
          coordinatesText: `${entry.lat}, ${entry.log}`,
          totalChildren: entry.totalChildren || 0,
          outOfSchoolChildren: entry.outOfSchoolChildren || 0,
          outOfSchoolRate: entry.totalChildren > 0 ?
            ((entry.outOfSchoolChildren / entry.totalChildren) * 100).toFixed(1) : 0,
          girlsPercentage: entry.girlsPercentage || 0,
          boysPercentage: entry.boysPercentage || 0,
          povertyPercentage: entry.povertyPercentage || 0,
          disabilityPercentage: entry.disabilityPercentage || 0,
          otherPercentage: entry.otherPercentage || 0,
          programType: entry.programType || 'N/A',
          date: entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A',
          unioncouncil: entry.unioncouncil || 'N/A',
          villagecouncil: entry.villagecouncil || 'N/A',
          tehsil: entry.tehsil || 'N/A',
          pk: entry.pk || 'N/A',
          national: entry.national || 'N/A',
          schoolType: entry.schoolType || 'School' // Default to 'School' if not specified
        }))

      setDistricts(validDistricts)
      setFilteredDistricts(validDistricts)

      // Create unique districts for dropdown
      const districtGroups = validDistricts.reduce((acc, district) => {
        const districtName = district.district
        if (!acc[districtName]) {
          acc[districtName] = []
        }
        acc[districtName].push(district)
        return acc
      }, {})

      const uniqueDistrictsList = Object.keys(districtGroups)
        .sort()
        .map(districtName => ({
          name: districtName,
          count: districtGroups[districtName].length,
          locations: districtGroups[districtName],
          totalChildren: districtGroups[districtName].reduce((sum, d) => sum + d.totalChildren, 0),
          totalOutOfSchool: districtGroups[districtName].reduce((sum, d) => sum + d.outOfSchoolChildren, 0)
        }))

      setUniqueDistricts(uniqueDistrictsList)

      // Reset dropdown selection when data is refreshed
      setSelectedDistrictName('all')
      setSelectedDistrict(null)

      if (validDistricts.length > 0) {
        const uniqueCount = uniqueDistrictsList.length
        showToast(`Loaded ${validDistricts.length} locations across ${uniqueCount} districts`, 'success')
      } else {
        showToast('No districts with valid coordinates found', 'warning')
      }

    } catch (error) {
      console.error('Error fetching district data:', error)
      setError('Failed to load district data')
      showToast('Failed to load district data', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Search functionality
  const handleSearch = (term) => {
    setSearchTerm(term)
    applyFilters(term, selectedDistrictName)
  }

  // Apply filters based on search term and selected district name
  const applyFilters = (searchTerm, districtName) => {
    let filtered = districts

    // Filter by selected district name
    if (districtName !== 'all') {
      filtered = filtered.filter(district => district.district === districtName)
    }

    // Filter by search term
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(district =>
        district.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        district.unioncouncil.toLowerCase().includes(searchTerm.toLowerCase()) ||
        district.tehsil.toLowerCase().includes(searchTerm.toLowerCase()) ||
        district.programType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredDistricts(filtered)
  }

  // Table dropdown filter handler
  const handleTableDistrictFilter = (districtName) => {
    setTableDistrictFilter(districtName)
    let filtered = districts
    if (districtName !== 'all') {
      filtered = filtered.filter(d => d.district === districtName)
    }
    // Also apply search term
    if (searchTerm && searchTerm.trim()) {
      filtered = filtered.filter(district =>
        district.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
        district.unioncouncil.toLowerCase().includes(searchTerm.toLowerCase()) ||
        district.tehsil.toLowerCase().includes(searchTerm.toLowerCase()) ||
        district.programType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredDistricts(filtered)
  }

  // Handle dropdown district selection
  const handleDropdownDistrictSelect = (districtName) => {
    setSelectedDistrictName(districtName)

    if (districtName === 'all') {
      // Show all districts
      setSelectedDistrict(null)
      setMapCenter([34.0151, 71.5249])
      setMapZoom(8)
      showToast('Showing all districts', 'info')
    } else {
      // Find all locations for the selected district name
      const districtLocations = districts.filter(d => d.district === districtName)
      if (districtLocations.length > 0) {
        // Don't change map center/zoom - keep current view
        setSelectedDistrict({
          district: districtName,
          locations: districtLocations,
          count: districtLocations.length,
          totalChildren: districtLocations.reduce((sum, d) => sum + d.totalChildren, 0),
          totalOutOfSchool: districtLocations.reduce((sum, d) => sum + d.outOfSchoolChildren, 0),
          outOfSchoolRate: districtLocations.length > 0 ?
            ((districtLocations.reduce((sum, d) => sum + d.outOfSchoolChildren, 0) /
              districtLocations.reduce((sum, d) => sum + d.totalChildren, 0)) * 100).toFixed(1) : 0
        })
        showToast(`Showing ${districtLocations.length} locations for ${districtName}`, 'info')
      }
    }

    // Apply filters
    applyFilters(searchTerm, districtName)
  }

  // Handle district selection from table
  const handleDistrictSelect = (district) => {
    setSelectedDistrict(district)
    setSelectedDistrictName(district.district)
    setMapCenter(district.coordinates)
    setMapZoom(12)
    applyFilters(searchTerm, district.district)
    showToast(`Selected ${district.district}`, 'info')
  }

  // Handle map marker click
  const handleMarkerClick = (district) => {
    setSelectedDistrict(district)
    setSelectedDistrictName(district.district)
    applyFilters(searchTerm, district.district)
    showToast(`Selected ${district.district}`, 'info')
  }

  // Center map on selected district
  const centerMapOnDistrict = (district) => {
    setMapCenter(district.coordinates)
    setMapZoom(14)
    setSelectedDistrict(district)
    showToast(`Centered map on ${district.district}`, 'info')
  }

  // Reset map view
  const resetMapView = () => {
    setMapCenter([34.0151, 71.5249])
    setMapZoom(8)
    setSelectedDistrict(null)
    setSelectedDistrictName('all')
    applyFilters(searchTerm, 'all')
    showToast('Map view reset', 'info')
  }

  // Load data on component mount
  useEffect(() => {
    fetchDistrictData()
  }, [])

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
      <div className="p-4 md:p-6 bg-[#F8F9FA] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                Districts Map
              </h1>
              <p className="text-gray-600 mt-1">
                Interactive map showing district locations and data
              </p>
            </div>
            <div className="flex items-center gap-3">
              {selectedDistrict && (
                <button
                  onClick={resetMapView}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <Navigation className="w-4 h-4" />
                  Reset View
                </button>
              )}
              <button
                onClick={fetchDistrictData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search districts, union councils, tehsils, or programs..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>{filteredDistricts.length} of {districts.length} districts</span>
              </div>
              {!loading && districts.length > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>{uniqueDistricts.length} Districts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Total Children: {districts.reduce((sum, d) => sum + d.totalChildren, 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Out of School: {districts.reduce((sum, d) => sum + d.outOfSchoolChildren, 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600">Loading district data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 text-center">
            <div className="text-red-600 mb-4">
              <MapPin className="w-12 h-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Error Loading Data</h3>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={fetchDistrictData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Main Content - Map and Table */}
        {!loading && !error && (
          <div className="mb-6 gap-6">
            {/* Map Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
              <div className="flex flex-col gap-4 mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Interactive Map</h2>
                  {selectedDistrict && selectedDistrictName !== 'all' && (
                    <div className="text-sm text-blue-600 font-medium">
                      📍 {selectedDistrict.district} ({selectedDistrict.count} location{selectedDistrict.count > 1 ? 's' : ''})
                    </div>
                  )}
                </div>

                {/* District Dropdown Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <label className="text-sm font-medium text-gray-700">
                      Select District:
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedDistrictName}
                      onChange={(e) => handleDropdownDistrictSelect(e.target.value)}
                      disabled={loading || uniqueDistricts.length === 0}
                      className={`appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:min-w-48 text-sm transition-all duration-200 ${
                        loading || uniqueDistricts.length === 0
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : 'hover:border-gray-400'
                      }`}
                    >
                      {loading ? (
                        <option value="">Loading districts...</option>
                      ) : uniqueDistricts.length === 0 ? (
                        <option value="">No districts available</option>
                      ) : (
                        <>
                          <option value="all">
                            All Districts ({uniqueDistricts.length} districts, {districts.length} locations)
                          </option>
                          {uniqueDistricts.map((district) => (
                            <option key={district.name} value={district.name}>
                              {district.name} ({district.count} location{district.count > 1 ? 's' : ''})
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-200 ${
                      loading ? 'text-gray-300' : 'text-gray-400'
                    }`} />
                  </div>

                  {/* District Stats */}
                  {selectedDistrictName !== 'all' && selectedDistrict && (
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 animate-fadeIn">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>Showing {selectedDistrict.count} location{selectedDistrict.count > 1 ? 's' : ''} for {selectedDistrict.district}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Total: {selectedDistrict.totalChildren}</span>
                      </div>
<div className="flex items-center gap-1">
  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
  <span>
    Out of School: {
      selectedDistrict.locations
        ? selectedDistrict.locations.reduce((sum, d) => sum + (d.outOfSchoolChildren || 0), 0)
        : selectedDistrict.outOfSchoolChildren
    }
  </span>
</div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Rate: {selectedDistrict.outOfSchoolRate}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapEventHandler
                    setMapCenter={setMapCenter}
                    setMapZoom={setMapZoom}
                  />
                  <MapController center={mapCenter} zoom={mapZoom} />
                  {filteredDistricts.map((district) => {
                    // Get the appropriate icon based on school type and selection state
                    const markerIcon = getMarkerIcon(district, selectedDistrictName)

                    return (
                      <Marker
                        key={district.id}
                        position={district.coordinates}
                        icon={markerIcon}
                        eventHandlers={{
                          click: () => handleMarkerClick(district)
                        }}
                      >
                      <Popup>
                        <div className=" p-2 min-w-64">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {district.district}
                          </h3>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Coordinates:</span>
                              <span className="font-mono text-blue-600">
                                {district.coordinatesText}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className={`font-medium ${district.schoolType === 'Madrasa' ? 'text-green-600' : 'text-blue-600'}`}>
                                {district.schoolType || 'School'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total Children:</span>
                              <span className="font-medium">{district.totalChildren}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Out of School:</span>
                              <span className="font-medium text-red-600">
                                {district.outOfSchoolChildren} ({district.outOfSchoolRate}%)
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Program:</span>
                              <span className="font-medium">{district.programType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Union Council:</span>
                              <span>{district.unioncouncil}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tehsil:</span>
                              <span>{district.tehsil}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDistrictSelect(district)}
                            className="mt-3 w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                          >
                            Select District
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                    )
                  })}
                </MapContainer>
              </div>

              {selectedDistrict && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-medium text-blue-900 mb-2">{selectedDistrict.district}</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-blue-700">Coordinates:</span>
                      <span className="ml-1 font-mono">{selectedDistrict.coordinatesText}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Type:</span>
                      <span className={`ml-1 font-medium ${selectedDistrict.schoolType === 'Madrasa' ? 'text-green-700' : 'text-blue-700'}`}>
                        {selectedDistrict.schoolType || 'School'}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-700">Total Children:</span>
                      <span className="ml-1">{selectedDistrict.totalChildren}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Out of School:</span>
                      <span className="ml-1">{selectedDistrict.outOfSchoolChildren} ({selectedDistrict.outOfSchoolRate}%)</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Program:</span>
                      <span className="ml-1">{selectedDistrict.programType}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

         {/* Table Section */}
        <section>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">District Data</h2>
              </div>

          {/* Table  */}

              {filteredDistricts.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No districts found</p>
                  <p className="text-sm">
                    {searchTerm ? 'Try adjusting your search terms' : 'No districts with valid coordinates available'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          District
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Coordinates
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Children
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Out of School
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Program
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredDistricts.map((district) => (
                        <tr
                          key={district.id}
                          className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                            selectedDistrict?.id === district.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => handleDistrictSelect(district)}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {district.district}
                              </div>
                              <div className="text-sm text-gray-500">
                                {district.tehsil} • {district.unioncouncil}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              district.schoolType === 'Madrasa'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {district.schoolType || 'School'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-blue-600">
                              {district.coordinatesText}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {district.totalChildren.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {district.outOfSchoolChildren.toLocaleString()}
                            </div>
                            <div className="text-xs text-red-600">
                              {district.outOfSchoolRate}% rate
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {district.programType}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDistrictSelect(district)
                                }}
                                className="text-blue-600 hover:text-blue-900 transition-colors flex items-center gap-1"
                              >
                                <Eye className="w-3 h-3" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  centerMapOnDistrict(district)
                                }}
                                className="text-green-600 hover:text-green-900 transition-colors flex items-center gap-1"
                              >
                                <Navigation className="w-3 h-3" />
                                Center
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            </section>

        {/* Toast Component */}
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ show: false, message: '', type: 'info' })}
          />
        )}
      </div>
    </div>
    </>
  )
}

export default Map
