import React, { useState, useEffect } from 'react';
import CompanySidebar from './CompanySideBar';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Building2, Mail, User, MapPin, Phone, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// API configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Company API service
const companyAPI = {
  getProfile: async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token");
    
    const response = await axios.get(`${API_URL}/api/companies/profile`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Verify response structure
    if (!response.data || !response.data.success) {
      throw new Error("Invalid response structure");
    }

    return response;
  },

  updateProfile: async (profileData) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token");

    return axios.put(`${API_URL}/api/companies/profile`, profileData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  },
  
  updatePassword: async (passwordData) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token");
    
    return axios.put(`${API_URL}/api/companies/profile/password`, passwordData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  },

  uploadLogo: async (file) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token");
    
    const formData = new FormData();
    formData.append('companyLogo', file);
    
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("File size exceeds 2MB limit");
    }
    
    console.log("Uploading file:", file.name, "Size:", file.size);
    
    return axios.post(`${API_URL}/api/companies/profile/upload-logo`, formData, {
      headers: { 
        Authorization: `Bearer ${token}`
      },
      timeout: 30000 // Longer timeout for file uploads
    });
  },
  
  updateNotifications: async (notificationSettings) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No authentication token");
    
    return axios.put(`${API_URL}/api/companies/profile/notifications`, notificationSettings, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }
};

