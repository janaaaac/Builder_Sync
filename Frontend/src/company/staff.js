import React, { useState, useEffect } from 'react';
import { Trash, Plus, Search } from 'lucide-react';
import axios from 'axios';
import CompanySidebar from '../company/CompanySideBar'; // Import CompanySidebar

// Inline LoadingSpinner component
const LoadingSpinner = ({ overlay = false, message = 'Loading...' }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${overlay ? 'fixed inset-0 bg-black bg-opacity-50 z-50' : 'w-full h-full'}`}>
      <div className={`flex flex-col items-center justify-center ${overlay ? 'bg-white p-8 rounded-lg shadow-xl' : ''}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EA540C] mb-4"></div>
        <p className="text-gray-700">{message}</p>
      </div>
    </div>
  );
};

const StaffManagement = () => {
  // Add state for sidebar collapse
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'project_manager',
    email: '',
    username: '',
    password: 'TempPassword123' // Default temporary password
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState(null);

  // API URL from environment or default
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Create axios instance with auth token
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch staff data
  const fetchStaff = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/api/staff/company-staff');
      if (response.data.success) {
        setStaffList(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load staff data');
      }
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  // Load staff data on component mount
  useEffect(() => {
    fetchStaff();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Add new staff member
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!formData.fullName?.trim() || !formData.email?.trim() || 
          !formData.username?.trim() || !formData.password?.trim()) {
        throw new Error('Please fill in all required fields');
      }
      
      const response = await api.post('/api/staff/create', formData);
      
      if (response.data.success) {
        // Reset form
        setFormData({
          fullName: '',
          role: 'project_manager',
          email: '',
          username: '',
          password: 'TempPassword123'
        });
        
        setShowModal(false);
        fetchStaff(); // Refresh the staff list
        
        // Show success message instead of alert
        setSuccessMessage(`Staff member ${formData.fullName} created successfully!`);
        
        // Optional: Auto-dismiss after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      } else {
        throw new Error(response.data.message || 'Failed to create staff member');
      }
    } catch (err) {
      console.error('Error creating staff:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create staff member');
    } finally {
      setLoading(false);
    }
  };

  // Initiate delete staff member
  const initiateDelete = (staff) => {
    setStaffToDelete(staff);
    setDeleteConfirmation(true);
  };

  // Confirm delete staff member
  const confirmDelete = async () => {
    if (!staffToDelete) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.delete(`/api/staff/${staffToDelete._id}`);
      if (response.data.success) {
        setSuccessMessage(`${staffToDelete.fullName} has been successfully deleted.`);
        fetchStaff(); // Refresh the staff list
      } else {
        throw new Error(response.data.message || 'Failed to delete staff member');
      }
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete staff member');
    } finally {
      setLoading(false);
      setDeleteConfirmation(false);
      setStaffToDelete(null);
    }
  };

  // Available roles
  const roles = [
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'architect', label: 'Architect' },
    { value: 'engineer', label: 'Engineer' },
    { value: 'qs', label: 'Quantity Surveyor' },
    { value: 'site_supervisor', label: 'Site Supervisor' }
  ];

  // Filter staff based on search term
  const filteredStaff = staffList.filter(staff => 
    staff.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handler for sidebar collapse
  const handleCollapseChange = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Component */}
      <CompanySidebar onCollapseChange={handleCollapseChange} />
      
      {/* Main Content - Adjusted with margin when sidebar changes */}
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Staff Management</h1>
              <button 
                onClick={() => setShowModal(true)}
                className="bg-[#EA540C] text-white px-4 py-2 rounded-md hover:bg-[#EA540C]/90 flex items-center gap-2"
                disabled={loading}
              >
                <Plus size={18} />
                Add New Staff
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            {/* Success message */}
            {successMessage && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
                <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full animate-fade-in-up">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-green-100 rounded-full p-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">Success!</h3>
                  <p className="text-center text-gray-600">{successMessage}</p>
                  <div className="mt-6 flex justify-center">
                    <button 
                      onClick={() => setSuccessMessage('')} 
                      className="bg-[#EA540C] text-white px-6 py-2 rounded-md hover:bg-[#EA540C]/90 transition-colors"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search bar */}
            <div className="mb-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search staff by name, role or email..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-[#EA540C] focus:border-[#EA540C]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Staff Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    // Loading state inside table
                    <>
                      {[1, 2, 3].map(i => (
                        <tr key={`skeleton-${i}`} className="animate-pulse">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="h-4 bg-gray-200 rounded w-8"></div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ) : filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center">No staff members found</td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
                      <tr key={staff._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{staff.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {roles.find(r => r.value === staff.role)?.label || staff.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {staff.company ? (typeof staff.company === 'object' ? staff.company.name : staff.company) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => initiateDelete(staff)}
                              className="text-red-600 hover:text-red-900"
                              disabled={loading}
                            >
                              <Trash size={18} />
                            </button>
                          </div>
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
      
      {/* Modals remain outside the main layout */}
      {successMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full animate-fade-in-up">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">Success!</h3>
            <p className="text-center text-gray-600">{successMessage}</p>
            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => setSuccessMessage('')} 
                className="bg-[#EA540C] text-white px-6 py-2 rounded-md hover:bg-[#EA540C]/90 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
            {/* Modal loading overlay */}
            {loading && <LoadingSpinner message="Creating staff member..." />}
            
            <h2 className="text-xl font-bold mb-4">Add New Staff Member</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#EA540C] focus:border-[#EA540C]"
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#EA540C] focus:border-[#EA540C]"
                    placeholder="johndoe"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#EA540C] focus:border-[#EA540C]"
                    placeholder="john.doe@company.com"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Temporary Password *</label>
                  <input
                    type="text"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#EA540C] focus:border-[#EA540C]"
                    disabled={loading}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This is a temporary password. The user will be prompted to change it on first login.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#EA540C] focus:border-[#EA540C]"
                    disabled={loading}
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#EA540C] text-white rounded-md hover:bg-[#EA540C]/90"
                >
                  Create Staff Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {deleteConfirmation && staffToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-red-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center text-gray-800 mb-2">Confirm Deletion</h3>
            <p className="text-center text-gray-600 mb-2">
              Are you sure you want to delete <span className="font-semibold">{staffToDelete.fullName}</span>?
            </p>
            <p className="text-center text-gray-500 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex justify-center space-x-3 mt-4">
              <button 
                onClick={() => {
                  setDeleteConfirmation(false);
                  setStaffToDelete(null);
                }} 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 bg-[#EA540C] text-white rounded-md hover:bg-[#EA540C]/90 transition-colors"
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;