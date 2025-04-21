import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  Upload,
  Save,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  ChevronDown,
  Building,
  Trophy,
  AlertCircle,
  Bed,
  Bath,
  Phone,
  User,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Square,
  DollarSign,
  HardHat,
  Star,
  Clock, // <-- Added missing import
  Users2,
  Award,
  Building2,
} from 'lucide-react';

const PortfolioProfileSetup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // Use step index instead of tab name
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [setupComplete, setSetupComplete] = useState(false); // Add a state to track if setup is complete
  
  // Portfolio data state
  const [portfolio, setPortfolio] = useState({
    hero: {
      mainHeading: '',
      subHeading: '',
      description: '',
      backgroundImage: ''
    },
    whyChooseUs: {
      heading: 'Why Choose Us',
      subheading: 'Excellence in Construction, Committed to Quality',
      features: [],
      image: ''
    },
    projects: [],
    services: [],
    statistics: [],
    contact: {
      phone: '',
      email: '',
      address: '',
      workingHours: '',
      socialMedia: {
        facebook: '',
        linkedin: '',
        instagram: ''
      }
    }
  });
  
  // New project form state
  const [projectDetails, setProjectDetails] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    completionYear: '',
    image: '', // keep for backward compatibility
    images: [], // <-- add this
    details: [''],
    price: '',
    team: [] // <-- add this
  });

  // Add a state for new team member input
  const [newTeamMember, setNewTeamMember] = useState({
    fullName: '',
    jobRole: '',
    image: ''
  });

  // Handler for team member image upload
  const teamImageInputRef = useRef(null);
  const handleTeamImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setNewTeamMember(prev => ({
        ...prev,
        image: imageUrl
      }));
    }
  };

  // New service form state
  const [serviceDetails, setServiceDetails] = useState({
    title: '',
    description: '',
    icon: ''
  });

  // New statistic form state
  const [statDetails, setStatDetails] = useState({
    value: '',
    label: '',
    icon: '',
    type: '' // Add type field to track the predefined statistic type
  });
  
  // File upload refs
  const heroImageRef = useRef(null);
  const projectImageRef = useRef(null);
  const whyChooseUsImageRef = useRef(null);
  
  // Fetch portfolio data on component mount
  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Skip initial data fetching since the API endpoint is having issues
        // We'll start with an empty state and let the user create their portfolio
        console.log('Starting with fresh portfolio - no initial data loading');
        
        // Set loading to false to show the empty form
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('An error occurred. Please try again.');
        setLoading(false);
      }
    };
    
    fetchPortfolioData();
  }, [navigate]);
  
  // Save section data - Create instead of update if it doesn't exist
  const saveSection = async (section, data) => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Use POST instead of PUT for initial creation
      const response = await axios.post(
        `http://localhost:5001/api/portfolio/section/${section}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} section saved successfully!`);
        
        // Update local state with the saved data
        setPortfolio(prev => ({
          ...prev,
          [section]: response.data.data[section]
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        
        return true;
      }
    } catch (err) {
      console.error(`Error saving ${section}:`, err);
      setError(`Failed to save ${section}. Please try again.`);
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Save hero section
  const saveHeroSection = async () => {
    return await saveSection('hero', portfolio.hero);
  };

  // Save whyChooseUs section
  const saveWhyChooseUsSection = async () => {
    return await saveSection('whyChooseUs', portfolio.whyChooseUs);
  };
  
  // Add new project
  const addProject = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5001/api/portfolio/projects', // Updated endpoint
        projectDetails,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Project added successfully!');
        
        // Update local state with the new projects array
        setPortfolio(prev => ({
          ...prev,
          projects: response.data.data
        }));
        
        // Reset project form
        setProjectDetails({
          title: '',
          category: '',
          description: '',
          location: '',
          completionYear: '',
          image: '',
          images: [],
          details: [''],
          price: '',
          team: []
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        
        return true;
      }
    } catch (err) {
      console.error('Error adding project:', err);
      setError('Failed to add project. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Add new service
  const addService = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5001/api/portfolio/services', // Updated endpoint
        serviceDetails,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Service added successfully!');
        
        // Update local state with the new services array
        setPortfolio(prev => ({
          ...prev,
          services: response.data.data
        }));
        
        // Reset service form
        setServiceDetails({
          title: '',
          description: '',
          icon: ''
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        
        return true;
      }
    } catch (err) {
      console.error('Error adding service:', err);
      setError('Failed to add service. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Save contact information
  const saveContactInfo = async () => {
    return await saveSection('contact', portfolio.contact);
  };
  
  // Upload image
  const uploadImage = async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return null;
      }
      
      // Form data uses 'image' as the field name to match multer config
      const formData = new FormData();
      formData.append('image', file);
      
      // Use the correct endpoint for uploads based on your backend setup
      const response = await axios.post(
        'http://localhost:5001/api/utils/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log('Upload response:', response.data);
      
      // Return the URL of the uploaded image
      if (response.data.success) {
        return response.data.url;
      }
      
      return null;
    } catch (err) {
      console.error('Error uploading image:', err);
      console.error('Error details:', err.response?.data || 'No detailed error message');
      setError('Failed to upload image. Please try again.');
      return null;
    }
  };
  
  // Handle hero image upload
  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setPortfolio(prev => ({
        ...prev,
        hero: {
          ...prev.hero,
          backgroundImage: imageUrl
        }
      }));
    }
  };

  // Handle whyChooseUs image upload
  const handleWhyChooseUsImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setPortfolio(prev => ({
        ...prev,
        whyChooseUs: {
          ...prev.whyChooseUs,
          image: imageUrl
        }
      }));
    }
  };
  
  // Handle project image upload
  const handleProjectImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10); // max 10 images
    if (!files.length) return;
  
    const uploadedImages = [];
    for (const file of files) {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        uploadedImages.push(imageUrl);
      }
    }
    setProjectDetails(prev => ({
      ...prev,
      images: [...(prev.images || []), ...uploadedImages].slice(0, 10)
    }));
  };
  
  // Delete project
  // eslint-disable-next-line no-unused-vars
  const deleteProject = async (projectId) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.delete(
        `http://localhost:5001/api/portfolio/projects/${projectId}`, // Updated endpoint
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Project deleted successfully!');
        
        // Update local state to remove the deleted project
        setPortfolio(prev => ({
          ...prev,
          projects: prev.projects.filter(project => project._id !== projectId)
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete service
  const deleteService = async (serviceId) => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.delete(
        `http://localhost:5001/api/portfolio/services/${serviceId}`, // Updated endpoint
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Service deleted successfully!');
        
        // Update local state to remove the deleted service
        setPortfolio(prev => ({
          ...prev,
          services: prev.services.filter(service => service._id !== serviceId)
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error deleting service:', err);
      setError('Failed to delete service. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  // Add new statistic
  const addStat = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.post(
        'http://localhost:5001/api/portfolio/statistics', // Updated endpoint
        statDetails,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Statistic added successfully!');
        
        // Update local state with the new statistics array
        setPortfolio(prev => ({
          ...prev,
          statistics: response.data.data
        }));
        
        // Reset statistic form
        setStatDetails({
          value: '',
          label: '',
          icon: '',
          type: ''
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        
        return true;
      }
    } catch (err) {
      console.error('Error adding statistic:', err);
      setError('Failed to add statistic. Please try again.');
      return false;
    } finally {
      setSaving(false);
    }
  };
  
  // Delete statistic
  const deleteStat = async (statId) => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await axios.delete(
        `http://localhost:5001/api/portfolio/statistics/${statId}`, // Updated endpoint
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccessMessage('Statistic deleted successfully!');
        
        // Update local state to remove the deleted statistic
        setPortfolio(prev => ({
          ...prev,
          statistics: prev.statistics.filter(stat => stat._id !== statId)
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error deleting statistic:', err);
      setError('Failed to delete statistic. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Input and Textarea without React.memo or useCallback, just plain functional components
  const Input = ({ type = 'text', placeholder, value, onChange, className = '', ...props }) => (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all ${className}`}
      {...props}
    />
  );

  const Textarea = ({ placeholder, value, onChange, className = '', ...props }) => (
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all min-h-[100px] ${className}`}
      {...props}
    />
  );

  // Common button component
  const Button = ({ children, variant = 'primary', className = '', onClick, type = 'button' }) => {
    const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2';
    const variants = {
      primary: 'bg-orange-500 hover:bg-orange-600 text-white',
      outline: 'border border-gray-300 text-gray-600 hover:bg-gray-50',
      ghost: 'text-gray-400 hover:text-gray-600'
    };

    return (
      <button
        type={type}
        onClick={onClick}
        className={`${baseStyles} ${variants[variant]} ${className}`}
      >
        {children}
      </button>
    );
  };

  // Common select component
  const Select = ({ placeholder, options, value, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer bg-white flex items-center justify-between ${className}`}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </div>
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="px-4 py-2 cursor-pointer hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Card component
  const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {children}
    </div>
  );

  // Wizard steps configuration
  const steps = [
    { id: 'hero', label: 'Hero Section', description: 'Set up your main landing section' },
    { id: 'whyChooseUs', label: 'Why Choose Us', description: 'Highlight your company strengths' },
    { id: 'projects', label: 'Projects', description: 'Add your construction projects' },
    { id: 'services', label: 'Services', description: 'Add your construction services' },
    { id: 'stats', label: 'Statistics', description: 'Add company statistics' },
    { id: 'contact', label: 'Contact', description: 'Add contact information' }
  ];

  // Move these variable definitions outside of the return statement
  // so they're accessible to all functions including getStepContent
  const categoryOptions = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'industrial', label: 'Industrial' }
  ];

  const iconOptions = [
    { value: 'building', label: 'Building' },
    { value: 'home', label: 'Home' },
    { value: 'truck', label: 'Truck' },
    { value: 'ruler', label: 'Ruler' }
  ];

  // Create predefined statistic types
  const statisticOptions = [
    { id: 'experience', label: 'Years Experience', icon: 'Trophy', description: 'Number of years in business' },
    { id: 'projects', label: 'Projects Completed', icon: 'Building2', description: 'Total number of successful projects' },
    { id: 'team', label: 'Team Members', icon: 'Users2', description: 'Size of your professional team' },
    { id: 'satisfaction', label: 'Client Satisfaction', icon: 'Award', description: 'Client satisfaction rate' }
  ];

  // Navigation functions
  const goToNextStep = async () => {
    // Save current step's data before proceeding (optional)
    let saved = true;
    
    if (currentStep === 0) {
      saved = await saveHeroSection();
    } else if (currentStep === 1) {
      saved = await saveWhyChooseUsSection();
    } else if (currentStep === 5) {
      saved = await saveContactInfo();
    }
    
    // Only proceed if save was successful or no save was needed
    if (saved && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0); // Scroll to top on step change
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0); // Scroll to top on step change
    }
  };
  
  const completeSetup = async () => {
    // Final save action
    const saved = await saveContactInfo();
    if (saved) {
      setSuccessMessage('Portfolio setup completed successfully!');
      setSetupComplete(true); // Mark setup as complete
      // Redirect to the portfolio profile view page
      setTimeout(() => {
        navigate('/portfolio-profile'); // Update to match the route in App.js
      }, 1000);
    }
  };
  
  // FIXED: Create stable callbacks for form fields to prevent focus loss
  const handleMainHeadingChange = useCallback((value) => {
    setPortfolio(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        mainHeading: value
      }
    }));
  }, []);

  const handleSubHeadingChange = useCallback((value) => {
    setPortfolio(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        subHeading: value
      }
    }));
  }, []);

  const handleDescriptionChange = useCallback((value) => {
    setPortfolio(prev => ({
      ...prev,
      hero: {
        ...prev.hero,
        description: value
      }
    }));
  }, []);

  // Add state for new feature input
  const [newFeature, setNewFeature] = useState({
    icon: '',
    title: '',
    desc: ''
  });

  // The active content based on current step
  const getStepContent = (stepIndex) => {
    switch (stepIndex) {
      case 0: // Hero Section
        return (
          <Card>
            <div className="mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {steps[currentStep].label}
                </h2>
                <p className="text-sm text-gray-600">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Main Heading
                    </label>
                    <Input 
                      placeholder="Enter main heading" 
                      value={portfolio.hero.mainHeading}
                      onChange={handleMainHeadingChange}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Subheading
                    </label>
                    <Input 
                      placeholder="Enter subheading"
                      value={portfolio.hero.subHeading}
                      onChange={handleSubHeadingChange}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Description
                    </label>
                    <Textarea 
                      placeholder="Enter hero section description"
                      value={portfolio.hero.description}
                      onChange={handleDescriptionChange}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Background Image
                  </label>
                  <div 
                    onClick={() => heroImageRef.current.click()} 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer"
                  >
                    {portfolio.hero.backgroundImage ? (
                      <div className="relative">
                        <img 
                          src={portfolio.hero.backgroundImage} 
                          alt="Hero background" 
                          className="w-full h-40 object-cover rounded-lg" 
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                          <p className="text-white">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                          <Upload className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="text-orange-500 font-medium">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or WEBP (max. 5MB)
                        </p>
                      </div>
                    )}
                    <input 
                      ref={heroImageRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={currentStep === 0 || saving}
              >
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={goToNextStep}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save & Continue'}
                </Button>
              ) : (
                <Button 
                  onClick={completeSetup}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Finish'}
                </Button>
              )}
            </div>
          </Card>
        );
      case 1: // Why Choose Us Section
        return (
          <Card>
            <div className="mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {steps[currentStep].label}
                </h2>
                <p className="text-sm text-gray-600">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Section Heading
                    </label>
                    <Input 
                      placeholder="Enter section heading" 
                      value={portfolio.whyChooseUs.heading}
                      onChange={(value) => setPortfolio(prev => ({
                        ...prev,
                        whyChooseUs: {
                          ...prev.whyChooseUs,
                          heading: value
                        }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">
                      Section Subheading
                    </label>
                    <Input 
                      placeholder="Enter section subheading"
                      value={portfolio.whyChooseUs.subheading}
                      onChange={(value) => setPortfolio(prev => ({
                        ...prev,
                        whyChooseUs: {
                          ...prev.whyChooseUs,
                          subheading: value
                        }
                      }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2 mt-4">
                      Features & Benefits
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-3 gap-2">
                        <Select
                          placeholder="Select icon"
                          options={[
                            { value: 'HardHat', label: 'Hard Hat' },
                            { value: 'CheckCircle2', label: 'Check Circle' },
                            { value: 'Clock', label: 'Clock' },
                            { value: 'Trophy', label: 'Trophy' },
                            { value: 'Star', label: 'Star' }
                          ]}
                          value={newFeature.icon}
                          onChange={(value) => setNewFeature(prev => ({...prev, icon: value}))}
                        />
                        <Input 
                          placeholder="Title" 
                          value={newFeature.title}
                          onChange={(value) => setNewFeature(prev => ({...prev, title: value}))}
                        />
                        <Input 
                          placeholder="Description" 
                          value={newFeature.desc}
                          onChange={(value) => setNewFeature(prev => ({...prev, desc: value}))}
                        />
                      </div>
                      <Button
                        onClick={() => {
                          if (newFeature.icon && newFeature.title && newFeature.desc) {
                            setPortfolio(prev => ({
                              ...prev,
                              whyChooseUs: {
                                ...prev.whyChooseUs,
                                features: [...prev.whyChooseUs.features, newFeature]
                              }
                            }));
                            setNewFeature({ icon: '', title: '', desc: '' });
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" /> Add Feature
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Section Image
                  </label>
                  <div 
                    onClick={() => whyChooseUsImageRef.current.click()} 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer"
                  >
                    {portfolio.whyChooseUs.image ? (
                      <div className="relative">
                        <img 
                          src={portfolio.whyChooseUs.image} 
                          alt="Why Choose Us" 
                          className="w-full h-40 object-cover rounded-lg" 
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                          <p className="text-white">Click to change</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                          <Upload className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="text-orange-500 font-medium">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or WEBP (max. 5MB)
                        </p>
                      </div>
                    )}
                    <input 
                      ref={whyChooseUsImageRef}
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleWhyChooseUsImageUpload}
                    />
                  </div>
                </div>
              </div>
              
              {/* Show current features */}
              {portfolio.whyChooseUs.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-4">Current Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolio.whyChooseUs.features.map((feature, index) => {
                      let Icon;
                      switch(feature.icon) {
                        case 'HardHat': Icon = HardHat; break;
                        case 'CheckCircle2': Icon = CheckCircle2; break;
                        case 'Clock': Icon = Clock; break;
                        case 'Trophy': Icon = Trophy; break;
                        default: Icon = Star;
                      }
                      
                      return (
                        <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                          <div className="bg-orange-100 p-3 rounded-xl">
                            <Icon className="w-6 h-6 text-orange-500" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
                            <p className="text-gray-600 text-sm">{feature.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPortfolio(prev => ({
                                ...prev,
                                whyChooseUs: {
                                  ...prev.whyChooseUs,
                                  features: prev.whyChooseUs.features.filter((_, i) => i !== index)
                                }
                              }));
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={currentStep === 0 || saving}
              >
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={goToNextStep}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save & Continue'}
                </Button>
              ) : (
                <Button 
                  onClick={completeSetup}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Finish'}
                </Button>
              )}
            </div>
          </Card>
        );
      case 2: // Projects
        return (
          <Card>
            <div className="mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {steps[currentStep].label}
                </h2>
                <p className="text-sm text-gray-600">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const result = await addProject();
              if (result) {
                // Move to next step if project was added successfully
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                  window.scrollTo(0, 0);
                }
              }
            }} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Project Title</label>
                  <Input 
                    placeholder="e.g., Modern Two-Story Luxury Residence" 
                    value={projectDetails.title}
                    onChange={(value) => setProjectDetails({
                      ...projectDetails,
                      title: value
                    })}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
                  <Textarea 
                    placeholder="Describe the project..." 
                    value={projectDetails.description}
                    onChange={(value) => setProjectDetails({
                      ...projectDetails,
                      description: value
                    })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input 
                        placeholder="City, Country" 
                        value={projectDetails.location}
                        onChange={(value) => setProjectDetails({
                          ...projectDetails,
                          location: value
                        })}
                        className="pl-12"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Year</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input 
                        type="number"
                        placeholder="Completion Year" 
                        value={projectDetails.completionYear}
                        onChange={(value) => setProjectDetails({
                          ...projectDetails,
                          completionYear: value
                        })}
                        className="pl-12"
                        min="1900"
                        max="2100"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Specifications */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Project Specifications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Area (sq ft)</label>
                    <div className="relative">
                      <Square className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input 
                        type="number"
                        placeholder="2500" 
                        value={projectDetails.area}
                        onChange={(value) => setProjectDetails({
                          ...projectDetails,
                          area: value
                        })}
                        className="pl-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Duration (months)</label>
                    <Input 
                      type="number"
                      placeholder="8" 
                      value={projectDetails.duration}
                      onChange={(value) => setProjectDetails({
                        ...projectDetails,
                        duration: value
                      })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Bedrooms</label>
                    <div className="relative">
                      <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input 
                        type="number"
                        placeholder="5" 
                        value={projectDetails.bedrooms}
                        onChange={(value) => setProjectDetails({
                          ...projectDetails,
                          bedrooms: value
                        })}
                        className="pl-12"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Bathrooms</label>
                    <div className="relative">
                      <Bath className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input 
                        type="number"
                        placeholder="4.5" 
                        value={projectDetails.bathrooms}
                        onChange={(value) => setProjectDetails({
                          ...projectDetails,
                          bathrooms: value
                        })}
                        className="pl-12"
                        step="0.5"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Investment (LKR)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                      type="number"
                      placeholder="125000000" 
                      value={projectDetails.price}
                      onChange={(value) => setProjectDetails({
                        ...projectDetails,
                        price: value
                      })}
                      className="pl-12"
                    />
                  </div>
                </div>
              </div>

              {/* Project Details/Features */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Key Features</h2>
                
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Add a feature..." 
                      value={projectDetails.details.length > 0 && projectDetails.details[projectDetails.details.length - 1] === '' 
                        ? projectDetails.details[projectDetails.details.length - 1] 
                        : ''}
                      onChange={(value) => {
                        const newDetails = [...projectDetails.details];
                        if (newDetails.length > 0 && newDetails[newDetails.length - 1] === '') {
                          newDetails[newDetails.length - 1] = value;
                        } else {
                          newDetails.push(value);
                        }
                        setProjectDetails({...projectDetails, details: newDetails});
                      }}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        const lastDetail = projectDetails.details[projectDetails.details.length - 1];
                        if (lastDetail && lastDetail.trim() !== '') {
                          setProjectDetails({
                            ...projectDetails,
                            details: [...projectDetails.details, '']
                          });
                        }
                      }}
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {projectDetails.details.filter((detail, index) => detail.trim() !== '' || index === projectDetails.details.length - 1).map((detail, index) => (
                      detail.trim() !== '' && index !== projectDetails.details.length - 1 && (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <span>{detail}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newDetails = projectDetails.details.filter((_, i) => i !== index);
                              setProjectDetails({...projectDetails, details: newDetails});
                            }}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>

              {/* Team Section */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Project Team</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Full Name</label>
                    <Input
                      placeholder="Full Name"
                      value={newTeamMember.fullName}
                      onChange={value => setNewTeamMember(prev => ({ ...prev, fullName: value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Job Role</label>
                    <Input
                      placeholder="Job Role"
                      value={newTeamMember.jobRole}
                      onChange={value => setNewTeamMember(prev => ({ ...prev, jobRole: value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Image</label>
                    <div
                      className="flex items-center gap-2"
                      onClick={() => teamImageInputRef.current.click()}
                      style={{ cursor: 'pointer' }}
                    >
                      {newTeamMember.image ? (
                        <img src={newTeamMember.image} alt="Team" className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                          <Upload className="w-5 h-5 text-orange-500" />
                        </div>
                      )}
                      <span className="text-sm text-orange-500 underline">Upload</span>
                      <input
                        ref={teamImageInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleTeamImageUpload}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <Button
                    onClick={() => {
                      if (newTeamMember.fullName && newTeamMember.jobRole && newTeamMember.image) {
                        setProjectDetails(prev => ({
                          ...prev,
                          team: [...(prev.team || []), newTeamMember]
                        }));
                        setNewTeamMember({ fullName: '', jobRole: '', image: '' });
                      }
                    }}
                    type="button"
                  >
                    <Plus className="w-4 h-4" /> Add Team Member
                  </Button>
                </div>
                {/* List of added team members */}
                {projectDetails.team && projectDetails.team.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {projectDetails.team.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-4 bg-gray-50 rounded-lg p-3">
                        <img src={member.image} alt={member.fullName} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1">
                          <div className="font-medium">{member.fullName}</div>
                          <div className="text-sm text-gray-500">{member.jobRole}</div>
                        </div>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => {
                            setProjectDetails(prev => ({
                              ...prev,
                              team: prev.team.filter((_, i) => i !== idx)
                            }));
                          }}
                          title="Remove"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Project Image Upload */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Project Images</h2>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Project Images (up to 10)
                  </label>
                  <div
                    onClick={() => projectImageRef.current.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer"
                  >
                    {projectDetails.images && projectDetails.images.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {projectDetails.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={img}
                              alt={`Project ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-black bg-opacity-60 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition"
                              onClick={e => {
                                e.stopPropagation();
                                setProjectDetails(prev => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== idx)
                                }));
                              }}
                              title="Remove"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="mx-auto w-14 h-14 bg-orange-50 rounded-xl flex items-center justify-center">
                          <Upload className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="text-orange-500 font-medium">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG or WEBP (max. 5MB each, up to 10 images)
                        </p>
                      </div>
                    )}
                    <input
                      ref={projectImageRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      multiple
                      onChange={handleProjectImageUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Current projects section if needed */}
              {portfolio.projects.length > 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900">Current Projects</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolio.projects.map((project) => (
                      <div key={project._id} className="bg-white rounded-lg border border-gray-200 p-4 relative">
                        <button
                          type="button"
                          onClick={() => deleteProject(project._id)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col">
                          <h3 className="font-medium text-gray-900">{project.title}</h3>
                          <p className="text-sm text-gray-500">{project.location}</p>
                          <p className="text-sm text-orange-600 mt-1">{project.category}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation buttons - already included in original */}
              <div className="flex justify-between mt-8">
                <Button 
                  variant="outline" 
                  onClick={goToPreviousStep}
                  disabled={currentStep === 0 || saving}
                  type="button"
                >
                  Previous
                </Button>
                
                {currentStep < steps.length - 1 ? (
                  <Button 
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save & Continue'}
                  </Button>
                ) : (
                  <Button 
                    onClick={completeSetup}
                    disabled={saving}
                    type="button"
                  >
                    {saving ? 'Saving...' : 'Finish'}
                  </Button>
                )}
              </div>
            </form>
          </Card>
        );
      case 3: // Services
        return (
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {steps[currentStep].label}
              </h2>
              <p className="text-sm text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>
            <div className="flex items-center justify-between mb-6">
              <Button onClick={addService}>
                <Plus className="w-4 h-4" />
                Add New Service
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Service Title
                  </label>
                  <Input 
                    placeholder="Enter service title"
                    value={serviceDetails.title}
                    onChange={(value) => setServiceDetails({
                      ...serviceDetails,
                      title: value
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Description
                  </label>
                  <Textarea 
                    placeholder="Enter service description"
                    value={serviceDetails.description}
                    onChange={(value) => setServiceDetails({
                      ...serviceDetails,
                      description: value
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Icon
                  </label>
                  <Select
                    placeholder="Select icon"
                    options={iconOptions}
                    value={serviceDetails.icon}
                    onChange={(value) => setServiceDetails({ ...serviceDetails, icon: value })}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Current Services</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {portfolio.services.map((service) => (
                      <div key={service._id} className="flex items-start gap-4 p-4 rounded-lg bg-white border border-gray-200">
                        <div className="bg-orange-50 p-3 rounded-lg">
                          <Building className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{service.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {service.description}
                          </p>
                        </div>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg"
                          onClick={() => deleteService(service._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={currentStep === 0 || saving}
              >
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={goToNextStep}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save & Continue'}
                </Button>
              ) : (
                <Button 
                  onClick={completeSetup}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Finish'}
                </Button>
              )}
            </div>
          </Card>
        );
      case 4: // Statistics
        return (
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {steps[currentStep].label}
              </h2>
              <p className="text-sm text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Statistic Type
                  </label>
                  <Select
                    placeholder="Select statistic type"
                    options={statisticOptions.map(opt => ({ value: opt.id, label: opt.label }))}
                    value={statDetails.type}
                    onChange={(value) => {
                      const selectedStat = statisticOptions.find(stat => stat.id === value);
                      setStatDetails({
                        ...statDetails,
                        type: value,
                        label: selectedStat.label,
                        icon: selectedStat.icon
                      });
                    }}
                  />
                  {statDetails.type && (
                    <p className="text-xs text-gray-500 mt-1">
                      {statisticOptions.find(s => s.id === statDetails.type)?.description}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Value
                  </label>
                  <Input 
                    placeholder="e.g., 25+, 1000+, 100%"
                    value={statDetails.value}
                    onChange={(value) => setStatDetails({
                      ...statDetails,
                      value: value
                    })}
                  />
                </div>
                
                <Button
                  onClick={addStat}
                  disabled={!statDetails.type || !statDetails.value}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4" /> Add Statistic
                </Button>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-medium text-gray-900 mb-4">Recommended Statistics</h3>
                <div className="space-y-3">
                  {statisticOptions.map(opt => {
                    const exists = portfolio.statistics.some(s => s.label === opt.label);
                    return (
                      <div key={opt.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className={`bg-orange-50 p-2 rounded-lg ${exists ? 'opacity-50' : ''}`}>
                            {opt.icon === 'Trophy' && <Trophy className="w-5 h-5 text-orange-500" />}
                            {opt.icon === 'Building2' && <Building2 className="w-5 h-5 text-orange-500" />}
                            {opt.icon === 'Users2' && <Users2 className="w-5 h-5 text-orange-500" />}
                            {opt.icon === 'Award' && <Award className="w-5 h-5 text-orange-500" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{opt.label}</div>
                            <div className="text-xs text-gray-500">{opt.description}</div>
                          </div>
                        </div>
                        {exists ? (
                          <span className="text-xs text-green-600 px-2 py-1 bg-green-50 rounded-full">Added</span>
                        ) : (
                          <Button
                            variant="outline"
                            className="text-xs py-1"
                            onClick={() => {
                              setStatDetails({
                                type: opt.id,
                                label: opt.label,
                                icon: opt.icon,
                                value: ''
                              });
                            }}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Current statistics display */}
            {portfolio.statistics.length > 0 && (
              <div className="mt-8">
                <h3 className="font-medium text-gray-900 mb-4">Current Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {portfolio.statistics.map((stat) => {
                    let IconComponent = Trophy;
                    if (stat.icon === 'Building2') IconComponent = Building2;
                    if (stat.icon === 'Users2') IconComponent = Users2;
                    if (stat.icon === 'Award') IconComponent = Award;

                    return (
                      <div key={stat._id} className="bg-white border border-gray-200 rounded-xl p-5 relative">
                        <button 
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                          onClick={() => deleteStat(stat._id)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="flex flex-col items-center text-center">
                          <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center mb-3">
                            <IconComponent className="w-6 h-6 text-orange-500" />
                          </div>
                          <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                          <div className="text-sm text-gray-600">{stat.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={currentStep === 0 || saving}
              >
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  onClick={goToNextStep}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save & Continue'}
                </Button>
              ) : (
                <Button 
                  onClick={completeSetup}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Finish'}
                </Button>
              )}
            </div>
          </Card>
        );
      case 5: // Contact
        return (
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {steps[currentStep].label}
              </h2>
              <p className="text-sm text-gray-600">
                {steps[currentStep].description}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Phone Number
                  </label>
                  <Input 
                    type="tel" 
                    placeholder="Enter phone number"
                    value={portfolio.contact.phone}
                    onChange={(value) => setPortfolio({
                      ...portfolio,
                      contact: {
                        ...portfolio.contact,
                        phone: value
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Email Address
                  </label>
                  <Input 
                    type="email" 
                    placeholder="Enter email address"
                    value={portfolio.contact.email}
                    onChange={(value) => setPortfolio({
                      ...portfolio,
                      contact: {
                        ...portfolio.contact,
                        email: value
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Office Address
                  </label>
                  <Textarea 
                    placeholder="Enter office address"
                    value={portfolio.contact.address}
                    onChange={(value) => setPortfolio({
                      ...portfolio,
                      contact: {
                        ...portfolio.contact,
                        address: value
                      }
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Working Hours
                  </label>
                  <Input 
                    placeholder="e.g., Mon-Fri: 9:00 AM - 6:00 PM"
                    value={portfolio.contact.workingHours}
                    onChange={(value) => setPortfolio({
                      ...portfolio,
                      contact: {
                        ...portfolio.contact,
                        workingHours: value
                      }
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Social Media Links
                  </label>
                  <div className="space-y-2">
                    <Input 
                      type="url" 
                      placeholder="Facebook URL"
                      value={portfolio.contact.socialMedia.facebook}
                      onChange={(value) => setPortfolio({
                        ...portfolio,
                        contact: {
                          ...portfolio.contact,
                          socialMedia: {
                            ...portfolio.contact.socialMedia,
                            facebook: value
                          }
                        }
                      })}
                    />
                    <Input 
                      type="url" 
                      placeholder="LinkedIn URL"
                      value={portfolio.contact.socialMedia.linkedin}
                      onChange={(value) => setPortfolio({
                        ...portfolio,
                        contact: {
                          ...portfolio.contact,
                          socialMedia: {
                            ...portfolio.contact.socialMedia,
                            linkedin: value
                          }
                        }
                      })}
                    />
                    <Input 
                      type="url" 
                      placeholder="Instagram URL"
                      value={portfolio.contact.socialMedia.instagram}
                      onChange={(value) => setPortfolio({
                        ...portfolio,
                        contact: {
                          ...portfolio.contact,
                          socialMedia: {
                            ...portfolio.contact.socialMedia,
                            instagram: value
                          }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={goToPreviousStep}
                disabled={currentStep === 0 || saving}
              >
                Previous
              </Button>
              <Button 
                onClick={completeSetup}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Finish'}
              </Button>
            </div>
          </Card>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  // If setup is complete, render nothing (or a loader) because we are redirecting
  if (setupComplete) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 font-jakarta">
      {/* Main content */}
      <div className="flex-1 transition-all duration-300 overflow-auto ml-0">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Construction Portfolio Management</h1>
              <p className="text-gray-600 mt-2">Complete the following steps to set up your portfolio</p>
            </div>
            
            {/* Success message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                {successMessage}
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Step progress bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    {/* Step indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                          currentStep >= index
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div className="text-xs mt-2 font-medium text-gray-500">
                        {step.label}
                      </div>
                    </div>
                    
                    {/* Connector line between steps */}
                    {index < steps.length - 1 && (
                      <div 
                        className={`flex-1 h-0.5 mx-2 ${
                          currentStep > index ? 'bg-orange-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Loading state */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Current step content */}
                {getStepContent(currentStep)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioProfileSetup;