export default function CompanySettings() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [companyData, setCompanyData] = useState({
    username: '',
    email: '',
    companyName: '',
    registeredOfficeAddress: '',
    contactPhoneNumber: '',
    websiteURL: '',
    companyLogo: null
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
    serviceUpdates: true,
    marketingComms: false
  });

  const navigate = useNavigate();

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
    
    const fetchCompanyProfile = async () => {
      setLoading(true);
      try {
        console.log("Attempting to connect to API at:", API_URL);
        const response = await companyAPI.getProfile();
        console.log("Profile API response:", response);
        
        const profileData = response.data.data;

        // Validate required fields
        if (!profileData || !profileData.email) {
          throw new Error("Invalid profile data received");
        }

        setCompanyData({
          username: profileData.username || '',
          email: profileData.email,
          companyName: profileData.companyName || '',
          registeredOfficeAddress: profileData.registeredOfficeAddress || '',
          contactPhoneNumber: profileData.contactPhoneNumber || '',
          websiteURL: profileData.websiteURL || '',
          companyLogo: profileData.companyLogo || null,
          isApproved: profileData.isApproved || false
        });

      } catch (error) {
        console.error("Fetch Error:", error);
        
        if (error.response) {
          // Handle specific HTTP errors
          switch(error.response.status) {
            case 401:
              localStorage.removeItem("token");
              toast.error("Session expired. Please login again.");
              navigate('/login');
              break;
            case 403:
              toast.error("You don't have permission to access this");
              navigate('/');
              break;
            case 404:
              toast.error("Company profile not found");
              break;
            default:
              toast.error("Failed to load company profile");
          }
        } else if (error.code === 'ECONNABORTED') {
          toast.error("Request timed out. Please try again.");
        } else if (error.code === 'ERR_NETWORK') {
          toast.error(`Cannot connect to server at ${API_URL}. Please check if the server is running.`);
        } else {
          toast.error("Network error. Please check your connection.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.warning("Logo is too large. Maximum size is 2MB.");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("Uploading file:", file.name, "Size:", file.size);
      
      const response = await companyAPI.uploadLogo(file);
      
      // Update company data with the new logo URL from response
      setCompanyData(prev => ({
        ...prev,
        companyLogo: response.data.logoUrl
      }));
      
      toast.success("Company logo updated successfully!");
    } catch (error) {
      console.error("Error uploading company logo:", error);
      toast.error("Failed to upload company logo.");
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
      const response = await companyAPI.updateProfile({
        username: companyData.username,
        email: companyData.email,
        companyName: companyData.companyName,
        contactPersonName: companyData.contactPersonName,
        contactPhoneNumber: companyData.contactPhoneNumber,
        registeredOfficeAddress: companyData.registeredOfficeAddress,
        websiteURL: companyData.websiteURL
      });

      toast.success("Company profile updated successfully!");
      // Update local state with the response data if needed
      if (response.data.data) {
        setCompanyData(prev => ({
          ...prev,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update your company profile.");
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
      await companyAPI.updatePassword({
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
    const fetchCompanyProfile = async () => {
      setLoading(true);
      try {
        const response = await companyAPI.getProfile();
        const profileData = response.data.data || {};
        setCompanyData({
          username: profileData.username || '',
          email: profileData.email || '',
          companyName: profileData.companyName || '',
          registeredOfficeAddress: profileData.registeredOfficeAddress || '',
          contactPhoneNumber: profileData.contactPhoneNumber || '',
          websiteURL: profileData.websiteURL || '',
          companyLogo: profileData.companyLogo || null
        });
        
        toast.info("Form has been reset");
      } catch (error) {
        console.error("Error resetting form:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  };
  
  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      await companyAPI.updateNotifications({ notifications });
      toast.success("Notification preferences saved successfully!");
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast.error("Failed to save notification preferences.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-jakarta">
      {/* Sidebar - with collapse callback */}
      <div className="h-full fixed left-0 top-0 z-20">
        <CompanySidebar onCollapseChange={handleSidebarCollapse} isCollapsed={isCollapsed} />
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
              <h1 className="text-2xl font-bold text-gray-800">Company Settings</h1>
              <p className="text-gray-600">Manage your company profile and preferences</p>
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
            {activeTab === 'account' ? (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-8">
                  <h2 className="text-xl font-semibold mb-6">Company Information</h2>
                  
                  {/* Two-column layout for wider screens */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Company Logo */}
                    <div>
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-4">Company Logo</label>
                        <div className="flex flex-col items-center">
                          {companyData.companyLogo ? (
                            <img 
                              src={companyData.companyLogo} 
                              alt="Company Logo" 
                              className="w-32 h-32 object-contain rounded-lg border-4 border-orange-100 mb-4"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/150?text=Company+Logo";
                              }}
                            />
                          ) : (
                            <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center mb-4">
                              <Building2 className="w-16 h-16 text-gray-400" />
                            </div>
                          )}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload}
                            className="hidden"
                            id="logo-upload"
                          />
                          <label 
                            htmlFor="logo-upload" 
                            className="px-4 py-2 bg-[#EA540C] text-white rounded-full hover:bg-[#d64400] transition cursor-pointer"
                          >
                            {companyData.companyLogo ? 'Change Logo' : 'Upload Logo'}
                          </label>
                          <p className="text-xs text-gray-500 mt-2">Max size: 2MB</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Column 2-3: Form Fields */}
                    <div className="lg:col-span-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Username
                          </label>
                          <input 
                            type="text" 
                            name="username"
                            id="username" // Add id
                            value={companyData.username}
                            onChange={handleInputChange}
                            placeholder="Enter your username"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </label>
                          <input 
                            type="email" 
                            name="email"
                            id="email" // Add id
                            value={companyData.email}
                            onChange={handleInputChange}
                            placeholder="Enter your email"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                        <div>
                          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Company Name
                          </label>
                          <input 
                            type="text" 
                            name="companyName"
                            id="companyName" // Add id
                            value={companyData.companyName}
                            onChange={handleInputChange}
                            placeholder="Enter your company name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                        <div>
                          <label htmlFor="contactPhoneNumber" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Contact Phone Number
                          </label>
                          <input 
                            type="tel" 
                            name="contactPhoneNumber"
                            id="contactPhoneNumber" // Add id
                            value={companyData.contactPhoneNumber}
                            onChange={handleInputChange}
                            placeholder="Enter your contact number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                        <div>
                          <label htmlFor="registeredOfficeAddress" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Registered Office Address
                          </label>
                          <input 
                            type="text" 
                            name="registeredOfficeAddress"
                            id="registeredOfficeAddress" // Add id
                            value={companyData.registeredOfficeAddress}
                            onChange={handleInputChange}
                            placeholder="Enter your office address"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                          />
                        </div>
                        <div>
                          <label htmlFor="websiteURL" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Website URL
                          </label>
                          <input 
                            type="url" 
                            name="websiteURL"
                            id="websiteURL" // Add id
                            value={companyData.websiteURL}
                            onChange={handleInputChange}
                            placeholder="Enter your website URL"
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
                <div className="p-8">
                  <h2 className="text-xl font-semibold mb-6">Password & Security</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Password change form */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-medium mb-4">Change Password</h3>
                      <form onSubmit={handleUpdatePassword}>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input 
                              type="password" 
                              name="currentPassword"
                              id="currentPassword" // Add id
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-2 border ${passwordError.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]`}
                            />
                            {passwordError.currentPassword && (
                              <p className="mt-1 text-sm text-red-600">{passwordError.currentPassword}</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input 
                              type="password" 
                              name="newPassword"
                              id="newPassword" // Add id
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-2 border ${passwordError.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]`}
                            />
                            {passwordError.newPassword ? (
                              <p className="mt-1 text-sm text-red-600">{passwordError.newPassword}</p>
                            ) : (
                              <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
                            )}
                          </div>
                          
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input 
                              type="password" 
                              name="confirmPassword"
                              id="confirmPassword" // Add id
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
                          <li>Regularly update your security information</li>
                          <li>Monitor for unauthorized access in your account activity</li>
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
    { key: 'serviceUpdates', label: 'Service Updates', description: 'Get notified about changes to your services' },
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
        </div>
    );
    }