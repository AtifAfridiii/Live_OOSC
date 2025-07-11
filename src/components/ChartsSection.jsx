import React,{useState,useEffect} from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import axiosInstance from '../utils/axiosInstance';
import { API_PATHS } from '../utils/apiPaths';

const ChartsSection = () => {
  const [DistrictData, setDistrictData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchDistrictData();
  }, []);

  const fetchDistrictData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES);
      const data = response.data;
      setDistrictData(data);
    } catch (error) {
      console.error('Error fetching district data:', error);
    } finally {
      setLoading(false);
    }
  };

    // Sample data for OOSC Trend Overview
  const trendData = [
    { year: '2019', value: 4.2 },
    { year: '2020', value: 4.5 },
    { year: '2021', value: 4.8 },
    { year: '2022', value: 4.6 },
    { year: '2023', value: 4.9 },
    { year: '2024', value: 4.92 }
  ]

  // Calculate percentages for OOSC By Districts (Donut Chart)
  let totalChildren = 0;
  let totalOutOfSchool = 0;

  DistrictData.forEach(entry => {
    totalChildren += Number(entry.totalChildren) || 0;
    totalOutOfSchool += Number(entry.outOfSchoolChildren) || 0;
  });

  const inSchool = totalChildren - totalOutOfSchool;
  const inSchoolPercent = totalChildren > 0 ? ((inSchool / totalChildren) * 100).toFixed(1) : 0;
  const outOfSchoolPercent = totalChildren > 0 ? ((totalOutOfSchool / totalChildren) * 100).toFixed(1) : 0;

  const districtData = [
    { name: 'In School', value: Number(inSchoolPercent), color: '#93C5FD' },
    { name: 'Out of School', value: Number(outOfSchoolPercent), color: '#4A90E2' }
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
      {/* OOSC Trend Overview */}
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">OOSC Trend Overview</h3>
        <div className="h-48 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                domain={[4, 5]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#4A90E2"
                strokeWidth={2}
                dot={{ fill: '#4A90E2', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: '#2c5aa0' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* OOSC By Districts */}
      <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">OOSC By Districts</h3>
        <div className="h-48 md:h-64 flex items-center justify-center">
          <div className="relative w-[220px] h-[200px] md:w-[280px] md:h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={districtData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {districtData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-gray-900">{outOfSchoolPercent}%</div>
                <div className="text-xs md:text-sm text-gray-600">Out of School</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#93C5FD' }}></span>
            <span className="text-xs md:text-sm text-gray-700 font-semibold">In School:</span>
            <span className="text-xs md:text-sm text-gray-900 font-bold">{inSchoolPercent}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: '#4A90E2' }}></span>
            <span className="text-xs md:text-sm text-gray-700 font-semibold">Out of School:</span>
            <span className="text-xs md:text-sm text-gray-900 font-bold">{outOfSchoolPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartsSection
