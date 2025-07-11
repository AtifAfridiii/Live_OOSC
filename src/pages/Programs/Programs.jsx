import React, { useState, useEffect } from "react";
import { ChevronDown, Calendar, Users, Target, TrendingUp, MapPin, GraduationCap } from 'lucide-react';
import StatsCard from '../../components/StatsCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import Toast from '../../components/Toast';

export default function Programs() {
    // State management
    const [entries, setEntries] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [selectedProgramType, setSelectedProgramType] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const COLORS = ["#4285F4", "#EC4899"];

    // Static trend data 
    const trendData = [
        { year: '2019', value: 4.2 },
        { year: '2020', value: 4.5 },
        { year: '2021', value: 4.8 },
        { year: '2022', value: 4.6 },
        { year: '2023', value: 4.9 },
        { year: '2024', value: 4.92 }
    ];

    // Utility functions
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    };

    // Data processing functions with comprehensive debugging
    const extractUniquePrograms = (entriesData) => {
        console.log('🔍 [DEBUG] Extracting unique programs from entries:', entriesData);
        console.log('🔍 [DEBUG] Total entries received:', entriesData.length);

        // Extract program types and log each step
        const allProgramTypes = entriesData.map(entry => {
            console.log('🔍 [DEBUG] Entry program type:', entry.programType, 'from entry:', entry);
            return entry.programType;
        });

        console.log('🔍 [DEBUG] All program types (including duplicates):', allProgramTypes);

        // Filter out empty/null values
        const validProgramTypes = allProgramTypes.filter(type => {
            const isValid = type && type.trim() !== '';
            console.log('🔍 [DEBUG] Program type validation:', type, '-> valid:', isValid);
            return isValid;
        });

        console.log('🔍 [DEBUG] Valid program types:', validProgramTypes);

        // Get unique values
        const uniqueProgramTypes = [...new Set(validProgramTypes)];
        console.log('🔍 [DEBUG] Unique program types:', uniqueProgramTypes);

        // Create program objects
        const programs = uniqueProgramTypes.map(type => ({
            name: type,
            type: type
        }));

        console.log('🔍 [DEBUG] Final programs array:', programs);
        return programs;
    };

    const filterEntriesByProgram = (entriesData, programType) => {
        console.log('🔍 [DEBUG] Filtering entries by program type:', programType);
        console.log('🔍 [DEBUG] Total entries to filter:', entriesData.length);

        if (!programType) {
            console.log('🔍 [DEBUG] No program type selected, returning empty array');
            return [];
        }

        const filtered = entriesData.filter(entry => {
            const matches = entry.programType === programType;
            console.log('🔍 [DEBUG] Entry filter check:', entry.programType, '===', programType, '-> matches:', matches);
            return matches;
        });

        console.log('🔍 [DEBUG] Filtered entries result:', filtered);
        console.log('🔍 [DEBUG] Filtered entries count:', filtered.length);
        return filtered;
    };

    const calculateDistrictEnrollments = (filteredEntries) => {
        console.log('🔍 [DEBUG] Calculating district enrollments from:', filteredEntries);

        const districtMap = {};

        filteredEntries.forEach(entry => {
            const district = entry.district || 'Unknown';
            const enrolled = parseInt(entry.totalChildren) || 0;

            console.log('🔍 [DEBUG] Processing entry - District:', district, 'Enrolled:', enrolled);

            if (districtMap[district]) {
                districtMap[district] += enrolled;
            } else {
                districtMap[district] = enrolled;
            }
        });

        console.log('🔍 [DEBUG] District map:', districtMap);

        const result = Object.entries(districtMap)
            .map(([district, enrolled]) => ({ district, enrolled }))
            .sort((a, b) => b.enrolled - a.enrolled);

        console.log('🔍 [DEBUG] Final district enrollments:', result);
        return result;
    };

    const calculateGenderDistribution = (filteredEntries) => {
        console.log('🔍 [DEBUG] Calculating gender distribution from:', filteredEntries);

        if (filteredEntries.length === 0) {
            console.log('🔍 [DEBUG] No entries, returning default 50/50 split');
            return [{ name: "Boys", value: 50 }, { name: "Girls", value: 50 }];
        }

        let totalGirls = 0;
        let totalBoys = 0;
        let validEntries = 0;

        filteredEntries.forEach(entry => {
            const girls = parseFloat(entry.girlsPercentage) || 0;
            const boys = parseFloat(entry.boysPercentage) || 0;

            console.log('🔍 [DEBUG] Entry gender data - Girls:', girls, 'Boys:', boys);

            if (girls > 0 || boys > 0) {
                totalGirls += girls;
                totalBoys += boys;
                validEntries++;
                console.log('🔍 [DEBUG] Valid entry counted. Running totals - Girls:', totalGirls, 'Boys:', totalBoys, 'Valid entries:', validEntries);
            }
        });

        if (validEntries === 0) {
            console.log('🔍 [DEBUG] No valid gender data, returning default 50/50 split');
            return [{ name: "Boys", value: 50 }, { name: "Girls", value: 50 }];
        }

        const avgGirls = Math.round(totalGirls / validEntries);
        const avgBoys = Math.round(totalBoys / validEntries);

        console.log('🔍 [DEBUG] Calculated averages - Girls:', avgGirls, 'Boys:', avgBoys);

        const result = [
            { name: "Boys", value: avgBoys },
            { name: "Girls", value: avgGirls }
        ];

        console.log('🔍 [DEBUG] Final gender distribution:', result);
        return result;
    };

    const calculateStatistics = (filteredEntries) => {
        console.log('🔍 [DEBUG] Calculating statistics from:', filteredEntries);

        if (filteredEntries.length === 0) {
            console.log('🔍 [DEBUG] No entries, returning empty statistics');
            return {
                totalStudents: 0,
                girlsPercentage: 0,
                boysPercentage: 0,
                districts: [],
                entriesCount: 0
            };
        }

        // Calculate total students
        const totalStudents = filteredEntries.reduce((sum, entry) => {
            const students = parseInt(entry.totalChildren) || 0;
            console.log('🔍 [DEBUG] Adding students:', students, 'from entry:', entry.district);
            return sum + students;
        }, 0);

        // Calculate average gender percentages
        let totalGirls = 0;
        let totalBoys = 0;
        let validGenderEntries = 0;

        filteredEntries.forEach(entry => {
            const girls = parseFloat(entry.girlsPercentage) || 0;
            const boys = parseFloat(entry.boysPercentage) || 0;

            if (girls > 0 || boys > 0) {
                totalGirls += girls;
                totalBoys += boys;
                validGenderEntries++;
            }
        });

        const avgGirlsPercentage = validGenderEntries > 0 ? Math.round(totalGirls / validGenderEntries) : 0;
        const avgBoysPercentage = validGenderEntries > 0 ? Math.round(totalBoys / validGenderEntries) : 0;

        // Get unique districts
        const districts = [...new Set(filteredEntries.map(entry => entry.district).filter(d => d))];

        const statistics = {
            totalStudents,
            girlsPercentage: avgGirlsPercentage,
            boysPercentage: avgBoysPercentage,
            districts,
            entriesCount: filteredEntries.length
        };

        console.log('🔍 [DEBUG] Final statistics:', statistics);
        return statistics;
    };

    // API function to fetch all entries with comprehensive debugging
    const fetchAllEntries = async (isInitial = false) => {
        console.log('🔄 [DEBUG] Starting to fetch all entries...');
        setLoading(true);

        try {
            console.log('🔄 [DEBUG] Making API call to:', API_PATHS.ENTRIES.GET_ALL_ENTRIES);
            const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES);

            console.log('📋 [DEBUG] Raw API response:', response);
            console.log('📋 [DEBUG] Response status:', response.status);
            console.log('📋 [DEBUG] Response data:', response.data);
            console.log('📋 [DEBUG] Response data type:', typeof response.data);
            console.log('📋 [DEBUG] Response data keys:', Object.keys(response.data || {}));

            // Try different possible data structures
            let entriesData = [];
            if (response.data?.entries && Array.isArray(response.data.entries)) {
                entriesData = response.data.entries;
                console.log('📋 [DEBUG] Found entries in response.data.entries');
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                entriesData = response.data.data;
                console.log('📋 [DEBUG] Found entries in response.data.data');
            } else if (Array.isArray(response.data)) {
                entriesData = response.data;
                console.log('📋 [DEBUG] Found entries directly in response.data');
            } else {
                console.log('❌ [DEBUG] No valid entries array found in response');
                entriesData = [];
            }

            console.log('📋 [DEBUG] Extracted entries data:', entriesData);
            console.log('📋 [DEBUG] Entries count:', entriesData.length);

            if (entriesData.length > 0) {
                console.log('📋 [DEBUG] First entry sample:', entriesData[0]);
                console.log('📋 [DEBUG] First entry keys:', Object.keys(entriesData[0] || {}));
            }

            setEntries(entriesData);

          
            const uniquePrograms = extractUniquePrograms(entriesData);
            setPrograms(uniquePrograms);

            console.log('✅ [DEBUG] Successfully processed data');
            if (!isInitial) {
    showToast(`Loaded ${entriesData.length} entries with ${uniquePrograms.length} programs`, 'success');
}
        } catch (error) {
            console.error('❌ [DEBUG] Error fetching entries:', error);
            console.error('❌ [DEBUG] Error details:', error.response?.data);
            console.error('❌ [DEBUG] Error status:', error.response?.status);

            setEntries([]);
            setPrograms([]);
            showToast('Failed to load program data', 'error');
        } finally {
            setLoading(false);
            console.log('🔄 [DEBUG] Fetch operation completed');
        }
    };

   
    useEffect(() => {
        console.log('🚀 [DEBUG] Component mounted, fetching entries...');
        fetchAllEntries(true); 
    }, []);

   
    useEffect(() => {
        if (!selectedProgramType && programs.length > 0) {
            setSelectedProgramType(programs[0].type);
        }
    }, [programs, selectedProgramType]);

    
    const handleProgramSelect = (programType) => {
        console.log('📌 [DEBUG] Program selected:', programType);
        setSelectedProgramType(programType);
    };

   
    const getFilteredData = () => {
        console.log('🔄 [DEBUG] Getting filtered data for program:', selectedProgramType);
        const filteredEntries = filterEntriesByProgram(entries, selectedProgramType);

        return {
            filteredEntries,
            enrollmentsData: calculateDistrictEnrollments(filteredEntries),
            genderData: calculateGenderDistribution(filteredEntries),
            statistics: calculateStatistics(filteredEntries)
        };
    };

    const currentData = getFilteredData();
    console.log('📊 [DEBUG] Current data for rendering:', currentData);

    // Custom Statistics Card Component
    const ProgramStatsCards = () => {
        if (!selectedProgramType) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatsCard
                    title="Select a Program"
                    value="-"
                    icon={<Target className="w-6 h-6 text-blue-600" />}
                    bgColor="bg-blue-300"
                    iconBg="bg-blue-100"
                  />
                  <StatsCard
                    title="Enrolled"
                    value="-"
                    icon={<Users className="w-6 h-6 text-green-600" />}
                    bgColor="bg-green-300"
                    iconBg="bg-green-100"
                  />
                  <StatsCard
                    title="Districts"
                    value="-"
                    icon={<MapPin className="w-6 h-6 text-purple-600" />}
                    bgColor="bg-purple-300"
                    iconBg="bg-purple-100"
                  />
                  <StatsCard
                    title="Data Entries"
                    value="-"
                    icon={<GraduationCap className="w-6 h-6 text-orange-600" />}
                    bgColor="bg-orange-300"
                    iconBg="bg-orange-100"
                  />
                </div>
            );
        }

        return (
            <>
            <div className="w-full md:w-1/2 lg:w-[30%] mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
    {selectedProgramType && (
        <div className="w-full">
            <h4 className="font-semibold text-blue-900 mb-2 text-base sm:text-lg">Program Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 text-sm">
                <div className=" p-2 rounded border border-blue-100">
                    <span className="text-black">Total Students: </span>
                    <span className="font-semibold">{currentData.statistics.totalStudents?.toLocaleString() || '0'}</span>
                </div>
                <div className=" p-2 rounded border border-blue-100">
                    <span className="text-black">Girls: </span>
                    <span className="font-semibold">{currentData.statistics.girlsPercentage || 0}%</span>
                </div>
                <div className=" p-2 rounded border border-blue-100">
                    <span className="text-black">Boys: </span>
                    <span className="font-semibold">{currentData.statistics.boysPercentage || 0}%</span>
                </div>
                <div className=" p-2 rounded border border-blue-100 sm:col-span-2 lg:col-span-1">
                    <div className="text-black">Districts:</div>
                    <div className="font-semibold truncate" title={currentData.statistics.districts?.join(', ') || 'None'}>
                        {currentData.statistics.districts?.join(', ') || 'None'}
                    </div>
                </div>
                <div className=" p-2 rounded border border-blue-100 sm:col-span-2 lg:col-span-1">
                    <span className="text-blue-600">Data Entries: </span>
                    <span className="font-semibold">{currentData.statistics.entriesCount}</span>
                </div>
            </div>
        </div>
    )}
</div>            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatsCard
                  title="Program Type"
                  value={selectedProgramType}
                  icon={<Target className="w-6 h-6 text-blue-600" />}
                  bgColor="bg-blue-300"
                  iconBg="bg-blue-100"
                />
                <StatsCard
                  title="Enrolled"
                  value={currentData.statistics.totalStudents?.toLocaleString() || '0'}
                  icon={<Users className="w-6 h-6 text-green-600" />}
                  bgColor="bg-green-300"
                  iconBg="bg-green-100"
                />
                <StatsCard
                  title="Districts"
                  value={currentData.statistics.districts?.length || 0}
                  icon={<MapPin className="w-6 h-6 text-purple-600" />}
                  bgColor="bg-purple-300"
                  iconBg="bg-purple-100"
                />
                <StatsCard
                  title="Data Entries"
                  value={currentData.statistics.entriesCount || 0}
                  icon={<GraduationCap className="w-6 h-6 text-orange-600" />}
                  bgColor="bg-orange-300"
                  iconBg="bg-orange-100"
                />
            </div>
            </>
        );
    };

    return (
        <>
            {toast.visible && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(t => ({ ...t, visible: false }))}
                />
            )}

            <div className="p-4 md:p-6 bg-[#F8F9FA]">
                {/* Program Selection Dropdown */}
                <div className="max-w-7xl mx-auto mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Programs Dashboard</h1>
                                <p className="text-gray-600 mt-1">Select a program to view detailed analytics and metrics</p>
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedProgramType}
                                    onChange={(e) => handleProgramSelect(e.target.value)}
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-64"
                                    disabled={loading}
                                >
                                    <option value="">Select a Program</option>
                                    {programs.map((program) => (
                                        <option key={program.type} value={program.type}>
                                            {program.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Custom Statistics Cards */}
                <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 pb-4">
              
                    <ProgramStatsCards />
                </div>

                <div className="grid md:grid-cols-2 gap-4 md:gap-6 sm:grid-cols-1">
                    {/* Dynamic Enrollments Chart */}
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h3 className="text-base md:text-lg font-semibold text-gray-900">
                                Enrollments by District {selectedProgramType ? `(${selectedProgramType})` : ''}
                            </h3>
                            {loading && (
                                <div className="flex items-center text-gray-500">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                                    Loading...
                                </div>
                            )}
                        </div>

                        {currentData.enrollmentsData.length > 0 ? (
                            <div className="overflow-x-auto">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={currentData.enrollmentsData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="district" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="enrolled" fill="#4A90E2" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-48 text-gray-500">
                                <div className="text-center">
                                    <p className="text-lg mb-2">No enrollment data available</p>
                                    <p className="text-sm">
                                        {selectedProgramType ? 'No entries found for this program type' : 'Please select a program to view data'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Static Trend Chart */}
                    <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">OOSC Trend Overview (Static)</h3>
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
                                    <Tooltip formatter={(value) => [`${value}%`, 'OOSC Rate']} />
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


              
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100 mt-4">
                    <div className="bg-[#F8FAFC] rounded-lg p-4 shadow border border-blue-100 w-full md:w-1/2 flex flex-col items-center">
                        <div className="flex items-center justify-between w-full mb-4">
                            <h3 className="text-center text-base font-semibold text-gray-900">
                                Gender Distribution {selectedProgramType ? `(${selectedProgramType})` : ''}
                            </h3>
                            {loading && (
                                <div className="flex items-center text-gray-500">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                                </div>
                            )}
                        </div>
                        <div className="w-full flex justify-center">
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={currentData.genderData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={0}
                                        outerRadius={60}
                                        paddingAngle={0}
                                        dataKey="value"
                                    >
                                        {currentData.genderData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        iconType="circle"
                                        formatter={(value) => {
                                            const item = currentData.genderData.find(d => d.name === value);
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

                    <div className="flex flex-col items-center justify-center w-full md:w-1/2 space-y-2 pt-4">
                       

                        <button
                            className="text-black text-sm font-medium bg-transparent border border-gray-500 px-4 py-2 rounded-lg w-full transition-colors duration-200 hover:bg-gray-50"
                            disabled={loading}
                        >
                            Edit Program Info
                        </button>
                        <button
                            className="text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg w-full transition-colors duration-200 disabled:bg-blue-300"
                            disabled={loading || !selectedProgramType}
                        >
                            Export Program Data
                        </button>
                        <button
                            className="text-white text-sm font-medium bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg w-full transition-colors duration-200 disabled:bg-green-300"
                            disabled={loading || !selectedProgramType}
                        >
                            Add Beneficiary
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
