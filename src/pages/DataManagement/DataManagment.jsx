import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  const [userRole, setUserRole] = useState('')

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
    tehsil: '',
    age:'',
    totalTeachers:'',
    requiredFaculty:'',
    customProgramType: '',
    schoolType: ''
  })

  // Map state
  const [mapPosition, setMapPosition] = useState([34.0151, 71.5249]) // Default to Peshawar, Pakistan
  const [mapZoom, setMapZoom] = useState(8)
  const [markerPosition, setMarkerPosition] = useState(null)

  // Location search state
  const [locationSearchResults, setLocationSearchResults] = useState([])
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [locationSearchFeedback, setLocationSearchFeedback] = useState('')
  const [isSearchingLocation, setIsSearchingLocation] = useState(false)

  // Debounce timer ref for location search
  const searchTimeoutRef = useRef(null)

const handleInputChange = (field, value) => {
    if (field === 'programType' && value === 'Other') {
      setFormData(prev => ({...prev, customProgramType: ''}));
    }

    // Handle location search functionality with debouncing
    if (field === 'location') {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        handleLocationSearch(value);
      }, 500); // 500ms debounce delay
    }

    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Geographical location search functionality using Nominatim (OpenStreetMap)
  const handleLocationSearch = async (searchValue) => {
    if (!searchValue || searchValue.trim() === '') {
      setLocationSearchResults([]);
      setShowLocationSuggestions(false);
      setLocationSearchFeedback('');
      setIsSearchingLocation(false);
      return;
    }

    // Check if the input looks like coordinates (lat, lng format)
    const coordinatePattern = /^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*$/;
    if (coordinatePattern.test(searchValue.trim())) {
      // Handle coordinate input - don't search, just validate and update map
      const locationParts = searchValue.split(',');
      if (locationParts.length === 2) {
        const lat = parseFloat(locationParts[0].trim());
        const lng = parseFloat(locationParts[1].trim());
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setMarkerPosition([lat, lng]);
          setMapPosition([lat, lng]);
          setMapZoom(14);
          setLocationSearchFeedback('Coordinates entered manually');
          setTimeout(() => setLocationSearchFeedback(''), 3000);
        }
      }
      setLocationSearchResults([]);
      setShowLocationSuggestions(false);
      setIsSearchingLocation(false);
      return;
    }

    // If it's a location name, search using Nominatim geocoding service
    const searchTerm = searchValue.trim();
    if (searchTerm.length < 2) {
      setLocationSearchResults([]);
      setShowLocationSuggestions(false);
      setLocationSearchFeedback('');
      setIsSearchingLocation(false);
      return;
    }

    setIsSearchingLocation(true);
    setLocationSearchFeedback('Searching for location...');

    try {
      // Use Nominatim geocoding service (OpenStreetMap)
      // Focus search on Pakistan region for better results
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchTerm)}&` +
        `countrycodes=pk&` + // Focus on Pakistan
        `format=json&` +
        `limit=5&` +
        `addressdetails=1&` +
        `extratags=1`
      );

      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const results = await response.json();

      if (results && results.length > 0) {
        // Transform results for our UI
        const transformedResults = results.map((result, index) => ({
          id: `geocode-${index}`,
          display_name: result.display_name,
          name: result.name || result.display_name.split(',')[0],
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          type: result.type,
          importance: result.importance || 0,
          address: result.address || {}
        }));

        setLocationSearchResults(transformedResults);
        setShowLocationSuggestions(true);
        setLocationSearchFeedback(`Found ${transformedResults.length} location${transformedResults.length > 1 ? 's' : ''}`);
      } else {
        setLocationSearchResults([]);
        setShowLocationSuggestions(false);
        setLocationSearchFeedback('No locations found. Try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationSearchResults([]);
      setShowLocationSuggestions(false);
      setLocationSearchFeedback('Location search unavailable. Please enter coordinates manually.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  // Handle location selection from geocoding search results
  const handleLocationSelect = (selectedLocation) => {
    if (selectedLocation.lat && selectedLocation.lng) {
      const lat = selectedLocation.lat;
      const lng = selectedLocation.lng;

      // Update marker position
      setMarkerPosition([lat, lng]);

      // Update location field with coordinates
      const locationString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setFormData(prev => ({
        ...prev,
        location: locationString
      }));

      // Animate map to the selected location
      setMapPosition([lat, lng]);
      setMapZoom(14); // Zoom in to show the location clearly

      // Hide suggestions and show success feedback
      setShowLocationSuggestions(false);
      setLocationSearchFeedback(`Location found: ${selectedLocation.name}`);

      // Clear feedback after 3 seconds
      setTimeout(() => {
        setLocationSearchFeedback('');
      }, 3000);

      showToast(`Map centered on ${selectedLocation.name}`, 'success');
    }
  };

  // Map controller for smooth transitions - memoized to prevent unnecessary re-renders
  const MapController = React.memo(({ center, zoom }) => {
    const map = useMapEvents({});
    const lastCenterRef = useRef(null);
    const lastZoomRef = useRef(null);

    React.useEffect(() => {
      // Prevent running before map is initialized
      if (!map || typeof map.getCenter !== 'function' || typeof map.getZoom !== 'function') return;
      if (!center || !zoom) return;

      // Check if center or zoom actually changed
      const centerChanged = !lastCenterRef.current ||
        Math.abs(lastCenterRef.current[0] - center[0]) > 0.0001 ||
        Math.abs(lastCenterRef.current[1] - center[1]) > 0.0001;

      const zoomChanged = !lastZoomRef.current ||
        Math.abs(lastZoomRef.current - zoom) > 0.1;

      if (centerChanged || zoomChanged) {
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();

        // Only fly if map center/zoom are different from target
        if (
          Math.abs(currentCenter.lat - center[0]) > 0.0001 ||
          Math.abs(currentCenter.lng - center[1]) > 0.0001 ||
          Math.abs(currentZoom - zoom) > 0.1
        ) {
          map.flyTo(center, zoom, {
            duration: 1.5,
            easeLinearity: 0.25
          });
        }

        // Update refs
        lastCenterRef.current = center;
        lastZoomRef.current = zoom;
      }
    }, [center, zoom, map]);

    return null;
  });

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng
        setMarkerPosition([lat, lng])
        // Format coordinates and update location field
        const locationString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        setFormData(prev => ({
          ...prev,
          location: locationString
        }))
        // Clear search feedback when manually clicking
        setLocationSearchFeedback('');
        setShowLocationSuggestions(false);
      }
    })
    return null
  }

  // Interactive Map Component - memoized to prevent unnecessary re-renders
  const InteractiveMap = React.memo(() => {
    try {
      return (
        <div className="w-full h-64 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
          <MapContainer
            center={mapPosition}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            key={`map-${mapPosition[0]}-${mapPosition[1]}-${mapZoom}`} // Prevent unnecessary re-mounts
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapController center={mapPosition} zoom={mapZoom} />
            <MapClickHandler />
            {markerPosition && (
              <Marker position={markerPosition} />
            )}
          </MapContainer>
        </div>
      )
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Error rendering map:', error)
      }
      return (
        <div className="w-full h-64 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>Map could not be loaded</p>
            <p className="text-sm">Please check your internet connection</p>
          </div>
        </div>
      )
    }
  })

  // Transform form data to match backend schema with correct data types
const transformFormDataForAPI = (data, markerPosition = null, isEdit = false) => {
    const programType = data.programType === 'Other' ? data.customProgramType : data.programType;
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

    const totalChildren = parseInt(data.totalChildren) || 0;
    const calculatedRequiredFaculty = Math.floor(totalChildren / 40);

    return {
      district: data.district,
      totalChildren: parseInt(data.totalChildren) || 0,
      outOfSchoolChildren: parseInt(data.outOfSchoolChildren) || 0,
      girlsPercentage: parseFloat(data.girlsPercentage) || 0,
      boysPercentage: parseFloat(data.boysPercentage) || 0,
      povertyPercentage: parseFloat(data.povertyPercentage) || 0,
      disabilityPercentage: parseFloat(data.disabilityPercentage) || 0,
      otherPercentage: parseFloat(data.otherPercentage) || 0,
      programType: programType,
      date: data.date,
      unioncouncil: data.unioncouncil,
      villagecouncil: data.villagecouncil,
      pk: data.pk,
      national: data.national,
      lat: lat,
      log: log,
      tehsil: data.tehsil,
      age: data.age,
      totalTeachers: parseInt(data.totalTeachers) || 0,
      requiredFaculty: calculatedRequiredFaculty || 0,
      schoolType: data.schoolType
    }
  }

  // API Functions
  const fetchAllEntries = async () => {
    setLoading(true)

    // Check authentication before making API call
    const token = localStorage.getItem('token')
    if (!token) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ No authentication token found!')
      }
      showToast('Authentication required. Please login.', 'error')
      setLoading(false)
      return
    }

    try {
      const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES)

      // Try different extraction methods
      let entriesData = []
      if (response.data?.entries && Array.isArray(response.data.entries)) {
        entriesData = response.data.entries
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        entriesData = response.data.data
      } else if (Array.isArray(response.data)) {
        entriesData = response.data
      } else {
        entriesData = []
      }

      // Sort entries by creation date (newest first)
      const sortedEntries = entriesData.sort((a, b) => {
        // Try different possible date fields
        const dateA = new Date(a.createdAt || a.date || a.created_at || a.timestamp || 0)
        const dateB = new Date(b.createdAt || b.date || b.created_at || b.timestamp || 0)
        return dateB - dateA // Descending order (newest first)
      })

      setEntries(sortedEntries)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error fetching entries:', error)
        console.error('❌ Error details:', error.response?.data)
      }
      setEntries([])
      showToast('Failed to load entries', 'error')
    } finally {
      setLoading(false)
    }
  }

  const createEntry = async (entryData) => {
    setLoading(true)
    try {
      const response = await axiosInstance.post(API_PATHS.ENTRIES.CREATE_ENTRY, entryData)
      await fetchAllEntries()
      // Reset to first page to show the new entry at the top
      setCurrentPage(1)
      showToast('Entry created successfully', 'success')
      return response.data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error creating entry:', error)
        console.error('❌ Error response:', error.response?.data)
      }
      showToast('Failed to create entry', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateEntry = async (entryId, entryData) => {
    setLoading(true)
    try {
      const response = await axiosInstance.put(API_PATHS.ENTRIES.UPDATE_ENTRY_BY_ID(entryId), entryData)
      await fetchAllEntries()
      showToast('Entry updated successfully', 'success')
      return response.data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error updating entry:', error)
        console.error('❌ Error response:', error.response?.data)
      }
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
      await fetchAllEntries()
      showToast('Entry deleted successfully', 'success')
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting entry:', error)
      }
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
      return response.data
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching entry by ID:', error)
      }
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
  }

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage)
    const totalPages = getTotalPages(filteredEntries.length)

    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
      setGoToPage('')
    } else {
      showToast(`Please enter a page number between 1 and ${totalPages}`, 'error')
    }
  }

  const getPaginationInfo = (totalItems) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)
    return { startItem, endItem, totalItems }
  }

  // Check authentication, load entries, and get user role on component mount
  useEffect(() => {
    const initializeComponent = async () => {
      const isAuth = checkAuthentication()
      if (isAuth) {
        // Fetch user profile to get role
        try {
          const profileResponse = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE)
          const role = profileResponse.data?.role || profileResponse.data?.user?.role || ''
          setUserRole(role)
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ Profile test failed:', error.response?.status, error.response?.data)
          }
          if (error.response?.status === 401) {
            showToast('Session expired. Please login again.', 'error')
            setTimeout(() => {
              localStorage.clear();
              window.location.href = '/login';
            }, 2000);
            return;
          }
        }
        try {
          await fetchAllEntries()
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Failed to load initial data:', error)
          }
          setEntries([])
        }
      } else {
        showToast('Please login to access data management', 'error')
      }
    }
    initializeComponent()
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [])

  // Watch for manual location input changes and update marker - memoized to prevent unnecessary updates
  const updateMarkerFromLocation = useCallback((location) => {
    if (location) {
      const locationParts = location.split(',')
      if (locationParts.length === 2) {
        const lat = parseFloat(locationParts[0].trim())
        const lng = parseFloat(locationParts[1].trim())
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          setMarkerPosition(prev => {
            // Only update if position actually changed
            if (!prev || prev[0] !== lat || prev[1] !== lng) {
              return [lat, lng]
            }
            return prev
          })
        }
      }
    } else {
      setMarkerPosition(prev => prev ? null : prev)
    }
  }, [])

  useEffect(() => {
    updateMarkerFromLocation(formData.location)
  }, [formData.location, updateMarkerFromLocation])

  const handleAddEntry = async () => {
    // Check if program type is "Other" and custom type is empty
    const finalProgramType = formData.programType === 'Other' ? formData.customProgramType : formData.programType;
    if (
      !formData.district ||
      !formData.totalChildren ||
      !formData.outOfSchoolChildren ||
      !formData.date ||
      !formData.povertyPercentage ||
      !formData.disabilityPercentage ||
      !formData.otherPercentage ||
      !formData.location||
      !formData.tehsil||
      !finalProgramType||
      !formData.pk||
      !formData.national ||
      !formData.age ||
      !formData.totalTeachers ||
      // !formData.requiredFaculty||
      !formData.girlsPercentage||
      !formData.boysPercentage
    ) {
      showToast('Please fill in all required fields', 'error')
      return
    }
 // Validation: Out of School Children <= Total Children
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
    if (girls < 0) {
      showToast('Girls % should not be negative', 'error');
      return;
    }
    if (boys < 0) {
      showToast('Boys % should not be negative', 'error');
      return;
    }
    if (girls + boys === 0) {
      showToast('Girls % and Boys % combined should not be 0%', 'error');
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
    if (poverty < 0) {
      showToast('Poverty % should not be negative', 'error');
      return;
    }
    if (disability < 0) {
      showToast('Disability % should not be negative', 'error');
      return;
    }
    if (other < 0) {
      showToast('Other % should not be negative', 'error');
      return;
    }
    if (poverty + disability + other === 0) {
      showToast('Poverty %, Disability %, and Other % combined should not be 0%', 'error');
      return;
    }
   // Validation: Total Teachers >= 0
    if(formData.totalTeachers < 0){
      showToast('Total Teachers should not be negative', 'error');
      return;
    }

    // Validation: Age >= 0
    if(formData.age < 0){
      showToast('Age should not be negative', 'error');
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

      // Check if the current program type is a custom type (not in the predefined options)
      const predefinedOptions = [
        'Foundation Community School (FCS)',
        'Accelerated Learning Program (ALP)',
        'ALP Middle Tech',
        'POHA',
        'Virtual/Online School',
        'RPL',
        'Adult Literacy Program',
        'Youth Skills Program'
      ];

      const isCustomProgramType = !predefinedOptions.includes(entry.programType);

      setFormData({
        district: entry.district || '',
        totalChildren: entry.totalChildren || '',
        outOfSchoolChildren: entry.outOfSchoolChildren || '',
        girlsPercentage: entry.girlsPercentage || '',
        boysPercentage: entry.boysPercentage || '',
        povertyPercentage: entry.povertyPercentage || '',
        disabilityPercentage: entry.disabilityPercentage || '',
        otherPercentage: entry.otherPercentage || '',
        programType: isCustomProgramType ? 'Other' : (entry.programType || ''),
        customProgramType: isCustomProgramType ? entry.programType : '',
        date: entry.date || '',
        unioncouncil: entry.unioncouncil || '',
        villagecouncil: entry.villagecouncil || '',
        pk: entry.pk || '',
        national: entry.national || '',
        location: entry.lat+","+entry.log || '',
        tehsil: entry.tehsil || '',
        age: entry.age || '',
        totalTeachers: entry.totalTeachers || '',
        requiredFaculty: entry.requiredFaculty || '',
        schoolType: entry.schoolType || 'School'
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
      tehsil: '',
      age: '',
      totalTeachers: '',
      requiredFaculty: '',
      customProgramType: '',
      schoolType: 'School'
    })
    setMarkerPosition(null) // Reset map marker
    setShowSuccessMessage(false)
    setIsEditMode(false)
    setEditingEntryId(null)

    // Reset location search state
    setLocationSearchResults([])
    setShowLocationSuggestions(false)
    setLocationSearchFeedback('')
    setIsSearchingLocation(false)

    // Reset map position and zoom
    setMapPosition([34.0151, 71.5249])
    setMapZoom(8)
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
    // CSV upload functionality placeholder
  }

  // Authentication helpers
  const checkAuthentication = () => {
    const authStatus = isUserAuthenticated()
    const token = getAuthToken()
    setIsAuthenticated(authStatus && !!token)
    return authStatus && !!token
  }

  const handleLogin = () => {
    navigate('/login')
  }



  // Filter entries based on search term - memoized for performance
  const filteredEntries = useMemo(() => {
    return (entries || []).filter(entry => {
      if (!entry) {
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
      const tehsilName = entry?.tehsil?.toLowerCase().includes(searchLower)
      const unionCouncilName = entry?.unioncouncil?.toLowerCase().includes(searchLower)
      const villageCouncilName = entry?.villagecouncil?.toLowerCase().includes(searchLower)
      const pkName = entry?.pk?.toLowerCase().includes(searchLower)
      const nationalName = entry?.national?.toLowerCase().includes(searchLower)

      return matchesDistrict || matchesProgram || matchesDate || tehsilName || unionCouncilName || villageCouncilName || pkName || nationalName
    })
  }, [entries, searchTerm])

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Get paginated entries for current page - memoized for performance
  const paginatedEntries = useMemo(() => getPaginatedEntries(filteredEntries), [filteredEntries, currentPage])
  const totalPages = useMemo(() => getTotalPages(filteredEntries.length), [filteredEntries.length])
  const paginationInfo = useMemo(() => getPaginationInfo(filteredEntries.length), [filteredEntries.length, currentPage])

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
                    className={`bg-[#4A90E2] hover:bg-[#2c5aa0] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 ${userRole === 'Viewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={userRole === 'Viewer'}
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
        <div className="max-w-7xl mx-auto mb-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Entry' : 'Add New Entry'}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            <form className="w-full">
              {/* District - Full width on all screens */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"
                  placeholder="Mardan"
                />
              </div>

              {/* Responsive Grid Layout */}
              <div className="grid sm:grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* First Column */}

                  {/* Tehsil */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tehsil</label>
                    <input
                      type="text"
                      value={formData.tehsil}
                      onChange={(e) => handleInputChange('tehsil', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Tehsil"
                    />
                  </div>
             {/* Union Council */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Union Council <span className='text-xs sm:text-sm text-gray-500'>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.unioncouncil}
                      onChange={(e) => handleInputChange('unioncouncil', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Union Council"
                    />
                  </div>

                    {/* Village Council */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Village Council <span className='text-xs sm:text-sm text-gray-500'>(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.villagecouncil}
                      onChange={(e) => handleInputChange('villagecouncil', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Village Council"
                    />
                  </div>

                   {/* Total Teachers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Teachers</label>
                    <input
                      type="number"
                      value={formData.totalTeachers}
                      onChange={(e) => handleInputChange('totalTeachers', e.target.value)}
                      className= { parseInt(formData.totalTeachers) < 0 ? "w-full px-4 py-2 sm:py-3 rounded-lg border border-red-500 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-red-400 text-base sm:text-lg placeholder-gray-400 shadow-sm" :"w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"}
                      placeholder="Total number of teachers"
                      min="0"
                    />
                    {parseInt(formData.totalTeachers) < 0 && (
                      <span className="text-xs text-red-600 mt-1 block">Total Teachers cannot be negative</span>
                    )}

                  </div>

                  {/* Total Children */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Children</label>
                    <input
                      type="number"
                      value={formData.totalChildren}
                      onChange={(e) => handleInputChange('totalChildren', e.target.value)}
                      className={`w-full px-4 py-2 sm:py-3 rounded-lg border bg-[#F8F9FA] focus:outline-none text-base sm:text-lg placeholder-gray-400 shadow-sm ${
                        parseInt(formData.totalChildren) < 0
                          ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                          : 'border-blue-100 focus:ring-2 focus:ring-blue-200'
                      }`}
                      placeholder="12000"
                      min="0"
                    />
                    {parseInt(formData.totalChildren) < 0 && (
                      <span className="text-xs text-red-600 mt-1 block">Total Children cannot be negative</span>
                    )}
                  </div>


 {/* Out-of-School Children */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Out-of-School Children</label>
                    <input
                      type="number"
                      value={formData.outOfSchoolChildren}
                      onChange={(e) => handleInputChange('outOfSchoolChildren', e.target.value)}
                      className={`w-full px-4 py-2 sm:py-3 rounded-lg border bg-[#F8F9FA] focus:outline-none text-base sm:text-lg placeholder-gray-400 shadow-sm ${
                        parseInt(formData.outOfSchoolChildren) > parseInt(formData.totalChildren) ||
                        parseInt(formData.outOfSchoolChildren) < 0
                          ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                          : 'border-blue-100 focus:ring-2 focus:ring-blue-200'
                      }`}
                      placeholder="4500"
                      min="0"
                      ref={input => {
                        if (input && parseInt(formData.outOfSchoolChildren) > parseInt(formData.totalChildren)) {
                          input.focus();
                        }
                      }}
                    />
                    {parseInt(formData.outOfSchoolChildren) > parseInt(formData.totalChildren) && (
                      <span className="text-xs text-red-600 mt-1 block">Out-of-School Children cannot be greater than Total Children</span>
                    )}
                    {parseInt(formData.outOfSchoolChildren) < 0 && (
                      <span className="text-xs text-red-600 mt-1 block">Out-of-School Children cannot be negative</span>
                    )}
                  </div>

                   {/* PK */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">PK constituency</label>
                    <input
                      type="text"
                      value={formData.pk}
                      onChange={(e) => handleInputChange('pk', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Provincial Assembly"
                    />
                  </div>



                {/* Third Column */}

                  {/* National */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">NA constituency</label>
                    <input
                      type="text"
                      value={formData.national}
                      onChange={(e) => handleInputChange('national', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"
                      placeholder="National Assembly"
                    />
                  </div>


                 {/* Program Type */}
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Program Type</label>
                    {formData.programType === 'Other' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={formData.customProgramType || ''}
                          onChange={(e) => handleInputChange('customProgramType', e.target.value)}
                          className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"
                          placeholder="Enter custom program type"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('programType', 'Foundation Community School (FCS)');
                            handleInputChange('customProgramType', '');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          ← Back to dropdown
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <select
                          value={formData.programType}
                          onChange={(e) => handleInputChange('programType', e.target.value)}
                          className="w-full appearance-none px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm pr-10"
                        >
                          <option value="">Select Program Type</option>
                          <option value="Foundation Community School (FCS)">Foundation Community School (FCS)</option>
                          <option value="Accelerated Learning Program (ALP)">Accelerated Learning Program (ALP)</option>
                          <option value="ALP Middle Tech">ALP Middle Tech</option>
                          <option value="POHA">POHA</option>
                          <option value="Virtual/Online School">Virtual/Online School</option>
                          <option value="RPL">RPL</option>
                          <option value="Adult Literacy Program">Adult Literacy Program</option>
                          <option value="Youth Skills Program">Youth Skills Program</option>
                          <option value="Other">Other</option>
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>

                 {/* Boys % */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Boys %</label>
                    <input
                      type="number"
                      value={formData.boysPercentage}
                      onChange={(e) => handleInputChange('boysPercentage', e.target.value)}
                      className={`w-full px-4 py-2 sm:py-3 rounded-lg border bg-[#F8F9FA] focus:outline-none text-base sm:text-lg placeholder-gray-400 shadow-sm ${
                        parseInt(formData.boysPercentage) + parseInt(formData.girlsPercentage) > 100 ||
                        parseInt(formData.boysPercentage) < 0 ||
                        parseInt(formData.boysPercentage) + parseInt(formData.girlsPercentage) < 100
                          ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                          : 'border-blue-100 focus:ring-2 focus:ring-blue-200'
                      }`}
                      placeholder="40"
                      min="0"
                      max="100"
                    />
                    {parseInt(formData.boysPercentage) + parseInt(formData.girlsPercentage) > 100 && (
                      <span className="text-xs text-red-600 mt-1 block">Girls % and Boys % combined should not exceed 100%</span>
                    )}
                    {parseInt(formData.boysPercentage) < 0 && (
                      <span className="text-xs text-red-600 mt-1 block">Boys % should be positive</span>
                    )}
                    {parseInt(formData.boysPercentage) + parseInt(formData.girlsPercentage) < 100 && (
                      <span className="text-xs text-red-600 mt-1 block">Girls % and Boys % combined should be 100%</span>
                    )}
                  </div>

                   {/* Girls % */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Girls %</label>
                    <input
                      type="number"
                      value={formData.girlsPercentage}
                      onChange={(e) => handleInputChange('girlsPercentage', e.target.value)}
                      className={`w-full px-4 py-2 sm:py-3 rounded-lg border bg-[#F8F9FA] focus:outline-none text-base sm:text-lg placeholder-gray-400 shadow-sm ${
                        parseInt(formData.boysPercentage) + parseInt(formData.girlsPercentage) > 100 ||
                        parseInt(formData.girlsPercentage) < 0 ||
                        parseInt(formData.boysPercentage) + parseInt(formData.girlsPercentage) < 100
                          ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                          : 'border-blue-100 focus:ring-2 focus:ring-blue-200'
                      }`}
                      placeholder="60"
                      min="0"
                      max="100"
                    />
                    {parseInt(formData.boysPercentage) + parseInt(formData.girlsPercentage) > 100 && (
                      <span className="text-xs text-red-600 mt-1 block">Girls % and Boys % combined should not exceed 100%</span>
                    )}
                    {parseInt(formData.girlsPercentage) < 0 && (
                      <span className="text-xs text-red-600 mt-1 block">Girls % should be positive</span>
                    )}
                    {parseInt(formData.boysPercentage) + parseInt(formData.girlsPercentage) < 100 && (
                      <span className="text-xs text-red-600 mt-1 block">Girls % and Boys % combined should be 100%</span>
                    )}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg shadow-sm"
                    />
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className= {parseInt(formData.age)<0 ? "w-full px-4 py-2 sm:py-3 rounded-lg border border-red-500 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-red-400 text-base sm:text-lg placeholder-gray-400 shadow-sm" : "w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"}
                      placeholder="e.g. 5-9, 10-16"
                    />
                    {parseInt(formData.age)<0 && (
                      <span className="text-xs text-red-600 mt-1 block">Age should be positive</span>
                    )}

                  </div>

                  {/* School / Madrasa */}
                 <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">School / Madrasa</label>
  <div className="relative">
    <select
      name="schoolType"
      value={formData.schoolType || 'School'}
      onChange={(e) => handleInputChange('schoolType', e.target.value)}
      className="w-full appearance-none px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm pr-10"
    >
      <option value="School">School</option>
      <option value="Madrasa">Madrasa</option>
    </select>
    {/* Custom dropdown arrow */}
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
</div>

                  {/* Required Faculty */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 hidden">Required Faculty</label>
                    <input
                      type="number"
                      value={formData.requiredFaculty}
                      onChange={(e) => handleInputChange('requiredFaculty', e.target.value)}
                      className=" hidden w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm"
                      placeholder="Number of required faculty"
                      min="0"
                    />
                  </div> */}

              </div>

              {/* Barriers Section - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 pt-6 border-t border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Poverty %</label>
                  <input
                    type="number"
                    value={formData.povertyPercentage}
                    onChange={(e) => handleInputChange('povertyPercentage', e.target.value)}
                    className={`w-full px-4 py-2 sm:py-3 rounded-lg border bg-[#F8F9FA] focus:outline-none text-base sm:text-lg placeholder-gray-400 shadow-sm ${
                      parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) > 100 ||
                      parseInt(formData.povertyPercentage) < 0 ||
                      parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) < 100
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-blue-100 focus:ring-2 focus:ring-blue-200'
                    }`}
                    placeholder="45"
                    min="0"
                    max="100"
                  />
                  {parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) > 100 && (
                    <span className="text-xs text-red-600 mt-1 block">Combined percentages should not exceed 100%</span>
                  )}
                  {parseInt(formData.povertyPercentage) < 0 && (
                    <span className="text-xs text-red-600 mt-1 block">Poverty % should be positive</span>
                  )}
                  {parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) < 100 && (
                    <span className="text-xs text-red-600 mt-1 block">Combined percentages should be 100%</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Disability %</label>
                  <input
                    type="number"
                    value={formData.disabilityPercentage}
                    onChange={(e) => handleInputChange('disabilityPercentage', e.target.value)}
                    className={`w-full px-4 py-2 sm:py-3 rounded-lg border bg-[#F8F9FA] focus:outline-none text-base sm:text-lg placeholder-gray-400 shadow-sm ${
                      parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) > 100 ||
                      parseInt(formData.disabilityPercentage) < 0 ||
                      parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) < 100
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-blue-100 focus:ring-2 focus:ring-blue-200'
                    }`}
                    placeholder="15"
                    min="0"
                    max="100"
                  />
                  {parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) > 100 && (
                    <span className="text-xs text-red-600 mt-1 block">Combined percentages should not exceed 100%</span>
                  )}
                  {parseInt(formData.disabilityPercentage) < 0 && (
                    <span className="text-xs text-red-600 mt-1 block">Disability % should be positive</span>
                  )}
                  {parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) < 100 && (
                    <span className="text-xs text-red-600 mt-1 block">Combined percentages should be 100%</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Other %</label>
                  <input
                    type="number"
                    value={formData.otherPercentage}
                    onChange={(e) => handleInputChange('otherPercentage', e.target.value)}
                    className={`w-full px-4 py-2 sm:py-3 rounded-lg border bg-[#F8F9FA] focus:outline-none text-base sm:text-lg placeholder-gray-400 shadow-sm ${
                      parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) > 100 ||
                      parseInt(formData.otherPercentage) < 0 ||
                      parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) < 100
                        ? 'border-red-500 focus:ring-2 focus:ring-red-400'
                        : 'border-blue-100 focus:ring-2 focus:ring-blue-200'
                    }`}
                    placeholder="25"
                    min="0"
                    max="100"
                  />
                  {parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) > 100 && (
                    <span className="text-xs text-red-600 mt-1 block">Combined percentages should not exceed 100%</span>
                  )}
                  {parseInt(formData.otherPercentage) < 0 && (
                    <span className="text-xs text-red-600 mt-1 block">Other % should be positive</span>
                  )}
                  {parseInt(formData.povertyPercentage) + parseInt(formData.disabilityPercentage) + parseInt(formData.otherPercentage) < 100 && (
                    <span className="text-xs text-red-600 mt-1 block">Combined percentages should be 100%</span>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    onFocus={() => {
                      if (locationSearchResults.length > 0) {
                        setShowLocationSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Delay hiding suggestions to allow clicking on them
                      setTimeout(() => setShowLocationSuggestions(false), 200);
                    }}
                    className="w-full px-4 py-2 sm:py-3 rounded-lg border border-blue-100 bg-[#F8F9FA] focus:outline-none focus:ring-2 focus:ring-blue-200 text-base sm:text-lg placeholder-gray-400 shadow-sm cursor-pointer"
                    placeholder={isEditMode ? "Click on map to change location" : "Search location (e.g., Peshawar, Mardan) or enter coordinates (lat, lng)"}
                    disabled={isEditMode}
                  />

                  {/* Loading indicator */}
                  {isSearchingLocation && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}

                  {/* Location Search Suggestions Dropdown */}
                  {showLocationSuggestions && locationSearchResults.length > 0 && !isEditMode && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {locationSearchResults.map((location, index) => (
                        <button
                          key={location.id || index}
                          type="button"
                          onClick={() => handleLocationSelect(location)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50"
                        >
                          <div className="flex flex-col">
                            <div className="font-medium text-gray-900">
                              {location.name}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              {location.display_name}
                            </div>
                            <div className="text-xs text-gray-400">
                              {location.lat.toFixed(4)}, {location.lng.toFixed(4)} • {location.type}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location Search Feedback */}
                {locationSearchFeedback && (
                  <div className={`text-xs mt-1 block ${
                    locationSearchFeedback.includes('found') || locationSearchFeedback.includes('Location found')
                      ? 'text-green-600'
                      : locationSearchFeedback.includes('No locations') || locationSearchFeedback.includes('unavailable')
                        ? 'text-orange-600'
                        : locationSearchFeedback.includes('Searching')
                          ? 'text-blue-600'
                          : 'text-gray-600'
                  }`}>
                    {locationSearchFeedback}
                  </div>
                )}

                {isEditMode ? (
                  <span className="text-xs text-gray-500 mt-1 block">In edit mode, location can only be changed by selecting a new point on the map below.</span>
                ) : (
                  <span className="text-xs text-gray-500 mt-1 block">
                    Type a location name (e.g., Peshawar, Mardan, Islamabad) to search, enter coordinates (lat, lng), or click on the map below.
                  </span>
                )}
              </div>

              {/* Interactive Map */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
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
                      className="text-xs text-red-600 hover:text-red-800 underline self-start sm:self-auto"
                    >
                      Clear location
                    </button>
                  )}
                </div>
                <div className="w-full">
                  <InteractiveMap />
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-2 gap-2">
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

              {/* Success Message */}
              {showSuccessMessage && (
                <div className="mb-6">
                  <span className="text-green-600 text-base">
                    {isEditMode ? 'Entry updated successfully!' : 'Entry added successfully!'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={handleAddEntry}
                  type="button"
                  disabled={loading || userRole === 'Viewer'}
                  className={`w-full sm:w-auto bg-[#4A90E2] hover:bg-[#2c5aa0] disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium text-base sm:text-lg shadow-sm transition-colors duration-200 flex items-center justify-center ${userRole === 'Viewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                  className="w-full sm:w-auto bg-white border border-blue-200 hover:bg-blue-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-[#2c5aa0] px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium text-base sm:text-lg shadow-sm transition-colors duration-200"
                >
                  Reset
                </button>

                <button
                  onClick={handleUploadCSV}
                  type="button"
                  disabled={loading}
                  className="w-full sm:w-auto bg-white border border-blue-200 hover:bg-blue-50 disabled:bg-gray-100 disabled:cursor-not-allowed text-[#2c5aa0] px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium text-base sm:text-lg shadow-sm transition-colors duration-200 flex items-center justify-center"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Group</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Teachers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Required Faculty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School Type</th>
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
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.age}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.totalTeachers}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.requiredFaculty}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{entry.schoolType}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEditEntry(entry.id || entry._id)}
                              disabled={loading || userRole === 'Viewer'}
                              className={`text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center ${userRole === 'Viewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id || entry._id)}
                              disabled={loading || userRole === 'Viewer'}
                              className={`text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center ${userRole === 'Viewer' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
