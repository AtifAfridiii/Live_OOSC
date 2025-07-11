import React from "react";
const StatsCard = ({ title, value, icon, bgColor, iconBg }) => (
  <div className={`rounded-lg p-4 md:p-6 shadow-sm border border-gray-100 ${bgColor}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`rounded-lg p-3 ${iconBg}`}>{icon}</div>
    </div>
  </div>
);

export default StatsCard;
