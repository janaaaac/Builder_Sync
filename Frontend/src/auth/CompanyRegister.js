import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HardHat, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Mail, 
  Lock, 
  Upload,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XIcon,
  Shield,
  Globe2,
  Users,
  AlertCircle,
  Calendar,
  FileText,
  Link
} from 'lucide-react';

const CompanyRegister = () => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Account Information
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactPersonName: '',
    contactPhoneNumber: '',
    
    // Step 2: Company Information
    companyName: '',
    businessRegNumber: '',
    businessType: '',
    establishmentYear: '',
    registeredOfficeAddress: '',
    branchOfficeAddress: '',
    websiteURL: '',
    
    // Step 3: Certifications
    cidaRegNumber: '',
    cidaGrade: '',
    specializedLicenses: [],
    isoCertifications: [],
    companyLogo: null
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [previews, setPreviews] = useState({
    companyLogo: null,
    specializedLicenses: [],
    isoCertifications: [],
  });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  useEffect(() => {
    const calculateProgress = () => {
      const totalFields = 17;
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
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviews(prev => ({
            ...prev,
            [name]: event.target.result
          }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleMultipleFileChange = (name) => (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setFormData(prev => ({
        ...prev,
        [name]: [...prev[name], ...files]
      }));
      
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setPreviews(prev => ({
              ...prev,
              [name]: [...prev[name], {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                url: event.target.result,
                name: file.name
              }]
            }));
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews(prev => ({
            ...prev,
            [name]: [...prev[name], {
              id: Date.now() + Math.random().toString(36).substr(2, 9),
              url: null,
              name: file.name
            }]
          }));
        }
      });
    }
  };

  const removeFile = (name, id) => {
    setPreviews(prev => ({
      ...prev,
      [name]: prev[name].filter(item => item.id !== id)
    }));
    
    const index = previews[name].findIndex(item => item.id === id);
    if (index !== -1) {
      setFormData(prev => ({
        ...prev,
        [name]: prev[name].filter((_, i) => i !== index)
      }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.username) newErrors.username = 'Username is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
      if (!formData.contactPersonName) newErrors.contactPersonName = 'Contact person name is required';
      if (!formData.contactPhoneNumber) newErrors.contactPhoneNumber = 'Contact phone number is required';
    } 
    else if (currentStep === 2) {
      if (!formData.companyName) newErrors.companyName = 'Company name is required';
      if (!formData.businessRegNumber) newErrors.businessRegNumber = 'Business registration number is required';
      if (!formData.registeredOfficeAddress) newErrors.registeredOfficeAddress = 'Registered office address is required';
    }
    else if (currentStep === 3) {
      if (!formData.cidaRegNumber) newErrors.cidaRegNumber = 'CIDA registration number is required';
      if (!formData.cidaGrade) newErrors.cidaGrade = 'CIDA grade is required';
      if (!formData.companyLogo) newErrors.companyLogo = 'Company logo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    
    setIsLoading(true);
    setMessage({ text: '', type: '' });
  
    try {
      const formDataToSend = new FormData();
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'companyLogo' && 
            key !== 'specializedLicenses' && 
            key !== 'isoCertifications' && 
            key !== 'confirmPassword' && 
            formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
  
      // Append company logo if exists
      if (formData.companyLogo) {
        formDataToSend.append('companyLogo', formData.companyLogo);
      }
  
      // Append specialized licenses if they exist
      if (formData.specializedLicenses && formData.specializedLicenses.length > 0) {
        Array.from(formData.specializedLicenses).forEach((file, index) => {
          formDataToSend.append(`specializedLicenses`, file); // Note: Same field name for all files
        });
      }
  
      // Append ISO certifications if they exist
      if (formData.isoCertifications && formData.isoCertifications.length > 0) {
        Array.from(formData.isoCertifications).forEach((file, index) => {
          formDataToSend.append(`isoCertifications`, file); // Note: Same field name for all files
        });
      }
  
      const response = await axios.post(
        'http://localhost:5001/api/companies/create',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      setShowSuccessPopup(true);
      setMessage({ text: response.data.message || 'Registration successful!', type: 'success' });
      
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = 'Registration failed. Please try again.';
      if (error.response) {
        // Improved error message extraction
        errorMessage = error.response.data?.message ||
                       error.response.data?.error ||
                       error.response.statusText ||
                       'Unknown server error';
    
        // If validation errors, show the first one
        if (error.response.data?.errors) {
          const firstError = Object.values(error.response.data.errors)[0];
          errorMessage = firstError?.message || firstError;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
    
      setMessage({
        text: errorMessage,
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              {step === 1 ? 'Account Information' : 
               step === 2 ? 'Company Details' : 
               'Certifications & Logo'}
            </h2>
            <p className="text-[#737373] mb-6 leading-relaxed">
              {step === 1 ? 'Create your account credentials to get started.' : 
               step === 2 ? 'Tell us about your company.' : 
               'Provide your certifications, licenses, and upload your company logo.'}
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
              {/* Step 1: Account Information */}
              {step === 1 && (
                <div className="space-y-6">
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
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Contact Person Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="text"
                          name="contactPersonName"
                          placeholder="Enter contact person name"
                          value={formData.contactPersonName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                        {errors.contactPersonName && <p className="text-red-500 text-xs mt-1">{errors.contactPersonName}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Contact Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="tel"
                          name="contactPhoneNumber"
                          placeholder="Enter contact number"
                          value={formData.contactPhoneNumber}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                        {errors.contactPhoneNumber && <p className="text-red-500 text-xs mt-1">{errors.contactPhoneNumber}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
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
                </div>
              )}

              {/* Step 2: Company Information */}
              {step === 2 && (
                <div className="space-y-6">
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
                      <label className="text-sm text-[#737373] mb-1.5 block">Business Registration Number</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="text"
                          name="businessRegNumber"
                          placeholder="Enter registration number"
                          value={formData.businessRegNumber}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                        {errors.businessRegNumber && <p className="text-red-500 text-xs mt-1">{errors.businessRegNumber}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Business Type</label>
                      <select
                        value={formData.businessType}
                        onChange={handleInputChange}
                        name="businessType"
                        className="w-full px-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] focus:outline-none focus:border-[#EA540C] transition-colors"
                      >
                        <option value="" className="bg-[#000000]">Select type</option>
                        <option value="contractor" className="bg-[#000000]">General Contractor</option>
                        <option value="subcontractor" className="bg-[#000000]">Subcontractor</option>
                        <option value="developer" className="bg-[#000000]">Developer</option>
                        <option value="consultant" className="bg-[#000000]">Consultant</option>
                        <option value="supplier" className="bg-[#000000]">Supplier</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Establishment Year</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="number"
                          name="establishmentYear"
                          placeholder="Year established"
                          value={formData.establishmentYear}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-[#737373] mb-1.5 block">Registered Office Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                      <input
                        type="text"
                        name="registeredOfficeAddress"
                        placeholder="Enter registered office address"
                        value={formData.registeredOfficeAddress}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                      />
                      {errors.registeredOfficeAddress && <p className="text-red-500 text-xs mt-1">{errors.registeredOfficeAddress}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-[#737373] mb-1.5 block">Branch Office Address (if any)</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                      <input
                        type="text"
                        name="branchOfficeAddress"
                        placeholder="Enter branch office address"
                        value={formData.branchOfficeAddress}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-[#737373] mb-1.5 block">Website URL</label>
                    <div className="relative">
                      <Link className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                      <input
                        type="url"
                        name="websiteURL"
                        placeholder="Enter website URL"
                        value={formData.websiteURL}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Certifications */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">CIDA Registration Number</label>
                      <div className="relative">
                        <FileText className="absolute left-3 top-3 h-5 w-5 text-[#737373]" />
                        <input
                          type="text"
                          name="cidaRegNumber"
                          placeholder="Enter CIDA registration number"
                          value={formData.cidaRegNumber}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] placeholder:text-[#737373] focus:outline-none focus:border-[#EA540C] transition-colors"
                        />
                        {errors.cidaRegNumber && <p className="text-red-500 text-xs mt-1">{errors.cidaRegNumber}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">CIDA Grade</label>
                      <select
                        value={formData.cidaGrade}
                        onChange={handleInputChange}
                        name="cidaGrade"
                        className="w-full px-4 py-2.5 rounded-lg border bg-[#3E3E3E]/30 border-[#3E3E3E] text-[#FFFFFF] focus:outline-none focus:border-[#EA540C] transition-colors"
                      >
                        <option value="" className="bg-[#000000]">Select CIDA grade</option>
                        <option value="C1" className="bg-[#000000]">C1</option>
                        <option value="C2" className="bg-[#000000]">C2</option>
                        <option value="C3" className="bg-[#000000]">C3</option>
                        <option value="C4" className="bg-[#000000]">C4</option>
                        <option value="C5" className="bg-[#000000]">C5</option>
                        <option value="C6" className="bg-[#000000]">C6</option>
                        <option value="C7" className="bg-[#000000]">C7</option>
                      </select>
                      {errors.cidaGrade && <p className="text-red-500 text-xs mt-1">{errors.cidaGrade}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">Specialized Licenses</label>
                      <div 
                        onClick={() => document.getElementById('licenses').click()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 cursor-pointer ${
                          errors.specializedLicenses ? 'border-red-500' : 'border-[#3E3E3E] hover:border-[#EA540C]'
                        }`}
                      >
                        <input
                          id="licenses"
                          type="file"
                          className="hidden"
                          onChange={handleMultipleFileChange('specializedLicenses')}
                          accept="image/*,application/pdf"
                          multiple
                        />
                        {previews.specializedLicenses && previews.specializedLicenses.length > 0 ? (
                          <div className="relative mb-2">
                            {previews.specializedLicenses[previews.specializedLicenses.length-1].url ? (
                              <img 
                                src={previews.specializedLicenses[previews.specializedLicenses.length-1].url} 
                                alt="License Preview" 
                                className="h-32 max-w-full mx-auto rounded object-contain"
                              />
                            ) : (
                              <div className="h-32 flex items-center justify-center">
                                <FileText className="h-16 w-16 text-[#EA540C]" />
                              </div>
                            )}
                            <button 
                              onClick={() => removeFile('specializedLicenses', previews.specializedLicenses[previews.specializedLicenses.length-1].id)}
                              className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center"
                            >
                              <XIcon className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <Upload className="h-6 w-6 text-[#737373] mx-auto mb-2" />
                        )}
                        <p className="text-sm text-[#737373]">
                          {formData.specializedLicenses && formData.specializedLicenses.length > 0 ? 
                            `${formData.specializedLicenses.length} file(s) selected` : 
                            'Upload license documents (PDF, images)'
                          }
                        </p>
                        {errors.specializedLicenses && (
                          <p className="text-red-500 text-xs mt-1">{errors.specializedLicenses}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-[#737373] mb-1.5 block">ISO Certifications</label>
                      <div 
                        onClick={() => document.getElementById('certifications').click()}
                        className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 cursor-pointer ${
                          errors.isoCertifications ? 'border-red-500' : 'border-[#3E3E3E] hover:border-[#EA540C]'
                        }`}
                      >
                        <input
                          id="certifications"
                          type="file"
                          className="hidden"
                          onChange={handleMultipleFileChange('isoCertifications')}
                          accept="image/*,application/pdf"
                          multiple
                        />
                        {previews.isoCertifications && previews.isoCertifications.length > 0 ? (
                          <div className="relative mb-2">
                            {previews.isoCertifications[previews.isoCertifications.length-1].url ? (
                              <img 
                                src={previews.isoCertifications[previews.isoCertifications.length-1].url} 
                                alt="Certification Preview" 
                                className="h-32 max-w-full mx-auto rounded object-contain"
                              />
                            ) : (
                              <div className="h-32 flex items-center justify-center">
                                <FileText className="h-16 w-16 text-[#EA540C]" />
                              </div>
                            )}
                            <button 
                              onClick={() => removeFile('isoCertifications', previews.isoCertifications[previews.isoCertifications.length-1].id)}
                              className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center"
                            >
                              <XIcon className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ) : (
                          <Upload className="h-6 w-6 text-[#737373] mx-auto mb-2" />
                        )}
                        <p className="text-sm text-[#737373]">
                          {formData.isoCertifications && formData.isoCertifications.length > 0 ? 
                            `${formData.isoCertifications.length} file(s) selected` : 
                            'Upload ISO certification documents (PDF, images)'
                          }
                        </p>
                        {errors.isoCertifications && (
                          <p className="text-red-500 text-xs mt-1">{errors.isoCertifications}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-[#737373] mb-1.5 block">Company Logo</label>
                    <div 
                      onClick={() => document.getElementById('logo').click()}
                      className={`border-2 border-dashed rounded-lg p-4 text-center transition-all duration-300 cursor-pointer ${
                        errors.companyLogo ? 'border-red-500' : 'border-[#3E3E3E] hover:border-[#EA540C]'
                      }`}
                    >
                      <input
                        id="logo"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange('companyLogo')}
                        accept="image/*"
                      />
                      {previews.companyLogo ? (
                        <div className="relative mb-2">
                          <img 
                            src={previews.companyLogo} 
                            alt="Company Logo Preview" 
                            className="h-32 max-w-full mx-auto rounded object-contain"
                          />
                          <button 
                            onClick={() => removeFile('companyLogo', previews.companyLogo.id)}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center"
                          >
                            <XIcon className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <Upload className="h-6 w-6 text-[#737373] mx-auto mb-2" />
                      )}
                      <p className="text-sm text-[#737373]">
                        {formData.companyLogo ? formData.companyLogo.name : 'Upload Company Logo'}
                      </p>
                      {errors.companyLogo && (
                        <p className="text-red-500 text-xs mt-1">{errors.companyLogo}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex justify-end gap-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-6 py-2.5 border border-[#3E3E3E] text-[#737373] rounded-lg hover:bg-[#3E3E3E] hover:text-[#FFFFFF] transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={step < 3 ? handleNext : handleSubmit}
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
                      {step < 3 ? 'Continue' : 'Complete Registration'}
                      {step < 3 && <ChevronRight className="w-4 h-4" />}
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
          <button 
            onClick={() => window.location.href = '/login'}
            className="text-[#EA540C] hover:text-[#EA540C]/80 transition-colors"
          >
            Sign in
          </button>
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
              <h2 className="text-xl font-bold text-[#FFFFFF] mb-2">Registration Successful</h2>
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

export default CompanyRegister;