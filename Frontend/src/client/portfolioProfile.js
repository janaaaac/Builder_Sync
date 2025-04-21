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
} from 'lucide-react';

const ConstructionPortfolioProfile = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  // For the stats section - Make client satisfaction stat dynamic
  const stats = useMemo(() => {
    if (portfolio?.statistics?.length) {
      // Map backend statistics to our format with proper icons
      return portfolio.statistics.map(stat => {
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
    
    // Default stats if none from backend
    return [
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
  }, [portfolio]);

  // Find the client satisfaction stat from backend data if available
  const clientSatisfactionStat = portfolio?.statistics?.find(
    stat => stat.label.toLowerCase().includes('satisfaction') || 
           stat.label.toLowerCase().includes('client')
  );

  // Update the client satisfaction value if found
  if (clientSatisfactionStat) {
    const satisfactionIndex = stats.findIndex(s => s.label === "Client Satisfaction");
    if (satisfactionIndex >= 0) {
      stats[satisfactionIndex].value = clientSatisfactionStat.value;
    }
  }

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

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gray-900 text-white">
        <div className="absolute inset-0">
          <img 
            src={portfolio?.hero?.backgroundImage || "https://images.unsplash.com/photo-1541976590-713941681591"}
            alt="Construction Site"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative container mx-auto px-6 py-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-1 w-20 bg-orange-500 rounded-full"></div>
              <span className="text-orange-500 font-medium">Leading Construction Company</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              {portfolio?.hero?.mainHeading || "Building Tomorrow's"}
              <span className="text-orange-500"> Landmarks</span>
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

      {/* Stats Section */}
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

      {/* Services Section */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600">
              {portfolio?.servicesSummary || 
                "We offer comprehensive construction solutions tailored to meet diverse project requirements across various sectors."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processedServices.map((service, index) => (
              <div key={index} 
                className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-orange-200 transition-all">
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

      {/* Projects Section */}
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
            {projects.map((project) => (
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
                      {portfolio?.clientCount || portfolio?.clients?.length || 
                       (clientSatisfactionStat?.value !== "100%" ? clientSatisfactionStat?.value : "1000+")}
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
  );
};

export default ConstructionPortfolioProfile;