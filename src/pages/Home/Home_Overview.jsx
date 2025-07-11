import React,{useState,useEffect} from 'react'
import ChartsSection from '../../components/ChartsSection'
import BottomSection from '../../components/BottomSection'
import ActionButtons from '../../components/ActionButtons'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import { ChevronDown } from 'lucide-react'


const MainContent = () => {
  const [stats, setStats] = useState([
    { title: 'Total Children', value: '0', bgColor: 'bg-[#4A90E2]', textColor: 'text-white' },
    { title: 'Out Of School', value: '0', bgColor: 'bg-[#FFE4CC]', textColor: 'text-[#D97706]' },
    { title: 'Girls (%)', value: '0%', bgColor: 'bg-[#E1F5FE]', textColor: 'text-[#1976D2]' },
    { title: 'Boys (%)', value: '0%', bgColor: 'bg-[#F5F5F5]', textColor: 'text-[#424242]' }
  ])

  const [selectedGender, setSelectedGender] = useState('All')
  const [genderOptions, setGenderOptions] = useState(['All', 'Boys', 'Girls'])
  const [showGenderDropdown, setShowGenderDropdown] = useState(false)

  const fetchStats = async (genderFilter = 'All') => {
    try {
      const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES);
      const data = Array.isArray(response.data) ? response.data : (response.data?.entries || response.data?.data || []);

      // Calculate totals from all data (no filtering by entry threshold)
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

      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats(selectedGender);
  }, [selectedGender]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showGenderDropdown && !event.target.closest('.gender-dropdown')) {
        setShowGenderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGenderDropdown]);

  const handleGenderChange = (gender) => {
    setSelectedGender(gender);
    setShowGenderDropdown(false);
  };

  return (
    <main className="p-4 md:p-6 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Top Filter Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-2">
          <button className="flex-1 bg-[#4A90E2] text-white font-semibold px-6 py-2 rounded-lg flex items-center justify-between transition-colors duration-200">
            Total Children
          </button>

          {/* Gender Filter Dropdown */}
          <div className="relative flex-1 gender-dropdown">
            <button
              onClick={() => setShowGenderDropdown(!showGenderDropdown)}
              className="w-full bg-[#4A90E2] hover:bg-[#2c5aa0] text-white font-semibold px-6 py-2 rounded-lg flex items-center justify-between transition-colors duration-200"
            >
              {selectedGender === 'All' ? 'Gender' : selectedGender}
              <ChevronDown className={`w-5 h-5 ml-2 transition-transform duration-200 ${showGenderDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showGenderDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {genderOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleGenderChange(option)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors duration-200 ${
                      selectedGender === option ? 'bg-blue-50 text-[#4A90E2] font-semibold' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
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
        <ChartsSection />

        {/* Bottom Section with Bar Charts and Activity */}
        <BottomSection />

        {/* Action Buttons */}
        <ActionButtons />
      </div>
    </main>
  )
}

export default MainContent
