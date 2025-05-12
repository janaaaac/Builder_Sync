import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  User, 
  Lock, 
  HardHat, 
  Eye, 
  EyeOff, 
  Mail, 
  AlertCircle, 
  LogIn 
} from 'lucide-react';

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginType, setLoginType] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  // Handle navigation
  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear previous errors
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
    
    // Clear login error when user starts typing again
    if (loginError) {
      setLoginError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate login identifier (email or username)
    const identifier = loginType === 'email' ? formData.email : formData.username;
    if (!identifier) {
      newErrors[loginType] = `${loginType === 'email' ? 'Email' : 'Username'} is required`;
    } else if (loginType === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      newErrors.email = 'Invalid email format';
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;

    // Clear any previous login errors
    setLoginError('');
    
    // Set loading state
    setIsLoading(true);

    try {
      console.log("Starting login request to:", `${API_URL}/api/auth/login`);
      
      // Make API call to the backend
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });
      
      // Log the response for debugging
      console.log("Login response:", response.data);
      
      if (response.data.success) {
        // Store authentication data in local storage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('userRole', response.data.user.role);
        
        // Store user data as JSON for more comprehensive access
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Store user display name based on role
        if (response.data.user.fullName) {
          localStorage.setItem('userName', response.data.user.fullName);
        } else if (response.data.user.companyName) {
          localStorage.setItem('userName', response.data.user.companyName);
        } else if (response.data.user.username) {
          localStorage.setItem('userName', response.data.user.username);
        }
        
        // Log important login details
        console.log('Login Successful', response.data);
        console.log("User role:", response.data.user.role);
        console.log("Staff specific role:", response.data.user.staffRole || response.data.user.specificRole);
        console.log("isFirstLogin flag:", response.data.user.isFirstLogin);
        
        // Store staff role if available
        if (response.data.user.staffRole || response.data.user.specificRole) {
          localStorage.setItem('staffRole', response.data.user.staffRole || response.data.user.specificRole);
        }

        // Check for special account states
        if (response.data.user.role === 'company' && !response.data.user.isApproved) {
          console.log("Company not approved - redirecting to pending-approval");
          navigate('/pending-approval', { replace: true });
          return;
        }
        
        // Check if user is a staff member (any staff role)
        const staffRoles = ['project_manager', 'architect', 'engineer', 'quantity_surveyor', 'qs'];
        const isStaffMember = staffRoles.includes(response.data.user.role);
        
        console.log("Checking staff role:", response.data.user.role, "Is staff member:", isStaffMember);

        // Handle staff first login scenario
        if (isStaffMember && response.data.user.isFirstLogin) {
          console.log("Staff first login detected - redirecting to /first-login");
          navigate('/first-login', { replace: true });
          return;
        }
        
        // STEP 3: Route to appropriate dashboard
        const getDashboardPath = (user) => {
          if (user.role === "admin") return "/admin-dashboard";
          if (user.role === "client") return "/client-dashboard";
          if (user.role === "company") return "/company-dashboard";
          
          // If the role is staff OR it's one of the staff-specific roles
          if (user.role === "staff" || isStaffMember) {
            console.log("Detected staff member, redirecting to staff dashboard");
            return "/staff-dashboard";
          }
          
          // Default path if no matching role
          return "/";
        };

        const targetPath = getDashboardPath(response.data.user);
        console.log(`Redirecting to ${targetPath} for ${response.data.user.role} role`);
        navigate(targetPath, { replace: true });
      } else {
        // Handle failed login despite 200 status
        setLoginError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('Login Error details:', error);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error("Server response:", error.response.status, error.response.data);
      } else if (error.request) {
        console.error("No response received from server");
      } else {
        console.error("Error setting up request:", error.message);
      }
      
      // Set appropriate error message based on response
      if (error.response && error.response.data) {
        setLoginError(error.response.data.message || 'Login failed. Please check your credentials.');
      } else {
        setLoginError('Network error. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginMethods = [
    { 
      icon: Mail, 
      title: 'Email Login', 
      description: 'Login with your registered email',
      type: 'email'
    },
    { 
      icon: User, 
      title: 'Username Login', 
      description: 'Login with your company username',
      type: 'username'
    }
  ];

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#EA540C]/10 rounded-full blur-3xl -top-48 -right-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-[#EA540C]/10 rounded-full blur-3xl -bottom-48 -left-48 animate-pulse delay-1000"></div>
      </div>

      {/* Login Container */}
      <div className="w-full max-w-md bg-[#000000]/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#3E3E3E] p-8">
        {/* Logo and Title */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative mr-4">
            <div className="absolute inset-0 bg-[#EA540C] rounded-full blur-md animate-pulse"></div>
            <HardHat className="w-12 h-12 text-[#FFFFFF] relative" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#FFFFFF] tracking-tight">BuilderSync</h1>
            <p className="text-[#EA540C] text-sm">Construction Management System</p>
          </div>
        </div>

        {/* Login Method Selection */}
        <div className="flex justify-center mb-6">
          {loginMethods.map((method) => (
            <button
              key={method.type}
              onClick={() => setLoginType(method.type)}
              className={`
                px-4 py-2 mx-2 rounded-lg transition-all duration-300 flex items-center
                ${loginType === method.type 
                  ? 'bg-[#EA540C] text-white' 
                  : 'bg-[#3E3E3E] text-[#737373] hover:bg-[#3E3E3E]/70'
                }
              `}
            >
              <method.icon className="w-5 h-5 mr-2" />
              {method.title}
            </button>
          ))}
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Login Identifier Input */}
          <div>
            <label className="text-sm text-[#737373] mb-1.5 block">
              {loginType === 'email' ? 'Email Address' : 'Username'}
            </label>
            <div className="relative">
              {loginType === 'email' ? (
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
              ) : (
                <User className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
              )}
              <input
                type={loginType === 'email' ? 'email' : 'text'}
                name={loginType}
                placeholder={`Enter your ${loginType}`}
                value={formData[loginType]}
                onChange={handleInputChange}
                className={`
                  w-full pl-10 pr-4 py-2.5 rounded-lg border 
                  ${errors[loginType] 
                    ? 'border-red-500' 
                    : 'border-[#3E3E3E]'
                  } 
                  bg-[#3E3E3E]/30 text-[#FFFFFF] 
                  placeholder:text-[#737373] 
                  focus:outline-none focus:border-[#EA540C] 
                  transition-colors
                `}
              />
              {errors[loginType] && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors[loginType]}
                </div>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-sm text-[#737373] mb-1.5 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                className={`
                  w-full pl-10 pr-10 py-2.5 rounded-lg border 
                  ${errors.password 
                    ? 'border-red-500' 
                    : 'border-[#3E3E3E]'
                  } 
                  bg-[#3E3E3E]/30 text-[#FFFFFF] 
                  placeholder:text-[#737373] 
                  focus:outline-none focus:border-[#EA540C] 
                  transition-colors
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#737373] hover:text-[#FFFFFF] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
              {errors.password && (
                <div className="flex items-center text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {errors.password}
                </div>
              )}
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="remember" 
                className="mr-2 bg-[#3E3E3E] text-[#EA540C] rounded focus:ring-[#EA540C]"
              />
              <label htmlFor="remember" className="text-[#737373]">Remember me</label>
            </div>
            <button 
              type="button"
              onClick={() => handleNavigation('/forgot-password')}
              className="text-[#EA540C] hover:text-[#EA540C]/80 transition-colors text-sm"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full py-2.5 rounded-lg 
              bg-[#EA540C] text-[#FFFFFF] 
              hover:bg-[#EA540C]/90 
              transition-colors 
              flex items-center justify-center 
              disabled:opacity-50
            "
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </>
            )}
          </button>
          {loginError && (
            <div className="flex items-center text-red-500 text-sm mt-1">
              <AlertCircle className="w-4 h-4 mr-2" />
              {loginError}
            </div>
          )}
        </form>

        {/* Registration Link */}
        <div className="mt-6 text-center">
          <p className="text-[#737373]">
            Don't have an account?{' '}
            <a 
              href="/register-category" 
              className="text-[#EA540C] hover:text-[#EA540C]/80 transition-colors"
            >
              Register Now
            </a>
          </p>
        </div>
      </div>

      {/* Additional Context */}
      <div className="mt-6 text-center text-[#737373] text-sm">
        <p>Secure Login for Construction Professionals</p>
      </div>
    </div>
  );
};

export default LoginPage;