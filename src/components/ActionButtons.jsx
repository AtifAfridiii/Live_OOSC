import React from 'react'
import { TrendingUp, UserPlus } from 'lucide-react'

const ActionButtons = () => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mt-4 md:mt-6">
      <button className="bg-[#4A90E2] hover:bg-[#2c5aa0] text-white px-6 md:px-10 py-2 md:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm text-sm md:text-base">
        <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
        <span>Track Enrollment</span>
      </button>

      <button className="bg-[#4A90E2] hover:bg-[#2c5aa0] text-white px-6 md:px-10 py-2 md:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm text-sm md:text-base">
        <UserPlus className="w-4 h-4 md:w-5 md:h-5" />
        <span>Assign Task</span>
      </button>
    </div>
  )
}

export default ActionButtons
