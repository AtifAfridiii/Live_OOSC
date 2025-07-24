import React,{useState,useEffect,useCallback} from 'react'
import ChartsSection from '../../components/ChartsSection'
import BottomSection from '../../components/BottomSection'
import ActionButtons from '../../components/ActionButtons'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import { ChevronDown, Loader2 } from 'lucide-react'


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
    endDate: ''
  })

  // Dropdown options state
  const [filterOptions, setFilterOptions] = useState({
    districts: ['All'],
    genders: ['All', 'Boys', 'Girls'],
    ageGroups: ['All', '5-9', '9-16']
  })

  // Dropdown visibility state
  const [dropdownStates, setDropdownStates] = useState({
    district: false,
    gender: false,
    ageGroup: false,
    dateRange: false
  })

  // Loading and error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filteredData, setFilteredData] = useState([])

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
      
      // Extract unique districts, genders, and age groups from data
      const districts = ['All', ...new Set(data.map(entry => entry.district).filter(Boolean))];
      const genders = ['All', 'Boys', 'Girls'];
      const ageGroups = ['All', ...new Set(data.map(entry => entry.ageGroup).filter(Boolean))];
      
      setFilterOptions({
        districts,
        genders,
        ageGroups
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, [fetchAllEntries]);

  // Apply filters to data
  const applyFilters = useCallback((data, currentFilters) => {
    return data.filter(entry => {
      // District filter
      if (currentFilters.district !== 'All' && entry.district !== currentFilters.district) {
        return false;
      }
      
      // Age group filter
      if (currentFilters.ageGroup !== 'All' && entry.ageGroup !== currentFilters.ageGroup) {
        return false;
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
          dateRange: false
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter change handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    
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
        dateRange: false
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
      endDate: ''
    });
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

          {/* Filter Dropdowns */}
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
        <ActionButtons />
      </div>
    </main>
  )
}

export default MainContent
