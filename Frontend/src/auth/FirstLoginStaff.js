import React, { useState, useEffect, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Upload } from 'lucide-react';

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function FirstLoginSetup() {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: null
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({
    length: true,
    uppercase: true,
    number: true,
    special: true,
    match: false
  });
  
  const fileInputRef = useRef(null);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'newPassword') {
      checkPasswordStrength(value);
    }
  };
  
  // Password validation effect
  useEffect(() => {
    const password = formData.newPassword;
    
    setPasswordErrors({
      length: password.length < 8,
      uppercase: !/[A-Z]/.test(password),
      number: !/[0-9]/.test(password),
      special: !/[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword
    });
    
    // Calculate strength
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
    
    setPasswordStrength(strength);
  }, [formData.newPassword, formData.confirmPassword]);

  // Auth verification effect
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          toast.error('Authentication required. Please log in.');
          navigate('/login');
          return;
        }
        
        // Verify token with backend
        await axios.get(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Check if this is actually a staff member needing first login
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        if (user.role !== 'staff' && !user.isFirstLogin) {
          toast.warning('This page is only for new staff members');
          navigate('/login');
        }
        
      } catch (error) {
        console.error('Auth verification error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Your session has expired. Please log in again.');
        navigate('/login');
      }
    };
    
    verifyAuth();
  }, [navigate]);
  
  // Handle profile image upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Profile picture must be less than 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        profilePicture: file
      }));
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const checkPasswordStrength = (password) => {
    if (!password) {
      setPasswordStrength(0);
      return;
    }
    
    // Already handled by the useEffect
  };
  
  const getStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.currentPassword !== '' &&
      formData.newPassword !== '' &&
      formData.confirmPassword !== '' &&
      !passwordErrors.length &&
      !passwordErrors.uppercase &&
      !passwordErrors.number &&
      !passwordErrors.special &&
      !passwordErrors.match
    );
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }
    
    // Check password strength
    if (passwordStrength < 75) {
      toast.warning('Please choose a stronger password');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found. Please login again.');
        setIsSubmitting(false);
        navigate('/login');
        return;
      }
      
      const formPayload = new FormData();
      formPayload.append('currentPassword', formData.currentPassword);
      formPayload.append('newPassword', formData.newPassword);
      formPayload.append('confirmPassword', formData.confirmPassword);
      
      if (formData.profilePicture) {
        formPayload.append('profilePicture', formData.profilePicture);
      }
      
      const response = await axios.post(`${API_URL}/api/staff/first-login`, formPayload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        toast.success('Account setup completed successfully!');
        
        // Update user in localStorage
        const updatedUser = {
          ...JSON.parse(localStorage.getItem('user')),
          isFirstLogin: false,
          profilePicture: response.data.staff?.profilePicture,
          profilePictureUrl: response.data.staff?.profilePictureUrl
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Redirect after delay
        setTimeout(() => {
          navigate('/staff-dashboard');
        }, 1500);
      } else {
        throw new Error(response.data.message || 'Setup failed');
      }
    } catch (err) {
      console.error('First login setup error:', err);
      
      if (err.response) {
        // Handle specific error cases
        if (err.response.status === 401) {
          toast.error('Current password is incorrect');
        } else if (err.response.status === 400) {
          toast.error(err.response.data.message || 'Validation failed');
        } else {
          toast.error(err.response.data.message || 'Server error during setup');
        }
      } else if (err.request) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <ToastContainer position="top-right" autoClose={5000} />
      
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#EA540C] flex-col justify-between p-12 text-white">
        <div>
          <div className="text-3xl font-bold mb-2">BuilderSync</div>
          <div className="h-1 w-16 bg-white mb-8"></div>
          <h1 className="text-4xl font-bold mb-6">Welcome to your workspace</h1>
          <p className="text-lg opacity-80">Complete your profile setup to get started with your new account.</p>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Secure Access</h3>
              <p className="text-sm opacity-80">Set up your password for secure access to your workspace.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Personalized Experience</h3>
              <p className="text-sm opacity-80">Add your profile photo to personalize your account.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4">
            <div className="mt-1">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">One-time Setup</h3>
              <p className="text-sm opacity-80">You'll only need to do this once to access all features.</p>
            </div>
          </div>
        </div>
        
        <div className="text-sm opacity-70">
          &copy; {new Date().getFullYear()} BuilderSync. All rights reserved.
        </div>
      </div>
      
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Complete Your Profile</h2>
            <p className="text-gray-600 mt-2">Set up your password and profile picture</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA540C] focus:border-[#EA540C]"
                  placeholder="Enter your temporary password"
                  required
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the temporary password provided to you by your administrator
              </p>
            </div>
            
            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA540C] focus:border-[#EA540C]"
                  placeholder="Create a strong password"
                  required
                />
                <div
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Strength Meter */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`} 
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Weak</span>
                    <span>Medium</span>
                    <span>Strong</span>
                  </div>
                </div>
              )}
              
              {/* Password Requirements */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className={`text-xs flex items-center ${passwordErrors.length ? 'text-red-500' : 'text-green-500'}`}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    {passwordErrors.length ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                  At least 8 characters
                </div>
                <div className={`text-xs flex items-center ${passwordErrors.uppercase ? 'text-red-500' : 'text-green-500'}`}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    {passwordErrors.uppercase ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                  Uppercase letter
                </div>
                <div className={`text-xs flex items-center ${passwordErrors.number ? 'text-red-500' : 'text-green-500'}`}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    {passwordErrors.number ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                  Number (0-9)
                </div>
                <div className={`text-xs flex items-center ${passwordErrors.special ? 'text-red-500' : 'text-green-500'}`}>
                  <svg className="w-3.5 h-3.5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    {passwordErrors.special ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                  Special character
                </div>
              </div>
            </div>
            
            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EA540C] focus:border-[#EA540C] ${
                    passwordErrors.match && formData.confirmPassword 
                      ? 'border-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm your new password"
                  required
                />
              </div>
              {passwordErrors.match && formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Passwords don't match</p>
              )}
            </div>
            
            {/* Profile Picture */}
            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Profile Picture
              </label>
              <div className="flex items-center space-x-6">
                <div className="shrink-0">
                  <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile preview" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label 
                    htmlFor="profilePicture"
                    className="inline-flex items-center px-4 py-2 border border-[#EA540C] text-sm font-medium rounded-md text-[#EA540C] bg-white hover:bg-[#EA540C]/5 cursor-pointer transition-colors"
                  >
                    {imagePreview ? 'Change photo' : 'Upload photo'}
                  </label>
                  <input 
                    id="profilePicture" 
                    name="profilePicture" 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept="image/*"
                  />
                  <p className="text-xs text-gray-500">JPG, PNG or GIF (Max. 5MB)</p>
                  {!imagePreview && (
                    <p className="text-xs text-gray-500 mt-1">
                      You can skip this step and add a photo later
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#EA540C] hover:bg-[#EA540C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#EA540C] transition-colors ${
                  !isFormValid() ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                disabled={!isFormValid() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Complete Setup'}
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By completing this form, you agree to our <a href="#" className="text-[#EA540C] hover:underline">Terms of Service</a> and <a href="#" className="text-[#EA540C] hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need help? <a href="#" className="text-[#EA540C] font-medium hover:underline">Contact Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirstLoginSetup;