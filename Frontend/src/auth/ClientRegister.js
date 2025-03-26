import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HardHat, 
  Building2, 
  User, 
  Briefcase, 
  Phone, 
  MapPin, 
  Mail, 
  Lock, 
  Upload,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Shield,
  Globe2,
  Users,
  Cog,
  AlertCircle
} from 'lucide-react';

const ClientRegister = () => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    companyName: '',
    clientType: '',
    nicPassportNumber: '',
    nicPassportFile: null,
    profilePicture: null,
    primaryContact: '',
    address: '',
    preferredCommunication: '',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [previews, setPreviews] = useState({
    nicPassportFile: null,
    profilePicture: null,
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const calculateProgress = () => {
      const totalFields = 13;
      const filledFields = Object.values(formData).filter(value => 
        value !== '' && value !== null && value !== false && 
        (Array.isArray(value) ? value.length > 0 : true)
      ).length;
      return (filledFields / totalFields) * 100;
    };
    setProgress(calculateProgress());
  }, [formData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleFileChange = (name) => (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        [name]: file
      }));
      
      // Generate preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviews(prev => ({
            ...prev,
            [name]: event.target.result
          }));
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files (like PDFs), just clear the preview
        setPreviews(prev => ({
          ...prev,
          [name]: null
        }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.username) newErrors.username = 'Username is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    } else {
      if (!formData.companyName) newErrors.companyName = 'Company name is required';
      if (!formData.primaryContact) newErrors.primaryContact = 'Contact number is required';
      if (!formData.nicPassportFile) newErrors.nicPassportFile = 'Company documents are required';
      if (!formData.profilePicture) newErrors.profilePicture = 'Company logo is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      // Create FormData object for file uploads
      const formDataToSend = new FormData();
      
      // Append all form data
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Make API call
      const response = await axios.post(
        'http://localhost:5001/api/clients/create',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Show success popup instead of just message
      setShowSuccessPopup(true);
      
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      if (error.response) {
        // Handle specific error messages from backend
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Features array
  const features = [
    {
      icon: CheckCircle2,
      title: "Streamlined Project Management",
      description: "Track progress and manage tasks efficiently with real-time updates"
    },
    {
      icon: Shield,
      title: "Secure Document Sharing",
      description: "Share blueprints, contracts and documents with enterprise-grade security"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Connect your entire team and improve communication across projects"
    },
    {
      icon: Globe2,
      title: "Access Anywhere",
      description: "Access your projects from any device, wherever your work takes you"
    }
  ];

  const [expandedFeatureIndex, setExpandedFeatureIndex] = useState(null);

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-[#EA540C]/10 rounded-full blur-3xl -top-48 -right-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-[#EA540C]/10 rounded-full blur-3xl -bottom-48 -left-48 animate-pulse delay-1000"></div>
      </div>

      {/* Logo and Title */}
      <div className="mb-8 flex items-center gap-3">
        <div className="relative">
          <div className="absolute inset-0 bg-[#EA540C] rounded-full blur-md animate-pulse"></div>
          <HardHat className="w-12 h-12 text-[#FFFFFF] relative" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-[#FFFFFF] tracking-tight">BuilderSync</h1>
          <p className="text-[#EA540C] font-medium">Construction Management System</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-5xl mb-6">
        <div className="flex justify-between text-sm text-[#737373] mb-2">
          <span>Registration Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-[#3E3E3E] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#EA540C] transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`w-full max-w-5xl mb-4 p-4 rounded-lg ${
          message.type === 'error' ? 'bg-red-500/20 border border-red-500' : 'bg-green-500/20 border border-green-500'
        }`}>
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-5 h-5 ${
              message.type === 'error' ? 'text-red-500' : 'text-green-500'
            }`} />
            <span className={`text-sm ${
              message.type === 'error' ? 'text-red-300' : 'text-green-300'
            }`}>{message.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-5xl bg-[#000000]/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-[#3E3E3E]">
        <div className="grid md:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="md:col-span-4 text-[#FFFFFF]">
            <h2 className="text-2xl font-bold mb-4 text-[#EA540C]">
              {step === 1 ? 'Create Account' : 'Client Details'}
            </h2>
            <p className="text-[#737373] mb-6 leading-relaxed">
              {step === 1 
                ? 'Join thousands of construction professionals using BuilderSync to manage their projects efficiently.'
                : 'Help us customize your experience by providing your personal information.'}
            </p>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const isExpanded = expandedFeatureIndex === index;
                
                return (
                  <div 
                    key={index}
                    onClick={() => setExpandedFeatureIndex(isExpanded ? null : index)}
                    className="flex items-start gap-3 p-3 rounded-lg bg-[#3E3E3E]/50 border border-[#3E3E3E] hover:border-[#EA540C]/50 transition-all duration-300 cursor-pointer"
                  >
                    <feature.icon className="w-5 h-5 text-[#EA540C] mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-[#FFFFFF]">{feature.title}</h3>
                        <ChevronRight className={`w-4 h-4 text-[#EA540C] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-20 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                        <p className="text-sm text-[#737373]">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="md:col-span-8">
            <div className="bg-[#3E3E3E]/20 rounded-xl p-6 border border-[#3E3E3E]">
              {step === 1 ? (
                <div className="space-y-6">
                  {/* Username & Full Name */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Username</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="text"
                          name="username"
                          placeholder="Enter username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                        {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="text"
                          name="fullName"
                          placeholder="Enter full name"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm text-[#737373] mb-1.5 block">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-sm text-[#737373] mb-1.5 block">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                      <input
                        type="password"
                        name="password"
                        placeholder="Create password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                      />
                      {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-sm text-[#737373] mb-1.5 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                      <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Company Details Fields */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Company Name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="text"
                          name="companyName"
                          placeholder="Enter company name"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                        {errors.companyName && <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Business Type</label>
                      <select
                        value={formData.clientType}
                        onChange={handleInputChange}
                        name="clientType"
                        className="w-full px-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] focus:outline-none focus:border-[#EA540C] transition-colors"
                      >
                        <option value="" className="bg-[#000000]">Select type</option>
                        <option value="contractor" className="bg-[#000000]">General Contractor</option>
                        <option value="subcontractor" className="bg-[#000000]">Subcontractor</option>
                        <option value="developer" className="bg-[#000000]">Developer</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="tel"
                          name="primaryContact"
                          placeholder="Enter contact number"
                          value={formData.primaryContact}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                        {errors.primaryContact && <p className="text-red-500 text-xs mt-1">{errors.primaryContact}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="text"
                          name="address"
                          placeholder="Enter company address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* NIC/Passport and Preferred Communication */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">NIC/Passport Number</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="text"
                          name="nicPassportNumber"
                          placeholder="Enter NIC or passport number"
                          value={formData.nicPassportNumber}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Preferred Communication</label>
                      <select
                        value={formData.preferredCommunication}
                        onChange={handleInputChange}
                        name="preferredCommunication"
                        className="w-full px-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] focus:outline-none focus:border-[#EA540C] transition-colors"
                      >
                        <option value="" className="bg-[#000000]">Select preferred method</option>
                        <option value="email" className="bg-[#000000]">Email</option>
                        <option value="phone" className="bg-[#000000]">Phone</option>
                        <option value="sms" className="bg-[#000000]">SMS</option>
                        <option value="app" className="bg-[#000000]">In-App Notification</option>
                      </select>
                    </div>
                  </div>

                  {/* File Upload Areas */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">NIC/Passport  </label>
                      <div 
                        onClick={() => document.getElementById('docs').click()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 cursor-pointer ${
                          errors.nicPassportFile ? 'border-red-500' : 'border-[#3E3E3E] hover:border-[#EA540C]'
                        }`}
                      >
                        <input
                          id="docs"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange('nicPassportFile')}
                          accept="image/*,application/pdf"
                        />
                        {previews.nicPassportFile ? (
                          <div className="relative mb-2">
                            <img 
                              src={previews.nicPassportFile} 
                              alt="NIC/Passport Preview" 
                              className="h-32 max-w-full mx-auto rounded object-contain"
                            />
                          </div>
                        ) : (
                          <Upload className="h-6 w-6 text-[#737373] mx-auto mb-2" />
                        )}
                        <p className="text-sm text-[#737373]">
                          {formData.nicPassportFile ? formData.nicPassportFile.name : 'Upload NIC/Passport Image '}
                        </p>
                        {errors.nicPassportFile && (
                          <p className="text-red-500 text-xs mt-1">{errors.nicPassportFile}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Profile Picture</label>
                      <div 
                        onClick={() => document.getElementById('logo').click()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 cursor-pointer ${
                          errors.profilePicture ? 'border-red-500' : 'border-[#3E3E3E] hover:border-[#EA540C]'
                        }`}
                      >
                        <input
                          id="logo"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange('profilePicture')}
                          accept="image/*"
                        />
                        {previews.profilePicture ? (
                          <div className="relative mb-2">
                            <img 
                              src={previews.profilePicture} 
                              alt="Profile Picture Preview" 
                              className="h-32 max-w-full mx-auto rounded-full object-cover"
                            />
                          </div>
                        ) : (
                          <Upload className="h-6 w-6 text-[#737373] mx-auto mb-2" />
                        )}
                        <p className="text-sm text-[#737373]">
                          {formData.profilePicture ? formData.profilePicture.name : 'Upload Profile Picture'}
                        </p>
                        {errors.profilePicture && (
                          <p className="text-red-500 text-xs mt-1">{errors.profilePicture}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-end gap-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-6 py-2.5 border border-[#3E3E3E] text-[#737373] rounded-lg hover:bg-[#3E3E3E] hover:text-[#FFFFFF] transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => step === 1 ? setStep(2) : handleSubmit()}
                  disabled={isLoading}
                  className="px-6 py-2.5 bg-[#EA540C] text-[#FFFFFF] rounded-lg hover:bg-[#EA540C]/90 transition-colors flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      {step === 1 ? 'Continue' : 'Complete Setup'}
                      {step === 1 && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-[#737373]">
          Already have an account?{' '}
          <a href="#" className="text-[#EA540C] hover:text-[#EA540C]/80 transition-colors">
            Sign in
          </a>
        </p>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#121212] p-8 rounded-xl border border-[#3E3E3E] shadow-xl flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#EA540C]"></div>
            <p className="mt-6 text-[#FFFFFF] font-medium">Processing your registration...</p>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#121212] p-8 rounded-xl border border-[#3E3E3E] shadow-xl max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">Registration Successful!</h2>
              <p className="text-[#737373] mb-6">
                Your account has been created and is currently under review. We'll notify you once it's approved.
              </p>
              <button
                onClick={() => {
                  setShowSuccessPopup(false);
                  // You can add navigation to login page here
                  // navigate('/login');
                }}
                className="px-6 py-2.5 bg-[#EA540C] text-[#FFFFFF] rounded-lg hover:bg-[#EA540C]/90 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientRegister;