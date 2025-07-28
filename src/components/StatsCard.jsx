import React from "react";
const StatsCard = ({ title, value, icon, bgColor = "bg-white", iconBg = "bg-gray-100" }) => (
  <div className={`rounded-lg p-3 sm:p-4 md:p-6 shadow-sm border border-gray-100 ${bgColor} min-h-[100px] sm:min-h-[120px]`}>
    <div className="flex items-center justify-between h-full">
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
        <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mt-1 break-words">{value}</p>
      </div>
      <div className={`rounded-lg p-2 sm:p-3 ml-2 flex-shrink-0 ${iconBg}`}>{icon}</div>
    </div>
  </div>
);

export default StatsCard;
