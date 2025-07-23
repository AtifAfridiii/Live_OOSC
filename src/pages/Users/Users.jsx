import React, {useState,useEffect} from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';
import Toast from '../../components/Toast';
import DeleteConfirmationAlert from '../../components/DeleteConfirmationAlert';
import { getAuthToken, isUserAuthenticated } from '../../utils/authHelpers';


export default function Users() {
    const [currentUserRole, setCurrentUserRole] = useState('');
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

    // Edit user state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        status: '',
    });
    const [editError, setEditError] = useState('');
    const [editFieldErrors, setEditFieldErrors] = useState({});
    const [showEditPassword, setShowEditPassword] = useState(false);
    const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);

    // Delete user state
    const [deleteConfirmation, setDeleteConfirmation] = useState({
        visible: false,
        userId: null,
        userName: null
    });

    // Toast state
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Utility function to show toast messages
    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000);
    };

    // Comprehensive authentication check
    const checkAuthenticationStatus = () => {
        const token = getAuthToken();
        const isAuth = isUserAuthenticated();
        const hasValidToken = token && token.length > 0;

        console.log('🔐 Authentication Status Check:', {
            hasToken: !!token,
            tokenLength: token?.length,
            isAuthenticated: isAuth,
            hasValidToken
        });

        if (!hasValidToken || !isAuth) {
            console.warn('⚠️ Authentication failed - redirecting to login');
            showToast('Please login to continue', 'error');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login';
            }, 1500);
            return false;
        }
        return true;
    };

    // Handle API errors with better error messages
    const handleApiError = (error, operation = 'operation') => {
        console.error(`❌ ${operation} failed:`, error);
        console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
        });

        if (error.response?.status === 401) {
            showToast('Session expired. Please login again.', 'error');
            setTimeout(() => {
                localStorage.clear();
                window.location.href = '/login';
            }, 2000);
            return 'auth_error';
        } else if (error.response?.status === 403) {
            showToast('You do not have permission to perform this action.', 'error');
            return 'permission_error';
        } else if (error.response?.status === 404) {
            showToast('User not found.', 'error');
            return 'not_found';
        } else if (error.response?.status >= 500) {
            showToast('Server error. Please try again later.', 'error');
            return 'server_error';
        } else {
            const errorMessage = error.response?.data?.message || `Failed to ${operation}`;
            showToast(errorMessage, 'error');
            return 'general_error';
        }
    };

    // Handle edit user button click
    const handleEditUser = (user) => {
        setEditingUser(user);
        setEditForm({
            name: user.name,
            email: user.email,
            password: user.confirmPassword,
            confirmPassword: user.confirmPassword,
            role: user.role,
            status: user.status,
        });
        setEditError('');
        setEditFieldErrors({});
        setShowEditModal(true);
    };

    // Handle edit user form submission
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        let errors = {};

        // Check authentication before proceeding
        if (!checkAuthenticationStatus()) {
            return;
        }

        console.log('🔐 Update User - Starting update for user:', editingUser?._id);

        // Name validation
        if (!editForm.name.trim()) {
            errors.name = 'Name is required.';
        } else if (editForm.name.length < 3) {
            errors.name = 'Name must be at least 3 characters.';
        }

        // Email validation
        if (!editForm.email.trim()) {
            errors.email = 'Email is required.';
        } else if (!/^\S+@\S+\.\S+$/.test(editForm.email)) {
            errors.email = 'Invalid email address.';
        }

        // Role validation
        if (!editForm.role) {
            errors.role = 'Role is required.';
        }

        // Status validation
        if (!editForm.status) {
            errors.status = 'Status is required.';
        }

        // Password validation (only if password is provided)
        if (editForm.password && editForm.password.length < 6) {
            errors.password = 'Password must be at least 6 characters.';
        }

        // Confirm password validation (only if password is provided)
        if (editForm.password && !editForm.confirmPassword) {
            errors.confirmPassword = 'Confirm password is required when setting a new password.';
        } else if (editForm.password && editForm.password !== editForm.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match.';
        }

        setEditFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            setEditError('Please fix the errors below.');
            return;
        }

        setLoading(true);
        try {
            const updateData = {
                name: editForm.name,
                email: editForm.email,
                role: editForm.role,
                status: editForm.status,
            };

            // Only include password if it's provided
            if (editForm.password) {
                updateData.password = editForm.password;
                updateData.confirmPassword = editForm.confirmPassword;
            }


            console.warn('⚠️ BACKEND BUG: The update will affect the logged-in user, not the target user');
            console.log('Target user ID:', editingUser._id);
            console.log('Update data:', updateData);

            await axiosInstance.put(API_PATHS.USERS.UPDATE_USER(editingUser._id), updateData);

            setShowEditModal(false);
            setEditForm({ name: '', email: '', password: '', confirmPassword: '', role: '', status: '' });
            setEditFieldErrors({});
            setEditingUser(null);
            fetchAllUsers();
            showToast('User updated successfully', 'success');
        } catch (error) {
            const errorType = handleApiError(error, 'update user');

            if (errorType === 'auth_error') {
                setEditError('Session expired. Please login again.');
            } else if (errorType === 'permission_error') {
                setEditError('You do not have permission to update this user.');
            } else if (errorType === 'not_found') {
                setEditError('User not found.');
            } else {
                const errorMessage = error.response?.data?.message || 'Failed to update user.';
                setEditError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle delete user button click
    const handleDeleteUser = (user) => {
        setDeleteConfirmation({
            visible: true,
            userId: user._id || user.id,
            userName: user.name
        });
    };

    // Confirm delete user
    const confirmDeleteUser = async () => {
        // Check authentication before proceeding
        if (!checkAuthenticationStatus()) {
            return;
        }

        setLoading(true);
        console.log('🔐 Delete User - Starting deletion for user:', deleteConfirmation.userId);

        try {
            await axiosInstance.put(API_PATHS.USERS.DELETE_USER(deleteConfirmation.userId));
            setDeleteConfirmation({ visible: false, userId: null, userName: null });
            fetchAllUsers();
            showToast('User deleted successfully', 'success');
        } catch (error) {
            handleApiError(error, 'delete user');
        } finally {
            setLoading(false);
        }
    };

    // Cancel delete user
    const cancelDeleteUser = () => {
        setDeleteConfirmation({ visible: false, userId: null, userName: null });
    };

    const fetchAllUsers = async () => {
        // Check authentication before proceeding
        if (!checkAuthenticationStatus()) {
            return;
        }

        setLoading(true)
        console.log('🔐 Fetch Users - Starting fetch');

        try {
            const response = await axiosInstance.get(API_PATHS.USERS.GET_ALL_USERS)
            console.log('✅ Users fetched successfully:', response.data?.length || 0, 'users');
            setUsers(response.data)
        } catch (error) {
            handleApiError(error, 'fetch users');
        } finally {
            setLoading(false)
        }
    }

    // Test token validity and get current user role on component mount
    useEffect(() => {
        const testTokenValidity = async () => {
            const token = getAuthToken();
            console.log('🔐 Component Mount - Token Test:', {
                hasToken: !!token,
                tokenLength: token?.length,
                tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
                isAuthenticated: isUserAuthenticated()
            });

            // Test with a simple API call first
            try {
                console.log('🧪 Testing token with profile endpoint...');
                const profileResponse = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE);
                console.log('✅ Profile test successful:', profileResponse.data);
                const role = profileResponse.data?.role || profileResponse.data?.user?.role || '';
                setCurrentUserRole(role);
            } catch (error) {
                console.error('❌ Profile test failed:', error.response?.status, error.response?.data);
                if (error.response?.status === 401) {
                    console.warn('🔐 Token is invalid or expired');
                    showToast('Session expired. Please login again.', 'error');
                    setTimeout(() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }, 2000);
                    return;
                }
            }
        };

        testTokenValidity();
        fetchAllUsers();
    }, [])


    return (
       <>
      {/* Toast Notification */}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(t => ({ ...t, visible: false }))}
        />
      )}

      {/* Delete Confirmation Alert */}
      <DeleteConfirmationAlert
        isVisible={deleteConfirmation.visible}
        onConfirm={confirmDeleteUser}
        onCancel={cancelDeleteUser}
        entryTitle={deleteConfirmation.userName}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />

      <div className='p-4 md:p-6 flex items-end justify-end'>
          <div className="
    flex
    items-end justify-end
    w-full md:w-1/2
    space-y-2 md:space-y-0 md:space-x-3
    pt-4 md:pt-0
  ">
             <button
                className={`text-[#4A90E2] text-sm font-medium bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg w-full md:w-auto ${['Viewer','DistrictProgramOfficer'].includes(currentUserRole) ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => setShowAddModal(true)}
                disabled={['Viewer','DistrictProgramOfficer'].includes(currentUserRole)}
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
                    <option value="" disabled>Select a role</option>
                    <option value="Viewer">Viewer</option>
                    <option value="admin">Admin</option>
                    <option value="DirectorProgram">Director Program</option>
                    <option value="DistrictProgramOfficer">District Program Officer</option>
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

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-40 px-2 md:px-0">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md md:max-w-lg p-4 md:p-8 relative mx-auto animate-fadeIn">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl md:text-xl"
              onClick={() => setShowEditModal(false)}
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className='flex flex-col items-center'>
              <h2 className="text-lg md:text-xl font-semibold mb-2 md:mb-4 text-center">Edit User</h2>
              <p className='text-xs md:text-sm text-gray-500 mb-4 text-center'>Update user information</p>
            </div>
            {editError && <div className="text-red-500 text-xs md:text-sm mb-2 text-center">{editError}</div>}
            <form
              autoComplete="off"
              onSubmit={handleEditSubmit}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${editFieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                    value={editForm.name}
                    placeholder="Enter full name"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  />
                  {editFieldErrors.name && <div className="text-red-500 text-xs mt-1">{editFieldErrors.name}</div>}
                </div>
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${editFieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                    value={editForm.email}
                    placeholder="Enter email address"
                    autoComplete="off"
                    spellCheck={false}
                    onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  />
                  {editFieldErrors.email && <div className="text-red-500 text-xs mt-1">{editFieldErrors.email}</div>}
                </div>
                <div className="mb-2">
                  <label>Role</label>
                  <select
                    className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${editFieldErrors.role ? 'border-red-500' : 'border-gray-300'}`}
                    value={editForm.role}
                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}
                  >
                    <option value="" disabled>Select a role</option>
                    <option value="Viewer">Viewer</option>
                    <option value="admin">Admin</option>
                    <option value="DirectorProgram">Director Program</option>
                    <option value="DistrictProgramOfficer">District Program Officer</option>
                  </select>
                  {editFieldErrors.role && <div className="text-red-500 text-xs mt-1">{editFieldErrors.role}</div>}
                </div>
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">New Password</label>
                  <div className="relative">
                    <input
                      type={showEditPassword ? "text" : "password"}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${editFieldErrors.password ? 'border-red-500' : 'border-gray-300'}`}
                      value={editForm.password}
                      placeholder="Leave blank to keep current password"
                      autoComplete="new-password"
                      spellCheck={false}
                      onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs md:text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setShowEditPassword(v => !v)}
                    >
                      {showEditPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {editFieldErrors.password && <div className="text-red-500 text-xs mt-1">{editFieldErrors.password}</div>}
                </div>
                <div className="mb-2">
                  <label className="block text-xs md:text-sm font-medium mb-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showEditConfirmPassword ? "text" : "password"}
                      className={`w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-xs md:text-base ${editFieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                      value={editForm.confirmPassword}
                      placeholder="Confirm new password"
                      autoComplete="new-password"
                      spellCheck={false}
                      onChange={e => setEditForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs md:text-sm text-gray-500 hover:text-gray-700 focus:outline-none"
                      tabIndex={-1}
                      onClick={() => setShowEditConfirmPassword(v => !v)}
                    >
                      {showEditConfirmPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {editFieldErrors.confirmPassword && <div className="text-red-500 text-xs mt-1">{editFieldErrors.confirmPassword}</div>}
                </div>
              </div>

              <div className="mb-2 mt-2">
                <label className="block text-xs md:text-sm font-medium mb-1">Status</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="inline-flex items-center cursor-pointer text-xs md:text-base">
                    <input
                      type="radio"
                      className="form-radio accent-blue-500"
                      name="editStatus"
                      value="active"
                      checked={editForm.status === 'active'}
                      onChange={() => setEditForm(f => ({ ...f, status: 'active' }))}
                    />
                    <span className="ml-2">Active</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer text-xs md:text-base">
                    <input
                      type="radio"
                      className="form-radio accent-blue-500"
                      name="editStatus"
                      value="inactive"
                      checked={editForm.status === 'inactive'}
                      onChange={() => setEditForm(f => ({ ...f, status: 'inactive' }))}
                    />
                    <span className="ml-2">Inactive</span>
                  </label>
                </div>
                {editFieldErrors.status && <div className="text-red-500 text-xs mt-1">{editFieldErrors.status}</div>}
              </div>

              <div className="flex justify-end mt-4 gap-2">
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-gray-400 w-full md:w-auto text-xs md:text-base"
                  onClick={() => setShowEditModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow focus:outline-none focus:ring-2 focus:ring-blue-400 w-full md:w-auto text-xs md:text-base"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update User'}
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
          <button
            className={`p-1 rounded hover:bg-blue-100 text-blue-600 ${['Viewer','DistrictProgramOfficer'].includes(currentUserRole) ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Edit"
            onClick={() => handleEditUser(row)}
            disabled={loading || ['Viewer','DistrictProgramOfficer'].includes(currentUserRole)}
          >
            <FaEdit />
          </button>
          <button
            className={`p-1 rounded hover:bg-red-100 text-red-600 ${['Viewer','DistrictProgramOfficer'].includes(currentUserRole) ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Delete"
            onClick={() => handleDeleteUser(row)}
            disabled={loading || ['Viewer','DistrictProgramOfficer'].includes(currentUserRole)}
          >
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
