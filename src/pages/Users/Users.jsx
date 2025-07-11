import React, {useState,useEffect} from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';

export default function Users() {

     const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)

    const [deleteUSer,selectDeleteUser]=useState(null)

    const handleDeleteUser = async () => {
        setLoading(true)
        try {
            const response = await axiosInstance.delete(API_PATHS.USERS.DELETE_USER(deleteUSer))
            setUsers(response.data)
        } catch (error) {
            console.error('Error deleting user:', error)
        } finally {
            setLoading(false)
        }
    }
    const handleSelectDeleteUser = (userId) => {
        selectDeleteUser(userId)
    }

    const fetchAllUsers = async () => {
        setLoading(true)
        try {
            const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS)
            setUsers(response.data)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAllUsers()
    }, [])


    return (
       <>
      <div className='p-4 md:p-6 flex items-end justify-end'>
          <div className="
    flex
    items-end justify-end
    w-full md:w-1/2
    space-y-2 md:space-y-0 md:space-x-3
    pt-4 md:pt-0

  ">
             <button className="text-[#4A90E2] text-sm font-medium bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full md:w-auto">
      +Add User
    </button>
        </div>
      </div>

<section>
    <div className='p-4 md:p-6'>
         <div className="mb-8">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border-2 border-blue-500">
                  <thead className="bg-gray-50">
                    <tr className='bg-blue-500 text-white'>
                      <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-transparent">
                    {users.map((row, index) => (
                      <tr key={index} className="bg-blue-100  border-3 border-white">
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ">{row.name}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.email}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="inline-flex items-center gap-2">
                            <button className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Edit">
                              <FaEdit />
                            </button>
                            <button className="p-1 rounded hover:bg-red-100 text-red-600" title="Delete">
                              <FaTrash />
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
    </div>

</section>

       </>
    )
}
