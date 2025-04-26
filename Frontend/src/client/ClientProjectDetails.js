import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ChevronDown, ArrowRight, Mail, Phone, MapPin, Plus, X, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const ClientProjectDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams(); // Get projectId from URL params
  
  // Keep only essential state variables
  const [project, setProject] = useState(location.state?.project || null);
  const [loading, setLoading] = useState(!project);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
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
          console.log('No projectId provided, redirecting to companies list');
          navigate('/all-companies');
          return;
        }
        
        console.log('Attempting to fetch project with ID:', projectId);
        
        // Get the company ID from location state if available
        const companyId = location.state?.companyId;
        
        // If no company ID is available, try to fetch the project using a generic endpoint
        if (!companyId) {
          console.warn('No company ID available. Trying public endpoint for all projects');
          try {
            // This public endpoint would need to be created in your API to search projects across portfolios
            const publicProjectEndpoint = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/projects/public/${projectId}`;
            console.log(`Trying to fetch from generic project endpoint: ${publicProjectEndpoint}`);
            
            // If your backend doesn't have this endpoint yet, you would need to create it
            // For now, we'll set an appropriate error message
            setError("The project could not be found. Please access it from the company's portfolio page.");
            setLoading(false);
            return;
          } catch (err) {
            console.error('Error fetching from public projects endpoint:', err);
            setError("Project details cannot be displayed. Please try accessing from the company profile.");
            setLoading(false);
            return;
          }
        }
        
        // Approach: Get the public portfolio of the company and then find the project
        let projectData = null;
        
        try {
          // If we have a company ID, fetch that company's public portfolio
          if (companyId) {
            const publicPortfolioEndpoint = `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/portfolio/public/${companyId}`;
            console.log(`Fetching portfolio from: ${publicPortfolioEndpoint}`);
            
            const portfolioResponse = await axios.get(publicPortfolioEndpoint);
            
            if (portfolioResponse.data?.success && portfolioResponse.data?.data?.projects) {
              // Find the project with matching ID in the portfolio
              const foundProject = portfolioResponse.data.data.projects.find(
                p => p._id === projectId
              );
              
              if (foundProject) {
                projectData = foundProject;
                console.log('Found project in company portfolio data');
              }
            }
          } else {
            // If no company ID, try to fetch from all viewable companies' portfolios
            // This is not ideal for performance, but is a fallback
            setError("Project details cannot be displayed. Please try accessing from the company profile.");
            return;
          }
        } catch (err) {
          console.error('Error fetching project data:', err);
          if (err.response?.status === 404) {
            setError("Project not found. It may have been removed or the ID is incorrect.");
          } else {
            setError("Failed to load project data. Please try again later.");
          }
          setLoading(false);
          return;
        }
        
        if (projectData) {
          console.log('Setting fetched project data:', projectData);
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
          // If we still don't have project data, set an error
          setError("Project information could not be found. Please try again or contact support.");
        }
      } catch (err) {
        console.error('Error in fetch process:', err);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjectData();
  }, [projectId, navigate, location.state, project]);

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

  return (
    <div className="min-h-screen bg-white">
      {/* Image Modal */}
      <ImageModal />
      
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
                {project?.area || (project?.stats && project.stats.area) || "2,500"}
              </div>
              <div className="text-xl font-medium text-gray-800 mb-1">sq ft</div>
              <div className="text-gray-500">Area</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {project?.duration || (project?.stats && project.stats.duration) || "8"}
              </div>
              <div className="text-xl font-medium text-gray-800 mb-1">months</div>
              <div className="text-gray-500">Duration</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {project?.bedrooms || (project?.stats && project.stats.bedrooms) || "5"}
              </div>
              <div className="text-xl font-medium text-gray-800 mb-1">bedrooms</div>
              <div className="text-gray-500">Rooms</div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="text-5xl font-bold text-orange-500 mb-2">
                {formattedPrice}
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
              <div className="bg-gray-50 p-6 rounded-lg border-l-4 border-orange-500 mb-6">
                <p className="text-gray-700 leading-relaxed">
                  {projectDescription.description}
                </p>
              </div>
              
              <div className="bg-white rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold flex items-center">
                    <span className="bg-green-100 text-green-600 p-1 rounded-md mr-2">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                    Key Features & Details
                  </h3>
                </div>
                
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
              </div>
            </div>

            {/* Right sidebar - Project details */}
            <div className="bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-xl font-bold mb-4">Project Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-start border-b border-gray-200 pb-2">
                  <span className="text-gray-600 mr-4 flex-shrink-0">Project</span>
                  <span className="font-medium text-right">{projectDescription.title}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium">{projectDescription.location}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Year</span>
                  <span className="font-medium">{projectDescription.year}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Category</span>
                  <span className="font-medium">{project?.category || "N/A"}</span>
                </div>
                
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-600">Bathrooms</span>
                  <span className="font-medium">{project?.bathrooms || "4.5"}</span>
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
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {displayTeam.map((member, index) => (
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
            ))}
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <div className="bg-gray-900 text-white p-6 text-center">
        <p>© 2025 BuilderSync. All rights reserved.</p>
      </div>
    </div>
  );
};

export default ClientProjectDetails;