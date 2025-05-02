import { Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import ClientSidebar from './clientSidebar';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';

const CompanyCard = ({ company, index }) => {
  const navigate = useNavigate();
  // Use company data from props
  const gradients = [
    'bg-gradient-to-r from-orange-200 to-orange-100',
    'bg-gradient-to-r from-yellow-200 to-yellow-100',
    'bg-gradient-to-r from-green-200 to-green-100',
    'bg-gradient-to-r from-blue-200 to-blue-100',
  ];
  
  const gradient = gradients[index % gradients.length];
  
  const handleNavigateToPortfolio = () => {
    // Navigate to the company's portfolio page with companyId as parameter
    navigate(`/client/construction-portfolio/${company._id}`, { 
      state: { 
        company,
        // Add additional data that might be useful for the portfolio page
        source: 'allCompanies'
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ 
        opacity: 1, 
        y: 0,
        transition: { 
          duration: 0.5,
          delay: index * 0.1 
        }
      }}
      viewport={{ once: true }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={handleNavigateToPortfolio} // Add click handler to the entire card
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      {/* Gradient header */}
      <div className={`h-32 relative ${gradient}`}>
        <div className="absolute bottom-0 left-6 transform translate-y-1/2">
          <motion.div 
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1 + index * 0.1
            }}
            className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 overflow-hidden"
          >
            <img
              src={company.logo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${company.name}`}
              alt={`${company.name} logo`}
              className="w-full h-full object-cover"
            />
          </motion.div>
        </div>
      </div>
      
      {/* Content */}
      <div className="pt-12 px-6 pb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded-full text-sm transition-colors"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering the parent div's onClick
              handleNavigateToPortfolio();
            }}
          >
            Portfolio
          </motion.button>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          {company.description || "No description available"}
        </p>
        <div className="flex flex-col gap-2 text-sm text-gray-500">
          {company.website && (
            <div className="flex items-center gap-2">
              <span>{company.website}</span>
            </div>
          )}
          {company.address && (
            <div className="flex items-center gap-2">
              <span>{company.address}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const AllCompanys = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch companies data when component mounts
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        
        // Get the auth token from localStorage
        const token = localStorage.getItem('token');
        
        // Log for debugging
        console.log('Attempting to fetch companies with token:', token ? 'Token exists' : 'No token found');
        
        // Set up proper API URL and headers
        let apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
        
        // Prioritize the new client-specific endpoint
        const endpoints = [
          '/api/clients/companies',   // New client-specific endpoint - try first
          '/clients/companies',       // Alternative format
          '/api/client/companies',    // Another possible format
          '/client/companies',        // Another possible format
          // Original endpoints as fallbacks
          '/api/companies/',
          '/api/companies',
          '/companies/',
          '/companies'
        ];
        
        let response = null;
        let successEndpoint = '';
        
        // Try each endpoint until one works
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${apiUrl}${endpoint}`);
            response = await axios.get(`${apiUrl}${endpoint}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            // If we get here, the request succeeded
            successEndpoint = endpoint;
            console.log(`Success with endpoint: ${apiUrl}${endpoint}`);
            console.log('Response data:', response.data);
            break;
          } catch (e) {
            console.log(`Endpoint ${apiUrl}${endpoint} failed with:`, e.message);
            // Continue to the next endpoint
          }
        }
        
        if (!response) {
          throw new Error('All endpoints failed');
        }
        
        // Process the successful response
        if (response.data && Array.isArray(response.data)) {
          // Map the company data to ensure consistent property names
          const mappedCompanies = response.data.map(company => ({
            _id: company._id,
            name: company.companyName || company.name,
            description: company.businessType || company.description,
            website: company.websiteURL || company.website,
            address: company.registeredOfficeAddress || company.address,
            logo: company.companyLogo || company.logo
          }));
          setCompanies(mappedCompanies);
        } else if (response.data && response.data.companies) {
          // Same mapping for nested data
          const mappedCompanies = response.data.companies.map(company => ({
            _id: company._id,
            name: company.companyName || company.name,
            description: company.businessType || company.description,
            website: company.websiteURL || company.website,
            address: company.registeredOfficeAddress || company.address,
            logo: company.companyLogo || company.logo
          }));
          setCompanies(mappedCompanies);
        } else if (response.data && typeof response.data === 'object') {
          // Try to extract companies from object
          const possibleCompanies = Object.values(response.data).filter(item => 
            item && typeof item === 'object' && 'name' in item
          );
          
          if (possibleCompanies.length > 0) {
            setCompanies(possibleCompanies);
          } else {
            // For demo purposes, create mock companies if none found
            setCompanies([
              {
                _id: '1',
                name: 'Access Engineering PLC',
                description: 'Building Websites and Webapps with Seamless User Experience Across Devices.',
                website: 'accessengineering.lk',
                address: 'Colombo 07'
              },
              {
                _id: '2',
                name: 'ICC Construction Ltd',
                description: 'Specializing in commercial building construction and project management.',
                website: 'icc-construction.com',
                address: 'Kandy'
              },
              {
                _id: '3',
                name: 'Build Masters',
                description: 'Residential construction experts with over 20 years of experience.',
                website: 'buildmasters.lk',
                address: 'Galle'
              }
            ]);
            console.log('Created mock companies for demo purposes');
          }
        }
        
        setError(null);
      } catch (err) {
        console.error('All API endpoints failed:', err);
        
        // For development/demo purposes, create mock data
        console.log('Loading mock data for development');
        setCompanies([
          {
            _id: '1',
            name: 'Access Engineering PLC',
            description: 'Building Websites and Webapps with Seamless User Experience Across Devices.',
            website: 'accessengineering.lk',
            address: 'Colombo 07'
          },
          {
            _id: '2',
            name: 'ICC Construction Ltd',
            description: 'Specializing in commercial building construction and project management.',
            website: 'icc-construction.com',
            address: 'Kandy'
          },
          {
            _id: '3',
            name: 'Build Masters',
            description: 'Residential construction experts with over 20 years of experience.',
            website: 'buildmasters.lk',
            address: 'Galle'
          }
        ]);
        
        // Set a warning instead of error when using mock data
        setError('Using demo data - connect your backend for real data');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);
  
  // Handle sidebar collapse state change
  const handleSidebarCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-jakarta">
      {/* Sidebar - matching settings page implementation */}
      <div className="h-full">
        <ClientSidebar onCollapseChange={handleSidebarCollapse} />
      </div>
      
      {/* Main content with adjusted margin based on sidebar state */}
      <div className={`flex-1 transition-all duration-300 overflow-hidden ${
        isCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Header */}
        <div className="bg-white shadow-sm py-4 px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">All Companies</h1>
              <p className="text-gray-600">Browse and connect with construction companies</p>
            </div>
            
            {/* Search input */}
            <div className="relative">
              <input
                type="search"
                placeholder="Search companies..."
                className="w-64 bg-gray-50 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA540C]/20"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <NotificationBell userType="client" />
          </div>
        </div>

        {/* Main content - with scrollable area */}
        <div className="h-[calc(100vh-64px)] overflow-y-auto">
          <main className="max-w-7xl mx-auto px-8 py-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <p>{error}</p>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg"
                >
                  Try Again
                </button>
              </div>
            ) : companies.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No companies found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {companies.map((company, index) => (
                  <CompanyCard key={company._id || index} company={company} index={index} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AllCompanys;
