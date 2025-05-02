import React, { useState, useEffect } from 'react';
import ClientSidebar from './clientSidebar';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// API configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Client API service
const clientAPI = {
  getProfile: async () => {
    const token = localStorage.getItem("token");
    return axios.get(`${API_URL}/api/clients/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  updateProfile: async (profileData) => {
    const token = localStorage.getItem("token");
    return axios.put(`${API_URL}/api/clients/profile`, profileData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  
  updatePassword: async (passwordData) => {
    const token = localStorage.getItem("token");
    return axios.put(`${API_URL}/api/clients/profile/password`, passwordData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  uploadProfilePicture: async (file) => {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    
    // Change to match expected field from multer configuration
    formData.append('profilePicture', file);
    
    console.log("Uploading file:", file.name, "Size:", file.size);
    
    return axios.post(`${API_URL}/api/clients/profile/upload-photo`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        // Remove the Content-Type header to let axios set it with boundary
        // 'Content-Type': 'multipart/form-data'
      }
    });
  },
  
  updateNotifications: async (notificationSettings) => {
    // You may need to implement this endpoint on the backend
    const token = localStorage.getItem("token");
    return axios.put(`${API_URL}/api/clients/profile/notifications`, notificationSettings, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },

  getProposalNotifications: async () => {
    const token = localStorage.getItem("token");
    return axios.get(`${API_URL}/api/clients/notifications/proposals`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};

export default function ClientSettings() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [clientData, setClientData] = useState({
    fullName: '',
    email: '',
    address: '',
    contactNumber: '',
    profilePicture: null
  });

  // Add password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [passwordError, setPasswordError] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: ''
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    pushNotifications: true,
    projectUpdates: true,
    marketingComms: false
  });

  // Add state for proposal notifications
  const [proposalNotifications, setProposalNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  // Handle sidebar collapse from the sidebar component
  const handleSidebarCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  useEffect(() => {    
    // For demo purposes, we'll just monitor window resize
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Check on initial load
    
    const fetchClientProfile = async () => {
      setLoading(true);
      try {
        console.log("Attempting to connect to API at:", API_URL);
        const response = await clientAPI.getProfile();
        console.log("Profile API response:", response);
        
        // The data is nested inside 'data' according to your backend controller
        const responseData = response.data;
        
        if (responseData.success && responseData.data) {
          // Use the nested data structure from your backend
          setClientData({
            fullName: responseData.data.fullName || '',
            email: responseData.data.email || '',
            address: responseData.data.address || '', 
            contactNumber: responseData.data.primaryContact || '', // Map primaryContact to contactNumber
            profilePicture: responseData.data.profilePicture || null
          });
        } else {
          console.warn("Unexpected API response structure:", responseData);
          toast.warning("Received unexpected data format from server");
        }
        
      } catch (error) {
        console.error("Error fetching client profile:", error);
        
        if (error.code === 'ERR_NETWORK') {
          toast.error(`Cannot connect to server at ${API_URL}. Please check if the server is running.`);
        } else if (error.response?.status === 401) {
          localStorage.removeItem("token");
          toast.error("Session expired. Please login again.");
        } else {
          toast.error("Failed to load your profile information.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchClientProfile();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add effect to fetch proposal notifications when tab changes to notifications
  useEffect(() => {
    if (activeTab === 'notifications') {
      fetchProposalNotifications();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (passwordError[name]) {
      setPasswordError(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfileImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.warning("Image is too large. Maximum size is 2MB.");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Uploading file:", file.name, "Size:", file.size);
      
      const response = await clientAPI.uploadProfilePicture(file);
      
      // Update client data with the new profile picture URL from response
      setClientData(prev => ({
        ...prev,
        profilePicture: response.data.profilePictureUrl
      }));
      
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error("Failed to upload profile picture.");
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      // Map frontend fields to backend expected structure
      const profileUpdateData = {
        fullName: clientData.fullName,
        email: clientData.email,
        address: clientData.address,
        primaryContact: clientData.contactNumber // Map contactNumber to primaryContact
      };
      
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication error. Please log in again.");
        return;
      }
  
      // Since your API route is expecting a client ID, we need to get it first
      const profileResponse = await axios.get(`${API_URL}/api/clients/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const clientId = profileResponse.data.data?._id;
      if (!clientId) {
        throw new Error("Could not retrieve client ID");
      }
      
      // Use the ID to update the profile
      await axios.put(`${API_URL}/api/clients/${clientId}`, profileUpdateData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update your profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    let isValid = true;
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: ''
    };
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
      isValid = false;
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }
    
    if (!isValid) {
      setPasswordError(errors);
      return;
    }
    
    setLoading(true);
    try {
      await clientAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success("Password updated successfully!");
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error("Error updating password:", error);
      
      // Enhanced error handling based on server response
      if (error.response) {
        if (error.response.status === 401) {
          setPasswordError({
            ...errors,
            currentPassword: 'Current password is incorrect'
          });
        } else if (error.response.status === 400) {
          // Handle validation errors
          if (error.response.data.details) {
            // Display specific validation error
            toast.error(error.response.data.details);
          } else {
            toast.error(error.response.data.error || "Invalid input. Please check your data.");
          }
        } else {
          // Generic error message for other error codes
          toast.error(error.response.data.error || "Failed to update password.");
        }
      } else {
        // Network errors or other issues
        toast.error("Connection error. Please check your internet and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    // Reset form to initial values from server
    const fetchClientProfile = async () => {
      setLoading(true);
      try {
        const response = await clientAPI.getProfile();
        const profileData = response.data.profileInfo || {};
        setClientData({
          fullName: profileData.fullName || '',
          email: profileData.email || '',
          address: profileData.address || '',
          contactNumber: profileData.contactNumber || '',
          profilePicture: profileData.profilePicture || null
        });
        
        toast.info("Form has been reset");
      } catch (error) {
        console.error("Error resetting form:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientProfile();
  };
  
  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await clientAPI.updateNotifications({ notifications });
      toast.success("Notification preferences saved successfully!");
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast.error("Failed to save notification preferences.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch proposal notifications - improved error handling
  const fetchProposalNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const response = await clientAPI.getProposalNotifications();
      console.log("Proposal notifications:", response.data);
      
      if (response.data.success && response.data.data) {
        setProposalNotifications(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching proposal notifications:", error);
      
      // Handle 404 errors gracefully - backend endpoint not implemented yet
      if (error.response?.status === 404) {
        console.log("Notifications endpoint not available yet - using mock data");
        
        // Use mock data temporarily until backend is ready
        const mockData = [
          {
            _id: 'mock1',
            type: 'proposal_rejected',
            message: 'Your proposal was reviewed but unfortunately not accepted at this time.',
            data: { reason: 'Budget constraints and timeline issues. The project scope exceeds our current capacity.' },
            createdAt: new Date(Date.now() - 2*24*60*60*1000), // 2 days ago
            proposal: { _id: 'proposal1', projectTitle: 'Home Renovation Project' }
          },
          {
            _id: 'mock2',
            type: 'proposal_approved',
            message: 'Congratulations! Your project proposal has been approved.',
            createdAt: new Date(Date.now() - 7*24*60*60*1000), // 7 days ago
            proposal: { _id: 'proposal2', projectTitle: 'Office Renovation' }
          }
        ];
        
        setProposalNotifications(mockData);
      } else {
        // For other types of errors, show an empty state
        setProposalNotifications([]);
        toast.error("Failed to load notifications");
      }
    } finally {
      setNotificationsLoading(false);
    }
  };

  // Mock function for formatRelativeTime if it doesn't exist
  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const handleCreateProject = async (proposalId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5001/api/projects/from-proposal/${proposalId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success('Project created successfully!');
        // Optionally update notification/project list here
      } else {
        toast.error(res.data.message || 'Failed to create project');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating project');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-jakarta">
      {/* Sidebar - with collapse callback */}
      <div className="h-full">
        <ClientSidebar onCollapseChange={handleSidebarCollapse} />
      </div>
      
      {/* Main Content - dynamically adjusted based on sidebar state */}
      <div 
        className={`flex-1 transition-all duration-300 overflow-hidden ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Header */}
        <div className="bg-white shadow-sm py-4 px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
              <p className="text-gray-600">Manage your profile and preferences</p>
            </div>
            
            
          </div>
        </div>
        
        {/* Content with flexible height */}
        <div className="h-[calc(100vh-64px)] overflow-y-auto">
          {/* Tab navigation */}
          <div className="sticky top-0 bg-white shadow-sm z-10">
            <div className="flex border-b">
              <button 
                onClick={() => setActiveTab('account')}
                className={`px-6 py-4 font-medium ${activeTab === 'account' ? 'border-b-2 border-[#EA540C] text-[#EA540C]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Account Settings
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`px-6 py-4 font-medium ${activeTab === 'security' ? 'border-b-2 border-[#EA540C] text-[#EA540C]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Security
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`px-6 py-4 font-medium ${activeTab === 'notifications' ? 'border-b-2 border-[#EA540C] text-[#EA540C]' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Notifications
              </button>
            </div>
          </div>
          
          {/* Tab content */}
          <div className="max-w-6xl mx-auto p-8">
            {/* The tab content remains the same... */}
            {activeTab === 'account' ? (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {/* Account tab content remains the same... */}
                <div className="p-8">
                  <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                  
                  {/* Two-column layout for wider screens */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Profile Picture */}
                    <div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
                        <div className="flex flex-col items-center">
                          {clientData.profilePicture ? (
                            <img 
                              src={clientData.profilePicture} 
                              alt="Profile" 
                              className="w-32 h-32 object-cover rounded-full border-4 border-orange-100 mb-4"
                              onError={(e) => {
                                console.log("Image failed to load:", clientData.profilePicture);
                                e.target.src = "/static/media/default-avatar.png";
                                // If the default avatar also fails, use an inline SVG
                                e.target.onerror = () => {
                                  e.target.onerror = null; // Prevent infinite loop
                                  e.target.style.display = "none";
                                  const parent = e.target.parentNode;
                                  const svgDiv = document.createElement("div");
                                  svgDiv.className = "w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center";
                                  svgDiv.innerHTML = `<svg 
                                    class="w-16 h-16 text-gray-400" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24" 
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path 
                                      strokeLinecap="round" 
                                      strokeLinejoin="round" 
                                      strokeWidth="2" 
                                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                                  </svg>`;
                                  parent.insertBefore(svgDiv, e.target);
                                };
                              }}
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                              <svg 
                                className="w-16 h-16 text-gray-400" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  strokeWidth="2" 
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleProfileImageUpload}
                            className="hidden"
                            id="profile-upload"
                          />
                          <label 
                            htmlFor="profile-upload" 
                            className="px-4 py-2 bg-[#EA540C] text-white rounded-full hover:bg-[#d64400] transition cursor-pointer"
                          >
                            {clientData.profilePicture ? 'Change Photo' : 'Upload Photo'}
                          </label>
                          <p className="text-xs text-gray-500 mt-2">Max size: 2MB</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Column 2-3: Form Fields */}
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Full name</label>
                          <input 
                            type="text" 
                            name="fullName"
                            value={clientData.fullName}
                            onChange={handleInputChange}
                            placeholder="Please enter your full name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input 
                            type="email" 
                            name="email"
                            value={clientData.email}
                            onChange={handleInputChange}
                            placeholder="Please enter your email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                        {/* Make sure this div isn't being hidden by CSS or conditions */}
                        <div style={{display: 'block'}}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                          <input 
                            type="text" 
                            name="address"
                            value={clientData.address || ''}
                            onChange={handleInputChange}
                            placeholder="Please enter your address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contact number</label>
                          <input 
                            type="tel" 
                            name="contactNumber"
                            value={clientData.contactNumber}
                            onChange={handleInputChange}
                            placeholder="Please enter your contact number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="mt-8 flex items-center space-x-4">
                        <button 
                          onClick={handleUpdateProfile}
                          disabled={loading}
                          className="bg-[#EA540C] text-white px-6 py-3 rounded-full hover:bg-[#d64400] transition-colors disabled:opacity-70"
                        >
                          {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                        <button 
                          onClick={handleResetForm}
                          disabled={loading}
                          className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-70"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'security' ? (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {/* Security tab content remains the same... */}
                <div className="p-8">
                  <h2 className="text-xl font-semibold mb-6">Password & Security</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Password change form */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      <form onSubmit={handleUpdatePassword}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input 
                              type="password" 
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-2 border ${passwordError.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]`}
                            />
                            {passwordError.currentPassword && (
                              <p className="mt-1 text-sm text-red-600">{passwordError.currentPassword}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input 
                              type="password" 
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-2 border ${passwordError.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]`}
                            />
                            {passwordError.newPassword && (
                              <p className="mt-1 text-sm text-red-600">{passwordError.newPassword}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input 
                              type="password" 
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-2 border ${passwordError.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]`}
                            />
                            {passwordError.confirmPassword && (
                              <p className="mt-1 text-sm text-red-600">{passwordError.confirmPassword}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-6">
                          <button 
                            type="submit"
                            disabled={loading}
                            className="bg-[#EA540C] text-white px-6 py-3 rounded-full hover:bg-[#d64400] transition-colors disabled:opacity-70"
                          >
                            {loading ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </form>
                    </div>
                    
                    {/* Additional security settings */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <p className="text-gray-700">Enhance your account security with 2FA</p>
                          <p className="text-sm text-gray-500">We'll ask for a verification code when signing in from unknown devices</p>
                        </div>
                        <button 
                          className="px-4 py-2 border border-[#EA540C] text-[#EA540C] rounded-full hover:bg-orange-50"
                        >
                          Enable
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-6">
                        <h4 className="font-medium text-gray-700 mb-2">Security Tips</h4>
                        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
                          <li>Use a strong, unique password for your account</li>
                          <li>Never share your account credentials with others</li>
                          <li>Sign out when using shared devices</li>
                          <li>Check for unauthorized access in your account activity</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-8">
                  <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
                  
                  {/* Proposal Rejection Notifications Section */}
                  <div className="mb-8 bg-gray-50 p-6 rounded-lg border-l-4 border-[#EA540C]">
                    <h3 className="text-lg font-medium mb-4 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#EA540C]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Recent Proposal Updates
                    </h3>
                    
                    {notificationsLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#EA540C]"></div>
                      </div>
                    ) : proposalNotifications.length > 0 ? (
                      <div className="space-y-4">
                        {proposalNotifications.map((notification) => (
                          <div key={notification._id} className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-800">{notification.proposal?.projectTitle || 'Project Proposal'}</h4>
                                <p className={`${notification.type === 'proposal_rejected' ? 'text-red-600' : 'text-green-600'} text-sm font-medium mt-1`}>
                                  {notification.type === 'proposal_rejected' ? 'Proposal Rejected' : 'Proposal Approved'}
                                </p>
                                <p className="text-gray-600 text-sm mt-2">
                                  {notification.message}
                                </p>
                                {notification.data?.reason && (
                                  <p className="text-gray-700 mt-2 text-sm bg-gray-50 p-3 rounded border-l-2 border-red-400">
                                    <span className="font-medium">Reason: </span> 
                                    {notification.data.reason}
                                  </p>
                                )}
                                {notification.type === 'proposal_approved' && !notification.projectCreated && (
                                  <button
                                    onClick={() => handleCreateProject(notification.proposal?._id)}
                                    className="bg-blue-500 text-white px-4 py-2 rounded"
                                  >
                                    Create Project
                                  </button>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">{formatRelativeTime(notification.createdAt)}</span>
                            </div>
                            <div className="mt-3 flex">
                              <button 
                                onClick={() => window.location.href = `/client/proposals/${notification.proposal?._id}`}
                                className="text-sm text-[#EA540C] hover:text-[#c64509] font-medium"
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-gray-500">No proposal notifications yet</p>
                      </div>
                    )}
                    
                    {proposalNotifications.length > 0 && (
                      <div className="mt-4 text-center">
                        <button className="inline-flex items-center text-[#EA540C] hover:text-[#c64509] font-medium">
                          View All Notifications
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {[
                        { key: 'email', label: 'Email Notifications', description: 'Receive updates and alerts via email' },
                        { key: 'sms', label: 'SMS Notifications', description: 'Get instant notifications via text message' },
                        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive alerts on your device' }
                      ].map(({ key, label, description }) => (
                        <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-gray-700 font-medium">{label}</span>
                            <p className="text-gray-500 text-sm">{description}</p>
                          </div>
                          <button 
                            onClick={() => toggleNotification(key)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notifications[key] 
                                ? 'bg-[#EA540C]' 
                                : 'bg-gray-300'
                            } relative`}
                          >
                            <span 
                              className={`absolute top-0.5 ${
                                notifications[key] 
                                  ? 'right-0.5 bg-white' 
                                  : 'left-0.5 bg-white'
                              } w-5 h-5 rounded-full shadow-md transition-all`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="space-y-6">
                      {[
                        { key: 'projectUpdates', label: 'Project Updates', description: 'Get notified about changes to your projects' },
                        { key: 'marketingComms', label: 'Marketing Communications', description: 'Receive promotional offers and updates' }
                      ].map(({ key, label, description }) => (
                        <div key={key} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-gray-700 font-medium">{label}</span>
                            <p className="text-gray-500 text-sm">{description}</p>
                          </div>
                          <button 
                            onClick={() => toggleNotification(key)}
                            className={`w-12 h-6 rounded-full transition-colors ${
                              notifications[key] 
                                ? 'bg-[#EA540C]' 
                                : 'bg-gray-300'
                            } relative`}
                          >
                            <span 
                              className={`absolute top-0.5 ${
                                notifications[key] 
                                  ? 'right-0.5 bg-white' 
                                  : 'left-0.5 bg-white'
                              } w-5 h-5 rounded-full shadow-md transition-all`}
                            />
                          </button>
                        </div>
                      ))}
                      
                      <div className="mt-8">
                        <button 
                          onClick={handleSaveNotifications}
                          className="bg-[#EA540C] text-white px-6 py-3 rounded-full hover:bg-[#d64400] transition-colors"
                        >
                          Save Preferences
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}