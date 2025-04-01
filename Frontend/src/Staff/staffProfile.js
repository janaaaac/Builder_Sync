import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import StaffSidebar from './staffSideBar';
import axios from 'axios';

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

export default function StaffSettings() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  
  // Staff data state
  const [staffData, setStaffData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    specialization: '',
    profilePicture: '',
    qualifications: []
  });

  // File upload states
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [qualificationFiles, setQualificationFiles] = useState([]);

  // Password state
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

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    pushNotifications: true,
    projectUpdates: true,
    marketingComms: false
  });

  // API base URL
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  // Create axios instance with auth token
  const api = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    }
  });

  // Handle sidebar collapse
  const handleSidebarCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  // Fetch staff profile data
  const fetchStaffProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/staff/profile');
      
      if (response.data.success) {
        const profileData = response.data.data;
        setStaffData({
          fullName: profileData.fullName || '',
          email: profileData.email || '',
          contactNumber: profileData.contactNumber || '',
          specialization: profileData.specialization || '',
          profilePicture: profileData.profilePicture || '',
          qualifications: profileData.qualifications || []
        });
      } else {
        toast.error("Failed to load profile data");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error(error.response?.data?.message || "Error loading profile data");
    } finally {
      setLoading(false);
    }
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
    
    // Fetch staff profile data
    fetchStaffProfile();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaffData(prev => ({
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

  const handleProfileImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.warning("Image is too large. Maximum size is 2MB.");
      return;
    }
    
    // Create a temporary URL for preview
    const imageUrl = URL.createObjectURL(file);
    
    setStaffData(prev => ({
      ...prev,
      profilePicture: imageUrl
    }));
    
    // Store the file for later upload
    setProfilePictureFile(file);
  };

  const handleQualificationUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file sizes
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning(`File ${file.name} is too large. Maximum size is 5MB.`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      setQualificationFiles(prev => [...prev, ...validFiles]);
      toast.info(`${validFiles.length} file(s) ready to upload`);
    }
  };

  const removeQualificationFile = (index) => {
    setQualificationFiles(prev => prev.filter((_, i) => i !== index));
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
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add text fields
      formData.append('fullName', staffData.fullName);
      formData.append('contactNumber', staffData.contactNumber);
      formData.append('specialization', staffData.specialization);
      
      // Add profile picture if selected
      if (profilePictureFile) {
        formData.append('profilePicture', profilePictureFile);
      }
      
      // Add qualification files if any
      if (qualificationFiles.length > 0) {
        qualificationFiles.forEach(file => {
          formData.append('qualifications', file);
        });
      }
      
      // Update axios instance headers for multipart/form-data
      const multipartApi = axios.create({
        baseURL: API_URL,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const response = await multipartApi.put('/api/staff/profile', formData);
      
      if (response.data.success) {
        toast.success("Profile updated successfully!");
        
        // Update local state with the returned data
        const updatedProfile = response.data.staff;
        setStaffData({
          fullName: updatedProfile.fullName || '',
          email: updatedProfile.email || '',
          contactNumber: updatedProfile.contactNumber || '',
          specialization: updatedProfile.specialization || '',
          profilePicture: updatedProfile.profilePicture || '',
          qualifications: updatedProfile.qualifications || []
        });
        
        // Clear file upload states
        setProfilePictureFile(null);
        setQualificationFiles([]);
      } else {
        toast.error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update your profile");
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
      // Call password update API
      const response = await api.put('/api/staff/update-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        toast.success("Password updated successfully!");
        // Clear password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setPasswordError({
          ...errors,
          general: response.data.message || "Failed to update password"
        });
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError({
        ...errors,
        general: error.response?.data?.message || "Failed to update password"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    // Fetch the original data from the server
    fetchStaffProfile();
    toast.info("Form has been reset");
  };
  
  const handleSaveNotifications = async () => {
    setLoading(true);
    try {
      // Call notification preferences API
      const response = await api.put('/api/staff/notification-preferences', notifications);
      
      if (response.data.success) {
        toast.success("Notification preferences saved successfully!");
      } else {
        toast.error(response.data.message || "Failed to save notification preferences");
      }
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast.error(error.response?.data?.message || "Failed to save notification preferences");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-jakarta">
      {/* Sidebar - with collapse callback */}
      <div className="h-full">
        <StaffSidebar onCollapseChange={handleSidebarCollapse} />
      </div>
      
      {/* Main Content - dynamically adjusted based on sidebar state */}
      <div 
        className={`flex-1 transition-all duration-300 overflow-hidden ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Full page loading overlay */}
        {loading && <LoadingSpinner overlay message="Processing your request..." />}
        
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
            {activeTab === 'account' ? (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <div className="p-8">
                  <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Column 1: Profile Picture and Qualifications */}
                    <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-4">Profile Picture</label>
                        <div className="flex flex-col items-center">
                          {staffData.profilePicture ? (
                            <img 
                              src={staffData.profilePicture} 
                              alt="Profile" 
                              className="w-32 h-32 object-cover rounded-full border-4 border-orange-100 mb-4"
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/150";
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
                            disabled={loading}
                          />
                          <label 
                            htmlFor="profile-upload" 
                            className="px-4 py-2 bg-[#EA540C] text-white rounded-full hover:bg-[#d64400] transition cursor-pointer disabled:opacity-70"
                          >
                            {staffData.profilePicture ? 'Change Photo' : 'Upload Photo'}
                          </label>
                          <p className="text-xs text-gray-500 mt-2">Max size: 2MB</p>
                        </div>
                      </div>
                      
                      {/* Qualifications Section */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-4">Qualifications & Certificates</label>
                        
                        {/* Existing qualifications */}
                        {staffData.qualifications && staffData.qualifications.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Documents</h4>
                            <ul className="space-y-2">
                              {staffData.qualifications.map((url, index) => (
                                <li key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                  <a 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline text-sm truncate max-w-[180px]"
                                  >
                                    Document {index + 1}
                                  </a>
                                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                  </svg>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* New qualification uploads */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Upload New Documents</h4>
                          
                          {/* Selected files for upload */}
                          {qualificationFiles.length > 0 && (
                            <ul className="mb-3 space-y-2">
                              {qualificationFiles.map((file, index) => (
                                <li key={index} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                  <span className="text-sm truncate max-w-[180px]">{file.name}</span>
                                  <button 
                                    onClick={() => removeQualificationFile(index)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                          
                          <input 
                            type="file" 
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                            onChange={handleQualificationUpload}
                            className="hidden"
                            id="qualification-upload"
                            multiple
                            disabled={loading}
                          />
                          <label 
                            htmlFor="qualification-upload" 
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 transition cursor-pointer block text-center text-sm"
                          >
                            Select Files
                          </label>
                          <p className="text-xs text-gray-500 mt-2">Max size: 5MB per file. Accepted formats: PDF, DOC, DOCX, JPG, PNG</p>
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
                            value={staffData.fullName}
                            onChange={handleInputChange}
                            placeholder="Please enter your full name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                          <input 
                            type="email" 
                            name="email"
                            value={staffData.email}
                            readOnly
                            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50"
                            disabled={true}
                          />
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contact number</label>
                          <input 
                            type="tel" 
                            name="contactNumber"
                            value={staffData.contactNumber}
                            onChange={handleInputChange}
                            placeholder="Please enter your contact number"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                          <input 
                            type="text" 
                            name="specialization"
                            value={staffData.specialization}
                            onChange={handleInputChange}
                            placeholder="Your area of expertise"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]"
                            disabled={loading}
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
                          Update Profile
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
                        {passwordError.general && (
                          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                            {passwordError.general}
                          </div>
                        )}
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input 
                              type="password" 
                              name="currentPassword"
                              value={passwordData.currentPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-4 py-2 border ${passwordError.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#EA540C]`}
                              disabled={loading}
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
                              disabled={loading}
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
                              disabled={loading}
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
                            Update Password
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
                          disabled={loading}
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
                  
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <h3 className="text-lg font-medium mb-4">Manage your notifications</h3>
                        
                        <div className="space-y-4">
                        {Object.keys(notifications).map((key) => (
                            <div key={key} className="flex items-center justify-between">
                            <label className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                            <input 
                                type="checkbox" 
                                checked={notifications[key]} 
                                onChange={() => toggleNotification(key)} 
                                className="form-checkbox h-5 w-5 text-[#EA540C] border-gray-300 rounded focus:ring-[#EA540C]"
                            />
                            </div>
                        ))}
                        </div>
                        
                        <div className="mt-6">
                        <button 
                            onClick={handleSaveNotifications}
                            disabled={loading}
                            className="bg-[#EA540C] text-white px-6 py-3 rounded-full hover:bg-[#d64400] transition-colors disabled:opacity-70"
                        >
                            Save Preferences
                        </button>
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
    // Handle sidebar collapse
    };
// Handle menu item click
