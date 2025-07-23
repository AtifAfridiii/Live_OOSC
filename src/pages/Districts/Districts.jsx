import React, { useState, useEffect } from "react";
import { XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import StatsCard from '../../components/StatsCard';
import { ChevronDown, Calendar, Users, Target, ArrowBigDownIcon,PersonStandingIcon,} from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';

export default function DistrictsPage() {
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [allEntries, setAllEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tehsils, setTehsils] = useState([]);
  const [selectedTehsil, setSelectedTehsil] = useState("");

  // Static trend data (remains unchanged)
  const trendData = [
    { year: '2019', value: 4.2 },
    { year: '2020', value: 4.5 },
    { year: '2021', value: 4.8 },
    { year: '2022', value: 4.6 },
    { year: '2023', value: 4.9 },
    { year: '2024', value: 4.92 }
  ];

  useEffect(() => {
    setLoading(true);
    axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES)
      .then(response => {
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data?.entries || response.data?.data || []);
        setAllEntries(data);
        // No default district selection to allow "All Districts" to be the default
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedDistrict) {
      const districtTehsils = [...new Set(allEntries
        .filter(e => e.district === selectedDistrict)
        .map(e => e.tehsil)
        .filter(t => t))
      ];
      setTehsils(districtTehsils);
      setSelectedTehsil(""); // Reset tehsil when district changes
    } else {
      setTehsils([]);
    }
  }, [selectedDistrict, allEntries]);

  useEffect(() => {
    let entries = allEntries;
    if (selectedDistrict) {
      entries = entries.filter(e => e.district === selectedDistrict);
    }
    if (selectedTehsil) {
      entries = entries.filter(e => e.tehsil === selectedTehsil);
    }
    setFilteredEntries(entries);
  }, [selectedDistrict, selectedTehsil, allEntries]);

  // Dynamic Dropout Reasons Data
  const enrollmentsData = [
    { district: 'Poverty', enrolled: filteredEntries.reduce((sum, e) => sum + (Number(e.povertyPercentage) || 0), 0) },
    { district: 'Disability', enrolled: filteredEntries.reduce((sum, e) => sum + (Number(e.disabilityPercentage) || 0), 0) },
    { district: 'Child Labor', enrolled: filteredEntries.reduce((sum, e) => sum + (Number(e.childLaborPercentage) || 0), 0) },
    { district: 'No internet', enrolled: filteredEntries.reduce((sum, e) => sum + (Number(e.noInternetPercentage) || 0), 0) },
    { district: 'Other', enrolled: filteredEntries.reduce((sum, e) => sum + (Number(e.otherPercentage) || 0), 0) }
  ];

  // Dynamic Gender Data
  let totalGirls = 0, totalBoys = 0, totalChildren = 0;
  filteredEntries.forEach(entry => {
    const children = Number(entry.totalChildren) || 0;
    const girlsPercent = Number(entry.girlsPercentage) || 0;
    const boysPercent = 100 - girlsPercent;
    totalGirls += (girlsPercent / 100) * children;
    totalBoys += (boysPercent / 100) * children;
    totalChildren += children;
  });
  const genderData = [
    { name: "Girls", value: totalChildren > 0 ? Math.round((totalGirls / totalChildren) * 100) : 0 },
    { name: "Boys", value: totalChildren > 0 ? Math.round((totalBoys / totalChildren) * 100) : 0 }
  ];
  const COLORS = ["#EC4899", "#4285F4"];

  // Calculate OOSC by Tehsil and Level
  const ooscByTehsilAndLevel = filteredEntries.reduce((acc, entry) => {
    const { tehsil, level, outOfSchoolChildren } = entry;
    if (tehsil && level) {
      if (!acc[tehsil]) {
        acc[tehsil] = {};
      }
      if (!acc[tehsil][level]) {
        acc[tehsil][level] = 0;
      }
      acc[tehsil][level] += Number(outOfSchoolChildren) || 0;
    }
    return acc;
  }, {});

  return (
        <>
            <div className="p-4 md:p-6 bg-[#F8F9FA]">
                <div className="max-w-7xl mx-auto mb-6">
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Districts Dashboard</h1>
        <p className="text-gray-600 mt-1">Select a district to view detailed analytics and metrics</p>
       <div className="flex gap-4 text-sm">
         <h1 className="underline">District: {selectedDistrict}</h1>
       <h1  className="underline">Tehsil: {selectedTehsil}</h1>
       </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative">
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-64"
            disabled={loading}
          >
            <option value="">All Districts</option>
            {[...new Set(allEntries.map(e => e.district).filter(Boolean))].map(district => (
              <option key={district} value={district}>{district}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select
            value={selectedTehsil}
            onChange={e => setSelectedTehsil(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-64"
            disabled={loading || !selectedDistrict}
          >
            <option value="">All Tehsils</option>
            {tehsils.map(tehsil => (
              <option key={tehsil} value={tehsil}>{tehsil}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  </div>
  <div className="mt-4">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatsCard title="Total Children" value={(() => {
    let total = 0;
    filteredEntries.forEach(e => { total += Number(e.totalChildren) || 0; });
    return total;
  })()} icon={<Users className="w-6 h-6 text-green-600" />} bgColor={"bg-[#4A90E2]"} iconBg={"bg-[#e8f0fe]"} />
  <StatsCard title="Programs" value={filteredEntries.length} icon={<Target className="w-6 h-6 text-blue-600" />} />
  <StatsCard title="Dropout %" value={(() => {
    let total = 0, dropout = 0;
    filteredEntries.forEach(e => {
      total += Number(e.totalChildren) || 0;
      dropout += Number(e.outOfSchoolChildren) || 0;
    });
    return total > 0 ? ((dropout / total) * 100).toFixed(1) + '%' : '0%';
  })()} icon={<ArrowBigDownIcon className="w-6 h-6 text-red-600" />} bgColor={"bg-[#E1F5FE]"} iconBg={"bg-[#e0f7fa]"} />
  <StatsCard title="Girls %" value={(() => {
    let total = 0, girls = 0;
    filteredEntries.forEach(e => {
      const children = Number(e.totalChildren) || 0;
      const girlsPercent = Number(e.girlsPercentage) || 0;
      girls += (girlsPercent / 100) * children;
      total += children;
    });
    return total > 0 ? ((girls / total) * 100).toFixed(1) + '%' : '0%';
  })()} icon={<PersonStandingIcon className="w-6 h-6 text-red-600" />} bgColor={"bg-[#F5F5F5]"} iconBg={"bg-[#fce4ec]"} />
</div>
  </div>
</div>


  <div className="grid md:grid-cols-2 gap-4 md:gap-6 sm:grid-cols-1 mt-6">
     <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
                         <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Dropout Reasons - {selectedDistrict}</h3>

                         <div className="overflow-x-auto">
                             <ResponsiveContainer width="100%" height={200}>
                                 <BarChart data={enrollmentsData}>
                                     <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                     <XAxis dataKey="district" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                     <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                     <Tooltip />
                                     <Legend />
                                     <Bar dataKey="enrolled" fill="#4A90E2" />
                                 </BarChart>
                             </ResponsiveContainer>
                         </div>

                     </div>



       <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
                              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">OOSC Trend Swabi (2019-2024) </h3>
                              <div className="h-48 md:h-64">
                                  <ResponsiveContainer width="100%" height={200}>
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

  </div>

<div className="flex flex-col md:flex-row gap-4 md:gap-6 mt-4">
  {/* Chart Column */}
  <div className="bg-[#F8FAFC] rounded-lg p-4 shadow border border-blue-100 w-full md:w-1/2 flex flex-col items-center min-h-[272px]">
    <h3 className="text-center text-base font-semibold text-gray-900 mb-4">Gender Distribution</h3>
    <div className="w-full flex justify-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={genderData}
            cx="50%"
            cy="50%"
            innerRadius={0}
            outerRadius={60}
            paddingAngle={0}
            dataKey="value"
          >
            {genderData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Legend
            iconType="circle"
            formatter={(value, entry) => {
              const item = genderData.find(d => d.name === value);
              return `${value} – ${item?.value}%`;
            }}
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
  {/* Text Column */}
  <div className="bg-[#F8FAFC] rounded-lg p-4 shadow border border-blue-100 w-full md:w-1/2 flex flex-col justify-center items-center min-h-[272px]">
    <h1>📝 New program launched – Apr 1</h1>
    <h1>✅ Survey updated – Mar 29</h1>
    <h1>📌 Voucher extended – Mar 15</h1>
  </div>
</div>

  <div className="flex item-end justify-end mt-4">
    <div className="
    flex flex-col md:flex-row
    items-center justify-end
    w-full md:w-1/2
    space-y-2 md:space-y-0 md:space-x-3
     md:pt-1
  ">
    <button className="text-black text-sm font-medium bg-transparent border border-gray-500 px-4 py-2 rounded-lg w-full md:w-auto">
    Refresh
    </button>
    <button className="text-[#4A90E2] text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg w-full md:w-auto">
      Export
    </button>
    <button className="text-[#4A90E2] text-sm font-medium bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full md:w-auto">
    View on Map
    </button>
  </div>
  </div>

            </div>
        </>
    );
}