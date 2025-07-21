import React,{useState,useEffect} from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'

function BottomSection() {

  // Drop-out Reasons data (dynamic)
  const [dropoutReasons, setDropoutReasons] = useState([
    { reason: 'Disability', percentage: 0, color: 'bg-[#00B8D9]' },
    { reason: 'Poverty', percentage: 0, color: 'bg-[#F44336]' },
    { reason: 'Other', percentage: 0, color: 'bg-[#9C27B0]' },
  ]);

  const [programData, setProgramData] = useState([]);
  const [districtData, setDistrictData] = useState([]);
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [showAllDistricts, setShowAllDistricts] = useState(false);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES);
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data?.entries || response.data?.data || []);

        // Program chart: Count occurrences of each program type
        const programCounts = {};
        let totalPrograms = 0;
        data.forEach(entry => {
          const type = entry.programType || 'Unknown';
          programCounts[type] = (programCounts[type] || 0) + 1;
          totalPrograms++;
        });
        const programChartData = Object.entries(programCounts).map(([type, count]) => ({
          label: type,
          value: totalPrograms > 0 ? Math.round((count / totalPrograms) * 100) : 0
        }));
        setProgramData(programChartData);


        const districtCounts = {};
        let totalDistricts = 0;
        data.forEach(entry => {

          const rawDistrict = entry.district || 'Unknown';
          const district = rawDistrict.toLowerCase();
          districtCounts[district] = (districtCounts[district] || 0) + 1;
          totalDistricts++;
        });

        const displayLabels = {};
        data.forEach(entry => {
          const rawDistrict = entry.district || 'Unknown';
          const district = rawDistrict.toLowerCase();
        
          displayLabels[district] = rawDistrict.replace(/\b\w/g, c => c.toUpperCase());
        });
        const districtChartData = Object.entries(districtCounts).map(([district, count]) => ({
          label: displayLabels[district] || district,
          value: totalDistricts > 0 ? Math.round((count / totalDistricts) * 100) : 0
        }));
        setDistrictData(districtChartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };
    fetchChartData();
  }, []);


  useEffect(() => {
    const fetchDropoutReasons = async () => {
      try {
        const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES);
        // Support both array and object response
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data?.entries || response.data?.data || []);

        let totalPoverty = 0;
        let totalDisability = 0;
        let totalOther = 0;
        let totalDropout = 0;
        data.forEach(entry => {
          const poverty = Number(entry.povertyPercentage) || 0;
          const disability = Number(entry.disabilityPercentage) || 0;
          const other = Number(entry.otherPercentage) || 0;
          totalPoverty += poverty;
          totalDisability += disability;
          totalOther += other;
          totalDropout += poverty + disability + other;
        });

        // Calculate overall percentage for each reason out of total dropout
        const povertyPercent = totalDropout ? Math.round((totalPoverty / totalDropout) * 100) : 0;
        const disabilityPercent = totalDropout ? Math.round((totalDisability / totalDropout) * 100) : 0;
        const otherPercent = totalDropout ? Math.round((totalOther / totalDropout) * 100) : 0;

        setDropoutReasons([
          { reason: 'Disability', percentage: disabilityPercent, color: 'bg-[#00B8D9]' },
          { reason: 'Poverty', percentage: povertyPercent, color: 'bg-[#F44336]' },
          { reason: 'Other', percentage: otherPercent, color: 'bg-[#9C27B0]' },
        ]);
      } catch (error) {
        console.error('Error fetching dropout reasons:', error);
      }
    };
    fetchDropoutReasons();
  }, []);

  // Activity data
  const activities = [
    { text: 'Weekly survey uploaded in Bajaur Tehsil', time: '2 hours ago', user: 'Admin' },
    { text: 'District Survey updated (OOSC by 4%)', time: '4 hours ago', user: 'User' },
    { text: 'Uploaded girls enrollment data', time: '6 hours ago', user: 'Admin' },
    { text: 'Created report on 2024', time: '8 hours ago', user: 'User' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
      {/* Left Column - Bar Charts */}
      <div className="space-y-4 md:space-y-6">
        {/* OOSC by District */}
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">OOSC by District</h3>
          <div className="space-y-3">
            {(showAllDistricts ? districtData : districtData.slice(0, 5)).map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-16 md:w-20 text-xs md:text-sm text-gray-600 truncate">{item.label}</div>
                <div className="flex-1 mx-2 md:mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#4A90E2] h-2 rounded-full"
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs md:text-sm text-gray-600 w-8">{item.value}%</div>
              </div>
            ))}
            {districtData.length > 5 && (
              <button
                className="mt-2 text-blue-600 text-xs underline hover:text-blue-800"
                onClick={() => setShowAllDistricts(v => !v)}
              >
                {showAllDistricts ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>

        {/* Access Programmes */}
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Access Programmes</h3>
          <div className="space-y-3">
            {(showAllPrograms ? programData : programData.slice(0, 5)).map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-sm text-gray-600">{item.label}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#4A90E2] h-2 rounded-full"
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-8">{item.value}%</div>
              </div>
            ))}
            {programData.length > 5 && (
              <button
                className="mt-2 text-blue-600 text-xs underline hover:text-blue-800"
                onClick={() => setShowAllPrograms(v => !v)}
              >
                {showAllPrograms ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Drop-out Reasons and Activity */}
      <div className="space-y-4 md:space-y-6">
        {/* Drop-out Reasons */}
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Drop-out Reasons</h3>
          <div className="space-y-3">
            {dropoutReasons.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-16 text-sm text-gray-600">{item.reason}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 w-8">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Activity</h3>
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-2 md:space-x-3">
                <div className="w-2 h-2 bg-[#4A90E2] rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm text-gray-900 leading-relaxed">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BottomSection
