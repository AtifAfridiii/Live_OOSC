import React, {useState,useEffect} from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';


export default function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [showAddModal, setShowAddModal] = useState(false)
    const [addForm, setAddForm] = useState({
        name: '',
        email: '',
        role: '',
        password: '',
        confirmPassword: '',
        status: 'active',
    });
    const [addError, setAddError] = useState('');
    const [addFieldErrors, setAddFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
             <button
                className="text-[#4A90E2] text-sm font-medium bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full md:w-auto"
                onClick={() => setShowAddModal(true)}
              >
                +Add User
              </button>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center  bg-opacity-40 px-2 md:px-0">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md md:max-w-lg p-4 md:p-8 relative mx-auto animate-fadeIn">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl md:text-xl"
              onClick={() => setShowAddModal(false)}
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className='flex flex-col items-center'>
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-center">Add User</h2>
              <p className='text-xs md:text-sm text-gray-500 mb-4 text-center'>Add new user to Dashboard</p>
            </div>
            {addError && <div className="text-red-500 text-xs md:text-sm mb-2 text-center">{addError}</div>}
            <form
              autoComplete="off"
              onSubmit={async (e) => {
                e.preventDefault();
                setAddError('');
                let errors = {};
                // Name validation
                if (!addForm.name.trim()) {
                  errors.name = 'Name is required.';
                } else if (addForm.name.length < 3) {
                  errors.name = 'Name must be at least 3 characters.';
                }
                // Email validation
                if (!addForm.email.trim()) {
                  errors.email = 'Email is required.';
                } else if (!/^\S+@\S+\.\S+$/.test(addForm.email)) {
                  errors.email = 'Invalid email address.';
                }
                // Role validation
                if (!addForm.role) {
                  errors.role = 'Role is required.';
                }
                // Password validation
                if (!addForm.password) {
                  errors.password = 'Password is required.';
                } else if (addForm.password.length < 6) {
                  errors.password = 'Password must be at least 6 characters.';
                }
                // Confirm password validation
                if (!addForm.confirmPassword) {
                  errors.confirmPassword = 'Confirm password is required.';
                } else if (addForm.password !== addForm.confirmPassword) {
                  errors.confirmPassword = 'Passwords do not match.';
                }
                // Status validation
                if (!addForm.status) {
                  errors.status = 'Status is required.';
                }
                setAddFieldErrors(errors);
                if (Object.keys(errors).length > 0) {
                  setAddError('Please fix the errors below.');
                  return;
                }
                setLoading(true);
                try {
                  const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
                    name: addForm.name,
                    email: addForm.email,
                    role: addForm.role,
                    password: addForm.password,
                    confirmPassword: addForm.confirmPassword,
                    status: addForm.status,
                  });
                  if (response.data && response.data.user) {
                    setShowAddModal(false);
                    setAddForm({ name: '', email: '', role: '', password: '', confirmPassword: '', status: 'active' });
                    setAddFieldErrors({});
                    fetchAllUsers();
                  } else {
                    setAddError('Registration failed.');
                  }
                } catch (error) {
                  if (error.response && error.response.data && error.response.data.message) {
                    setAddError(error.response.data.message);
                  } else {
                    setAddError('Failed to add user.');
                  }
                } finally {
                  setLoading(false);
                }
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${addFieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                    value={addForm.name}
                    placeholder="Enter full name"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  />
                  {addFieldErrors.name && <div className="text-red-500 text-xs mt-1">{addFieldErrors.name}</div>}
                </div>
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${addFieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                    value={addForm.email}
                    placeholder="Enter email address"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  />
                  {addFieldErrors.email && <div className="text-red-500 text-xs mt-1">{addFieldErrors.email}</div>}
                </div>
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Role</label>
                  <select
                    className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${addFieldErrors.role ? 'border-red-500' : 'border-gray-300'}`}
                    value={addForm.role}
                    onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                  >
                    <option value="" disabled>Select role</option>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                  {addFieldErrors.role && <div className="text-red-500 text-xs mt-1">{addFieldErrors.role}</div>}
                </div>
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${addFieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                      value={addForm.password}
                      placeholder="Enter password"
                      autoComplete="new-password"
                      spellCheck={false}
                      onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs md:text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setShowPassword(v => !v)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {addFieldErrors.password && <div className="text-red-500 text-xs mt-1">{addFieldErrors.password}</div>}
                </div>
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${addFieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                      value={addForm.confirmPassword}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      spellCheck={false}
                      onChange={e => setAddForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs md:text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPassword(v => !v)}
                    >
                      {showConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {addFieldErrors.confirmPassword && <div className="text-red-500 text-xs mt-1">{addFieldErrors.confirmPassword}</div>}
                </div>
              </div>
            
              <div className="mb-2 mt-2">
                <label className="block text-xs md:text-sm font-medium mb-1">Status</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="inline-flex items-center cursor-pointer text-xs md:text-base">
                    <input
                      type="radio"
                      className="form-radio accent-blue-500"
                      name="status"
                      value="active"
                      checked={addForm.status === 'active'}
                      onChange={() => setAddForm(f => ({ ...f, status: 'active' }))}
                    />
                    <span className="ml-2">Active</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer text-xs md:text-base">
                    <input
                      type="radio"
                      className="form-radio accent-blue-500"
                      name="status"
                      value="inactive"
                      checked={addForm.status === 'inactive'}
                      onChange={() => setAddForm(f => ({ ...f, status: 'inactive' }))}
                    />
                    <span className="ml-2">Inactive</span>
                  </label>
                </div>
                {addFieldErrors.status && <div className="text-red-500 text-xs mt-1">{addFieldErrors.status}</div>}
              </div>
              <div className="flex justify-end mt-2 gap-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-gray-400 w-full md:w-auto text-xs md:text-base"
                  onClick={() => setShowAddModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-auto text-xs md:text-base"
                  disabled={loading}
                >
                  {loading ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium  uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-transparent">
                    {loading && users.length === 0 ? (
  <tr>
    <td colSpan="5" className="py-10 text-center">
      <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-blue-500 font-semibold">Loading users...</span>
      </div>
    </td>
  </tr>
) : users.length === 0 ? (
  <tr>
    <td colSpan="5" className="py-10 text-center text-gray-500">No users found.</td>
  </tr>
) : (
  users.map((row, index) => (
    <tr key={index} className="bg-blue-100  border-3 border-white">
      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ">{row.name}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.email}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{row.role}</td>
      <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold">
        <span className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full inline-block
            ${row.status === 'active' ? 'bg-green-500' : row.status === 'inactive' ? 'bg-red-500' : 'bg-gray-400'}`}></span>
          <span className={row.status === 'active' ? 'text-green-700' : row.status === 'inactive' ? 'text-red-700' : 'text-gray-700'}>
            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
          </span>
        </span>
      </td>
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
  ))
)}
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
