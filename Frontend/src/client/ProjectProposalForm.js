import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ProjectProposalForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const companyId = location.state?.companyId;
  const companyName = location.state?.companyName || "the company"; // Get company name from state
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successData, setSuccessData] = useState({
    companyName: "",
    proposalTitle: ""
  });
  
  // Log companyId for debugging
  useEffect(() => {
    console.log("Company ID from URL params:", companyId);
    console.log("Company Name:", companyName);
    if (!companyId) {
      setError("No company selected. Please select a company to submit a proposal to.");
    }
  }, [companyId, companyName]);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nic: '',
    projectTitle: '',
    projectLocation: '',
    budget: '',
    timeline: '',
    month: '',
    year: '',
    projectDescription: '',
    requirements: {
      architecturalDesign: false,
      electricalInstallations: false,
      interiorDesign: false,
      structuralEngineering: false,
      plumbingAndSanitation: false,
      landscaping: false
    }
  });
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        requirements: {
          ...formData.requirements,
          [name]: checked
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle file selection with improved validation
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate files before setting to state
    const maxSizeInBytes = 5 * 1024 * 1024; // Reduced to 5MB for better reliability
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    
    // Filter out invalid files
    const validFiles = selectedFiles.filter(file => {
      if (file.size > maxSizeInBytes) {
        console.warn(`File ${file.name} exceeds maximum size limit (5MB)`);
        return false;
      }
      if (!validTypes.includes(file.type)) {
        console.warn(`File ${file.name} has unsupported type: ${file.type}`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length < selectedFiles.length) {
      alert("Some files were not added because they are too large (>5MB) or have an unsupported format. Please use smaller files in PDF, DOC, or image formats.");
    }
    
    setFiles(validFiles);
  };
  
  // Handle form submission with improved field validation matching the database model
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate companyId is present
    if (!companyId) {
      alert("Error: No company selected. Please select a company to submit a proposal to.");
      return;
    }
    
    // Basic form validation for required fields based on your database model
    if (!formData.projectTitle) {
      alert("Project Title is required");
      return;
    }
    
    if (!formData.projectLocation) {
      alert("Project Location is required");
      return;
    }
    
    if (!formData.budget) {
      alert("Budget is required");
      return;
    }
    
    if (!formData.projectDescription) {
      alert("Project Description is required");
      return;
    }
    
    // Validate timeline is provided (either date or month/year)
    if (!formData.timeline && (!formData.month || !formData.year)) {
      alert("Please provide either a timeline date or month/year");
      return;
    }
    
    // Validate at least one requirement is selected
    const hasSelectedRequirements = Object.values(formData.requirements).some(Boolean);
    if (!hasSelectedRequirements) {
      alert("Please select at least one project requirement");
      return;
    }
    
    setLoading(true);
    
    try {
      // Create FormData object for file uploads
      const formDataObj = new FormData();
      
      // Add all form fields to FormData matching database model fields
      formDataObj.append('projectTitle', formData.projectTitle);
      formDataObj.append('projectLocation', formData.projectLocation);
      formDataObj.append('budget', formData.budget);
      
      // Handle timeline data, prioritizing the date picker value
      if (formData.timeline) {
        formDataObj.append('timeline', formData.timeline);
      }
      
      // Always include month and year if available
      if (formData.month) {
        formDataObj.append('month', formData.month);
      }
      
      if (formData.year) {
        formDataObj.append('year', formData.year);
      }
      
      // Add project description
      formDataObj.append('projectDescription', formData.projectDescription);
      
      // Add company ID - required by your model
      formDataObj.append('companyId', companyId);
      
      // Fix: Requirements need to be sent as individual fields
      // This makes it easier for the backend to process them
      formDataObj.append('requirements[architecturalDesign]', formData.requirements.architecturalDesign);
      formDataObj.append('requirements[electricalInstallations]', formData.requirements.electricalInstallations);
      formDataObj.append('requirements[interiorDesign]', formData.requirements.interiorDesign);
      formDataObj.append('requirements[structuralEngineering]', formData.requirements.structuralEngineering);
      formDataObj.append('requirements[plumbingAndSanitation]', formData.requirements.plumbingAndSanitation);
      formDataObj.append('requirements[landscaping]', formData.requirements.landscaping);
      
      // Add client information fields
      // Note: These will be available in req.body but the controller will use the authenticated user ID
      formDataObj.append('fullName', formData.fullName || '');
      formDataObj.append('email', formData.email || '');
      formDataObj.append('phone', formData.phone || '');
      formDataObj.append('nic', formData.nic || '');
      
      // Add files to FormData - limit quantity to prevent overload
      const maxFiles = 3;
      if (files.length > maxFiles) {
        alert(`You can upload a maximum of ${maxFiles} files. The first ${maxFiles} files will be used.`);
      }
      
      const filesToUpload = files.slice(0, maxFiles);
      filesToUpload.forEach((file) => {
        formDataObj.append('attachments', file);
      });
      
      // Log the data being sent
      console.log("Submitting proposal with data:", {
        projectTitle: formData.projectTitle,
        projectLocation: formData.projectLocation,
        budget: formData.budget,
        timeline: formData.timeline || `${formData.month}/${formData.year}`,
        projectDescription: formData.projectDescription.substring(0, 30) + "...", // Log a preview
        companyId,
        requirementsChecked: Object.values(formData.requirements).filter(Boolean).length,
        attachments: filesToUpload.length
      });
      
      // Log the data being sent - specifically log requirements for debugging
      console.log("Requirements being sent:", {
        architecturalDesign: formData.requirements.architecturalDesign || false,
        electricalInstallations: formData.requirements.electricalInstallations || false,
        interiorDesign: formData.requirements.interiorDesign || false,
        structuralEngineering: formData.requirements.structuralEngineering || false,
        plumbingAndSanitation: formData.requirements.plumbingAndSanitation || false,
        landscaping: formData.requirements.landscaping || false
      });
      
      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to submit a proposal');
        navigate('/login');
        return;
      }
      
      // API endpoint
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const endpointUrl = `${baseUrl}/api/proposal/submit`;
      
      // Submit proposal with FormData
      const response = await axios.post(
        endpointUrl, 
        formDataObj,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        console.log("Proposal submitted successfully:", response.data);
        
        // Show success popup
        setSuccessData({
          companyName: companyName,
          proposalTitle: formData.projectTitle
        });
        setShowSuccessPopup(true);
      } else {
        throw new Error(response.data.message || 'Failed to submit proposal');
      }
    } catch (error) {
      console.error('Error submitting proposal:', error);
      
      // Handle specific API error messages
      if (error.response?.data?.message) {
        alert(`Server error: ${error.response.data.message}`);
      } else if (error.response?.data && typeof error.response.data === 'string' && 
                error.response.data.includes('ENOENT')) {
        alert('Server error: Unable to process the uploaded files. Please try again with fewer or smaller files.');
      } else {
        alert(error.message || 'Failed to submit proposal. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle close success popup
  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    navigate('/client-dashboard');
  };
  
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden relative">
      {/* Success popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-auto shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-center text-gray-800 mb-2">Proposal Submitted!</h3>
            <p className="text-center text-gray-600 mb-6">
              Your proposal has been successfully submitted to <span className="font-semibold text-orange-500">{successData.companyName}</span>. 
              They will review your proposal and provide feedback soon.
            </p>
            <div className="text-center">
              <button
                onClick={handleCloseSuccessPopup}
                className="px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Display error message if no companyId */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
          <button 
            onClick={() => navigate('/client-dashboard')}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
          >
            Return to Dashboard
          </button>
        </div>
      )}
      
      {/* Header Banner */}
      <div className="bg-orange-500 p-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400 rounded-full opacity-30 -mt-32 -mr-32"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-400 rounded-full opacity-20 -mb-16 -ml-16"></div>
        <h1 className="text-3xl font-bold text-white mb-2 relative z-10">Project Proposal</h1>
        <p className="text-orange-50 relative z-10">
          Need an experienced and skilled hand with custom IT projects?
          Fill out the form to get a free consultation.
        </p>
      </div>
      
      <form className="p-6" onSubmit={handleSubmit}>
        {/* Progress Indicator */}
        <div className="flex justify-between mb-8">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">1</div>
            <span className="text-xs mt-1 text-gray-600">Client Info</span>
          </div>
          <div className="flex-1 flex items-center mx-2">
            <div className="h-1 w-full bg-orange-200"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">2</div>
            <span className="text-xs mt-1 text-gray-600">Project</span>
          </div>
          <div className="flex-1 flex items-center mx-2">
            <div className="h-1 w-full bg-orange-200"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">3</div>
            <span className="text-xs mt-1 text-gray-600">Details</span>
          </div>
          <div className="flex-1 flex items-center mx-2">
            <div className="h-1 w-full bg-orange-200"></div>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">4</div>
            <span className="text-xs mt-1 text-gray-600">Submit</span>
          </div>
        </div>
        
        {/* Client Information */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">1</div>
            <h2 className="text-2xl font-semibold text-gray-800">Client Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Please enter your full name" 
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-3.5 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative">
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Please enter your email" 
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-3.5 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <select className="h-full py-0 pl-3 pr-7 border-transparent bg-transparent text-gray-500 sm:text-sm rounded-l-md focus:outline-none">
                    <option>+1</option>
                    <option>+44</option>
                    <option>+91</option>
                  </select>
                </div>
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Please enter your phone number" 
                  className="w-full p-3 pl-16 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NIC</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="nic"
                  value={formData.nic}
                  onChange={handleChange}
                  placeholder="XXX XXX XXX X" 
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-3.5 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Project Information */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">2</div>
            <h2 className="text-2xl font-semibold text-gray-800">Project Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="projectTitle"
                  value={formData.projectTitle}
                  onChange={handleChange}
                  placeholder="Please enter your project title" 
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-3.5 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Location</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="projectLocation"
                  value={formData.projectLocation}
                  onChange={handleChange}
                  placeholder="Please enter your address" 
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-3.5 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
              <div className="relative">
                <input 
                  type="text" 
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  placeholder="Please enter your budget" 
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-3.5 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
              <div className="relative">
                <input 
                  type="date" 
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-3.5 text-orange-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              
              {/* Alternative: Month/Year selector if you prefer a custom approach */}
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <select 
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select Month</option>
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
                <div>
                  <select 
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select Year</option>
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Proposal Details */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">3</div>
            <h2 className="text-2xl font-semibold text-gray-800">Proposal Details</h2>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
            <div className="relative">
              <textarea 
                rows={6}
                name="projectDescription"
                value={formData.projectDescription}
                onChange={handleChange}
                placeholder="Provide a brief overview of your project. Include the purpose, scope, and any specific goals or challenges the project aims to address."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Key Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="architectural" 
                    type="checkbox"
                    name="architecturalDesign"
                    checked={formData.requirements.architecturalDesign}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="architectural" className="font-medium text-gray-700">Architectural Design</label>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="electrical" 
                    type="checkbox"
                    name="electricalInstallations"
                    checked={formData.requirements.electricalInstallations}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="electrical" className="font-medium text-gray-700">Electrical Installations</label>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="interior" 
                    type="checkbox"
                    name="interiorDesign"
                    checked={formData.requirements.interiorDesign}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="interior" className="font-medium text-gray-700">Interior Design</label>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="structural" 
                    type="checkbox"
                    name="structuralEngineering"
                    checked={formData.requirements.structuralEngineering}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="structural" className="font-medium text-gray-700">Structural Engineering</label>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="plumbing" 
                    type="checkbox"
                    name="plumbingAndSanitation"
                    checked={formData.requirements.plumbingAndSanitation}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="plumbing" className="font-medium text-gray-700">Plumbing and Sanitation</label>
                </div>
              </div>
              <div className="relative flex items-start">
                <div className="flex items-center h-5">
                  <input 
                    id="landscaping" 
                    type="checkbox"
                    name="landscaping"
                    checked={formData.requirements.landscaping}
                    onChange={handleChange}
                    className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500" 
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="landscaping" className="font-medium text-gray-700">Landscaping</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Attachments */}
        <div className="mb-10">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold mr-3">4</div>
            <h2 className="text-2xl font-semibold text-gray-800">Attachments</h2>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-300 transition-colors">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="mx-auto w-12 h-12 mb-4 bg-orange-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Drop files here or <span className="text-orange-500">browse</span></p>
              <p className="text-xs text-gray-500 mt-2">File size of your documents should not exceed 10MB</p>
            </label>
            
            {/* Display selected files with remove button */}
            {files.length > 0 && (
              <div className="mt-4 text-left">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Selected files:</h4>
                <ul className="space-y-1">
                  {files.map((file, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="w-4 h-4 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mr-2 text-xs">✓</span>
                        {file.name} ({(file.size / 1024).toFixed(0)} KB)
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setFiles(files.filter((_, i) => i !== index));
                        }}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="text-center">
          <button 
            type="submit"
            disabled={loading || error}
            className="w-full px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-[50px] transition duration-200 shadow-md hover:shadow-lg disabled:bg-orange-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Proposal'}
          </button>
          <p className="mt-4 text-xs text-gray-500">
            By submitting this form, you agree to our <a href="#" className="text-orange-500 hover:underline">Terms of Service</a> and <a href="#" className="text-orange-500 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ProjectProposalForm;