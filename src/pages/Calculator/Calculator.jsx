import React, { useState } from 'react'

const Calculator = () => {
  // Teachers Calculator State
  const [studentsForTeachers, setStudentsForTeachers] = useState('');
  const [teachersResult, setTeachersResult] = useState('');
  const [showTeachersResult, setShowTeachersResult] = useState(false);

  // Institutes Calculator State
  const [childrenForInstitutes, setChildrenForInstitutes] = useState('');
  const [institutesResult, setInstitutesResult] = useState('');
  const [showInstitutesResult, setShowInstitutesResult] = useState(false);

  // Calculate Teachers (1 teacher per 40 students)
  const calculateTeachers = () => {
    const students = Number(studentsForTeachers) || 0;
    const requiredTeachers = Math.floor(students / 40);

    if(students < 40 && students > 0){
      setTeachersResult('1');
      setShowTeachersResult(true);
      return;
    }else if(students === 0){
      setTeachersResult('');
      setShowTeachersResult(false);
      return;
    }else if(students < 0){
      setTeachersResult('');
      setShowTeachersResult(false);
      return;
    }
    setTeachersResult(requiredTeachers.toString());
    setShowTeachersResult(true);
  };

  // Calculate Institutes (1 institute per 200 children)
  const calculateInstitutes = () => {
    const children = Number(childrenForInstitutes) || 0;
    const requiredInstitutes = Math.ceil(children / 200);
    if(children < 200 && children > 0){
      setInstitutesResult('1');
      setShowInstitutesResult(true);
      return;
    }else if(children === 0){
      setInstitutesResult('');
      setShowInstitutesResult(false);
      return;
    }else if(children < 0){
      setInstitutesResult('');
      setShowInstitutesResult(false);
      return;
    }
    setInstitutesResult(requiredInstitutes.toString());
    setShowInstitutesResult(true);
  };

  // Reset Teachers Calculator
  const resetTeachersCalculator = () => {
    setStudentsForTeachers('');
    setTeachersResult('');
    setShowTeachersResult(false);
  };

  // Reset Institutes Calculator
  const resetInstitutesCalculator = () => {
    setChildrenForInstitutes('');
    setInstitutesResult('');
    setShowInstitutesResult(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Education <span className="text-blue-600">Calculators</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Calculate required teachers and institutes with  specialized calculators
          </p>
        </div>

    {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 mb-12">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📋 How it works</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• <strong>Teachers Calculator:</strong> Uses 1:40 ratio (1 teacher per 40 students)</li>
              <li>• <strong>Institutes Calculator:</strong> Uses 1:200 ratio (1 institute per 200 children)</li>
              <li>• Enter the total number and get instant calculations</li>
              <li>• Results are rounded down using Math.floor for precision</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎯 Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li>• Two separate, specialized calculators</li>
              <li>• Fully responsive design for all devices</li>
              <li>• Smooth animations and transitions</li>
              <li>• Clear calculation breakdown displayed</li>
            </ul>
          </div>
        </div>

        {/* Two Separate Calculators */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Teachers Calculator */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className=" bg-[#2c5aa0] p-6 md:p-8">
              <div className="text-center">
                <div className="text-4xl mb-2">👨‍🏫</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Teachers Calculator
                </h2>
                <p className="text-blue-100 mt-2">
                  Find required teachers (1:40 ratio)
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Students Input */}
              <div className="space-y-2 mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Students *
                </label>
                <input
                  type="number"
                  className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 text-lg"
                  placeholder="Enter total number of students"
                  value={studentsForTeachers}
                  onChange={(e) => setStudentsForTeachers(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={calculateTeachers}
                  className="flex-1  bg-[#2c5aa0] text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500"
                  disabled={!studentsForTeachers}
                >
                  Calculate Teachers
                </button>
                <button
                  onClick={resetTeachersCalculator}
                  className="flex-1 sm:flex-none bg-gray-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:bg-gray-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  Reset
                </button>
              </div>

              {/* Teachers Results */}
              {showTeachersResult && (
                <div className=" bg-[#2c5aa0] rounded-2xl p-6 border-2 border-green-200 animate-fadeIn">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">
                    📊 Teachers Calculation Result
                  </h3>

                  <div className="bg-white rounded-xl p-6 shadow-md text-center">
                    <div className="text-3xl mb-2">📚</div>
                    <h4 className="font-semibold text-gray-700 mb-2">Required Teachers</h4>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {teachersResult}
                    </div>
                    <p className="text-sm text-gray-500">
                      Based on 1 teacher per 40 students
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Calculation:</strong> {studentsForTeachers} students ÷ 40 = {teachersResult} teachers
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Institutes Calculator */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className=" bg-[#2c5aa0] p-6 md:p-8">
              <div className="text-center">
                <div className="text-4xl mb-2">🏫</div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  Institutes Calculator
                </h2>
                <p className="text-purple-100 mt-2">
                  Find required institutes (1:200 ratio)
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Children Input */}
              <div className="space-y-2 mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Total Children *
                </label>
                <input
                  type="number"
                  className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-300 text-lg"
                  placeholder="Enter total number of children"
                  value={childrenForInstitutes}
                  onChange={(e) => setChildrenForInstitutes(e.target.value)}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={calculateInstitutes}
                  className="flex-1  bg-[#2c5aa0] text-white py-4 px-8 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-500"
                  disabled={!childrenForInstitutes}
                >
                  Calculate Institutes
                </button>
                <button
                  onClick={resetInstitutesCalculator}
                  className="flex-1 sm:flex-none bg-gray-500 text-white py-4 px-6 rounded-xl font-semibold text-lg shadow-lg hover:bg-gray-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300"
                >
                  Reset
                </button>
              </div>

              {/* Institutes Results */}
              {showInstitutesResult && (
                <div className=" bg-[#2c5aa0] rounded-2xl p-6 border-2 border-green-200 animate-fadeIn">
                  <h3 className="text-xl font-bold text-white mb-4 text-center">
                    📊 Institutes Calculation Result
                  </h3>

                  <div className="bg-white rounded-xl p-6 shadow-md text-center">
                    <div className="text-3xl mb-2">🏛️</div>
                    <h4 className="font-semibold text-gray-700 mb-2">Required Institutes</h4>
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {institutesResult}
                    </div>
                    <p className="text-sm text-gray-500">
                      Based on 1 institute per 200 children
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Calculation:</strong> {childrenForInstitutes} children ÷ 200 = {institutesResult} institutes
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

             </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Calculator
