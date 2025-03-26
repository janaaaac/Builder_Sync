import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

const ForgetPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    // Navigation logic to go back to login
    console.log('Go Back to Login');
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors
    setError('');
    
    // Validate email
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Start loading
    setIsLoading(true);

    try {
      // Simulate password reset API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If successful, show email sent confirmation
      setIsEmailSent(true);
    } catch (err) {
      // Handle any errors
      setError('Failed to send reset link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = () => {
    // Reset state to allow resending
    setIsEmailSent(false);
    setError('');
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
        <span className="font-medium">Back to Login</span>
      </button>

      {/* Main Container */}
      <div className="w-full max-w-md bg-[#3E3E3E]/30 rounded-2xl shadow-2xl border border-[#3E3E3E] p-8 backdrop-blur-xl">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Lock className="h-12 w-12 text-[#EA540C]" />
          </div>
          <h1 className="text-3xl font-bold text-[#FFFFFF] mb-2">
            {isEmailSent ? 'Check Your Email' : 'Forgot Password'}
          </h1>
          <p className="text-[#737373] text-sm">
            {isEmailSent 
              ? 'We\'ve sent a password reset link to your email' 
              : 'Enter the email associated with your account'}
          </p>
        </div>

        {/* Main Form or Confirmation */}
        {!isEmailSent ? (
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* Email Input */}
            <div>
              <label className="text-sm text-[#737373] mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-lg border 
                    ${error ? 'border-red-500' : 'border-[#3E3E3E]'} 
                    bg-[#3E3E3E]/30 text-[#FFFFFF] 
                    placeholder:text-[#737373] 
                    focus:outline-none focus:border-[#EA540C] 
                    transition-colors
                  `}
                />
              </div>
              {error && (
                <div className="flex items-center text-red-500 text-sm mt-2">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </div>
              )}
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
                  Sending Reset Link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6">
            <div className="bg-[#EA540C]/20 rounded-full p-4 inline-block mx-auto">
              <CheckCircle2 className="h-12 w-12 text-[#EA540C]" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">
                Reset Link Sent!
              </h2>
              <p className="text-[#737373] mb-4">
                We've sent a password reset link to <span className="text-[#FFFFFF]">{email}</span>. 
                Please check your inbox (and spam folder).
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={handleResendEmail}
                className="
                  w-full py-2.5 rounded-lg 
                  border border-[#3E3E3E] 
                  text-[#FFFFFF] 
                  hover:bg-[#3E3E3E] 
                  transition-colors
                "
              >
                Resend Reset Link
              </button>

              <p className="text-[#737373] text-sm">
                Didn't receive the email? 
                <button 
                  onClick={handleResendEmail}
                  className="text-[#EA540C] ml-1 hover:underline"
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        )}
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

export default ForgetPasswordPage;