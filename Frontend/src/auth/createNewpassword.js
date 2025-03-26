import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const CreateNewPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(calculatePasswordStrength(newPassword));
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    // Reset previous errors
    setError('');
    
    // Validate password
    if (!password) {
      setError('Password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Start loading
    setIsLoading(true);

    try {
      // Simulate password reset API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If successful, show success message or navigate
      console.log('Password Reset Successfully');
    } catch (err) {
      // Handle any errors
      setError('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    // Navigation logic to go back
    console.log('Go Back');
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
      case 3:
        return 'bg-yellow-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-red-500';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'Weak';
      case 2:
      case 3:
        return 'Medium';
      case 4:
      case 5:
        return 'Strong';
      default:
        return 'Weak';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] to-[#1E1E1E] flex flex-col items-center justify-center p-4 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#EA540C]/10 rounded-full blur-3xl -top-48 -right-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-[#EA540C]/10 rounded-full blur-3xl -bottom-48 -left-48 animate-pulse delay-1000"></div>
      </div>

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 flex items-center text-[#737373] hover:text-[#EA540C] transition-colors duration-300"
      >
        <ArrowLeft className="h-6 w-6 mr-2" />
        <span className="font-medium">Back</span>
      </button>

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#3E3E3E]/30 rounded-2xl shadow-2xl border border-[#3E3E3E] p-8 backdrop-blur-xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-[#EA540C]" />
          </div>
          <h1 className="text-3xl font-bold text-[#FFFFFF] mb-2">
            Create New Password
          </h1>
          <p className="text-[#737373] text-sm">
            Your new password must be different from previously used passwords
          </p>
        </div>

        {/* New Password Form */}
        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* New Password Input */}
          <div>
            <label className="text-sm text-[#737373] mb-1.5 block">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className={`
                  w-full pl-10 pr-10 py-2.5 rounded-lg border 
                  ${error && !password ? 'border-red-500' : 'border-[#3E3E3E]'} 
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
            </div>

            {/* Password Strength Indicator */}
            <div className="mt-2 h-1 w-full bg-[#3E3E3E] rounded-full overflow-hidden">
              <div 
                className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-[#737373] mt-1">
              Password Strength: {getPasswordStrengthText()}
            </p>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label className="text-sm text-[#737373] mb-1.5 block">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className={`
                  w-full pl-10 pr-10 py-2.5 rounded-lg border 
                  ${error && password !== confirmPassword ? 'border-red-500' : 'border-[#3E3E3E]'} 
                  bg-[#3E3E3E]/30 text-[#FFFFFF] 
                  placeholder:text-[#737373] 
                  focus:outline-none focus:border-[#EA540C] 
                  transition-colors
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-[#737373] hover:text-[#FFFFFF] transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center text-red-500 text-sm mt-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {/* Password Requirements */}
          <div className="text-[#737373] text-xs space-y-1">
            <p className="flex items-center">
              <CheckCircle2 
                className={`w-4 h-4 mr-2 ${password.length >= 8 ? 'text-green-500' : 'text-[#737373]'}`} 
              />
              At least 8 characters long
            </p>
            <p className="flex items-center">
              <CheckCircle2 
                className={`w-4 h-4 mr-2 ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-[#737373]'}`} 
              />
              Contains at least one uppercase letter
            </p>
            <p className="flex items-center">
              <CheckCircle2 
                className={`w-4 h-4 mr-2 ${/[0-9]/.test(password) ? 'text-green-500' : 'text-[#737373]'}`} 
              />
              Contains at least one number
            </p>
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
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>

      {/* Additional Information */}
      <div className="mt-8 text-center text-[#737373] text-sm">
        <p>
          Remember your password? {" "}
          <a 
            href="/login" 
            className="text-[#EA540C] hover:underline"
          >
            Back to Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default CreateNewPasswordPage;