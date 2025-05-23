import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, ArrowRight, Mail, Phone, MapPin, Plus, X, ChevronLeft, ChevronRight, Edit3, Trash2, AlertTriangle, Save, CheckCircle2, FileText, ListChecks, Image, Users, Clipboard, Building2, AlignLeft } from 'lucide-react';

const ProjectDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams(); // Get projectId from URL params
  
  // Move ALL useState calls to the top - before any conditional returns
  const [project, setProject] = useState(location.state?.project || null);
  const [loading, setLoading] = useState(!project);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
  // Add edit mode state variables
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Add these additional state variables for image uploads
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  
  // Add state to control the edit modal form
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState('details');
  
  // Check if user has edit permissions (owner of project)
  const canEdit = useMemo(() => {
    // If no token, user is not logged in
    if (!localStorage.getItem('token')) return false;
    
    // If no projectId in URL, user is coming from their portfolio
    if (!projectId && location.state?.project) return true;
    
    // Otherwise, we need to check if the user is the owner
    // This is a simplified check - you may need to enhance this based on your auth system
    return !project?.companyId || project?.companyId === localStorage.getItem('companyId');
  }, [project, projectId, location.state]);
  
  // Initialize edited project when project data loads
  useEffect(() => {
    if (project && editedProject === null) {
      setEditedProject(JSON.parse(JSON.stringify(project)));
    }
  }, [project, editedProject]);
  
  
  // Handle edit mode toggle - modified to show modal instead of inline editing
  const toggleEditMode = () => {
    if (isEditing) {
      setEditedProject(JSON.parse(JSON.stringify(project)));
      setShowEditModal(false);
    } else {
      setEditedProject(JSON.parse(JSON.stringify(project))); // <--- Add this here
      setShowEditModal(true);
      setActiveEditSection('details');
    }
    setIsEditing(!isEditing);
    setSaveSuccess(false);
    setSaveError(null);
  };
  
  // Handle input changes
  const handleInputChange = (field, value) => {
    console.log(`Field: ${field}, Value: ${value}`);
    setEditedProject(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle nested object changes
  const handleNestedChange = (parentField, field, value) => {
    setEditedProject(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] || {}),
        [field]: value
      }
    }));
  };
  
  // Handle array item changes
  const handleArrayItemChange = (field, index, value) => {
    setEditedProject(prev => {
      const updatedArray = [...(prev[field] || [])];
      updatedArray[index] = value;
      return {
        ...prev,
        [field]: updatedArray
      };
    });
  };
  
  // Add new item to array
  const handleAddArrayItem = (field, item) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), item]
    }));
  };
  
  // Remove item from array
  const handleRemoveArrayItem = (field, index) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index)
    }));
  };
  
  // Save project changes
  const saveProjectChanges = async () => {
    if (!editedProject) return;
    
    setSaveLoading(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveError('Authentication required');
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      // Use the correct endpoint for updating a project
      // Most likely: /api/portfolio/projects/:projectId
      if (!editedProject._id) {
        setSaveError('Project ID missing');
        setSaveLoading(false);
        return;
      }
      const endpoint = `http://localhost:5001/api/portfolio/projects/${editedProject._id}`;

      const response = await axios.put(
        endpoint,
        editedProject,
        { headers }
      );
      
      if (response.data.success) {
        setProject(editedProject);
        setSaveSuccess(true);
        setIsEditing(false);
        setShowEditModal(false);
      } else {
        setSaveError(response.data.message || 'Failed to save changes');
      }
    } catch (err) {
      console.error('Error saving project:', err);
      setSaveError(err.response?.data?.message || 'Error saving changes');
    } finally {
      setSaveLoading(false);
    }
  };
  
  // Delete project
  const deleteProject = async () => {
    if (!project?._id) {
      console.error('No project ID to delete');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveError('Authentication required');
        setIsDeleting(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      const endpoint = `http://localhost:5001/api/portfolio/projects/${project._id}`;
      
      const response = await axios.delete(endpoint, { headers });
      
      if (response.data.success) {
        navigate('/portfolio-profile', { state: { deleted: true }});
      } else {
        setSaveError(response.data.message || 'Failed to delete project');
        setIsDeleting(false);
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setSaveError(err.response?.data?.message || 'Error deleting project');
      setIsDeleting(false);
    }
  };
  
  // Confirmation Modal for Delete
  const DeleteConfirmationModal = () => {
    if (!showDeleteModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center gap-3 text-red-500 mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="text-xl font-bold">Delete Project</h3>
          </div>
          
          <p className="text-gray-700 mb-6">
            Are you sure you want to delete this project? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button 
              onClick={deleteProject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Fetch project data if not available from navigation state
  useEffect(() => {
    const fetchProjectData = async () => {
      // Skip fetch if we already have project data from state
      if (project) {
        console.log('Using project data from navigation state:', project);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Use projectId from URL params if available, otherwise redirect
        if (!projectId) {
          console.log('No projectId provided, redirecting to portfolio page');
          navigate('/portfolio-profile');
          return;
        }
        
        console.log('Attempting to fetch project with ID:', projectId);
        
        // Get the authentication token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No authentication token found in localStorage');
        }
        
        // Try to fetch the project from the portfolio endpoint and find the project by ID
        const portfolioEndpoint = `http://localhost:5001/api/portfolio`;
        let projectData = null;

        try {
          const portfolioResponse = await axios.get(portfolioEndpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (portfolioResponse.data?.success && portfolioResponse.data?.data?.projects) {
            // Find the project with matching ID in the portfolio
            const foundProject = portfolioResponse.data.data.projects.find(
              p => p._id === projectId
            );
            if (foundProject) {
              projectData = foundProject;
              console.log('Found project in portfolio data');
            }
          }
        } catch (portfolioErr) {
          console.error('Failed to fetch portfolio:', portfolioErr.message);
        }
        
        if (projectData) {
          console.log('Setting fetched project data:', projectData);
          // ...existing code for mapping projectData...
          setProject({
            _id: projectData._id,
            title: projectData.title,
            category: projectData.category,
            description: projectData.description,
            image: projectData.image,
            images: projectData.images || [],
            location: projectData.location,
            completionYear: projectData.completionYear,
            details: projectData.details || [],
            price: projectData.price,
            area: projectData.area || projectData.stats?.area,
            duration: projectData.duration || projectData.stats?.duration,
            bedrooms: projectData.bedrooms || projectData.stats?.bedrooms,
            bathrooms: projectData.bathrooms || projectData.stats?.bathrooms,
            team: projectData.team?.map(member => ({
              fullName: member.fullName,
              jobRole: member.jobRole,
              image: member.image
            })) || []
          });
        } else if (location.state?.project) {
          console.log('Using project data from navigation state as fallback');
          setProject(location.state.project);
        } else {
          // ...existing code for simulated project...
          setProject({
            _id: projectId,
            title: "Luxury Villa Project",
            category: "Residential",
            description: "This luxury villa showcases modern architectural elements with high-end finishes and sustainable features.",
            location: "Colombo, Sri Lanka",
            completionYear: "2023",
            price: "200M",
            details: [
              "5,000 square feet of living space",
              "Infinity pool with ocean view",
              "Smart home technology throughout",
              "Solar power system with battery backup",
              "Indoor-outdoor living design",
              "Private garden with native plants"
            ],
            image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
            images: [
              "https://images.unsplash.com/photo-1613490493576-7fde63acd811",
              "https://images.unsplash.com/photo-1576013551627-0ae7d1d6ad31",
              "https://images.unsplash.com/photo-1600585154340-be6161a56a0c"
            ],
            area: "5,000",
            duration: "12",
            bedrooms: "6",
            bathrooms: "5.5",
            team: [
              {
                fullName: "Evelyn Rose",
                jobRole: "Project Manager",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2"
              },
              {
                fullName: "John Landon",
                jobRole: "Architect",
                image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5"
              }
            ]
          });
        }
      } catch (err) {
        // ...existing error handling...
        if (location.state?.project) {
          setProject(location.state.project);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId, navigate, location.state, project]); 

  // Prepare data variables - only use actual project images from database
  const projectImages = useMemo(() => {
    if (project?.images?.length) {
      // If project has images, format them into objects with url and title
      console.log('Using project images from API:', project.images);
      return project.images.map((url, index) => ({
        url,
        title: project.imageTitles?.[index] || `Project Image ${index + 1}`
      }));
    }
    
    // If we have a single project image but no images array
    if (project?.image) {
      return [{
        url: project.image,
        title: "Main Project Image"
      }];
    }
    
    // No images available
    return [];
  }, [project]);

  // Also update other parts of the component that might try to access undefined
  const initialImage = projectImages.length > 0 ? projectImages[0].url : "";
  
  // Create a projectDescription object using the passed project data or defaults
  const projectDescription = useMemo(() => ({
    title: project?.title || "Modern Two-Story Luxury Residence",
    location: project?.location || "Colombo, Sri Lanka",
    year: project?.completionYear || "2024",
    description: project?.description || "This contemporary residence blends modern architectural elements with sustainable design principles...",
    features: project?.details || [
      "Energy-efficient design with solar panels and rainwater harvesting",
      "Smart home automation system throughout the property",
      "Infinity pool with panoramic city views",
      "Landscaped gardens with native plant species",
      "Home theater and entertainment area",
      "Gourmet kitchen with premium appliances",
      "Private office space with built-in storage"
    ]
  }), [project]);

  const teamMembers = [
    { name: "Evelyn Rose", role: "Project Manager", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80", color: "white" },
    { name: "John Landon", role: "Architect", image: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80", color: "white" },
    { name: "Paul Gray", role: "Quantity Surveyor", image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80", color: "white" },
    { name: "Monica Smith", role: "Engineer", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80", color: "white" },
  ];

  // Use the project's team if available, otherwise use the default team members
  const displayTeam = useMemo(() => {
    if (project?.team?.length) {
      return project.team.map(member => ({
        fullName: member.fullName,
        jobRole: member.jobRole,
        image: member.image,
        color: 'white' // Add default color for UI consistency
      }));
    }
    return teamMembers; // Fall back to default team members
  }, [project, teamMembers]);

  // Better price formatting with proper handling of backend data
  const formattedPrice = useMemo(() => {
    // First check if project has explicit price property
    if (project?.price) {
      return project.price;
    }
    
    // Then check if project has it in stats object
    if (project?.stats?.price) {
      return project.stats.price;
    }
    
    // Check if there's an investment field
    if (project?.investment) {
      return project.investment;
    }
    
    // Fallback for demo purposes
    return "125M";
  }, [project]);



  // Define handler functions using useCallback
  const openModal = useCallback((index) => {
    setModalImageIndex(index);
    setModalOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  }, []);

  const navigateModal = useCallback((direction) => {
    if (direction === 'next') {
      setModalImageIndex((prevIndex) => 
        prevIndex === projectImages.length - 1 ? 0 : prevIndex + 1
      );
    } else {
      setModalImageIndex((prevIndex) => 
        prevIndex === 0 ? projectImages.length - 1 : prevIndex - 1
      );
    }
  }, [projectImages.length]);

  // Add function to handle image uploads
  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setImageUploading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setSaveError('Authentication required to upload images');
        return;
      }
      
      const uploadedUrls = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await axios.post(
          'http://localhost:5001/api/utils/upload',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              // Calculate overall progress for multiple files
              const percentCompleted = Math.round(
                ((i * 100) + (progressEvent.loaded * 100 / progressEvent.total)) / files.length
              );
              setUploadProgress(percentCompleted);
            }
          }
        );
        
        if (response.data.success && response.data.url) {
          uploadedUrls.push(response.data.url);
        }
      }
      
      if (uploadedUrls.length > 0) {
        // Add uploaded images to the edited project
        setEditedProject(prev => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls]
        }));
        
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        setShowImageUploadModal(false);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setSaveError('Failed to upload images');
    } finally {
      setImageUploading(false);
    }
  };

  // Add function to remove image from project
  const handleRemoveImage = (index) => {
    setEditedProject(prev => {
      const updatedImages = [...(prev.images || [])];
      updatedImages.splice(index, 1);
      return { ...prev, images: updatedImages };
    });
  };

  // Add function to add team member
  const handleAddTeamMember = () => {
    setEditedProject(prev => ({
      ...prev,
      team: [
        ...(prev.team || []),
        { fullName: '', jobRole: '', image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d' }
      ]
    }));
  };

  // Add function to update team member
  const handleUpdateTeamMember = (index, field, value) => {
    setEditedProject(prev => {
      const updatedTeam = [...(prev.team || [])];
      updatedTeam[index] = { ...updatedTeam[index], [field]: value };
      return { ...prev, team: updatedTeam };
    });
  };

  // Add function to remove team member
  const handleRemoveTeamMember = (index) => {
    setEditedProject(prev => {
      const updatedTeam = [...(prev.team || [])];
      updatedTeam.splice(index, 1);
      return { ...prev, team: updatedTeam };
    });
  };

  // Image Upload Modal Component
  const ImageUploadModal = () => {
    if (!showImageUploadModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Upload Project Images</h3>
            <button 
              onClick={() => setShowImageUploadModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 10MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  multiple
                  onChange={(e) => handleImageUpload(e.target.files)}
                />
              </label>
            </div>
          </div>
          
          {imageUploading && (
            <div className="mb-4">
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
      </div>
    );
  };

  // Loading and error UI should come AFTER all hooks are defined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-2xl font-bold mb-4">Error Loading Project</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/portfolio-profile')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg"
          >
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  // Image Modal Component
  const ImageModal = () => {
    if (!modalOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-between p-4 md:p-8">
        {/* Close button */}
        <div className="flex justify-end">
          <button 
            onClick={closeModal}
            className="text-white hover:text-orange-400 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-8 h-8" />
          </button>
        </div>
        
        {/* Main image container with reduced height */}
        <div className="flex-1 flex items-center justify-center relative max-h-[60vh]"> {/* Added max-h-[60vh] */}
          <img 
            src={projectImages[modalImageIndex].url}
            alt={projectImages[modalImageIndex].title}
            className="h-full w-auto max-w-full object-contain mx-auto" // Modified classes
          />
          
          {/* Navigation buttons */}
          <button 
            onClick={() => navigateModal('prev')}
            className="absolute left-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-colors"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => navigateModal('next')}
            className="absolute right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white transition-colors"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          {/* Delete button in edit mode */}
          {isEditing && (
            <button 
              onClick={() => {
                handleRemoveImage(modalImageIndex);
                closeModal();
              }}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 p-2 rounded-full text-white transition-colors"
              aria-label="Delete image"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}
        </div>
        
        {/* Image title */}
        <div className="text-center text-white text-xl font-medium py-4">
          {projectImages[modalImageIndex].title}
        </div>
        
        {/* Thumbnails */}
        <div className="flex justify-center overflow-x-auto gap-2 pb-2 w-full px-4">
          {projectImages.map((image, index) => (
            <div 
              key={index}
              className={`flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${
                modalImageIndex === index ? 'border-orange-500' : 'border-transparent'
              }`}
              onClick={() => setModalImageIndex(index)}
            >
              <img 
                src={image.url}
                alt={image.title}
                className="w-20 h-14 object-cover"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Edit Project Modal Component
  const EditProjectModal = () => {
    if (!showEditModal) return null;
    
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
                <h2 className="text-2xl font-bold tracking-tight">{editedProject?.title || "Untitled Project"}</h2>
                <p className="text-white/80 text-sm">Edit project details and information</p>
              </div>
            </div>
            
            <button 
              onClick={() => {
                setShowEditModal(false);
                setIsEditing(false);
                setEditedProject(JSON.parse(JSON.stringify(project)));
              }}
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
                {id: 'details', label: 'Basic Details', icon: <FileText className="w-4 h-4 mr-2" />},
                {id: 'features', label: 'Features', icon: <ListChecks className="w-4 h-4 mr-2" />},
                {id: 'images', label: 'Project Gallery', icon: <Image className="w-4 h-4 mr-2" />},
                {id: 'team', label: 'Team Members', icon: <Users className="w-4 h-4 mr-2" />}
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
                   width: activeEditSection === 'details' ? '120px' : 
                          activeEditSection === 'features' ? '100px' : 
                          activeEditSection === 'images' ? '130px' : '140px',
                   transform: `translateX(${
                     activeEditSection === 'details' ? '0' :
                     activeEditSection === 'features' ? '120px' :
                     activeEditSection === 'images' ? '220px' : '350px'
                   })`
                 }}></div>
          </div>
          
          {/* Form Content with custom scrollbar */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeEditSection === 'details' && (
              <div className="space-y-8">
                <div className="bg-orange-50 border border-orange-100 p-5 rounded-xl flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
                    <Clipboard className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Project Information</h3>
                    <p className="text-sm text-gray-600">Enter the basic details about your construction project.</p>
                  </div>
                </div>
                
                {/* Structured form with card-based sections */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Building2 className="w-5 h-5 mr-2 text-orange-500" />
                    Project Identity
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Project Title*</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                        value={editedProject?.title || ""}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter project title"
                      />
                      <p className="text-xs text-gray-500">A clear, descriptive name for your project</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                        value={editedProject?.location || ""}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="City, Country"
                      />
                      <p className="text-xs text-gray-500">Where the project is located</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                        value={editedProject?.category || ""}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                      >
                        <option value="">Select category</option>
                        <option value="residential">Residential</option>
                        <option value="commercial">Commercial</option>
                        <option value="industrial">Industrial</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="institutional">Institutional</option>
                        <option value="renovation">Renovation</option>
                        <option value="hospitality">Hospitality</option>
                        <option value="retail">Retail</option>
                      </select>
                      <p className="text-xs text-gray-500">Type of construction project</p>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Completion Year</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
                        value={editedProject?.completionYear || ""}
                        onChange={(e) => handleInputChange('completionYear', e.target.value)}
                        placeholder="YYYY"
                      />
                      <p className="text-xs text-gray-500">When the project was completed</p>
                    </div>
                  </div>
                </div>
                
                {/* Project Description Section */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <AlignLeft className="w-5 h-5 mr-2 text-orange-500" />
                    Project Description
                  </h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Detailed Overview</label>
                    <textarea
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm h-40"
                      value={editedProject?.description || ""}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the project scope, unique features, challenges overcome..."
                    ></textarea>
                    <p className="text-xs text-gray-500 mt-2">A comprehensive description helps clients understand the project better</p>
                  </div>
                </div>
                
                {/* Project Specifications Section */}
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Project Specifications</h4>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Area (sq ft)</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        value={editedProject?.area || ""}
                        onChange={(e) => handleInputChange('area', e.target.value)}
                        placeholder="Area"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Duration (months)</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        value={editedProject?.duration || ""}
                        onChange={(e) => handleInputChange('duration', e.target.value)}
                        placeholder="Duration"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        value={editedProject?.bedrooms || ""}
                        onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                        placeholder="Bedrooms"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        value={editedProject?.bathrooms || ""}
                        onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                        placeholder="Bathrooms"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Investment/Price</label>
                    <div className="flex items-center">
                      <span className="bg-gray-100 px-4 py-3 border border-r-0 rounded-l-lg text-gray-600">LKR</span>
                      <input
                        type="text"
                        className="flex-1 p-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                        value={editedProject?.price || ""}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="Project cost/investment"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Features Section */}
            {activeEditSection === 'features' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-100 p-5 rounded-xl flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
                    <ListChecks className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Project Features</h3>
                    <p className="text-sm text-gray-600">Add all the key features and selling points of your project.</p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-medium text-gray-900">Project Features & Details</h4>
                    <button
                      onClick={() => handleAddArrayItem('details', '')}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Feature
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {(editedProject?.details || []).length > 0 ? (
                      (editedProject?.details || []).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-md border border-gray-100">
                          <div className="text-green-500 flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            value={feature}
                            onChange={(e) => handleArrayItemChange('details', index, e.target.value)}
                            placeholder="Enter project feature or detail"
                          />
                          <button 
                            onClick={() => handleRemoveArrayItem('details', index)}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors flex-shrink-0"
                            title="Remove feature"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="mb-2">No features added yet.</div>
                        <button
                          onClick={() => handleAddArrayItem('details', 'New project feature')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm inline-flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add First Feature
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Images Section */}
            {activeEditSection === 'images' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
                    <Image className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Project Gallery</h3>
                    <p className="text-sm text-gray-600">Upload and manage images of your construction project.</p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-medium text-gray-900">Project Images</h4>
                    <button
                      onClick={() => setShowImageUploadModal(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Upload Images
                    </button>
                  </div>
                  
                  {(editedProject?.images || []).length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {(editedProject?.images || []).map((image, index) => (
                        <div key={index} className="relative group rounded-lg overflow-hidden border border-gray-200">
                          <img 
                            src={image}
                            alt={`Project image ${index + 1}`}
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                      <Image className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="mb-2">No images added yet.</p>
                      <button
                        onClick={() => setShowImageUploadModal(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm inline-flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Upload Project Images
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Team Section */}
            {activeEditSection === 'team' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-100 p-5 rounded-xl flex items-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm mr-4">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Project Team</h3>
                    <p className="text-sm text-gray-600">Add team members who worked on this project.</p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-medium text-gray-900">Team Members</h4>
                    <button
                      onClick={handleAddTeamMember}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Team Member
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(editedProject?.team || []).length > 0 ? (
                      (editedProject?.team || []).map((member, index) => (
                        <div key={index} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 relative">
                          <button 
                            onClick={() => handleRemoveTeamMember(index)}
                            className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                            title="Remove team member"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          
                          <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                              <img 
                                src={member.image || "https://via.placeholder.com/150"}
                                alt={member.fullName || "Team member"}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            
                            <div className="flex-1 space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                                <input 
                                  type="text"
                                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  value={member.fullName || ""}
                                  onChange={(e) => handleUpdateTeamMember(index, 'fullName', e.target.value)}
                                  placeholder="Full Name"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Job Role</label>
                                <input 
                                  type="text"
                                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  value={member.jobRole || ""}
                                  onChange={(e) => handleUpdateTeamMember(index, 'jobRole', e.target.value)}
                                  placeholder="Job Role"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Image URL</label>
                                <input 
                                  type="text"
                                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                                  value={member.image || ""}
                                  onChange={(e) => handleUpdateTeamMember(index, 'image', e.target.value)}
                                  placeholder="Image URL"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <Users className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                        <p className="mb-2">No team members added yet.</p>
                        <button
                          onClick={handleAddTeamMember}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm inline-flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add Team Member
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Enhanced footer with better button styling */}
          <div className="bg-gray-50 p-6 flex justify-between gap-3 border-t border-gray-200">
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2.5 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete Project
            </button>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setIsEditing(false);
                  setEditedProject(JSON.parse(JSON.stringify(project)));
                }}
                className="px-5 py-2.5 border border-gray-300 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition-colors shadow-sm font-medium"
                disabled={saveLoading}
              >
                Cancel
              </button>
              <button 
                onClick={saveProjectChanges}
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Image Modal */}
      <ImageModal />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal />
      
      {/* Add the Edit Project Modal */}
      <EditProjectModal />
      
      {/* Image Upload Modal */}
      <ImageUploadModal />
      
      {/* Edit/Save Controls - only visible when user can edit */}
      {canEdit && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
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
          
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button 
                  onClick={toggleEditMode}
                  className="bg-gray-700 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition-all"
                  title="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
                <button 
                  onClick={saveProjectChanges}
                  disabled={saveLoading}
                  className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all flex items-center justify-center"
                  title="Save Changes"
                >
                  {saveLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-lg transition-all"
                  title="Delete Project"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={toggleEditMode}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-full shadow-lg transition-all"
                  title="Edit Project"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section with Parallax Effect */}
      <div className="relative h-screen overflow-hidden">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img 
          src={initialImage}
          alt={project?.title || "Modern House"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 h-full flex flex-col justify-between p-8">
          <header className="flex justify-between items-center">
            <div className="text-white font-bold text-3xl">BuilderSync</div>
            <button 
              onClick={() => navigate(-1)} 
              className="text-white hover:text-orange-400 transition-colors px-4 py-2"
            >
              Back to Projects
            </button>
          </header>

          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
              {projectDescription.title}
            </h1>
            <p className="text-gray-200 text-lg mb-8">
              {project?.category ? `${project.category} project` : 'Where luxury meets sustainability'} in {projectDescription.location}
            </p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg rounded-full transition-colors">
              Explore Project
            </button>
          </div>

          <ChevronDown className="w-12 h-12 text-white animate-bounce mx-auto" />
        </div>
      </div>

      {/* Stats Section - Modified Layout */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-2 border rounded bg-white text-center"
                    value={editedProject?.area || ""}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    placeholder="Area"
                  />
                ) : (
                  project?.area || (project?.stats && project.stats.area) || "2,500"
                )}
              </div>
              <div className="text-xl font-medium text-gray-800 mb-1">sq ft</div>
              <div className="text-gray-500">Area</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-2 border rounded bg-white text-center"
                    value={editedProject?.duration || ""}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    placeholder="Duration"
                  />
                ) : (
                  project?.duration || (project?.stats && project.stats.duration) || "8"
                )}
              </div>
              <div className="text-xl font-medium text-gray-800 mb-1">months</div>
              <div className="text-gray-500">Duration</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-2 border rounded bg-white text-center"
                    value={editedProject?.bedrooms || ""}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value)}
                    placeholder="Bedrooms"
                  />
                ) : (
                  project?.bedrooms || (project?.stats && project.stats.bedrooms) || "5"
                )}
              </div>
              <div className="text-xl font-medium text-gray-800 mb-1">bedrooms</div>
              <div className="text-gray-500">Rooms</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {isEditing ? (
                  <input
                    type="text"
                    className="w-full p-2 border rounded bg-white text-center"
                    value={editedProject?.price || ""}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="Price/Investment"
                  />
                ) : (
                  formattedPrice
                )}
              </div>
              <div className="text-xl font-medium text-gray-800 mb-1">LKR</div>
              <div className="text-gray-500">Investment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Project Description */}
      <div className="p-8 bg-white" id="description">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 flex items-center">
            <span className="bg-orange-100 text-orange-500 p-1 rounded-md mr-3">
              <ArrowRight className="w-5 h-5" />
            </span>
            Project Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              {isEditing ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Description</label>
                  <textarea
                    className="w-full p-4 border rounded-lg h-40 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    value={editedProject?.description || ""}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the project in detail including scope, challenges, and solutions..."
                  ></textarea>
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-orange-500 mb-6">
                  <p className="text-gray-700 leading-relaxed">
                    {projectDescription.description}
                  </p>
                </div>
              )}
              
              <div className="bg-white rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center">
                    <span className="bg-green-100 text-green-600 p-1 rounded-md mr-2">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    Key Features & Details
                  </h3>
                  
                  {isEditing && (
                    <button
                      onClick={() => handleAddArrayItem('details', '')}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add Feature
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-2 mb-4 bg-gray-50 p-4 rounded-lg">
                    {(editedProject?.details || []).length > 0 ? (
                      (editedProject?.details || []).map((feature, index) => (
                        <div key={index} className="flex items-center gap-2 bg-white p-3 rounded-md shadow-sm">
                          <div className="text-green-500 flex-shrink-0">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <input
                            type="text"
                            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                            value={feature}
                            onChange={(e) => handleArrayItemChange('details', index, e.target.value)}
                            placeholder="Enter project feature or detail"
                          />
                          <button 
                            onClick={() => handleRemoveArrayItem('details', index)}
                            className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors flex-shrink-0"
                            title="Remove feature"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <div className="mb-2">No features added yet.</div>
                        <button
                          onClick={() => handleAddArrayItem('details', 'New project feature')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm inline-flex items-center gap-1 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add First Feature
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectDescription.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
                        <div className="text-green-500 mt-0.5 flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar - Project details */}
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-4">Project Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                  <span className="text-gray-600 mr-4 flex-shrink-0">Project</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-right"
                      value={editedProject?.title || ""}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                    />
                  ) : (
                    <span className="font-medium text-right">{projectDescription.title}</span>
                  )}
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Location</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-right"
                      value={editedProject?.location || ""}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  ) : (
                    <span className="font-medium">{projectDescription.location}</span>
                  )}
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Year</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-right"
                      value={editedProject?.completionYear || ""}
                      onChange={(e) => handleInputChange('completionYear', e.target.value)}
                    />
                  ) : (
                    <span className="font-medium">{projectDescription.year}</span>
                  )}
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Category</span>
                  {isEditing ? (
                    <select
                      className="w-full p-2 border rounded text-right"
                      value={editedProject?.category || ""}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      <option value="">Select category</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="infrastructure">Infrastructure</option>
                    </select>
                  ) : (
                    <span className="font-medium">{project?.category || "N/A"}</span>
                  )}
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Bathrooms</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-right"
                      value={editedProject?.bathrooms || ""}
                      onChange={(e) => handleInputChange('bathrooms', e.target.value)}
                    />
                  ) : (
                    <span className="font-medium">{project?.bathrooms || "4.5"}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Gallery */}
      <div className="p-8 bg-gray-50" id="gallery">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Project Gallery</h2>
            
            {/* Add image upload button when in editing mode */}
            {isEditing && (
              <button 
                onClick={() => setShowImageUploadModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Images
              </button>
            )}
          </div>
          
          {projectImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Featured Image */}
              <div 
                className="h-72 md:h-auto rounded-2xl overflow-hidden cursor-pointer"
                onClick={() => openModal(activeImage)}
              >
                <img 
                  src={projectImages[activeImage].url}
                  alt="Featured"
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-700"
                />
              </div>
              
              {/* Thumbnail Grid - only shown if there are multiple images */}
              {projectImages.length > 1 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {projectImages.slice(0, Math.min(6, projectImages.length)).map((image, index) => (
                    <div 
                      key={index}
                      className={`relative rounded-xl overflow-hidden cursor-pointer aspect-square
                        ${activeImage === index ? 'ring-4 ring-orange-500' : ''}`}
                      onClick={() => {
                        setActiveImage(index);
                        openModal(index);
                      }}
                    >
                      <img 
                        src={image.url}
                        alt={image.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {index === 5 && projectImages.length > 6 ? (
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                          <Plus className="w-8 h-8 text-white mb-2" />
                          <span className="text-white font-medium">{projectImages.length - 6} More</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="text-white font-medium">{image.title}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-lg shadow-sm">
              <p className="text-gray-500">No images available for this project.</p>
            </div>
          )}
        </div>
      </div>

      {/* Team Section - Use project's team members if available */}
      <div className="bg-white p-8 pb-16" id="team">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-center">Meet Our Expert Team</h2>
            
            {/* Add team member button when in editing mode */}
            {isEditing && (
              <button 
                onClick={handleAddTeamMember}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Team Member
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {isEditing ? (
              // Editable team member cards
              (editedProject?.team || []).map((member, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 relative">
                  {/* Delete button */}
                  <button 
                    onClick={() => handleRemoveTeamMember(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  {/* Member photo */}
                  <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 rounded-full overflow-hidden">
                      <img 
                        src={member.image || "https://via.placeholder.com/150"}
                        alt={member.fullName || "Team member"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* Member information fields */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-center"
                      value={member.fullName || ""}
                      onChange={(e) => handleUpdateTeamMember(index, 'fullName', e.target.value)}
                      placeholder="Full Name"
                    />
                    
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-center text-orange-500"
                      value={member.jobRole || ""}
                      onChange={(e) => handleUpdateTeamMember(index, 'jobRole', e.target.value)}
                      placeholder="Job Role"
                    />
                    
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-center text-sm"
                      value={member.image || ""}
                      onChange={(e) => handleUpdateTeamMember(index, 'image', e.target.value)}
                      placeholder="Image URL"
                    />
                  </div>
                </div>
              ))
            ) : (
              // Regular display of team members
              displayTeam.map((member, index) => (
                <div 
                  key={index}
                  className="group relative"
                >
                  <div className={`${member.color || 'white'} rounded-2xl p-6 transform group-hover:-translate-y-2 transition-all duration-300 shadow-lg hover:shadow-xl`}>
                    {/* Profile Image */}
                    <div className="relative w-32 h-32 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500 to-pink-500 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute inset-1 rounded-full bg-white">
                        <img 
                          src={member.image}
                          alt={member.fullName || member.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Member Info */}
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-bold text-gray-800">{member.fullName || member.name}</h3>
                      <p className="text-orange-500 font-medium">{member.jobRole || member.role}</p>
                      
                      {/* Contact Info - Appears on Hover */}
                      <div className="overflow-hidden">
                        <div className="transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                          <div className="pt-4 border-t border-gray-200 mt-4">
                            <div className="flex items-center justify-center space-x-4">
                              <button className="p-2 rounded-full bg-white/50 hover:bg-white transition-colors">
                                <Mail className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-2 rounded-full bg-white/50 hover:bg-white transition-colors">
                                <Phone className="w-4 h-4 text-gray-600" />
                              </button>
                              <button className="p-2 rounded-full bg-white/50 hover:bg-white transition-colors">
                                <MapPin className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Experience Info */}
                      <div className="pt-4 mt-4 border-t border-gray-200/50">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Experience</span>
                          <span className="font-medium text-gray-800">8+ Years</span>
                        </div>
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-gray-600">Projects</span>
                          <span className="font-medium text-gray-800">20+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <div className="bg-gray-900 text-white p-6 text-center">
        <p>© 2025 BuilderSync. All rights reserved.</p>
      </div>

      {/* Add Image Upload Modal */}
      <ImageUploadModal />
    </div>
  );
};

export default ProjectDetails;