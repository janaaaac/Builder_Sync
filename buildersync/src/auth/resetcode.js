import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Shield, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';

const EnterResetCodePage = () => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleBack = () => {
    // Navigation logic to go back to forgot password
    console.log('Go Back to Forgot Password');
  };

  const handleCodeChange = (index: number, value: string) => {
    // Ensure only numbers are entered
    if (/^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors
    setError('');
    
    // Check if all code digits are filled
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    // Start loading
    setIsLoading(true);

    try {
      // Simulate code verification API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // If successful, navigate to create new password
      console.log('Code Verified, Navigate to New Password');
    } catch (err) {
      // Handle verification errors
      setError('Invalid reset code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    // Reset state
    setError('');
    setIsLoading(true);

    try {
      // Simulate resend code API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      setError('New reset code has been sent to your email');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
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
            <Shield className="h-12 w-12 text-[#EA540C]" />
          </div>
          <h1 className="text-3xl font-bold text-[#FFFFFF] mb-2">
            Verify Reset Code
          </h1>
          <p className="text-[#737373] text-sm">
            Enter the 6-digit code sent to your email
          </p>
        </div>

        {/* Reset Code Form */}
        <form onSubmit={handleVerifyCode} className="space-y-6">
          {/* Code Input Grid */}
          <div className="flex justify-center space-x-2">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`
                  w-12 h-12 text-center text-2xl rounded-lg border 
                  ${error ? 'border-red-500' : 'border-[#3E3E3E]'} 
                  bg-[#3E3E3E]/30 text-[#FFFFFF] 
                  focus:outline-none focus:border-[#EA540C] 
                  transition-colors
                `}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center text-red-500 text-sm mt-2">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {/* Resend Code */}
          <div className="text-center text-[#737373]">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="
                flex items-center justify-center mx-auto 
                text-[#EA540C] hover:text-[#EA540C]/80 
                transition-colors
              "
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend Code
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
                Verifying...
              </>
            ) : (
              'Verify Code'
            )}
          </button>
        </form>
      </div>

      {/* Additional Information */}
      <div className="mt-8 text-center text-[#737373] text-sm">
        <p>
          Didn't receive the code? {" "}
          <button 
            onClick={handleResendCode}
            className="text-[#EA540C] hover:underline"
          >
            Resend Code
          </button>
        </p>
      </div>
    </div>
  );
};

export default EnterResetCodePage;