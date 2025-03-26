import React, { useState } from 'react';
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

const LoginForm = () => {
  const [loginType, setLoginType] = useState('email');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

    // Set loading state
    setIsLoading(true);

    try {
      // Simulate login API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would typically handle successful login
      console.log('Login Successful', formData);
      
      // Reset loading state
      setIsLoading(false);
    } catch (error) {
      console.error('Login Error', error);
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
            <a 
              href="#" 
              className="text-[#EA540C] hover:text-[#EA540C]/80 transition-colors text-sm"
            >
              Forgot Password?
            </a>
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
        </form>

        {/* Registration Link */}
        <div className="mt-6 text-center">
          <p className="text-[#737373]">
            Don't have an account?{' '}
            <a 
              href="#" 
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

export default LoginForm;