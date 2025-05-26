import React, { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  Bed,
  Bath,
  MapPin,
  Calendar,
  Square,
  DollarSign,
  User,
} from 'lucide-react';

// Reusable form components
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

const Select = ({ placeholder, options, value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer bg-white flex items-center justify-between ${className}`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? options.find(opt => opt.value === value)?.label || value : placeholder}
        </span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
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

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const AddNewProject = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Project form state
  const [projectDetails, setProjectDetails] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    completionYear: '',
    image: '', // For backward compatibility
    images: [], // Multiple images
    details: [''], // Features
    price: '',
    area: '',
    duration: '',
    bedrooms: '',
    bathrooms: '',
    team: [] // Team members
  });

  // State for new team member input
  const [newTeamMember, setNewTeamMember] = useState({
    fullName: '',
    jobRole: '',
    image: ''
  });

  // Image upload refs
  const projectImageRef = useRef(null);
  const teamImageInputRef = useRef(null);
  
  // Handler for team member image upload
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

  // Upload image function
  const uploadImage = async (file) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return null;
      }
      
      // Uses 'image' as the field name to match multer config
      const formData = new FormData();
      formData.append('image', file);
      
      // Correct endpoint for uploads based on your backend setup
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
  
  // Handle project image upload
  const handleProjectImageUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10); // Max 10 images
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
        'http://localhost:5001/api/portfolio/projects',
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
          area: '',
          duration: '',
          bedrooms: '',
          bathrooms: '',
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

  // Category options
  const categoryOptions = [
    { value: 'residential', label: 'Residential' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'industrial', label: 'Industrial' }
  ];

  // Callbacks for Project Details section
  const handleProjectTitleChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, title: value }));
  }, []);
  
  const handleProjectCategoryChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, category: value }));
  }, []);
  
  const handleProjectDescriptionChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, description: value }));
  }, []);
  
  const handleProjectLocationChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, location: value }));
  }, []);
  
  const handleProjectCompletionYearChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, completionYear: value }));
  }, []);
  
  const handleProjectAreaChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, area: value }));
  }, []);
  
  const handleProjectDurationChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, duration: value }));
  }, []);
  
  const handleProjectBedroomsChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, bedrooms: value }));
  }, []);
  
  const handleProjectBathroomsChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, bathrooms: value }));
  }, []);
  
  const handleProjectPriceChange = useCallback((value) => {
    setProjectDetails(prev => ({ ...prev, price: value }));
  }, []);
  
  const handleProjectDetailInputChange = useCallback((value) => {
    setProjectDetails(prev => {
      const newDetails = [...prev.details];
      if (newDetails.length > 0) {
        newDetails[newDetails.length - 1] = value;
      } else {
        newDetails.push(value); // Fallback, though details should be initialized with ['']
      }
      return { ...prev, details: newDetails };
    });
  }, []);

  // Callbacks for New Team Member
  const handleNewTeamMemberFullNameChange = useCallback((value) => {
    setNewTeamMember(prev => ({ ...prev, fullName: value }));
  }, []);
  
  const handleNewTeamMemberJobRoleChange = useCallback((value) => {
    setNewTeamMember(prev => ({ ...prev, jobRole: value }));
  }, []);

  return (
    <div className="flex-1 p-8 bg-gray-50 font-jakarta">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Project</h1>
          <p className="text-gray-600 mt-2">Create a new project for your portfolio</p>
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

        <Card>
          <form onSubmit={(e) => {
            e.preventDefault();
            addProject();
          }} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Project Title</label>
                <Input 
                  placeholder="e.g., Modern Two-Story Luxury Residence" 
                  value={projectDetails.title}
                  onChange={handleProjectTitleChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Project Category</label>
                <Select 
                  placeholder="Select a category"
                  options={categoryOptions}
                  value={projectDetails.category}
                  onChange={handleProjectCategoryChange}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Description</label>
                <Textarea 
                  placeholder="Describe the project..." 
                  value={projectDetails.description}
                  onChange={handleProjectDescriptionChange}
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
                      onChange={handleProjectLocationChange}
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
                      onChange={handleProjectCompletionYearChange}
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
                      onChange={handleProjectAreaChange}
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
                    onChange={handleProjectDurationChange}
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
                      onChange={handleProjectBedroomsChange}
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
                      onChange={handleProjectBathroomsChange}
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
                    onChange={handleProjectPriceChange}
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
                    value={projectDetails.details.length > 0 ? projectDetails.details[projectDetails.details.length - 1] : ''}
                    onChange={handleProjectDetailInputChange}
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
                    onChange={handleNewTeamMemberFullNameChange}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Job Role</label>
                  <Input
                    placeholder="Job Role"
                    value={newTeamMember.jobRole}
                    onChange={handleNewTeamMemberJobRoleChange}
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
                        <User className="w-5 h-5 text-orange-500" />
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
                    if (newTeamMember.fullName && newTeamMember.jobRole) {
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
                      {member.image ? (
                        <img src={member.image} alt={member.fullName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
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

            {/* Submit button */}
            <div className="flex justify-end mt-8">
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="mr-2"
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Add Project'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AddNewProject;
