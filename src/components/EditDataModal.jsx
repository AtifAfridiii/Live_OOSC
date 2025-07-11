import React, { useState } from 'react'
import { Search, X } from 'lucide-react'

const EditDataModal = ({ isOpen, onClose, data, onSave }) => {
  const [formData, setFormData] = useState({
    district: '',
    totalChildren: '',
    outOfSchoolChildren: '',
    gender: { girls: '', boys: '' },
    programType: 'Voucher',
    date: '',
    dropOutReasons: {
      poverty: false,
      distance: false,
      other: false
    }
  })

  // Initialize form data when modal opens with existing data
  React.useEffect(() => {
    if (data) {
      setFormData(data)
    }
  }, [data])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGenderChange = (type, value) => {
    setFormData(prev => ({
      ...prev,
      gender: {
        ...prev.gender,
        [type]: value
      }
    }))
  }

  const handleDropOutChange = (reason, checked) => {
    setFormData(prev => ({
      ...prev,
      dropOutReasons: {
        ...prev.dropOutReasons,
        [reason]: checked
      }
    }))
  }

  const handleSaveEntry = () => {
    // Validate required fields
    if (!formData.district || !formData.totalChildren || !formData.outOfSchoolChildren || !formData.date) {
      alert('Please fill in all required fields')
      return
    }

    // Call onSave if provided (for editing existing entries)
    if (onSave) {
      onSave(formData)
    }

    onClose()
  }

  const handleCancel = () => {
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-0">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
              <span className="text-[#2c5aa0] font-bold text-sm">O</span>
            </div>
            <span className="font-medium text-sm">OOSC Edu App Track</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Edit (Data Entry)</span>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search Here..."
                className="text-sm border-none outline-none w-24"
              />
              <span className="text-sm text-gray-500">2024</span>
              <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            </div>
            {/* Cross Icon for closing modal */}
            <button
              onClick={onClose}
              className="ml-4 p-1 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Add New Data Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Add New Data</h2>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District
              </label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => handleInputChange('district', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter district name"
              />
            </div>

            {/* Total Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Children
              </label>
              <input
                type="text"
                value={formData.totalChildren}
                onChange={(e) => handleInputChange('totalChildren', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter total children"
              />
            </div>

            {/* Out of School Children */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Out of School Children
              </label>
              <input
                type="text"
                value={formData.outOfSchoolChildren}
                onChange={(e) => handleInputChange('outOfSchoolChildren', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter out of school children"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Girls %</label>
                  <input
                    type="text"
                    value={formData.gender.girls}
                    onChange={(e) => handleGenderChange('girls', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="%"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Boys %</label>
                  <input
                    type="text"
                    value={formData.gender.boys}
                    onChange={(e) => handleGenderChange('boys', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="%"
                  />
                </div>
              </div>
            </div>

            {/* Program Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Program Type
              </label>
              <select
                value={formData.programType}
                onChange={(e) => handleInputChange('programType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Voucher">Voucher</option>
                <option value="Formal">Formal</option>
                <option value="Merged Schools">Merged Schools</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Drop Out Reasons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Drop Out Reasons
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dropOutReasons.poverty}
                    onChange={(e) => handleDropOutChange('poverty', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Poverty</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dropOutReasons.distance}
                    onChange={(e) => handleDropOutChange('distance', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Distance</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.dropOutReasons.other}
                    onChange={(e) => handleDropOutChange('other', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Other</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEntry}
              className="bg-[#4A90E2] hover:bg-[#2c5aa0] text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Save Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditDataModal
