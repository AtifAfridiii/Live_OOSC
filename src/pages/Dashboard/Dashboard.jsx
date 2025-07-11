import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Header from '../../components/Header'
import MainContent from '../Home/Home_Overview'
import DataManagement from '../DataManagement/DataManagment'
import Programs from '../Programs/Programs'
import DistrictsPage from '../Districts/Districts'
import Reports from '../Reports/Reports'
import Users from '../Users/Users'

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    // Close sidebar only on mobile (not tablet) when navigation occurs
    if (window.innerWidth < 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleSidebarClose}
      />

      {/* Main Content Area - Adjusted for tablet sidebar */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-0">
        <Header onMenuClick={handleMenuClick} />
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="/overview" element={<MainContent />} />
            <Route path="/districts" element={<DistrictsPage />} />
            <Route path="/data-management" element={<DataManagement />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
