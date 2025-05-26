import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Phone,Mail,MapPin,Building2,Hammer,Users,Clock,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Trophy,
  HardHat,
  Ruler,
  Truck,
  Factory,
  Home,
  Building,
  Warehouse,
  Star,
  Edit3,
  Save,
  Plus,
  X,
  Image,
  AlignLeft
} from 'lucide-react';
import CompanySidebar from './CompanySideBar'; // <-- Import the sidebar

const ConstructionPortfolioProfile = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  
  // All state declarations first
  const [isEditing, setIsEditing] = useState(false);
  const [editedPortfolio, setEditedPortfolio] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSection, setUploadSection] = useState('');
  const [showImageUploadPopup, setShowImageUploadPopup] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { companyId } = useParams();
  
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        
        // Get token for authorized requests if user is logged in
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // If companyId is provided, fetch that company's portfolio
        // Otherwise, fetch the current logged-in company's portfolio
        const endpoint = companyId 
          ? `http://localhost:5001/api/portfolio/public/${companyId}`
          : 'http://localhost:5001/api/portfolio'; // Endpoint for current company
        
        const response = await axios.get(endpoint, { headers });
        
        if (response.data.success) {
          console.log('Successfully loaded portfolio data:', response.data.data);
          setPortfolio(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolio();
  }, [companyId]);

  // Use portfolio data if available, no default fallback
  const projects = portfolio?.projects || [];

  const services = portfolio?.services || [];

  // Helper to map icon string to Lucide icon component - expand to include all possible icons
  const iconMap = {
    HardHat,
    CheckCircle2,
    Clock,
    Trophy,
    Star,
    Users,
    Building2,
    Building,
    Home,
    Factory,
    Ruler,
    Truck,
    Warehouse,
    Hammer,
    MapPin,
    Mail,
    Phone,
    ExternalLink,
    // Add common icon names with variations
    "hardhat": HardHat,
    "check": CheckCircle2,
    "checkmark": CheckCircle2,
    "clock": Clock,
    "time": Clock,
    "trophy": Trophy,
    "award": Trophy,
    "star": Star,
    "users": Users,
    "team": Users,
    "people": Users,
    "building": Building,
    "building2": Building2,
    "home": Home,
    "house": Home,
    "factory": Factory,
    "ruler": Ruler,
    "truck": Truck,
    "warehouse": Warehouse,
    "hammer": Hammer,
    "location": MapPin,
    "map": MapPin,
    "mail": Mail,
    "email": Mail,
    "phone": Phone,
    "call": Phone,
    "external": ExternalLink,
    "link": ExternalLink
  };

  // For the stats section - consolidate all stats logic into a single useMemo
  const { stats, clientSatisfactionValue } = useMemo(() => {
    let statsArray = [];
    let satisfactionValue = "";
    
    if (portfolio?.statistics?.length) {
      // Map backend statistics to our format with proper icons
      statsArray = portfolio.statistics.map(stat => {
        // Find the appropriate icon or fall back to a default
        let IconComponent = Star; // default fallback icon
        
        if (stat.icon) {
          // Try to get the icon from our mapping (case insensitive)
          const lookupIcon = stat.icon.toLowerCase();
          IconComponent = iconMap[lookupIcon] || iconMap[lookupIcon.replace(/\s+/g, '')] || Star;
        } else {
          // Try to guess icon based on label
          const label = stat.label.toLowerCase();
          if (label.includes('experience') || label.includes('year')) IconComponent = Trophy;
          else if (label.includes('project') || label.includes('completed')) IconComponent = Building2;
          else if (label.includes('team') || label.includes('employee')) IconComponent = Users;
          else if (label.includes('satisfaction') || label.includes('client')) IconComponent = CheckCircle2;
        }
        
        return {
          icon: IconComponent,
          value: stat.value,
          label: stat.label
        };
      });
    } else {
      // Empty stats array if none from backend
      statsArray = [];
    }
    
    // Handle client satisfaction logic inside the useMemo
    const clientSatisfactionStat = portfolio?.statistics?.find(
      stat => stat.label.toLowerCase().includes('satisfaction') || 
             stat.label.toLowerCase().includes('client')
    );

    // Update the client satisfaction value if found
    if (clientSatisfactionStat) {
      const satisfactionIndex = statsArray.findIndex(s => s.label === "Client Satisfaction");
      if (satisfactionIndex >= 0) {
        statsArray[satisfactionIndex].value = clientSatisfactionStat.value;
      }
      satisfactionValue = clientSatisfactionStat.value;
    }
    
    return { 
      stats: statsArray,
      clientSatisfactionValue: satisfactionValue
    };
  }, [portfolio, iconMap]);

  // Handle services icons properly
  const processedServices = useMemo(() => {
    if (portfolio?.services?.length) {
      // Map backend services to include proper icon components
      return portfolio.services.map(service => {
        let IconComponent = Building; // Default icon
        
        // If the service has an icon property as a string
        if (typeof service.icon === 'string') {
          // Try to find the matching icon in our icon map
          const lookupIcon = service.icon.toLowerCase();
          IconComponent = iconMap[lookupIcon] || iconMap[lookupIcon.replace(/\s+/g, '')] || Building;
        } else if (service.icon) {
          // If icon is already a component (from hardcoded data)
          IconComponent = service.icon;
        } else {
          // Try to guess based on service title
          const title = service.title.toLowerCase();
          if (title.includes('residential') || title.includes('home')) IconComponent = Home;
          else if (title.includes('commercial') || title.includes('office')) IconComponent = Building;
          else if (title.includes('industrial') || title.includes('factory')) IconComponent = Factory;
          else if (title.includes('infrastructure') || title.includes('road')) IconComponent = Ruler;
        }
        
        return {
          ...service,
          icon: IconComponent
        };
      });
    }
    
    // Return empty array instead of default services
    return [];
  }, [portfolio, iconMap]);

  // Important: Move this useMemo here, before the loading check
  const displayedProjects = useMemo(() => {
    if (!projects) {
      return [];
    }
    return showAllProjects ? projects : projects.slice(0, 3);
  }, [projects, showAllProjects]);

  // Function to navigate to project details
  const navigateToProjectDetails = (project) => {
    if (project._id) {
      // If project has ID, use URL parameter
      navigate(`/project-details/${project._id}`);
    } else {
      // Fallback to state-based navigation
      navigate('/project-details', { state: { project } });
    }
  };

  // Initialize edited portfolio data when portfolio data is loaded
  useEffect(() => {
    if (portfolio) {
      setEditedPortfolio(JSON.parse(JSON.stringify(portfolio)));
    }
  }, [portfolio]);
  
  // Handle editing toggle - Modified to immediately open the edit form
  const toggleEditing = () => {
    if (isEditing) {
      // If canceling edit, reset to original data
      setEditedPortfolio(JSON.parse(JSON.stringify(portfolio)));
      setShowEditForm(false);
      setActiveEditSection('');
    } else {
      // When starting edit mode, immediately open the form
      setShowEditForm(true);
      setActiveEditSection('hero'); // Default to hero section
    }
    setIsEditing(!isEditing);
    setSaveSuccess(false);
    setSaveError(null);
  };
  
  // Handle input changes for various sections
  const handleInputChange = (section, field, value) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      if (!updated[section]) {
        updated[section] = {};
      }
      
      updated[section][field] = value;
      return updated;
    });
  };
  
  // Save changes to the backend
  const saveChanges = async () => {
    if (!editedPortfolio) return;
    
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveError('Authentication required. Please login.');
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post(
        'http://localhost:5001/api/portfolio',
        editedPortfolio,
        { headers }
      );
      
      if (response.data.success) {
        // Update local state with saved data
        setPortfolio(editedPortfolio);
        setSaveSuccess(true);
        setIsEditing(false);
      } else {
        setSaveError(response.data.message || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving portfolio:', err);
      setSaveError(err.response?.data?.message || 'Error saving changes');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Only show edit button if user is logged in and viewing their own portfolio
  const canEdit = !companyId && localStorage.getItem('token');

  // Add image upload functionality

  // General upload image function
  const uploadImage = async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveError('Authentication required. Please login.');
        return null;
      }
      
      setUploadingImage(true);
      
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
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );
      
      console.log('Upload response:', response.data);
      
      // Return the URL of the uploaded image
      if (response.data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        return response.data.url;
      }
      
      return null;
    } catch (err) {
      console.error('Error uploading image:', err);
      console.error('Error details:', err.response?.data || 'No detailed error message');
      setSaveError('Failed to upload image. Please try again.');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };
  
  // Handle hero image upload
  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadSection('hero.backgroundImage');
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setEditedPortfolio(prev => ({
        ...prev,
        hero: {
          ...(prev.hero || {}),
          backgroundImage: imageUrl
        }
      }));
    }
  };

  // Handle whyChooseUs image upload
  const handleWhyChooseUsImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadSection('whyChooseUs.image');
    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setEditedPortfolio(prev => ({
        ...prev,
        whyChooseUs: {
          ...(prev.whyChooseUs || {}),
          image: imageUrl
        }
      }));
    }
  };
  
  // Handle project image upload
  const handleProjectImageUpload = async (e, projectIndex) => {
    const files = Array.from(e.target.files).slice(0, 10); // max 10 images
    if (!files.length) return;
  
    setUploadSection('projects.images');
    const uploadedImages = [];
    for (const file of files) {
      const imageUrl = await uploadImage(file);
      if (imageUrl) {
        uploadedImages.push(imageUrl);
      }
    }
    
    if (uploadedImages.length > 0) {
      setEditedPortfolio(prev => {
        const updatedProjects = [...(prev.projects || [])];
        
        if (projectIndex !== undefined && updatedProjects[projectIndex]) {
          // Update existing project
          updatedProjects[projectIndex] = {
            ...updatedProjects[projectIndex],
            images: [...(updatedProjects[projectIndex].images || []), ...uploadedImages].slice(0, 10)
          };
        } else if (projectIndex === 'new') {
          // For a new project being created
          const newProject = {
            ...prev.newProject,
            images: [...(prev.newProject?.images || []), ...uploadedImages].slice(0, 10)
          };
          return { ...prev, newProject };
        }
        
        return { ...prev, projects: updatedProjects };
      });
    }
  };

  // Function to handle image file upload for any section (replaces the old handleImageUpload)
  const handleImageUpload = async (file, section, field) => {
    if (!file) return;
    
    setUploadSection(`${section}.${field}`);
    const imageUrl = await uploadImage(file);
    
    if (imageUrl) {
      setEditedPortfolio(prev => {
        const updated = { ...prev };
        
        if (!updated[section]) {
          updated[section] = {};
        }
        
        if (section === 'whyChooseUs') {
          // Handle nested object for whyChooseUs
          if (!updated.whyChooseUs) {
            updated.whyChooseUs = {};
          }
          updated.whyChooseUs[field] = imageUrl;
        } else {
          // Handle direct property
          updated[section][field] = imageUrl;
        }
        
        return updated;
      });
    }
  };

  // Function to add a new item to an array in the portfolio
  const handleAddItem = (section, item) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      if (!updated[section]) {
        updated[section] = [];
      } else if (!Array.isArray(updated[section])) {
        updated[section] = [];
      }
      
      updated[section] = [...updated[section], item];
      return updated;
    });
  };

  // Function to update an item in an array
  const handleUpdateItem = (section, index, updatedItem) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      if (Array.isArray(updated[section]) && updated[section][index]) {
        const newArray = [...updated[section]];
        newArray[index] = { ...newArray[index], ...updatedItem };
        updated[section] = newArray;
      }
      
      return updated;
    });
  };

  // Function to remove an item from an array
  const handleRemoveItem = (section, index) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      if (Array.isArray(updated[section])) {
        updated[section] = updated[section].filter((_, i) => i !== index);
      }
      
      return updated;
    });
  };

  // Function for handling nested object changes
  const handleNestedChange = (section, field, value) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      // Initialize the section if it doesn't exist
      if (!updated[section]) {
        updated[section] = {};
      }
      
      // Set the value
      updated[section][field] = value;
      
      return updated;
    });
  };

  // Add a new state for the image upload popup

  // Add form management states

  // Function to open the edit form for a specific section
  const openEditForm = (section) => {
    setActiveEditSection(section);
    setShowEditForm(true);
  };

  // Function to close the edit form
  const closeEditForm = () => {
    setShowEditForm(false);
    setActiveEditSection('');
  };

  // Render the edit form based on the active section
  const renderEditForm = () => {
    if (!showEditForm) return null;

    const formSections = {
      hero: (
        <div className="space-y-8">
          <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl flex items-start">
            <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
              <Building2 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Hero Section</h3>
              <p className="text-sm text-gray-600">Update the main banner section of your portfolio.</p>
            </div>
          </div>
          
          {/* Background Image Section */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Image className="w-5 h-5 mr-2 text-orange-500" />
              Background Image
            </h4>
            
            {/* Current image preview */}
            {editedPortfolio?.hero?.backgroundImage && (
              <div className="mb-6">
                <div className="w-full h-60 rounded-lg overflow-hidden border border-gray-200">
                  <img 
                    src={editedPortfolio.hero.backgroundImage}
                    alt="Current background"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* File upload input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Update Background:
              </label>
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="hero-image-upload"
                  onChange={handleHeroImageUpload}
                />
                <label
                  htmlFor="hero-image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-600 text-sm font-medium">Click to select a new image</span>
                  <p className="text-xs text-gray-500 mt-1">Recommended size: 1920×1080px</p>
                </label>
              </div>
            </div>
            
            {/* Upload progress indicator */}
            {uploadingImage && uploadSection === 'hero.backgroundImage' && (
              <div className="mt-2 mb-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-orange-500 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
              </div>
            )}
          </div>
          
          {/* Text Content Section */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <AlignLeft className="w-5 h-5 mr-2 text-orange-500" />
              Text Content
            </h4>
            
            <div className="space-y-5">
              <div className="space-y-2">
                {/* Add htmlFor to the label */}
                <label htmlFor="hero-tagline" className="block text-sm font-medium text-gray-700">Tagline</label>
                <input 
                  type="text" 
                  // Add id to the input
                  id="hero-tagline"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  value={editedPortfolio?.hero?.tagline }
                  onChange={(e) => handleInputChange('hero', 'tagline', e.target.value)}
                  placeholder="e.g. Leading Construction Company"
                />
                <p className="text-xs text-gray-500">Short phrase that appears above the main heading</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Main Heading</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  value={editedPortfolio?.hero?.mainHeading}
                  onChange={(e) => handleInputChange('hero', 'mainHeading', e.target.value)}
                  placeholder="e.g. Building Tomorrow's"
                />
                <p className="text-xs text-gray-500">First part of the main headline</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Accent Heading</label>
                <input 
                  type="text" 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-orange-500"
                  value={editedPortfolio?.hero?.accentHeading }
                  onChange={(e) => handleInputChange('hero', 'accentHeading', e.target.value)}
                  placeholder="e.g. Landmarks"
                />
                <p className="text-xs text-gray-500">Highlighted part of the headline (appears in orange)</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all h-32"
                  value={editedPortfolio?.hero?.description }
                  onChange={(e) => handleInputChange('hero', 'description', e.target.value)}
                  placeholder="Describe your company and services in a few sentences..."
                ></textarea>
                <p className="text-xs text-gray-500">Brief overview of your company that appears below the heading</p>
              </div>
            </div>
          </div>
        </div>
      ),
      
      stats: (
        <div className="space-y-8">
          <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex items-start">
            <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
              <Trophy className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Statistics Section</h3>
              <p className="text-sm text-gray-600">Update your company's key statistics and achievements.</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-medium text-gray-900">Company Statistics</h4>
              {/* <button
                onClick={() => handleAddItem('statistics', { label: 'New Statistic', value: '0', icon: 'trophy' })}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Statistic
              </button> */}
            </div>
            
            <div className="space-y-6">
              {(editedPortfolio?.statistics || []).map((stat, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="font-medium text-gray-700">Statistic #{index + 1}</h5>
                    <button
                      onClick={() => handleRemoveItem('statistics', index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        value={stat.label || ''}
                        onChange={(e) => handleUpdateItem('statistics', index, { label: e.target.value })}
                        placeholder="e.g. Years Experience"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        value={stat.value || ''}
                        onChange={(e) => handleUpdateItem('statistics', index, { value: e.target.value })}
                        placeholder="e.g. 25+"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                      <select
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        value={stat.icon || 'trophy'}
                        onChange={(e) => handleUpdateItem('statistics', index, { icon: e.target.value })}
                      >
                        <option value="trophy">Trophy</option>
                        <option value="users">Team/Users</option>
                        <option value="building">Building</option>
                        <option value="check">Checkmark</option>
                        <option value="star">Star</option>
                        <option value="clock">Clock</option>
                        <option value="hardhat">Hardhat</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              {(editedPortfolio?.statistics || []).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <div className="mb-2">No statistics added yet.</div>
                  <button
                    onClick={() => handleAddItem('statistics', { label: 'Years Experience', value: '25+', icon: 'trophy' })}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    Add First Statistic
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      
      services: (
        <div className="space-y-8">
          <div className="bg-green-50 border border-green-100 p-5 rounded-xl flex items-start">
            <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
              <Hammer className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Services Section</h3>
              <p className="text-sm text-gray-600">Update the services offered by your company.</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Section Headings</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={editedPortfolio?.servicesHeading || "Our Services"}
                    onChange={(e) => handleInputChange('servicesHeading', e.target.value)}
                    placeholder="e.g. Our Services"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section Summary</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    value={editedPortfolio?.servicesSummary || "We offer comprehensive construction solutions..."}
                    onChange={(e) => handleInputChange('servicesSummary', e.target.value)}
                    placeholder="Brief description of your services"
                  />
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-medium text-gray-900">Service Cards</h4>
                {/* <button
                  onClick={() => handleAddItem('services', { 
                    title: 'New Service', 
                    description: 'Description of the service', 
                    icon: 'building',
                    ctaText: 'Learn More'
                  })}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button> */}
              </div>
              
              <div className="space-y-6">
                {(editedPortfolio?.services || []).map((service, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="font-medium text-gray-700">Service #{index + 1}</h5>
                      <button
                        onClick={() => handleRemoveItem('services', index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          value={service.title || ''}
                          onChange={(e) => handleUpdateItem('services', index, { title: e.target.value })}
                          placeholder="e.g. Commercial Construction"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                        <select
                          className="w-full p-2 border border-gray-300 rounded-lg"
                          value={service.icon || 'building'}
                          onChange={(e) => handleUpdateItem('services', index, { icon: e.target.value })}
                        >
                          <option value="building">Commercial Building</option>
                          <option value="home">Residential Home</option>
                          <option value="factory">Factory/Industrial</option>
                          <option value="ruler">Infrastructure/Ruler</option>
                          <option value="truck">Transportation/Truck</option>
                          <option value="warehouse">Warehouse</option>
                          <option value="hammer">Construction/Hammer</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full p-2 border border-gray-300 rounded-lg h-20"
                        value={service.description || ''}
                        onChange={(e) => handleUpdateItem('services', index, { description: e.target.value })}
                        placeholder="Brief description of the service"
                      ></textarea>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        value={service.ctaText || 'Learn More'}
                        onChange={(e) => handleUpdateItem('services', index, { ctaText: e.target.value })}
                        placeholder="e.g. Learn More"
                      />
                    </div>
                  </div>
                ))}
                
                {(editedPortfolio?.services || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-2">No services added yet.</div>
                    <button
                      onClick={() => handleAddItem('services', { 
                        title: 'Commercial Construction', 
                        description: 'Office buildings, retail spaces, and industrial facilities', 
                        icon: 'building',
                        ctaText: 'Learn More'
                      })}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Add First Service
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      
      whyChooseUs: (
        <div className="space-y-8">
          <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl flex items-start">
            <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
              <CheckCircle2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Why Choose Us Section</h3>
              <p className="text-sm text-gray-600">Update the reasons why clients should choose your company.</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Section Content</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Section Heading</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={editedPortfolio?.whyChooseUs?.heading || "Why Choose Us"}
                  onChange={(e) => handleNestedChange('whyChooseUs', 'heading', e.target.value)}
                  placeholder="e.g. Why Choose Us"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Subheading</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg"
                  value={editedPortfolio?.whyChooseUs?.subheading || "Excellence in Construction, Committed to Quality"}
                  onChange={(e) => handleNestedChange('whyChooseUs', 'subheading', e.target.value)}
                  placeholder="e.g. Excellence in Construction, Committed to Quality"
                />
              </div>
            </div>
            
            <div className="mb-8">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2 text-purple-500" />
                Section Image
              </h4>
              
              {/* Current image preview */}
              {editedPortfolio?.whyChooseUs?.image && (
                <div className="mb-6">
                  <div className="w-full h-60 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={editedPortfolio.whyChooseUs.image}
                      alt="Why Choose Us"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              
              {/* File upload input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Image:
                </label>
                <div className="flex items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="why-choose-us-image-upload"
                    onChange={handleWhyChooseUsImageUpload}
                  />
                  <label
                    htmlFor="why-choose-us-image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <div className="bg-gray-100 p-4 rounded-full mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-gray-600 text-sm font-medium">Click to select a new image</span>
                    <p className="text-xs text-gray-500 mt-1">Recommended size: 800×600px</p>
                  </label>
                </div>
              </div>
              
              {/* Upload progress indicator */}
              {uploadingImage && uploadSection === 'whyChooseUs.image' && (
                <div className="mt-2 mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-purple-500 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-medium text-gray-900">Features</h4>
                {/* <button
                  onClick={() => {
                    const currentFeatures = editedPortfolio?.whyChooseUs?.features || [];
                    handleNestedChange('whyChooseUs', 'features', [
                      ...currentFeatures,
                      { icon: 'trophy', title: 'New Feature', desc: 'Description' }
                    ]);
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </button> */}
              </div>
              
              <div className="space-y-6">
                {(editedPortfolio?.whyChooseUs?.features || []).map((feature, index) => {
                  const currentFeatures = editedPortfolio?.whyChooseUs?.features || [];
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium text-gray-700">Feature #{index + 1}</h5>
                        <button
                          onClick={() => {
                            const updatedFeatures = [...currentFeatures];
                            updatedFeatures.splice(index, 1);
                            handleNestedChange('whyChooseUs', 'features', updatedFeatures);
                          }}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={feature.title || ''}
                            onChange={(e) => {
                              const updatedFeatures = [...currentFeatures];
                              updatedFeatures[index] = { ...feature, title: e.target.value };
                              handleNestedChange('whyChooseUs', 'features', updatedFeatures);
                            }}
                            placeholder="e.g. Expert Team"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={feature.desc || ''}
                            onChange={(e) => {
                              const updatedFeatures = [...currentFeatures];
                              updatedFeatures[index] = { ...feature, desc: e.target.value };
                              handleNestedChange('whyChooseUs', 'features', updatedFeatures);
                            }}
                            placeholder="e.g. Highly skilled professionals"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                          <select
                            className="w-full p-2 border border-gray-300 rounded-lg"
                            value={feature.icon || 'CheckCircle2'}
                            onChange={(e) => {
                              const updatedFeatures = [...currentFeatures];
                              updatedFeatures[index] = { ...feature, icon: e.target.value };
                              handleNestedChange('whyChooseUs', 'features', updatedFeatures);
                            }}
                          >
                            <option value="HardHat">Hard Hat</option>
                            <option value="CheckCircle2">Checkmark</option>
                            <option value="Clock">Clock</option>
                            <option value="Trophy">Trophy</option>
                            <option value="Star">Star</option>
                            <option value="Users">Team/Users</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {(editedPortfolio?.whyChooseUs?.features || []).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="mb-2">No features added yet.</div>
                    <button
                      onClick={() => {
                        handleNestedChange('whyChooseUs', 'features', [
                          { icon: 'HardHat', title: 'Expert Team', desc: 'Highly skilled professionals' }
                        ]);
                      }}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Add First Feature
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ),
      
      contact: (
        <div className="space-y-8">
          <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl flex items-start">
            <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
              <Mail className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Contact Information</h3>
              <p className="text-sm text-gray-600">Update your company's contact details.</p>
            </div>
          </div>
          
          <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-medium text-gray-900 mb-6">Company Contact Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                    <Phone className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-r-lg"
                    value={editedPortfolio?.contact?.phone || ""}
                    onChange={(e) => handleNestedChange('contact', 'phone', e.target.value)}
                    placeholder="e.g. +94 11 123 4567"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                    <Mail className="w-5 h-5" />
                  </span>
                  <input
                    type="email"
                    className="w-full p-2 border border-gray-300 rounded-r-lg"
                    value={editedPortfolio?.contact?.email || ""}
                    onChange={(e) => handleNestedChange('contact', 'email', e.target.value)}
                    placeholder="e.g. info@yourcompany.com"
                  />
                </div>
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Office Address</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                  <MapPin className="w-5 h-5" />
                </span>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-r-lg"
                  rows="3"
                  value={editedPortfolio?.contact?.address || ""}
                  onChange={(e) => handleNestedChange('contact', 'address', e.target.value)}
                  placeholder="Enter your office address"
                ></textarea>
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              <label className="block text-sm font-medium text-gray-700">Company Website</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-gray-500">
                  <ExternalLink className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-r-lg"
                  value={editedPortfolio?.contact?.website || ""}
                  onChange={(e) => handleNestedChange('contact', 'website', e.target.value)}
                  placeholder="e.g. https://www.yourcompany.com"
                />
              </div>
            </div>
          </div>
        </div>
      )
    };

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-y-auto p-4 backdrop-blur-sm transition-all duration-300">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
          {/* Enhanced header with gradient and subtle pattern */}
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 text-white p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.2)_0%,transparent_20%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.2)_0%,transparent_20%)]"></div>
            
            <div className="flex items-center space-x-3 relative z-10">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Edit3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Edit Company Portfolio</h2>
                <p className="text-white/80 text-sm">Customize your company's portfolio display</p>
              </div>
            </div>
            
            <button 
              onClick={closeEditForm}
              className="text-white/80 hover:text-white hover:bg-white/20 transition-all p-2 rounded-full"
              title="Close editor"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Improved Tab Navigation with animated indicator */}
          <div className="bg-gray-50 flex border-b border-gray-200 relative">
            <div className="flex overflow-x-auto hide-scrollbar">
              {[
                {id: 'hero', label: 'Hero Section', icon: <Building2 className="w-4 h-4 mr-2" />},
                {id: 'stats', label: 'Statistics', icon: <Trophy className="w-4 h-4 mr-2" />},
                {id: 'services', label: 'Services', icon: <Hammer className="w-4 h-4 mr-2" />},
                {id: 'whyChooseUs', label: 'Why Choose Us', icon: <CheckCircle2 className="w-4 h-4 mr-2" />},
                {id: 'contact', label: 'Contact Info', icon: <Mail className="w-4 h-4 mr-2" />}
              ].map(tab => (
                <button 
                  key={tab.id}
                  className={`px-6 py-4 font-medium flex items-center whitespace-nowrap transition-all
                    ${activeEditSection === tab.id 
                      ? 'text-orange-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
                  onClick={() => setActiveEditSection(tab.id)}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Animated underline indicator */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-orange-500 transition-all duration-300"
                 style={{
                   width: activeEditSection === 'hero' ? '130px' : 
                          activeEditSection === 'stats' ? '120px' : 
                          activeEditSection === 'services' ? '110px' :
                          activeEditSection === 'whyChooseUs' ? '150px' : '130px',
                   transform: `translateX(${
                     activeEditSection === 'hero' ? '0' :
                     activeEditSection === 'stats' ? '130px' :
                     activeEditSection === 'services' ? '250px' :
                     activeEditSection === 'whyChooseUs' ? '360px' : '510px'
                   })`
                 }}></div>
          </div>
          
          {/* Form Content with custom scrollbar */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {formSections[activeEditSection] || (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="mb-4 p-4 bg-gray-100 rounded-full">
                  <Edit3 className="w-10 h-10" />
                </div>
                <p>Select a section to edit from the tabs above</p>
              </div>
            )}
          </div>
          
          {/* Enhanced footer with better button styling */}
          <div className="bg-gray-50 p-6 flex justify-end gap-3 border-t border-gray-200">
            <button 
              onClick={closeEditForm}
              className="px-5 py-2.5 border border-gray-300 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-medium"
              disabled={saveLoading}
            >
              Cancel
            </button>
            <button 
              onClick={saveChanges}
              className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-lg hover:from-orange-700 hover:to-orange-600 transition-colors flex items-center gap-2 shadow-sm font-medium"
              disabled={saveLoading}
            >
              {saveLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fix for the Why Choose Us section - Update the handleNestedChange function
  // const handleNestedChange = (section, field, value) => {
  //   setEditedPortfolio(prev => {
  //     const updated = { ...prev };
      
  //     // Initialize the section if it doesn't exist
  //     if (!updated[section]) {
  //       updated[section] = {};
  //     }
      
  //     // Set the value
  //     updated[section][field] = value;
      
  //     return updated;
  //   });
  // };

  // Fix for nested objects in whyChooseUs and contact sections
  const handleWhyChooseUsFeatureUpdate = (index, field, value) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      // Initialize whyChooseUs if it doesn't exist
      if (!updated.whyChooseUs) {
        updated.whyChooseUs = {};
      }
      
      // Initialize features array if it doesn't exist
      if (!updated.whyChooseUs.features) {
        updated.whyChooseUs.features = [];
      }
      
      // Copy the features array
      const features = [...updated.whyChooseUs.features];
      
      // Initialize the feature object if it doesn't exist
      if (!features[index]) {
        features[index] = {};
      }
      
      // Update the field
      features[index] = {
        ...features[index],
        [field]: value
      };
      
      // Set the updated features array
      updated.whyChooseUs.features = features;
      
      return updated;
    });
  };

  // Function to add a feature to Why Choose Us
  const addWhyChooseUsFeature = (feature) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      // Initialize whyChooseUs if it doesn't exist
      if (!updated.whyChooseUs) {
        updated.whyChooseUs = {};
      }
      
      // Initialize features array if it doesn't exist
      if (!updated.whyChooseUs.features) {
        updated.whyChooseUs.features = [];
      }
      
      // Add the feature
      updated.whyChooseUs.features = [...updated.whyChooseUs.features, feature];
      
      return updated;
    });
  };

  // Function to remove a feature from Why Choose Us
  const removeWhyChooseUsFeature = (index) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      // Return unchanged if whyChooseUs or features doesn't exist
      if (!updated.whyChooseUs || !updated.whyChooseUs.features) {
        return prev;
      }
      
      // Filter out the feature at the given index
      updated.whyChooseUs.features = updated.whyChooseUs.features.filter((_, i) => i !== index);
      
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-8 w-4/5 max-w-4xl">
          {/* Hero section skeleton */}
          <div className="w-full h-64 bg-gray-200 rounded-xl animate-pulse"></div>
          
          {/* Stats section skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
          
          {/* Services section skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-1/3 mx-auto bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-2/3 mx-auto bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Projects section skeleton */}
          <div className="space-y-4">
            <div className="h-8 w-1/3 mx-auto bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-4 w-2/3 mx-auto bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add this block to handle and display the fetch error
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Portfolio</h2>
          <p className="text-gray-700">{error}</p>
          {/* Optionally add a retry button */}
        </div>
      </div>
    );
  }

 // Handle sidebar collapse from the sidebar component
 const handleSidebarCollapse = (collapsed) => {
  setIsCollapsed(collapsed);
};
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - with collapse callback */}
      <div
        className={`h-full fixed left-0 top-0 z-20 transition-all duration-300 bg-white border-r border-gray-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <CompanySidebar onCollapseChange={setIsCollapsed} isCollapsed={isCollapsed} />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Edit/Save Controls - only visible when user can edit */}
        {canEdit && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
            {saveSuccess && (
              <div className="bg-green-500 text-white p-3 rounded-xl shadow-lg mb-2 animate-fadeIn">
                Changes saved successfully!
              </div>
            )}
            
            {saveError && (
              <div className="bg-red-500 text-white p-3 rounded-xl shadow-lg mb-2 animate-fadeIn">
                {saveError}
              </div>
            )}
       
            {isEditing ? (
              <>
                {renderEditForm()}
                <div className="flex gap-2">
                  <button 
                    onClick={toggleEditing}
                    className="bg-gray-700 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all"
                    title="Cancel"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={saveChanges}
                    disabled={saveLoading}
                    className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all flex items-center justify-center"
                    title="Save Changes"
                  >
                    {saveLoading ? (
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-6 h-6" />
                    )}
                  </button>
                </div>
              </>
            ) : (
              <button 
                onClick={toggleEditing}
                className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all"
                title="Edit Portfolio"
              >
                <Edit3 className="w-6 h-6" />
              </button>

              
            )}
          </div>
        )}

        {/* Hero Section - Remove inline editing controls */}
        <div className="relative bg-gray-900 text-white">
          <div className="absolute inset-0">
            <img 
              src={portfolio?.hero?.backgroundImage || ""}
              alt="Construction Site"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          
          <div id="heroSection" className="relative container mx-auto px-6 py-32">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
                <span className="text-orange-500 font-medium">
                  {portfolio?.hero?.tagline || ""}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {portfolio?.hero?.mainHeading || ""}
                <span className="text-orange-500"> {portfolio?.hero?.accentHeading || ""}</span>
                <br />
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
                {portfolio?.hero?.description || ""}
              </p>
              <div className="flex flex-wrap gap-4">
                {/* <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium inline-flex items-center group transition-all">
                  View Our Projects
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-medium backdrop-blur-sm">
                  Contact Us
                </button> */}
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent h-32"></div>
        </div>

        {/* Stats Section - Remove inline editing controls */}
        <div className="relative -mt-16 container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-xl">
                    <stat.icon className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-gray-600">{stat.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Section - Remove inline editing controls */}
        <div className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {portfolio?.servicesHeading || "Our Services"}
              </h2>
              <p className="text-gray-600">
                {portfolio?.servicesSummary || ""}
              </p>
            </div>

            {processedServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {processedServices.map((service, index) => (
                  <div key={index} 
                    className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-orange-200 transition-all"
                  >
                    <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                      <service.icon className="w-7 h-7 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <button className="text-orange-500 group-hover:text-orange-600 inline-flex items-center text-sm font-medium">
                      {service.ctaText || "Learn More"}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500">No services available.</div>
            )}
          </div>
        </div>

        {/* Projects Section - Modified to show limited cards with See More button */}
        <div className="py-20 bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="relative max-w-4xl mx-auto mb-16">
              <div className="flex justify-between items-center mb-4">
                <div className="text-center mx-auto">
                  <h2 className="text-3xl font-bold text-white mb-4">Featured Projects</h2>
                  <p className="text-gray-400">
                    Discover our portfolio of landmark projects that showcase our expertise 
                    in construction and development.
                  </p>
                </div>
                <div className="absolute right-0 top-0">
                  <Link 
                    to="/company/add-project" 
                    className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add New Project
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedProjects.map((project) => (
                <div key={project.id} 
                  onClick={() => navigateToProjectDetails(project)}
                  className="group bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-all cursor-pointer"
                >
                  <div className="relative h-64">
                    <img
                      src={project.images?.length > 0 ? project.images[0] : project.image}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                    <div className="absolute top-4 right-4">
                      <span className="bg-orange-500/90 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        {project.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                    <p className="text-gray-400 mb-4">{project.description}</p>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {project.details.map((detail, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-orange-500" />
                          <span className="text-gray-400 text-sm">{detail}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center text-gray-400 text-sm">
                          <MapPin className="w-4 h-4 mr-1 text-orange-500" />
                          {project.location}
                        </div>
                        <div className="flex items-center text-gray-400 text-sm">
                          <Clock className="w-4 h-4 mr-1 text-orange-500" />
                          {project.completion}
                        </div>
                      </div>
                      <button 
                        className="text-orange-500 hover:text-orange-400 inline-flex items-center text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering the parent div's onClick
                          navigateToProjectDetails(project);
                        }}
                      >
                        View Details
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* See More button - only show if there are more than 3 projects */}
            {projects.length > 3 && (
              <div className="flex justify-center mt-12">
                <button
                  onClick={() => setShowAllProjects(!showAllProjects)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium inline-flex items-center group transition-all"
                >
                  {showAllProjects ? "Show Less" : "See More Projects"}
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Why Choose Us Section */}
        <div className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
                  <span className="text-orange-500 font-medium">
                    {portfolio?.whyChooseUs?.heading || "Why Choose Us"}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {portfolio?.whyChooseUs?.subheading || ""}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(portfolio?.whyChooseUs?.features || []).map((item, index) => {
                    const Icon = iconMap[item.icon] || Star;
                    return (
                      <div key={index} className="flex items-start gap-4">
                        <div className="bg-orange-100 p-3 rounded-xl">
                          <Icon className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                          <p className="text-gray-600 text-sm">{item.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="relative">
                <img 
                  src={portfolio?.whyChooseUs?.image || ""}
                  alt="Why Choose Us"
                  className="rounded-2xl shadow-2xl"
                />
                <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="bg-orange-100 p-4 rounded-xl">
                      <Users className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        {portfolio?.clientCount || portfolio?.clients?.length || clientSatisfactionValue || "100%"}
                      </div>
                      <div className="text-gray-600">Happy Clients</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}

        
        {/* Display contact information from portfolio if available */}
        {portfolio?.contact && (
          <div className="py-20 bg-gray-900">
            <div className="container mx-auto px-6">
              <div className="max-w-4xl mx-auto bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="relative">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Start Your Project?</h2>
                    <p className="text-orange-100">
                      Contact us today to discuss your construction needs and get a free consultation.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <a href={`tel:${portfolio.contact.phone}`} className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-2">Call Us</h3>
                      <p className="text-orange-100 text-sm">{portfolio.contact.phone}</p>
                    </a>
                    <a href={`mailto:${portfolio.contact.email}`} className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-2">Email Us</h3>
                      <p className="text-orange-100 text-sm">{portfolio.contact.email}</p>
                    </a>
                    <a href="#location" className="group bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-all">
                      <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-white mb-2">Visit Us</h3>
                      <p className="text-orange-100 text-sm">{portfolio.contact.address}</p>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConstructionPortfolioProfile;