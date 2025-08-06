import React,{useState,useEffect} from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { Loader2 } from 'lucide-react'
import { MapContainer, TileLayer, Circle, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Map controller component to handle map updates
const MapController = ({ center, zoom }) => {
  const map = useMap()

  React.useEffect(() => {
    if (!map || typeof map.getCenter !== 'function' || typeof map.getZoom !== 'function') return;
    if (center && zoom) {
      const currentCenter = map.getCenter()
      const currentZoom = map.getZoom()
      // Only fly if center/zoom are different
      if (
        Math.abs(currentCenter.lat - center[0]) > 0.001 ||
        Math.abs(currentCenter.lng - center[1]) > 0.001 ||
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

function BottomSection({ filteredData = [], loading = false }) {

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

  // Map state
  const [mapCenter, setMapCenter] = useState([34.0151, 71.5249]); // Default center for Pakistan
  const [mapZoom, setMapZoom] = useState(8);
  const [concentrationCircles, setConcentrationCircles] = useState([]);

  // Process filtered data for charts
  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      // Program chart: Count occurrences of each program type
      const programCounts = {};
      let totalPrograms = 0;
      filteredData.forEach(entry => {
        const type = entry.programType || 'Unknown';
        programCounts[type] = (programCounts[type] || 0) + 1;
        totalPrograms++;
      });
      const programChartData = Object.entries(programCounts).map(([type, count]) => ({
        label: type,
        value: totalPrograms > 0 ? Math.round((count / totalPrograms) * 100) : 0
      }));
      setProgramData(programChartData);

      // District chart: Count occurrences of each district
      const districtCounts = {};
      let totalDistricts = 0;
      filteredData.forEach(entry => {
        const rawDistrict = entry.district || 'Unknown';
        const district = rawDistrict.toLowerCase();
        districtCounts[district] = (districtCounts[district] || 0) + 1;
        totalDistricts++;
      });

      const displayLabels = {};
      filteredData.forEach(entry => {
        const rawDistrict = entry.district || 'Unknown';
        const district = rawDistrict.toLowerCase();
        displayLabels[district] = rawDistrict.replace(/\b\w/g, c => c.toUpperCase());
      });
      const districtChartData = Object.entries(districtCounts).map(([district, count]) => ({
        label: displayLabels[district] || district,
        value: totalDistricts > 0 ? Math.round((count / totalDistricts) * 100) : 0
      }));
      setDistrictData(districtChartData);
    } else {
      // Reset data when no filtered data
      setProgramData([]);
      setDistrictData([]);
    }
  }, [filteredData]);


  // Process dropout reasons from filtered data
  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      let totalPoverty = 0;
      let totalDisability = 0;
      let totalOther = 0;
      let totalDropout = 0;

      filteredData.forEach(entry => {
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
    } else {
      // Reset to default when no data
      setDropoutReasons([
        { reason: 'Disability', percentage: 0, color: 'bg-[#00B8D9]' },
        { reason: 'Poverty', percentage: 0, color: 'bg-[#F44336]' },
        { reason: 'Other', percentage: 0, color: 'bg-[#9C27B0]' },
      ]);
    }
  }, [filteredData]);

  // Calculate concentration circles for out-of-school children
  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      try {
        const circles = calculateConcentrationCircles(filteredData);
        setConcentrationCircles(circles);

        // Update map center to show the data area
        if (circles.length > 0) {
          const avgLat = circles.reduce((sum, circle) => sum + circle.center[0], 0) / circles.length;
          const avgLng = circles.reduce((sum, circle) => sum + circle.center[1], 0) / circles.length;

          // Validate coordinates before setting
          if (!isNaN(avgLat) && !isNaN(avgLng) && avgLat !== 0 && avgLng !== 0) {
            setMapCenter([avgLat, avgLng]);
            setMapZoom(10);
          } else {
            // Fallback to default Pakistan center
            setMapCenter([34.0151, 71.5249]);
            setMapZoom(8);
          }
        } else {
          // No circles but data exists - center on Pakistan
          setMapCenter([34.0151, 71.5249]);
          setMapZoom(8);
        }
      } catch (error) {
        console.error('Error calculating concentration circles:', error);
        setConcentrationCircles([]);
        setMapCenter([34.0151, 71.5249]);
        setMapZoom(8);
      }
    } else {
      setConcentrationCircles([]);
      setMapCenter([34.0151, 71.5249]);
      setMapZoom(8);
    }
  }, [filteredData]);

  // Function to calculate concentration circles based on data density
  const calculateConcentrationCircles = (data) => {
    const circles = [];
    const processedLocations = new Set();

    data.forEach(entry => {
      const lat = parseFloat(entry.lat);
      const lng = parseFloat(entry.log);
      const outOfSchoolCount = Number(entry.outOfSchoolChildren) || 0;

      // Skip invalid coordinates or zero out-of-school children
      if (isNaN(lat) || isNaN(lng) || outOfSchoolCount === 0) return;

      const locationKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
      if (processedLocations.has(locationKey)) return;
      processedLocations.add(locationKey);

      // Find nearby entries within 0.05 degrees (~5km)
      const nearbyEntries = data.filter(otherEntry => {
        const otherLat = parseFloat(otherEntry.lat);
        const otherLng = parseFloat(otherEntry.log);
        if (isNaN(otherLat) || isNaN(otherLng)) return false;

        const distance = Math.sqrt(
          Math.pow(lat - otherLat, 2) + Math.pow(lng - otherLng, 2)
        );
        return distance <= 0.05; // ~5km radius
      });

      // Calculate total out-of-school children in the area
      const schoolEntries = nearbyEntries.filter(e => (e.schoolType || 'School') === 'School');
      const madrasaEntries = nearbyEntries.filter(e => (e.schoolType || 'School') === 'Madrasa');

      const schoolOutOfSchool = schoolEntries.reduce((sum, e) => sum + (Number(e.outOfSchoolChildren) || 0), 0);
      const madrasaOutOfSchool = madrasaEntries.reduce((sum, e) => sum + (Number(e.outOfSchoolChildren) || 0), 0);

      // Create circles for significant concentrations (minimum threshold of 10 children)
      if (schoolOutOfSchool >= 10) {
        const intensity = Math.min(schoolOutOfSchool / 500, 1); // Normalize intensity
        circles.push({
          center: [lat, lng],
          radius: Math.min(Math.max(schoolOutOfSchool * 8, 800), 4000), // Scale radius based on count
          color: '#dc2626', // Red for out-of-school children
          fillColor: '#dc2626',
          fillOpacity: Math.max(0.2, Math.min(intensity * 0.7, 0.7)),
          weight: 2,
          type: 'school',
          count: schoolOutOfSchool,
          totalEntries: schoolEntries.length,
          district: entry.district || 'Unknown',
          tehsil:entry.tehsil||'Unknown',
          unioncouncil:entry.unioncouncil||'Unknown',
          village:entry.villagecouncil||'Unknown'
        });
      }

      if (madrasaOutOfSchool >= 10) {
        const intensity = Math.min(madrasaOutOfSchool / 500, 1); // Normalize intensity
        circles.push({
          center: [lat, lng],
          radius: Math.min(Math.max(madrasaOutOfSchool * 8, 800), 4000), // Scale radius based on count
          color: '#059669', // Green for out-of-madrasa children
          fillColor: '#059669',
          fillOpacity: Math.max(0.2, Math.min(intensity * 0.7, 0.7)),
          weight: 2,
          type: 'madrasa',
          count: madrasaOutOfSchool,
          totalEntries: madrasaEntries.length,
          district: entry.district || 'Unknown',
          tehsil:entry.tehsil||'Unknown',
          unioncouncil:entry.unioncouncil||'Unknown',
          village:entry.villagecouncil||'Unknown'
        });
      }
    });

    // Sort circles by count (largest first) to ensure proper layering
    return circles.sort((a, b) => b.count - a.count);
  };




  // Show loading state
  if (loading) {
    return (

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100 flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-600">Loading chart data...</span>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100 flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-600">Loading program data...</span>
            </div>
          </div>
        </div>
        <div className="space-y-4 md:space-y-6">
          <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100 flex items-center justify-center h-64">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-gray-600">Loading dropout data...</span>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
      {/* Left Column - Bar Charts */}
      <div className="space-y-4 md:space-y-6">
        {/* OOSC by District */}
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">OOSC by District</h3>
          {districtData.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No district data available</p>
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Access Programmes */}
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">Access Programmes</h3>
          {programData.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <p className="text-gray-500 mb-2">No program data available</p>
                <p className="text-sm text-gray-400">Try adjusting your filters</p>
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>


      {/* Right Column - Drop-out Reasons and Map*/}
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

        {/* Concentration Map */}
        <div className="bg-white rounded-lg p-4 md:p-6 shadow-sm border border-gray-100">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4 md:mb-6">
            Out-of-School Children Concentration Map
          </h3>
          <div className="space-y-4">
            {/* Legend and Statistics */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 opacity-60"></div>
                  <span>Out-of-School Children</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 opacity-60"></div>
                  <span>Out-of-Madrasa Children</span>
                </div>
              </div>

              {concentrationCircles.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{concentrationCircles.length}</span> concentration area{concentrationCircles.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="h-80 border border-gray-300 rounded-lg overflow-hidden">
              {concentrationCircles.length === 0 ? (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <p className="text-gray-500 mb-2">No concentration data available</p>
                    <p className="text-sm text-gray-400">Try adjusting your filters</p>
                  </div>
                </div>
              ) : (
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
                  <MapController center={mapCenter} zoom={mapZoom} />

                  {/* Render concentration circles */}
                  {concentrationCircles.map((circle, index) => (
                    <Circle
                      key={`${circle.type}-${index}-${circle.center[0]}-${circle.center[1]}`}
                      center={circle.center}
                      radius={circle.radius}
                      pathOptions={{
                        color: circle.color,
                        fillColor: circle.fillColor,
                        fillOpacity: circle.fillOpacity,
                        weight: circle.weight,
                        opacity: 0.8
                      }}
                    >
                      <Popup>
                        <div className="text-sm min-w-48">
                          <h4 className="font-semibold mb-2 text-gray-800">
                            {circle.type === 'school' ? '🏫 Out-of-School Children' : '🕌 Out-of-Madrasa Children'}
                          </h4>
                          <div className="space-y-1">
                            <p><strong>Children Count:</strong> <span className="text-red-600">{circle.count.toLocaleString()}</span></p>
                            <p><strong>District:</strong> {circle.district}</p>
                            <p><strong>Tehsil:</strong>{circle.tehsil}</p>
                            <p><strong>Union Council:</strong>{circle.unioncouncil}</p>
                            <p><strong>Village Council:</strong>{circle.village}</p>
                            <p><strong>Locations:</strong> {circle.totalEntries}</p>
                            <p><strong>Institution Type:</strong> {circle.type === 'school' ? 'School' : 'Madrasa'}</p>
                            <p><strong>Coordinates:</strong> {circle.center[0].toFixed(4)}, {circle.center[1].toFixed(4)}</p>
                          </div>
                        </div>
                      </Popup>
                    </Circle>
                  ))}
                </MapContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BottomSection
