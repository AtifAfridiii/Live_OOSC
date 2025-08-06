import React,{useState,useEffect,useCallback} from 'react'
import ChartsSection from '../../components/ChartsSection'
import BottomSection from '../../components/BottomSection'
import ActionButtons from '../../components/ActionButtons'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import { ChevronDown, Loader2, ChevronUp, Filter } from 'lucide-react'


const MainContent = () => {
  const [stats, setStats] = useState([
    { title: 'Total Children', value: '0', bgColor: 'bg-[#4A90E2]', textColor: 'text-white' },
    { title: 'Out Of School', value: '0', bgColor: 'bg-[#FFE4CC]', textColor: 'text-[#D97706]' },
    { title: 'Girls (%)', value: '0%', bgColor: 'bg-[#E1F5FE]', textColor: 'text-[#1976D2]' },
    { title: 'Boys (%)', value: '0%', bgColor: 'bg-[#F5F5F5]', textColor: 'text-[#424242]' }
  ])

  // Filter state management
  const [filters, setFilters] = useState({
    district: 'All',
    gender: 'All',
    ageGroup: 'All',
    startDate: '',
    endDate: '',
    tehsil: 'All',
    unioncouncil: 'All',
    villagecouncil: 'All',
    pk: 'All',
    national: 'All',
    program: 'All',

  })

  // Dropdown options state
  const [filterOptions, setFilterOptions] = useState({
    districts: ['All'],
    genders: ['All', 'Boys', 'Girls'],
    ageGroups: ['All'],
    tehsils: ['All'],
    unioncouncils: ['All'],
    villagecouncils: ['All'],
    pks: ['All'],
    nationals: ['All'],
    programs: ['All']
  })

  // Dropdown visibility state
  const [dropdownStates, setDropdownStates] = useState({
    district: false,
    gender: false,
    ageGroup: false,
    dateRange: false,
    tehsil: false,
    unioncouncil: false,
    villagecouncil: false,
    pk: false,
    national: false,
    program: false
  })

  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filteredData, setFilteredData] = useState([])

  // Loading states for individual cascading filters
  const [cascadingLoading, setCascadingLoading] = useState({
    tehsil: false,
    unioncouncil: false,
    villagecouncil: false,
    pk: false,
    national: false,
    program: false
  })

  // Additional filters visibility state
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false)

  // Fetch all entries from API
  const fetchAllEntries = useCallback(async () => {
    try {
      const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES);
      return Array.isArray(response.data) ? response.data : (response.data?.entries || response.data?.data || []);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setError('Failed to fetch data');
      return [];
    }
  }, []);

  // Fetch filter options from API data
  const fetchFilterOptions = useCallback(async () => {
    try {
      const data = await fetchAllEntries();

      // Extract unique districts, genders, and age values from data
      const districts = ['All', ...new Set(data.map(entry => entry.district).filter(Boolean))];
      const genders = ['All', 'Boys', 'Girls'];

      // Extract unique values for new geographic filters
      const tehsils = ['All', ...new Set(data.map(entry => entry.tehsil).filter(Boolean))];
      const unioncouncils = ['All', ...new Set(data.map(entry => entry.unioncouncil).filter(Boolean))];
      const villagecouncils = ['All', ...new Set(data.map(entry => entry.villagecouncil).filter(Boolean))];
      const pks = ['All', ...new Set(data.map(entry => entry.pk).filter(Boolean))];
      const nationals = ['All', ...new Set(data.map(entry => entry.national).filter(Boolean))];
      const programs = ['All', ...new Set(data.map(entry => entry.programType).filter(Boolean))];

      // Define predefined age ranges for filtering
      const ageGroups = ['All', '5-9', '10-17'];


      setFilterOptions({
        districts,
        genders,
        ageGroups,
        tehsils,
        unioncouncils,
        villagecouncils,
        pks,
        nationals,
        programs
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, [fetchAllEntries]);

  // Enhanced cascading filter options based on selected filters
  const fetchCascadingFilterOptions = useCallback(async (filterType, selectedValue, currentFilters = filters) => {
    // Set loading state for dependent filters
    const dependentFilters = {
      'district': ['tehsil', 'unioncouncil', 'villagecouncil', 'pk', 'national', 'program'],
      'tehsil': ['unioncouncil', 'villagecouncil', 'pk', 'national', 'program'],
      'unioncouncil': ['villagecouncil', 'pk', 'national', 'program'],
      'villagecouncil': ['pk', 'national', 'program'],
      'pk': ['national', 'program'],
      'national': ['program']
    };

    const dependents = dependentFilters[filterType] || [];

    // Set loading states for dependent filters
    setCascadingLoading(prev => {
      const newState = { ...prev };
      dependents.forEach(dep => {
        newState[dep] = true;
      });
      return newState;
    });

    try {
      const data = await fetchAllEntries();

      // Apply all current filters up to the changed filter level
      let filteredData = data;

      // Apply filters in hierarchy order
      if (currentFilters.district !== 'All') {
        filteredData = filteredData.filter(entry => entry.district === currentFilters.district);
      }

      if (filterType !== 'tehsil' && currentFilters.tehsil !== 'All') {
        filteredData = filteredData.filter(entry => entry.tehsil === currentFilters.tehsil);
      }

      if (filterType !== 'unioncouncil' && filterType !== 'tehsil' && currentFilters.unioncouncil !== 'All') {
        filteredData = filteredData.filter(entry => entry.unioncouncil === currentFilters.unioncouncil);
      }

      if (filterType !== 'villagecouncil' && filterType !== 'unioncouncil' && filterType !== 'tehsil' && currentFilters.villagecouncil !== 'All') {
        filteredData = filteredData.filter(entry => entry.villagecouncil === currentFilters.villagecouncil);
      }

      if (filterType !== 'pk' && filterType !== 'villagecouncil' && filterType !== 'unioncouncil' && filterType !== 'tehsil' && currentFilters.pk !== 'All') {
        filteredData = filteredData.filter(entry => entry.pk === currentFilters.pk);
      }

      if (filterType !== 'national' && filterType !== 'pk' && filterType !== 'villagecouncil' && filterType !== 'unioncouncil' && filterType !== 'tehsil' && currentFilters.national !== 'All') {
        filteredData = filteredData.filter(entry => entry.national === currentFilters.national);
      }

      // Apply the current selection if it's not 'All'
      if (selectedValue !== 'All') {
        const fieldMap = {
          'district': 'district',
          'tehsil': 'tehsil',
          'unioncouncil': 'unioncouncil',
          'villagecouncil': 'villagecouncil',
          'pk': 'pk',
          'national': 'national',
          'program': 'programType'
        };

        if (fieldMap[filterType]) {
          filteredData = filteredData.filter(entry => entry[fieldMap[filterType]] === selectedValue);
        }
      }

      // Extract unique values for all cascading filters based on current selection
      const tehsils = ['All', ...new Set(filteredData.map(entry => entry.tehsil).filter(Boolean))];
      const unioncouncils = ['All', ...new Set(filteredData.map(entry => entry.unioncouncil).filter(Boolean))];
      const villagecouncils = ['All', ...new Set(filteredData.map(entry => entry.villagecouncil).filter(Boolean))];
      const pks = ['All', ...new Set(filteredData.map(entry => entry.pk).filter(Boolean))];
      const nationals = ['All', ...new Set(filteredData.map(entry => entry.national).filter(Boolean))];
      const programs = ['All', ...new Set(filteredData.map(entry => entry.programType).filter(Boolean))];

      // Update filter options with cascading data
      setFilterOptions(prev => ({
        ...prev,
        tehsils,
        unioncouncils,
        villagecouncils,
        pks,
        nationals,
        programs
      }));

      // Clear loading states for dependent filters
      setCascadingLoading(prev => {
        const newState = { ...prev };
        dependents.forEach(dep => {
          newState[dep] = false;
        });
        return newState;
      });
    } catch (error) {
      console.error('Error fetching cascading filter options:', error);
      // Clear loading states on error too
      setCascadingLoading(prev => {
        const newState = { ...prev };
        dependents.forEach(dep => {
          newState[dep] = false;
        });
        return newState;
      });
    }
  }, [fetchAllEntries, filters]);

  // Apply filters to data
  const applyFilters = useCallback((data, currentFilters) => {
    return data.filter(entry => {
      // District filter
      if (currentFilters.district !== 'All' && entry.district !== currentFilters.district) {
        return false;
      }

      // Tehsil filter
      if (currentFilters.tehsil !== 'All' && entry.tehsil !== currentFilters.tehsil) {
        return false;
      }

      // Union Council filter
      if (currentFilters.unioncouncil !== 'All' && entry.unioncouncil !== currentFilters.unioncouncil) {
        return false;
      }

      // Village Council filter
      if (currentFilters.villagecouncil !== 'All' && entry.villagecouncil !== currentFilters.villagecouncil) {
        return false;
      }

      // PK filter
      if (currentFilters.pk !== 'All' && entry.pk !== currentFilters.pk) {
        return false;
      }

      // National filter
      if (currentFilters.national !== 'All' && entry.national !== currentFilters.national) {
        return false;
      }

      // Program filter
      if (currentFilters.program !== 'All' && entry.programType !== currentFilters.program) {
        return false;
      }

      // Age filter - check if the selected age range overlaps with the entry's age field
      if (currentFilters.ageGroup !== 'All' && entry.age) {
        const selectedAgeRange = currentFilters.ageGroup;
        const ageString = entry.age.toString();
        const ageParts = ageString.split(',').map(part => part.trim());
        
        // Parse the selected age range
        const [selectedStart, selectedEnd] = selectedAgeRange.split('-').map(num => parseInt(num.trim()));
        
        let ageMatches = false;
        ageParts.forEach(part => {
          // Check if entry age is a range (contains hyphen)
          if (part.includes('-')) {
            const [entryStart, entryEnd] = part.split('-').map(num => parseInt(num.trim()));
            if (!isNaN(entryStart) && !isNaN(entryEnd) && !isNaN(selectedStart) && !isNaN(selectedEnd)) {
              // Check if the ranges overlap
              // Two ranges overlap if one range's start is <= other range's end AND one range's end is >= other range's start
              if (entryStart <= selectedEnd && entryEnd >= selectedStart) {
                ageMatches = true;
              }
            }
          } else {
            // Single age value
            const age = parseInt(part);
            if (!isNaN(age) && !isNaN(selectedStart) && !isNaN(selectedEnd)) {
              // Check if the single age is within the selected range
              if (age >= selectedStart && age <= selectedEnd) {
                ageMatches = true;
              }
            }
          }
        });

        if (!ageMatches) {
          return false;
        }
      }

      // Date range filter
      if (currentFilters.startDate && currentFilters.endDate) {
        const entryDate = new Date(entry.createdAt || entry.date);
        const startDate = new Date(currentFilters.startDate);
        const endDate = new Date(currentFilters.endDate);

        if (entryDate < startDate || entryDate > endDate) {
          return false;
        }
      }

      return true;
    });
  }, []);

  // Calculate statistics from filtered data
  const calculateStats = useCallback((data, genderFilter = 'All') => {
    let totalChildren = 0;
    let totalOutOfSchool = 0;
    let totalGirls = 0;
    let totalBoys = 0;
    let outOfSchoolGirls = 0;
    let outOfSchoolBoys = 0;

    data.forEach(entry => {
      const children = Number(entry.totalChildren) || 0;
      const outOfSchoolCount = Number(entry.outOfSchoolChildren) || 0;
      const girlsPercentage = Number(entry.girlsPercentage) || 0;

      // Calculate gender-specific numbers
      const girlsCount = (girlsPercentage / 100) * children;
      const boysCount = children - girlsCount;

      // Calculate out-of-school by gender (proportional distribution)
      const outOfSchoolGirlsCount = (girlsPercentage / 100) * outOfSchoolCount;
      const outOfSchoolBoysCount = outOfSchoolCount - outOfSchoolGirlsCount;

      totalChildren += children;
      totalOutOfSchool += outOfSchoolCount;
      totalGirls += girlsCount;
      totalBoys += boysCount;
      outOfSchoolGirls += outOfSchoolGirlsCount;
      outOfSchoolBoys += outOfSchoolBoysCount;
    });

    // Calculate percentages
    const girlsOverallPercentage = totalChildren > 0 ? ((totalGirls / totalChildren) * 100).toFixed(1) : '0';
    const boysOverallPercentage = totalChildren > 0 ? ((totalBoys / totalChildren) * 100).toFixed(1) : '0';

    // Generate stats based on gender filter
    let statsData = [];

    if (genderFilter === 'Girls') {
      const girlsInSchool = totalGirls - outOfSchoolGirls;
      const girlsInSchoolPercentage = totalGirls > 0 ? ((girlsInSchool / totalGirls) * 100).toFixed(1) : '0';
      const girlsOutOfSchoolPercentage = totalGirls > 0 ? ((outOfSchoolGirls / totalGirls) * 100).toFixed(1) : '0';

      statsData = [
        {
          title: 'Total Girls',
          value: Math.round(totalGirls).toLocaleString(),
          bgColor: 'bg-[#4A90E2]',
          textColor: 'text-white'
        },
        {
          title: 'Out Of School Girls',
          value: Math.round(outOfSchoolGirls).toLocaleString(),
          bgColor: 'bg-[#FFE4CC]',
          textColor: 'text-[#D97706]'
        },
        {
          title: 'Girls In School (%)',
          value: `${girlsInSchoolPercentage}%`,
          bgColor: 'bg-[#E1F5FE]',
          textColor: 'text-[#1976D2]'
        },
        {
          title: 'Girls Out Of School (%)',
          value: `${girlsOutOfSchoolPercentage}%`,
          bgColor: 'bg-[#F5F5F5]',
          textColor: 'text-[#424242]'
        }
      ];
    } else if (genderFilter === 'Boys') {
      const boysInSchool = totalBoys - outOfSchoolBoys;
      const boysInSchoolPercentage = totalBoys > 0 ? ((boysInSchool / totalBoys) * 100).toFixed(1) : '0';
      const boysOutOfSchoolPercentage = totalBoys > 0 ? ((outOfSchoolBoys / totalBoys) * 100).toFixed(1) : '0';

      statsData = [
        {
          title: 'Total Boys',
          value: Math.round(totalBoys).toLocaleString(),
          bgColor: 'bg-[#4A90E2]',
          textColor: 'text-white'
        },
        {
          title: 'Out Of School Boys',
          value: Math.round(outOfSchoolBoys).toLocaleString(),
          bgColor: 'bg-[#FFE4CC]',
          textColor: 'text-[#D97706]'
        },
        {
          title: 'Boys In School (%)',
          value: `${boysInSchoolPercentage}%`,
          bgColor: 'bg-[#E1F5FE]',
          textColor: 'text-[#1976D2]'
        },
        {
          title: 'Boys Out Of School (%)',
          value: `${boysOutOfSchoolPercentage}%`,
          bgColor: 'bg-[#F5F5F5]',
          textColor: 'text-[#424242]'
        }
      ];
    } else {
      // All gender view (default)
      statsData = [
        {
          title: 'Total Children',
          value: totalChildren.toLocaleString(),
          bgColor: 'bg-[#4A90E2]',
          textColor: 'text-white'
        },
        {
          title: 'Out Of School',
          value: totalOutOfSchool.toLocaleString(),
          bgColor: 'bg-[#FFE4CC]',
          textColor: 'text-[#D97706]'
        },
        {
          title: 'Girls (%)',
          value: `${girlsOverallPercentage}%`,
          bgColor: 'bg-[#E1F5FE]',
          textColor: 'text-[#1976D2]'
        },
        {
          title: 'Boys (%)',
          value: `${boysOverallPercentage}%`,
          bgColor: 'bg-[#F5F5F5]',
          textColor: 'text-[#424242]'
        }
      ];
    }

    return statsData;
  }, []);

  // Main function to fetch and process data with filters
  const fetchAndProcessData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const allData = await fetchAllEntries();
      const filtered = applyFilters(allData, filters);
      const statsData = calculateStats(filtered, filters.gender);

      setFilteredData(filtered);
      setStats(statsData);
    } catch (error) {
      console.error('Error processing data:', error);
      setError('Failed to process data');
    } finally {
      setLoading(false);
    }
  }, [fetchAllEntries, applyFilters, calculateStats, filters]);

  // Initial data fetch and setup
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch and process data when filters change
  useEffect(() => {
    fetchAndProcessData();
  }, [fetchAndProcessData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setDropdownStates({
          district: false,
          gender: false,
          ageGroup: false,
          dateRange: false,
          tehsil: false,
          unioncouncil: false,
          villagecouncil: false,
          pk: false,
          national: false,
          program: false
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Toggle additional filters visibility
  const toggleAdditionalFilters = () => {
    setShowAdditionalFilters(prev => !prev);
  };

  // Enhanced filter change handlers with full cascading support
  const handleFilterChange = (filterType, value) => {
    // Define the hierarchy and what filters should be reset for each level
    const filterHierarchy = {
      'district': ['tehsil', 'unioncouncil', 'villagecouncil', 'pk', 'national', 'program'],
      'tehsil': ['unioncouncil', 'villagecouncil', 'pk', 'national', 'program'],
      'unioncouncil': ['villagecouncil', 'pk', 'national', 'program'],
      'villagecouncil': ['pk', 'national', 'program'],
      'pk': ['national', 'program'],
      'national': ['program']
    };

    const dependentFilters = filterHierarchy[filterType] || [];

    // Update the current filter and reset dependent filters
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filterType]: value
      };

      // Reset all dependent filters to 'All'
      dependentFilters.forEach(depFilter => {
        newFilters[depFilter] = 'All';
      });

      return newFilters;
    });

    // Handle cascading filter updates for geographic hierarchy
    if (filterHierarchy[filterType]) {
      // Show additional filters when a specific value is selected (not 'All')
      if (filterType === 'district' && value !== 'All') {
        setShowAdditionalFilters(true);
      }

      // Fetch cascading options for dependent filters
      const updatedFilters = {
        ...filters,
        [filterType]: value
      };

      // Reset dependent filters in the updated filters object
      dependentFilters.forEach(depFilter => {
        updatedFilters[depFilter] = 'All';
      });

      fetchCascadingFilterOptions(filterType, value, updatedFilters);
    }

    // Close the dropdown after selection
    setDropdownStates(prev => ({
      ...prev,
      [filterType]: false
    }));
  };

  const handleDateChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Dropdown toggle handlers
  const toggleDropdown = (dropdownType) => {
    setDropdownStates(prev => {
      const newState = {
        district: false,
        gender: false,
        ageGroup: false,
        dateRange: false,
        tehsil: false,
        unioncouncil: false,
        villagecouncil: false,
        pk: false,
        national: false,
        program: false
      };
      newState[dropdownType] = !prev[dropdownType];
      return newState;
    });
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      district: 'All',
      gender: 'All',
      ageGroup: 'All',
      startDate: '',
      endDate: '',
      tehsil: 'All',
      unioncouncil: 'All',
      villagecouncil: 'All',
      pk: 'All',
      national: 'All',
      program: 'All'
    });

    // Hide additional filters when resetting
    setShowAdditionalFilters(false);
  };

  return (
    <main className="p-4 md:p-6 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Enhanced Filter Controls */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 mb-6">
          {/* Filter Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            <div className="flex items-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              <button
                onClick={resetFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Main Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* District Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => toggleDropdown('district')}
                className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
              >
                <span className="truncate">
                  {filters.district === 'All' ? 'District' : filters.district}
                </span>
                <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.district ? 'rotate-180' : ''}`} />
              </button>

              {dropdownStates.district && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {filterOptions.districts.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleFilterChange('district', option)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                        filters.district === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Gender Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => toggleDropdown('gender')}
                className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
              >
                <span className="truncate">
                  {filters.gender === 'All' ? 'Gender' : filters.gender}
                </span>
                <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.gender ? 'rotate-180' : ''}`} />
              </button>

              {dropdownStates.gender && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {filterOptions.genders.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleFilterChange('gender', option)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                        filters.gender === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Age Group Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => toggleDropdown('ageGroup')}
                className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
              >
                <span className="truncate">
                  {filters.ageGroup === 'All' ? 'Age Group' : filters.ageGroup}
                </span>
                <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.ageGroup ? 'rotate-180' : ''}`} />
              </button>

              {dropdownStates.ageGroup && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  {filterOptions.ageGroups.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleFilterChange('ageGroup', option)}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                        filters.ageGroup === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range Filter */}
            <div className="relative dropdown-container">
              <button
                onClick={() => toggleDropdown('dateRange')}
                className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
              >
                <span className="truncate">
                  {filters.startDate && filters.endDate
                    ? `${filters.startDate} - ${filters.endDate}`
                    : 'Date Range'
                  }
                </span>
                <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.dateRange ? 'rotate-180' : ''}`} />
              </button>

              {dropdownStates.dateRange && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 w-72">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={e => handleDateChange('startDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={e => handleDateChange('endDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min={filters.startDate}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
                        }}
                        className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => toggleDropdown('dateRange')}
                        className="flex-1 bg-[#4A90E2] text-white px-4 py-2 text-sm rounded-lg hover:bg-[#2c5aa0]"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Toggle Button for Additional Filters */}
          {(filters.district !== 'All' || showAdditionalFilters) && (
            <div className="flex justify-start mt-4">
              <button
                onClick={toggleAdditionalFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4A90E2] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
              >
                <Filter className="w-4 h-4" />
                <span>{showAdditionalFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}</span>
                {showAdditionalFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>
          )}

          {/* Additional Filters Section - Conditionally Displayed */}
          {showAdditionalFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 transition-all duration-300 ease-in-out">
              <h4 className="text-sm  font-semibold text-gray-700 mb-3">Advanced Geographic Filters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

                {/* Tehsil Filter */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('tehsil')}
                    className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
                    disabled={cascadingLoading.tehsil}
                  >
                    <span className="truncate">
                      {filters.tehsil === 'All' ? 'Tehsil' : filters.tehsil}
                    </span>
                    {cascadingLoading.tehsil ? (
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    ) : (
                      <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.tehsil ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {dropdownStates.tehsil && !cascadingLoading.tehsil && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filterOptions.tehsils.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleFilterChange('tehsil', option)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                            filters.tehsil === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Union Council Filter */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('unioncouncil')}
                    className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
                    disabled={cascadingLoading.unioncouncil}
                  >
                    <span className="truncate">
                      {filters.unioncouncil === 'All' ? 'Union Council' : filters.unioncouncil}
                    </span>
                    {cascadingLoading.unioncouncil ? (
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    ) : (
                      <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.unioncouncil ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {dropdownStates.unioncouncil && !cascadingLoading.unioncouncil && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filterOptions.unioncouncils.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleFilterChange('unioncouncil', option)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                            filters.unioncouncil === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Village Council Filter */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('villagecouncil')}
                    className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
                    disabled={cascadingLoading.villagecouncil}
                  >
                    <span className="truncate">
                      {filters.villagecouncil === 'All' ? 'Village Council' : filters.villagecouncil}
                    </span>
                    {cascadingLoading.villagecouncil ? (
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    ) : (
                      <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.villagecouncil ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {dropdownStates.villagecouncil && !cascadingLoading.villagecouncil && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filterOptions.villagecouncils.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleFilterChange('villagecouncil', option)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                            filters.villagecouncil === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* PK Filter */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('pk')}
                    className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
                    disabled={cascadingLoading.pk}
                  >
                    <span className="truncate">
                      {filters.pk === 'All' ? 'PK' : filters.pk}
                    </span>
                    {cascadingLoading.pk ? (
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    ) : (
                      <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.pk ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {dropdownStates.pk && !cascadingLoading.pk && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filterOptions.pks.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleFilterChange('pk', option)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                            filters.pk === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* National Filter */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('national')}
                    className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
                    disabled={cascadingLoading.national}
                  >
                    <span className="truncate">
                      {filters.national === 'All' ? 'National' : filters.national}
                    </span>
                    {cascadingLoading.national ? (
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    ) : (
                      <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.national ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {dropdownStates.national && !cascadingLoading.national && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filterOptions.nationals.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleFilterChange('national', option)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                            filters.national === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Program Filter */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => toggleDropdown('program')}
                    className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
                    disabled={cascadingLoading.program}
                  >
                    <span className="truncate">
                      {filters.program === 'All' ? 'Program' : filters.program}
                    </span>
                    {cascadingLoading.program ? (
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                    ) : (
                      <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${dropdownStates.program ? 'rotate-180' : ''}`} />
                    )}
                  </button>

                  {dropdownStates.program && !cascadingLoading.program && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                      {filterOptions.programs.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleFilterChange('program', option)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                            filters.program === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (value && value !== 'All') {
                return (
                  <span
                    key={key}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {key === 'startDate' || key === 'endDate' ? `${key}: ${value}` : `${key}: ${value}`}
                    <button
                      onClick={() => handleFilterChange(key, key === 'startDate' || key === 'endDate' ? '' : 'All')}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} rounded-lg p-4 md:p-6 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <h3 className={`text-xs md:text-sm font-medium ${stat.textColor}`}>
                  {stat.title}
                </h3>
              </div>
              <div className={`text-2xl md:text-3xl font-bold ${stat.textColor}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <ChartsSection filteredData={filteredData} loading={loading} />

        {/* Bottom Section with Bar Charts and Activity */}
        <BottomSection filteredData={filteredData} loading={loading} />

        {/* Action Buttons */}
      </div>
    </main>
  )
}

export default MainContent
