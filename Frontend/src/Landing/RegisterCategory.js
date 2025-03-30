import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Users, 
  Building2, 
  CheckCircle2 
} from 'lucide-react';

const RegistrationCategory = () => {
  const navigate = useNavigate();
  const [hoverStakeholder, setHoverStakeholder] = useState(false);
  const [hoverCompany, setHoverCompany] = useState(false);

  const handleStakeholderRegistration = () => {
    // Navigate to client registration page
    navigate('/client-registration');
  };

  const handleCompanyRegistration = () => {
    // Navigate to company registration page
    navigate('/company-registration');
  };

  const handleBack = () => {
    // Navigate back to home/landing page
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000000] to-[#1E1E1E] flex flex-col items-center justify-center p-4 relative">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="absolute top-8 left-8 flex items-center text-[#737373] hover:text-[#EA540C] transition-colors duration-300"
      >
        <ArrowLeft className="h-6 w-6 mr-2" />
        <span className="font-medium">Back</span>
      </button>

      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-[#FFFFFF] mb-4">
          Join BuilderSync Platform
        </h1>
        <p className="text-[#737373] text-lg max-w-2xl mx-auto">
          Connect with verified partners and streamline your construction projects 
          with our AI-powered platform. Choose how you want to get started.
        </p>
      </div>

      {/* Registration Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        {/* Stakeholder Option */}
        <div 
          className={`
            bg-[#3E3E3E]/30 p-8 rounded-2xl shadow-2xl border border-[#3E3E3E] 
            transition-all duration-300 transform 
            ${hoverStakeholder ? 'scale-105 border-[#EA540C]/50' : ''} 
            relative overflow-hidden
          `}
          onMouseEnter={() => setHoverStakeholder(true)}
          onMouseLeave={() => setHoverStakeholder(false)}
        >
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#EA540C]/10 to-[#000000]/20 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            {/* Icon */}
            <div className="bg-[#EA540C]/20 rounded-full p-4 inline-block mb-4">
              <Users className="h-8 w-8 text-[#EA540C]" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-[#FFFFFF] mb-3">Stakeholder</h2>
            
            {/* Description */}
            <p className="text-[#737373] mb-6">
              Perfect for project owners, investors, and clients looking to find reliable contractors and manage construction projects.
            </p>

            {/* Features */}
            <ul className="space-y-2 mb-8">
              {[
                "Connect with verified contractors",
                "Manage multiple projects",
                "Track project progress in real-time"
              ].map((feature, index) => (
                <li key={index} className="flex items-center text-[#FFFFFF]">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-[#EA540C]" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Registration Button */}
            <button 
              onClick={handleStakeholderRegistration}
              className="
                bg-[#EA540C] hover:bg-[#EA540C]/90 
                text-white py-3 px-8 rounded-full 
                font-bold transition-all duration-300 
                w-full flex items-center justify-center
              "
            >
              Register as Stakeholder
            </button>
          </div>
        </div>

        {/* Company Option */}
        <div 
          className={`
            bg-[#3E3E3E]/30 p-8 rounded-2xl shadow-2xl border border-[#3E3E3E] 
            transition-all duration-300 transform 
            ${hoverCompany ? 'scale-105 border-[#EA540C]/50' : ''} 
            relative overflow-hidden
          `}
          onMouseEnter={() => setHoverCompany(true)}
          onMouseLeave={() => setHoverCompany(false)}
        >
          {/* Decorative Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#EA540C]/10 to-[#000000]/20 opacity-50 z-0"></div>
          
          <div className="relative z-10">
            {/* Icon */}
            <div className="bg-[#EA540C]/20 rounded-full p-4 inline-block mb-4">
              <Building2 className="h-8 w-8 text-[#EA540C]" />
            </div>

            {/* Title */}
            <h2 className="text-3xl font-bold text-[#FFFFFF] mb-3">Company</h2>
            
            {/* Description */}
            <p className="text-[#737373] mb-6">
              Ideal for contractors, suppliers, and service providers looking to grow their business and connect with potential clients.
            </p>

            {/* Features */}
            <ul className="space-y-2 mb-8">
              {[
                "Showcase your portfolio and services",
                "Receive project opportunities",
                "Streamline your project management"
              ].map((feature, index) => (
                <li key={index} className="flex items-center text-[#FFFFFF]">
                  <CheckCircle2 className="h-5 w-5 mr-2 text-[#EA540C]" />
                  {feature}
                </li>
              ))}
            </ul>

            {/* Registration Button */}
            <button 
              onClick={handleCompanyRegistration}
              className="
                bg-[#EA540C] hover:bg-[#EA540C]/90 
                text-white py-3 px-8 rounded-full 
                font-bold transition-all duration-300 
                w-full flex items-center justify-center
              "
            >
              Register as Company
            </button>
          </div>
        </div>
      </div>

      {/* Already have an account? */}
      <div className="mt-12 text-center">
        <p className="text-[#737373]">
          Already have an account?{" "}
          <a 
            href="/login" 
            className="text-[#EA540C] font-semibold hover:underline"
          >
            Sign in
          </a>
        </p>
      </div>

      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#EA540C]/10 rounded-full blur-3xl -top-48 -right-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-[#EA540C]/10 rounded-full blur-3xl -bottom-48 -left-48 animate-pulse delay-1000"></div>
      </div>
    </div>
  );
};

export default RegistrationCategory;