import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Phone, Mail, MapPin, Building2, Hammer, Users, Clock,
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
  X
} from 'lucide-react';

import ClientSidebar from './clientSidebar';

const ClientConstructionPortfolioProfile = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  const { companyId } = useParams();
  
  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        
        // Get token for authorized requests if user is logged in
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // If companyId is provided, fetch that company's portfolio using the public route
        // Otherwise, fetch the current logged-in company's portfolio
        const endpoint = companyId 
          ? `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/portfolio/public/${companyId}`
          : `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/portfolio`;
        
        console.log(`Fetching portfolio from: ${endpoint}`);
        const response = await axios.get(endpoint, { headers });
        
        if (response.data.success) {
          console.log('Successfully loaded portfolio data:', response.data.data);
          setPortfolio(response.data.data);
        } else {
          // Handle case where request succeeded but returned success: false
          setError(response.data.message || 'Failed to load portfolio data');
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        
        // Improved error handling with more specific messages for public route issues
        if (err.response) {
          // Handle specific HTTP error codes
          if (err.response.status === 403) {
            setError("You don't have permission to access this portfolio. Please log in or contact support.");
          } else if (err.response.status === 404) {
            setError("This company portfolio doesn't exist or has been removed.");
          } else if (err.response.status === 500 && companyId) {
            setError("There was a problem accessing the company portfolio. The public access route may not be properly configured.");
          } else {
            setError(`Server error: ${err.response.data?.message || 'Failed to load portfolio data'}`);
          }
        } else if (err.request) {
          // The request was made but no response was received
          setError("Network error. Please check your internet connection and try again.");
        } else {
          // Something happened in setting up the request
          setError('Failed to load portfolio data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchPortfolio();
  }, [companyId]);

  // Use portfolio data without default fallbacks
  const projects = portfolio?.projects || [];

  // Remove default services fallback
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
    let satisfactionValue = "0";
    
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
    }
    
    // Handle client satisfaction logic inside the useMemo
    const clientSatisfactionStat = portfolio?.statistics?.find(
      stat => stat.label.toLowerCase().includes('satisfaction') || 
             stat.label.toLowerCase().includes('client')
    );

    // Update the client satisfaction value if found
    if (clientSatisfactionStat) {
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
      // If project has ID, use URL parameter to navigate to ClientProjectDetails
      // Also pass the companyId in the state to help with fetching
      navigate(`/client-project-details/${project._id}`, {
        state: { 
          project: project,
          companyId: companyId || project.companyId
        }
      });
    } else {
      // Fallback to state-based navigation with company ID
      navigate('/client-project-details', { 
        state: { 
          project: project,
          companyId: companyId || project.companyId
        }
      });
    }
  };

  // Handle sidebar collapse from the sidebar component
  const handleSidebarCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  // Add function to handle service card click
  const handleServiceLearnMore = (e, service) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedService(service);
    setShowServiceModal(true);
  };

  // Add Service Detail Modal component
  const ServiceDetailModal = () => {
    if (!showServiceModal || !selectedService) return null;
    
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fadeIn">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <selectedService.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">{selectedService.title}</h3>
            </div>
            <button 
              onClick={() => setShowServiceModal(false)}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <p className="text-gray-700 mb-6 leading-relaxed">{selectedService.description}</p>
            
            {selectedService.features && (
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900">Key Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedService.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button 
              onClick={() => setShowServiceModal(false)}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              Close
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

  // Update the error state UI to avoid the AlertTriangle reference issue
  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <div className={`h-full fixed left-0 top-0 z-20 transition-all duration-300 bg-white border-r border-gray-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}>
          <ClientSidebar onCollapseChange={setIsCollapsed} isCollapsed={isCollapsed} />
        </div>
        
        <div className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}>
          <div className="min-h-screen flex items-center justify-center p-6">
            <div className="bg-white rounded-xl shadow-md p-8 text-center max-w-lg">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-8 h-8 text-red-500" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Portfolio Not Available</h2>
              <p className="text-gray-600 mb-6">
                {error || "This company hasn't set up their portfolio yet. Please check back later."}
              </p>
              <button
                onClick={() => navigate(-1)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center"
              >
                <ChevronRight className="w-5 h-5 mr-2" />
                Back to Companies
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - with collapse callback */}
      <div
        className={`h-full fixed left-0 top-0 z-20 transition-all duration-300 bg-white border-r border-gray-200 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <ClientSidebar onCollapseChange={setIsCollapsed} isCollapsed={isCollapsed} />
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Hero Section */}
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
                <button 
                  onClick={() => navigate('/send-proposal', { 
                    state: { 
                      companyId: companyId,
                      companyName: portfolio?.companyName || "Construction Company" 
                    } 
                  })} 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-medium inline-flex items-center group transition-all"
                >
                  Send Your Proposal
                  <Mail className="w-5 h-5 ml-2 group-hover:translate-y-[-2px] transition-transform" />
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full font-medium backdrop-blur-sm">
                  Contact Us
                </button>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 to-transparent h-32"></div>
        </div>

        {/* Stats Section - Only render if there are stats */}
        {stats.length > 0 && (
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
        )}

        {/* Services Section - Only render if there are services */}
        {processedServices.length > 0 && (
          <div className="py-20">
            <div className="container mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  {portfolio?.servicesHeading || "Our Services"}
                </h2>
                <p className="text-gray-600">
                  {portfolio?.servicesSummary || "We offer comprehensive construction solutions tailored to meet diverse project requirements."}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {processedServices.map((service, index) => (
                  <div key={index} 
                    className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-orange-200 transition-all h-[320px] flex flex-col"
                  >
                    <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                      <service.icon className="w-7 h-7 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6 line-clamp-6 flex-grow overflow-hidden">{service.description}</p>
                    <button 
                      onClick={(e) => handleServiceLearnMore(e, service)}
                      className="text-orange-500 group-hover:text-orange-600 inline-flex items-center text-sm font-medium mt-auto"
                    >
                      {service.ctaText || "Learn More"}
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Section - Only render if there are projects */}
        {displayedProjects.length > 0 && (
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
                    className="group bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 hover:border-orange-500/50 transition-all cursor-pointer h-[600px] flex flex-col"
                  >
                    <div className="relative h-64 flex-shrink-0">
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
                    <div className="p-6 flex-grow flex flex-col">
                      <h3 className="text-xl font-bold text-white mb-2">{project.title}</h3>
                      <p className="text-gray-400 mb-4 line-clamp-3 overflow-hidden">{project.description}</p>
                      <div className="grid grid-cols-2 gap-4 mb-6 overflow-y-auto flex-grow">
                        {project.details.map((detail, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                            <span className="text-gray-400 text-sm">{detail}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-auto">
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
        )}

        {/* Why Choose Us Section - Only render if portfolio has this section */}
        {portfolio?.whyChooseUs && (
          <div className="py-20 bg-white">
            <div className="container mx-auto px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-500 font-medium">
                      {portfolio?.whyChooseUs?.heading}
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-6">
                    {portfolio?.whyChooseUs?.subheading}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {portfolio?.whyChooseUs?.features.map((item, index) => {
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
                  {/* Updated image container with landscape aspect ratio */}
                  <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-2xl mb-10">
                    <img 
                      src={portfolio?.whyChooseUs?.image}
                      alt="Why Choose Us"
                      className="w-full h-full object-cover"
                    />
                  </div>
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
        )}

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
      {/* Service Detail Modal */}
      <ServiceDetailModal />
    </div>
  );
};

export default ClientConstructionPortfolioProfile;