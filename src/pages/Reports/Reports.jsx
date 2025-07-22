import React, { useState, useEffect } from 'react'
import {  Download, FileText, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import axiosInstance from '../../utils/axiosInstance'
import { API_PATHS } from '../../utils/apiPaths'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import Toast from '../../components/Toast'

const Reports = () => {
  const [filters, setFilters] = useState({
    district: 'Select...',
    program: 'Select...',
    year: '2024'
  })

  // State for API data
  const [apiData, setApiData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Derived state for dropdown options
  const [districts, setDistricts] = useState([])
  const [programs, setPrograms] = useState([])
  const [years, setYears] = useState([])

  // Filtered data based on current filters
  const [filteredData, setFilteredData] = useState([])
  const [statistics, setStatistics] = useState({
    enrolled: 0,
    dropoutRate: 0,
    girlsEnrolled: 0
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [goToPage, setGoToPage] = useState('')

  // Independent export district selection for export only
  const [exportDistrict, setExportDistrict] = useState('Select...');

  // Export loading states
  const [exportLoading, setExportLoading] = useState({
    excel: false,
    pdf: false
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await axiosInstance.get(API_PATHS.ENTRIES.GET_ALL_ENTRIES)
        const data = response.data

        // Sort entries by creation date (newest first)
        const sortedData = data.sort((a, b) => {
          // Try different possible date fields
          const dateA = new Date(a.createdAt || a.date || a.created_at || a.timestamp || 0)
          const dateB = new Date(b.createdAt || b.date || b.created_at || b.timestamp || 0)
          return dateB - dateA // Descending order (newest first)
        })

        console.log('📅 Sorted report entries by date (newest first):', sortedData.length, 'entries')
        if (sortedData.length > 0) {
          console.log('📅 First entry date:', sortedData[0].createdAt || sortedData[0].date || 'No date field')
          console.log('📅 Last entry date:', sortedData[sortedData.length - 1].createdAt || sortedData[sortedData.length - 1].date || 'No date field')
        }

        setApiData(sortedData)

        // Extract unique values for dropdowns
        const uniqueDistricts = [...new Set(data.map(entry => entry.district))].filter(Boolean)
        const uniquePrograms = [...new Set(data.map(entry => entry.programType))].filter(Boolean)
        const uniqueYears = [...new Set(data.map(entry => {
          if (entry.date) {
            return new Date(entry.date).getFullYear()
          }
          return null
        }))].filter(Boolean).sort((a, b) => b - a)

        setDistricts(uniqueDistricts)
        setPrograms(uniquePrograms)
        setYears(uniqueYears)

        // Set default year if available
        if (uniqueYears.length > 0) {
          setFilters(prev => ({
            ...prev,
            year: uniqueYears[0].toString()
          }))
        }

      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to fetch data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Update filtered data when filters change
  useEffect(() => {
    if (!apiData.length) return;

    // --- Filter programs based on district ---
    let filteredPrograms = [];
    if (filters.district !== 'Select...') {
      filteredPrograms = [
        ...new Set(
          apiData
            .filter(entry => entry.district === filters.district)
            .map(entry => entry.programType)
        )
      ].filter(Boolean);
      setPrograms(filteredPrograms);

      // Reset program if it's no longer valid
      if (!filteredPrograms.includes(filters.program) && filters.program !== 'Select...') {
        setFilters(prev => ({ ...prev, program: 'Select...' }));
      }
    } else {
      const allPrograms = [...new Set(apiData.map(entry => entry.programType))].filter(Boolean);
      setPrograms(allPrograms);
    }

    // --- Filter years based on district + program ---
    let filteredYears = [];
    if (filters.district !== 'Select...' && filters.program !== 'Select...') {
      filteredYears = [
        ...new Set(
          apiData
            .filter(
              entry =>
                entry.district === filters.district &&
                entry.programType === filters.program &&
                entry.date
            )
            .map(entry => new Date(entry.date).getFullYear())
        )
      ].sort((a, b) => b - a);
    } else {
      filteredYears = [
        ...new Set(
          apiData
            .filter(entry =>
              filters.district === 'Select...' ? true : entry.district === filters.district
            )
            .map(entry => entry.date && new Date(entry.date).getFullYear())
        )
      ]
        .filter(Boolean)
        .sort((a, b) => b - a);
    }

    setYears(filteredYears);

    // Reset year if it's no longer valid
    if (!filteredYears.map(String).includes(filters.year) && filters.year !== 'Select...') {
      setFilters(prev => ({
        ...prev,
        year: filteredYears.length > 0 ? filteredYears[0].toString() : 'Select...'
      }));
    }

    // --- Filter data ---
    let filtered = apiData;

    if (filters.district !== 'Select...') {
      filtered = filtered.filter(entry => entry.district === filters.district);
    }
    if (filters.program !== 'Select...') {
      filtered = filtered.filter(entry => entry.programType === filters.program);
    }
    if (filters.year !== 'Select...') {
      filtered = filtered.filter(entry => {
        if (entry.date) {
          return new Date(entry.date).getFullYear().toString() === filters.year;
        }
        return false;
      });
    }

    setFilteredData(filtered);

    // --- Stats ---
    if (filtered.length > 0) {
      const totalChildren = filtered.reduce((sum, entry) => sum + (entry.totalChildren || 0), 0);
      const totalOutOfSchool = filtered.reduce((sum, entry) => sum + (entry.outOfSchoolChildren || 0), 0);
      const avgGirlsPercentage =
        filtered.reduce((sum, entry) => sum + (entry.girlsPercentage || 0), 0) / filtered.length;

      const outOfSchoolRate =
        totalChildren > 0 ? ((totalOutOfSchool / totalChildren) * 100).toFixed(1) : 0;

      setStatistics({
        enrolled: totalChildren,
        dropoutRate: parseFloat(outOfSchoolRate),
        girlsEnrolled: parseFloat(avgGirlsPercentage.toFixed(1))
      });
    } else {
      setStatistics({ enrolled: 0, dropoutRate: 0, girlsEnrolled: 0 });
    }
  }, [apiData, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
    console.log('🔍 Reports filters changed, reset to page 1')
  }, [filters])

  // Generate chart data from filtered data
  const generateChartData = () => {
    if (!filteredData.length) return [];

    const chartData = {};

    filteredData.forEach(entry => {
      const district = entry.district;
      const program = entry.programType?.toLowerCase() || '';
      const totalChildren = entry.totalChildren || 0;

      if (!chartData[district]) {
        chartData[district] = { district, voucher: 0, mosque: 0 };
      }

      if (program.includes('voucher')) {
        chartData[district].voucher += totalChildren;
      } else if (program.includes('mosque')) {
        chartData[district].mosque += totalChildren;
      }
    });

    console.log('Chart Data:', Object.values(chartData)); // Debug

    return Object.values(chartData);
  };
  // Generate table data from filtered data
  const generateTableData = () => {
    if (!filteredData.length) return []

    return filteredData.map(entry => {
      // Format coordinates as "lat, lng" if both lat and log exist
      let locationCoordinates = 'N/A';
      if (entry.lat !== undefined && entry.log !== undefined &&
          entry.lat !== null && entry.log !== null &&
          entry.lat !== '' && entry.log !== '') {
        locationCoordinates = `${entry.lat}, ${entry.log}`;
      }

      return {
        district: entry.district || 'N/A',
        program: entry.programType || 'N/A',
        totalChildren: entry.totalChildren || 0,
        outOfSchool: entry.outOfSchoolChildren || 0,
        outOfSchoolRate: entry.totalChildren > 0 ? ((entry.outOfSchoolChildren / entry.totalChildren) * 100).toFixed(1) : 0,
        girls: entry.girlsPercentage || 0,
        boys: entry.boysPercentage || 0,
        poverty: entry.povertyPercentage || 0,
        disability: entry.disabilityPercentage || 0,
        other: entry.otherPercentage || 0,
        date: entry.date ? new Date(entry.date).toLocaleDateString() : 'N/A',
        unioncouncil: entry.unioncouncil || 'N/A',
        villagecouncil: entry.villagecouncil || 'N/A',
        pk: entry.pk || 'N/A',
        tehsil: entry.tehsil || 'N/A',
        national: entry.national || 'N/A',
        location: locationCoordinates,
      }
    })
  }

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }))
  }

  const handleExportExcel = async () => {
    try {
      setExportLoading(prev => ({ ...prev, excel: true }));

      // Get the data to export based on district filter
      const exportRows = exportDistrict !== 'Select...'
        ? filteredTableData.filter(row => row.district === exportDistrict)
        : filteredTableData;

      if (exportRows.length === 0) {
        <Toast message="No data available to export" type="error" />
        return;
      }

      // Prepare data for Excel export
      const excelData = exportRows.map(row => ({
        'District': row.district,
        'Program': row.program,
        'Total Children': row.totalChildren,
        'Out of School': row.outOfSchool,
        'Out of School %': `${row.outOfSchoolRate}%`,
        'Girls %': `${row.girls}%`,
        'Boys %': `${row.boys}%`,
        'Date': row.date,
        'Union Council': row.unioncouncil,
        'Village Council': row.villagecouncil,
        'PK constituency': row.pk,
        'Tehsil': row.tehsil,
        'NA constituency': row.national,
        'Location': row.location
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // District
        { wch: 18 }, // Union Council
        { wch: 18 }, // Village Council
        { wch: 18 }, // PK constituency
        { wch: 15 }, // Tehsil
        { wch: 18 }, // NA constituency
        { wch: 20 }, // Location
        { wch: 20 }, // Program
        { wch: 15 }, // Total Children
        { wch: 15 }, // Out of School
        { wch: 15 }, // Out of School %
        { wch: 10 }, // Girls %
        { wch: 10 }, // Boys %
        { wch: 12 }  // Date
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports Data');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const districtSuffix = exportDistrict !== 'Select...' ? `_${exportDistrict.replace(/\s+/g, '_')}` : '';
      const filename = `OOSC_Reports${districtSuffix}_${timestamp}.xlsx`;

      // Export the file
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);

      console.log(`✅ Excel export successful: ${filename} (${exportRows.length} rows)`);

    } catch (error) {
      console.error('❌ Excel export failed:', error);
      <Toast message="Failed to export Excel file. Please try again." type="error" />
    } finally {
      setExportLoading(prev => ({ ...prev, excel: false }));
    }
  }

  const handleExportPDF = async () => {
    try {
      setExportLoading(prev => ({ ...prev, pdf: true }));

      // Get the data to export based on district filter
      const exportRows = exportDistrict !== 'Select...'
        ? filteredTableData.filter(row => row.district === exportDistrict)
        : filteredTableData;

      if (exportRows.length === 0) {
        alert('No data available to export');
        return;
      }

      // Create PDF document
      const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation

      // Add title
      const title = exportDistrict !== 'Select...'
        ? `OOSC Reports - ${exportDistrict} District`
        : 'OOSC Reports - All Districts';

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, 20);

      // Add generation date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
      doc.text(`Total Records: ${exportRows.length}`, 20, 36);

      // Prepare table data
      const tableHeaders = [
        'District',
        'Program',
        'Total Children',
        'Out of School',
        'Out of School %',
        'Girls %',
        'Boys %',
        'Date',
        'Union Council',
        'Village Council',
        'PK constituency',
        'Tehsil',
        'NA constituency',
        'Location'
      ];

      const tableData = exportRows.map(row => [
        row.district,
        row.program,
        row.totalChildren.toLocaleString(),
        row.outOfSchool.toLocaleString(),
        `${row.outOfSchoolRate}%`,
        `${row.girls}%`,
        `${row.boys}%`,
        row.date,
        row.unioncouncil,
        row.villagecouncil,
        row.pk,
        row.tehsil,
        row.national,
        row.location
      ]);

      // Add table using autoTable
      autoTable(doc, {
        head: [tableHeaders],
        body: tableData,
        startY: 45,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [66, 139, 202], // Bootstrap blue
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245], // Light gray
        },
        columnStyles: {
          0: { cellWidth: 20 }, // District
          1: { cellWidth: 25 }, // Union Council
          2: { cellWidth: 25 }, // Village Council
          3: { cellWidth: 25 }, // PK constituency
          4: { cellWidth: 20 }, // Tehsil
          5: { cellWidth: 25 }, // NA constituency
          6: { cellWidth: 30 }, // Location
          7: { cellWidth: 35 }, // Program
          8: { cellWidth: 20 }, // Total Children
          9: { cellWidth: 20 }, // Out of School
          10: { cellWidth: 20 }, // Out of School %
          11: { cellWidth: 15 }, // Girls %
          12: { cellWidth: 15 }, // Boys %
          13: { cellWidth: 20 }, // Date
        },
        margin: { left: 20, right: 20 },
        didDrawPage: (data) => {
          // Add page numbers
          const pageCount = doc.internal.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

          doc.setFontSize(8);
          doc.text(`Page ${data.pageNumber} of ${pageCount}`,
            pageSize.width - 30, pageHeight - 10);
        }
      });

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const districtSuffix = exportDistrict !== 'Select...' ? `_${exportDistrict.replace(/\s+/g, '_')}` : '';
      const filename = `OOSC_Reports${districtSuffix}_${timestamp}.pdf`;

      // Save the PDF
      doc.save(filename);

      console.log(`✅ PDF export successful: ${filename} (${exportRows.length} rows)`);

    } catch (error) {
      console.error('❌ PDF export failed:', error);
      alert('Failed to export PDF file. Please try again.');
    } finally {
      setExportLoading(prev => ({ ...prev, pdf: false }));
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-600">Loading reports data...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
            <div className="text-center">
              <div className="text-red-500 mb-2">Error</div>
              <div className="text-gray-600">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
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
    console.log('📄 Reports page changed to:', newPage)
  }

  const handleGoToPage = () => {
    const pageNumber = parseInt(goToPage)
    const totalPages = getTotalPages(tableData.length)

    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
      setGoToPage('')
      console.log('📄 Reports navigated to page:', pageNumber)
    } else {
      alert(`Please enter a page number between 1 and ${totalPages}`)
    }
  }

  const getPaginationInfo = (totalItems) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1
    const endItem = Math.min(currentPage * itemsPerPage, totalItems)
    return { startItem, endItem, totalItems }
  }



  const chartData = generateChartData()
  const tableData = generateTableData()

  // Filter table data by exportDistrict if selected
  const filteredTableData = exportDistrict !== 'Select...'
    ? tableData.filter(row => row.district === exportDistrict)
    : tableData;

  // Get paginated table data
  const paginatedTableData = getPaginatedEntries(filteredTableData);
  const totalPages = getTotalPages(filteredTableData.length);
  const paginationInfo = getPaginationInfo(filteredTableData.length);

  console.log('📊 Total table entries:', filteredTableData.length);
  console.log('📄 Paginated entries for page', currentPage, ':', paginatedTableData.length);
  console.log('📄 Total pages:', totalPages);
  console.log('📄 Pagination info:', paginationInfo);

  return (
    <div className="p-4 md:p-6 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">Reports</h1>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 md:p-6">
          {/* Header with Logo and Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-gray-200">
                <span className="text-[#2c5aa0] font-bold text-sm">O</span>
              </div>
              <span className="font-medium text-sm text-gray-700">OOSC Edu App Track</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">Reports ({filteredData.length} entries)</span>
              </div>

            </div>
          </div>

          {/* Filters Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District:
              </label>
              <select
                value={filters.district}
                onChange={(e) => handleFilterChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="Select...">Select...</option>
                {districts.map(district => (
                  <option key={district} value={district}>{district}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program:
              </label>
              <select
                value={filters.program}
                onChange={(e) => handleFilterChange('program', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="Select...">Select...</option>
                {programs.map(program => (
                  <option key={program} value={program}>{program}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year:
              </label>
              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="Select...">Select...</option>
                {years.map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 md:p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-sm font-medium text-blue-600 mb-2">Enrolled</div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-700">
                {statistics.enrolled.toLocaleString()}
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-lg p-4 md:p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-sm font-medium text-red-600 mb-2">Dropout Rate</div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-red-700">
                {statistics.dropoutRate}%
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4 md:p-6 text-center hover:shadow-md transition-shadow duration-200">
              <div className="text-sm font-medium text-yellow-600 mb-2">Girls Enrolled</div>
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-700">
                {statistics.girlsEnrolled}%
              </div>
            </div>
          </div>

          {/* Enrollment Comparison Chart */}
          <div className="mb-8 bg-gray-50 rounded-lg p-4 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
              <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-3 lg:mb-0">
                Enrollment Comparison by District
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm">
              <div className="flex items-center space-x-2">
  <div className="w-3 h-3 bg-[#4A90E2] rounded-sm"></div>
  <span className="text-gray-600 font-medium">Voucher Program</span>
</div>
<div className="flex items-center space-x-2">
  <div className="w-3 h-3 bg-[#2ECC71] rounded-sm"></div>
  <span className="text-gray-600 font-medium">Mosque Program</span>
</div>

              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              {chartData.length > 0 ? (
                <div className="h-64 md:h-80 lg:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="district"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                      />
                     <Bar dataKey="voucher" fill="#4A90E2" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="mosque" fill="#2ECC71" radius={[3, 3, 0, 0]} />

                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No data available for the selected filters
                </div>
              )}
            </div>
          </div>

          {/* Program Summary Table */}
          <div className="mb-8">
            {/*  export controls above table */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export by District :</label>
                <select
                  value={exportDistrict}
                  onChange={e => setExportDistrict(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="Select...">All Districts</option>
                  {districts.map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleExportExcel}
              disabled={filteredData.length === 0 || exportLoading.excel}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
            >
              {exportLoading.excel ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>{exportLoading.excel ? 'Exporting...' : 'Export Excel'}</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={filteredData.length === 0 || exportLoading.pdf}
              className="bg-[#4A90E2] hover:bg-[#2c5aa0] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 text-sm"
            >
              {exportLoading.pdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>{exportLoading.pdf ? 'Exporting...' : 'Export PDF'}</span>
            </button>
          </div>
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
              Program Summary Table ({tableData.length} total{tableData.length > itemsPerPage ? `, showing ${paginatedTableData.length} on page ${currentPage}` : ''})
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              District
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Program
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Children
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Out of School
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Out of School %
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Girls %
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Boys %
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Union Council
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Village Council
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              PK constituency
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tehsil
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NA constituency
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Location
            </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedTableData.length > 0 ? (
                      paginatedTableData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.district}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.program}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.totalChildren.toLocaleString()}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.outOfSchool.toLocaleString()}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{row.outOfSchoolRate}%</span></td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">{row.girls}%</span></td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{row.boys}%</span></td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.date}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.unioncouncil}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.villagecouncil}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.pk}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.tehsil}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.national}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.location}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="14" className="px-4 py-8 text-center text-gray-500">
                          {tableData.length === 0 ? 'No data available for the selected filters' : 'No entries on this page'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {tableData.length > 0 && (
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
      </div>
    </div>
  )
}

export default Reports