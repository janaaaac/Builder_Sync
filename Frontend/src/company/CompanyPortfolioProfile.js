import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Phone,
  Mail,
  MapPin,
  Building2,
  Hammer,
  Users,
  Clock,
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
  X
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

  // Use portfolio data if available, otherwise use hardcoded data
  const projects = portfolio?.projects || [
    {
      id: 1,
      title: "Luxury Apartment Complex",
      category: "residential",
      description: "25-story luxury residential complex with modern amenities",
      details: ["250 Units", "Underground Parking", "Rooftop Garden"],
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00",
      location: "Colombo 07",
      completion: "2023"
    },
    {
      id: 2,
      title: "Tech Park Development",
      category: "commercial",
      description: "State-of-the-art technology park with smart infrastructure",
      details: ["100,000 sq ft", "Smart Building", "Green Certified"],
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab",
      location: "IT Zone",
      completion: "2024"
    },
    {
      id: 3,
      title: "Highway Extension Project",
      category: "infrastructure",
      description: "Major highway extension with bridges and tunnels",
      details: ["50 KM Length", "6 Bridges", "2 Tunnels"],
      image: "https://images.unsplash.com/photo-1513828583688-c52646db42da",
      location: "Southern Highway",
      completion: "2025"
    }
  ];

  const services = portfolio?.services || [
    {
      icon: Building,
      title: "Commercial Construction",
      description: "Office buildings, retail spaces, and industrial facilities"
    },
    {
      icon: Home,
      title: "Residential Development",
      description: "Luxury apartments, housing complexes, and custom homes"
    },
    {
      icon: Factory,
      title: "Industrial Projects",
      description: "Manufacturing plants, warehouses, and industrial parks"
    },
    {
      icon: Ruler,
      title: "Infrastructure Development",
      description: "Roads, bridges, and public infrastructure projects"
    }
  ];

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
    let satisfactionValue = "1000+";
    
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
      // Default stats if none from backend
      statsArray = [
        {
          icon: Trophy,
          value: "25+",
          label: "Years Experience"
        },
        {
          icon: Building2,
          value: "500+",
          label: "Projects Completed"
        },
        {
          icon: Users,
          value: "1000+",
          label: "Team Members"
        },
        {
          icon: CheckCircle2,
          value: "100%", 
          label: "Client Satisfaction"
        }
      ];
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

  const whyChooseUs = {
    heading: "Why Choose Us",
    subheading: "Excellence in Construction, Committed to Quality",
    features: [
      {
        icon: "HardHat",
        title: "Expert Team",
        desc: "Highly skilled professionals"
      },
      {
        icon: "CheckCircle2",
        title: "Quality Assured",
        desc: "ISO 9001:2015 certified"
      },
      {
        icon: "Clock",
        title: "Timely Delivery",
        desc: "On-time project completion"
      },
      {
        icon: "Trophy",
        title: "Award Winning",
        desc: "Industry recognized excellence"
      }
    ],
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd"
  };

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
    
    // Default hardcoded services
    return [
      {
        icon: Building,
        title: "Commercial Construction",
        description: "Office buildings, retail spaces, and industrial facilities"
      },
      {
        icon: Home,
        title: "Residential Development",
        description: "Luxury apartments, housing complexes, and custom homes"
      },
      {
        icon: Factory,
        title: "Industrial Projects",
        description: "Manufacturing plants, warehouses, and industrial parks"
      },
      {
        icon: Ruler,
        title: "Infrastructure Development",
        description: "Roads, bridges, and public infrastructure projects"
      }
    ];
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
  const handleNestedChange = (section, subsection, field, value) => {
    setEditedPortfolio(prev => {
      const updated = { ...prev };
      
      if (!updated[section]) {
        updated[section] = {};
      }
      
      if (!updated[section][subsection]) {
        updated[section][subsection] = {};
      }
      
      updated[section][subsection][field] = value;
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
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-2">Edit Hero Section</h2>
          
          {/* Background Image Section */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Background Image</h3>
            
            {/* Current image preview */}
            {editedPortfolio?.hero?.backgroundImage && (
              <div className="mb-4">
                <div className="w-full h-40 rounded-lg overflow-hidden">
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
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-lg">
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
                  <span className="text-gray-600 text-sm">Click to select a new image</span>
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
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Text Content</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded"
                value={editedPortfolio?.hero?.tagline || "Leading Construction Company"}
                onChange={(e) => handleInputChange('hero', 'tagline', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Heading</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded"
                value={editedPortfolio?.hero?.mainHeading || "Building Tomorrow's"}
                onChange={(e) => handleInputChange('hero', 'mainHeading', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Heading</label>
              <input 
                type="text" 
                className="w-full p-2 border rounded text-orange-500"
                value={editedPortfolio?.hero?.accentHeading || "Landmarks"}
                onChange={(e) => handleInputChange('hero', 'accentHeading', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                className="w-full p-2 border rounded h-32"
                value={editedPortfolio?.hero?.description || ""}
                onChange={(e) => handleInputChange('hero', 'description', e.target.value)}
              ></textarea>
            </div>
          </div>
        </div>
      ),
      stats: (
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-2">Edit Statistics</h2>
          
          <button
            onClick={() => handleAddItem('statistics', { label: 'New Stat', value: '0', icon: 'Star' })}
            className="bg-orange-500 text-white px-4 py-2 rounded mb-4"
          >
            Add New Statistic
          </button>
          
          <div className="space-y-8">
            {(editedPortfolio?.statistics || stats).map((stat, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                <button 
                  onClick={() => handleRemoveItem('statistics', index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={stat.icon?.name || 'Star'}
                      onChange={(e) => {
                        const updatedStat = { ...stat, icon: e.target.value };
                        handleUpdateItem('statistics', index, updatedStat);
                      }}
                    >
                      {Object.keys(iconMap).filter(k => !k.includes('.')).map(iconName => (
                        <option key={iconName} value={iconName}>{iconName}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                    <input 
                      type="text"
                      className="w-full p-2 border rounded"
                      value={stat.value || ''}
                      onChange={(e) => {
                        const updatedStat = { ...stat, value: e.target.value };
                        handleUpdateItem('statistics', index, updatedStat);
                      }}
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <input 
                    type="text"
                    className="w-full p-2 border rounded"
                    value={stat.label || ''}
                    onChange={(e) => {
                      const updatedStat = { ...stat, label: e.target.value };
                      handleUpdateItem('statistics', index, updatedStat);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      services: (
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-2">Edit Services</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Services Heading</label>
              <input 
                type="text"
                className="w-full p-2 border rounded"
                value={editedPortfolio?.servicesHeading || "Our Services"}
                onChange={(e) => handleInputChange('servicesHeading', '', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Services Summary</label>
              <textarea
                className="w-full p-2 border rounded h-24"
                value={editedPortfolio?.servicesSummary || "We offer comprehensive construction solutions tailored to meet diverse project requirements across various sectors."}
                onChange={(e) => handleInputChange('servicesSummary', '', e.target.value)}
              ></textarea>
            </div>
          </div>
          
          <button
            onClick={() => handleAddItem('services', { 
              icon: 'Building',
              title: 'New Service',
              description: 'Describe this service',
              ctaText: 'Learn More'
            })}
            className="bg-orange-500 text-white px-4 py-2 rounded mb-4"
          >
            Add New Service
          </button>
          
          <div className="space-y-8 max-h-96 overflow-y-auto p-2">
            {(editedPortfolio?.services || processedServices).map((service, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                <button 
                  onClick={() => handleRemoveItem('services', index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={typeof service.icon === 'string' ? service.icon : 'Building'}
                      onChange={(e) => {
                        const updatedService = { ...service, icon: e.target.value };
                        handleUpdateItem('services', index, updatedService);
                      }}
                    >
                      {Object.keys(iconMap).filter(k => !k.includes('.')).map(iconName => (
                        <option key={iconName} value={iconName}>{iconName}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                    <input 
                      type="text"
                      className="w-full p-2 border rounded"
                      value={service.ctaText || 'Learn More'}
                      onChange={(e) => {
                        const updatedService = { ...service, ctaText: e.target.value };
                        handleUpdateItem('services', index, updatedService);
                      }}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input 
                    type="text"
                    className="w-full p-2 border rounded"
                    value={service.title || ''}
                    onChange={(e) => {
                      const updatedService = { ...service, title: e.target.value };
                      handleUpdateItem('services', index, updatedService);
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    className="w-full p-2 border rounded h-24"
                    value={service.description || ''}
                    onChange={(e) => {
                      const updatedService = { ...service, description: e.target.value };
                      handleUpdateItem('services', index, updatedService);
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      whyChooseUs: (
        <div className="space-y-6">
          <h2 className="text-xl font-bold border-b pb-2">Edit Why Choose Us Section</h2>
          
          {/* Heading & Subheading */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Heading</label>
              <input 
                type="text"
                className="w-full p-2 border rounded"
                value={editedPortfolio?.whyChooseUs?.heading || whyChooseUs.heading}
                onChange={(e) => handleNestedChange('whyChooseUs', '', 'heading', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section Subheading</label>
              <input 
                type="text"
                className="w-full p-2 border rounded"
                value={editedPortfolio?.whyChooseUs?.subheading || whyChooseUs.subheading}
                onChange={(e) => {
                  // Use direct object update instead of handleNestedChange to ensure it works properly
                  setEditedPortfolio(prev => ({
                    ...prev,
                    whyChooseUs: {
                      ...(prev.whyChooseUs || {}),
                      subheading: e.target.value
                    }
                  }));
                }}
              />
            </div>
          </div>
          
          {/* Background Image */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Section Image</h3>
            
            {/* Current image preview */}
            {(editedPortfolio?.whyChooseUs?.image || whyChooseUs.image) && (
              <div className="mb-4">
                <div className="w-full h-40 rounded-lg overflow-hidden">
                  <img 
                    src={editedPortfolio?.whyChooseUs?.image || whyChooseUs.image}
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
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 p-6 rounded-lg">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="whyChooseUs-image-upload"
                  onChange={handleWhyChooseUsImageUpload}
                />
                <label
                  htmlFor="whyChooseUs-image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-gray-600 text-sm">Click to select a new image</span>
                </label>
              </div>
            </div>
            
            {/* Upload progress indicator */}
            {uploadingImage && uploadSection === 'whyChooseUs.image' && (
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
          
          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-700">Features</h3>
              <button
                onClick={() => {
                  const features = editedPortfolio?.whyChooseUs?.features || [];
                  handleNestedChange('whyChooseUs', '', 'features', [
                    ...features,
                    { icon: 'Star', title: 'New Feature', desc: 'Description goes here' }
                  ]);
                }}
                className="bg-orange-500 text-white px-3 py-1 rounded text-sm"
              >
                Add Feature
              </button>
            </div>
            
            <div className="space-y-6 max-h-96 overflow-y-auto p-2">
              {(editedPortfolio?.whyChooseUs?.features || whyChooseUs.features).map((feature, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
                  <button 
                    onClick={() => {
                      const features = [...(editedPortfolio?.whyChooseUs?.features || whyChooseUs.features)];
                      features.splice(index, 1);
                      handleNestedChange('whyChooseUs', '', 'features', features);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                      <select 
                        className="w-full p-2 border rounded"
                        value={feature.icon || 'Star'}
                        onChange={(e) => {
                          // Direct state update for more reliable changes
                          setEditedPortfolio(prev => {
                            const updatedFeatures = [...(prev.whyChooseUs?.features || whyChooseUs.features)];
                            updatedFeatures[index] = { 
                              ...updatedFeatures[index], 
                              icon: e.target.value 
                            };
                            return {
                              ...prev,
                              whyChooseUs: {
                                ...(prev.whyChooseUs || {}),
                                features: updatedFeatures
                              }
                            };
                          });
                        }}
                      >
                        {Object.keys(iconMap).filter(k => !k.includes('.')).map(iconName => (
                          <option key={iconName} value={iconName}>{iconName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input 
                        type="text"
                        className="w-full p-2 border rounded"
                        value={feature.title || ''}
                        onChange={(e) => {
                          // Direct state update for more reliable changes
                          setEditedPortfolio(prev => {
                            const updatedFeatures = [...(prev.whyChooseUs?.features || whyChooseUs.features)];
                            updatedFeatures[index] = { 
                              ...updatedFeatures[index], 
                              title: e.target.value 
                            };
                            return {
                              ...prev,
                              whyChooseUs: {
                                ...(prev.whyChooseUs || {}),
                                features: updatedFeatures
                              }
                            };
                          });
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea 
                      className="w-full p-2 border rounded h-16"
                      value={feature.desc || ''}
                      onChange={(e) => {
                        // Direct state update for more reliable changes
                        setEditedPortfolio(prev => {
                          const updatedFeatures = [...(prev.whyChooseUs?.features || whyChooseUs.features)];
                          updatedFeatures[index] = { 
                            ...updatedFeatures[index], 
                            desc: e.target.value 
                          };
                          return {
                            ...prev,
                            whyChooseUs: {
                              ...(prev.whyChooseUs || {}),
                              features: updatedFeatures
                            }
                          };
                        });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ),
      // Add more sections as needed: whyChooseUs, contact, etc.
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl relative mx-4 my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <button 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            onClick={closeEditForm}
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex">
            {/* Sidebar Navigation */}
            <div className="w-48 border-r pr-4">
              <ul className="space-y-2">
                <li
                  className={`p-2 rounded cursor-pointer ${activeEditSection === 'hero' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setActiveEditSection('hero')}
                >
                  Hero Section
                </li>
                <li
                  className={`p-2 rounded cursor-pointer ${activeEditSection === 'stats' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setActiveEditSection('stats')}
                >
                  Statistics
                </li>
                <li
                  className={`p-2 rounded cursor-pointer ${activeEditSection === 'services' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setActiveEditSection('services')}
                >
                  Services
                </li>
                <li
                  className={`p-2 rounded cursor-pointer ${activeEditSection === 'whyChooseUs' ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'}`}
                  onClick={() => setActiveEditSection('whyChooseUs')}
                >
                  Why Choose Us
                </li>
                {/* Add more nav items as needed */}
              </ul>
            </div>
            
            {/* Content Area */}
            <div className="flex-1 pl-6 overflow-y-auto">
              {formSections[activeEditSection] || (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="mb-4 p-4 bg-gray-100 rounded-full">
                    <Edit3 className="w-10 h-10" />
                  </div>
                  <p>Select a section to edit from the sidebar</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Form Controls */}
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
            <button 
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={closeEditForm}
            >
              Cancel
            </button>
            <button 
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
              onClick={saveChanges}
              disabled={saveLoading}
            >
              {saveLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>;
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
              src={portfolio?.hero?.backgroundImage || "https://images.unsplash.com/photo-1541976590-713941681591"}
              alt="Construction Site"
              className="w-full h-full object-cover opacity-20"
            />
          </div>
          
          <div id="heroSection" className="relative container mx-auto px-6 py-32">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
                <span className="text-orange-500 font-medium">
                  {portfolio?.hero?.tagline || "Leading Construction Company"}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                {portfolio?.hero?.mainHeading || "Building Tomorrow's"}
                <span className="text-orange-500"> {portfolio?.hero?.accentHeading || "Landmarks"}</span>
                <br />Today
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl">
                {portfolio?.hero?.description || 
                  "With over 25 years of excellence in construction, we specialize in delivering innovative and sustainable building solutions for residential, commercial, and industrial projects."}
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium inline-flex items-center group transition-all">
                  View Our Projects
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-medium backdrop-blur-sm">
                  Contact Us
                </button>
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
                {portfolio?.servicesSummary || "We offer comprehensive construction solutions tailored to meet diverse project requirements across various sectors."}
              </p>
            </div>

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
          </div>
        </div>

        {/* Projects Section - Modified to show limited cards with See More button */}
        <div className="py-20 bg-gray-900">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Featured Projects</h2>
              <p className="text-gray-400">
                Discover our portfolio of landmark projects that showcase our expertise 
                in construction and development.
              </p>
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
                    {portfolio?.whyChooseUs?.heading || whyChooseUs.heading}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  {portfolio?.whyChooseUs?.subheading || whyChooseUs.subheading}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(portfolio?.whyChooseUs?.features || whyChooseUs.features).map((item, index) => {
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
                  src={portfolio?.whyChooseUs?.image || whyChooseUs.image}
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
                        {portfolio?.clientCount || portfolio?.clients?.length || clientSatisfactionValue}
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