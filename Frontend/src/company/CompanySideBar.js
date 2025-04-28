import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Category,
  Note,
  MessageNotif,
  DollarSquare,
  Folder,
  StatusUp,
  Setting2,
  Profile2User,
  DocumentText,
  Gallery, // Import the Gallery icon for Portfolio
} from "iconsax-react";
import axios from "axios";

const CompanySidebar = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const navigate = useNavigate();
  
  // Add portfolio completion status
  const [portfolioComplete, setPortfolioComplete] = useState(false);
  
  // Enhanced company data state management
  const [companyData, setCompanyData] = useState({
    companyName: '',
    email: '',
    companyLogo: '',
    contactPersonName: '',
    isApproved: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        setCompanyData(prev => ({...prev, loading: true, error: null}));
        
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const response = await axios.get(
          "http://localhost:5001/api/companies/profile",
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log("Profile response:", response.data);
        
        if (response.data.success) {
          // Check if portfolio is complete from the response
          const hasPortfolio = response.data.data.hasPortfolio || false;
          setPortfolioComplete(hasPortfolio);
          
          setCompanyData({
            ...response.data.data,
            loading: false,
            error: null
          });
        } else {
          throw new Error(response.data.message || "Failed to fetch profile");
        }
        
      } catch (error) {
        console.error("Profile Error:", {
          status: error.response?.status,
          data: error.response?.data,
          config: error.config
        });

        if (error.response?.status === 403) {
          if (error.response.data?.message?.includes("approval")) {
            navigate('/pending-approval');
          } else {
            alert("You don't have permission to access this");
            navigate('/');
          }
          return;
        }

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate('/login');
          return;
        }

        setCompanyData(prev => ({
          ...prev,
          loading: false,
          error: "Failed to load profile. Please try again."
        }));
      }
    };

    // Listen for portfolio completion event in localStorage
    const onPortfolioComplete = () => {
      fetchCompanyProfile();
    };

    window.addEventListener('portfolioComplete', onPortfolioComplete);

    fetchCompanyProfile();

    return () => {
      window.removeEventListener('portfolioComplete', onPortfolioComplete);
    };
  }, [navigate]);

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    
    // Notify parent component about the change if callback exists
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  const handleMenuClick = (item) => {
    setActiveItem(item);
    if (item === "Team") {
      navigate('/staff-management');
      return;
    }
    if (item === "Projects") {
      navigate('/project-showcase');
      return;
    }
    if (item === "Settings") {
      navigate('/company-profile');
      return;
    }
    if (item === "Proposals") {
      navigate('/proposal-management');
      return;
    }
    if (item === "Dashboard") {
      navigate('/company-dashboard');
      return;
    }
    if (item === "chat") {
      // Navigate to the company chat page
      navigate('/company-chat');
      return;
    }
    if (item === "Portfolio") {
      // Always check the latest value of portfolioComplete
      if (portfolioComplete === true) {
        navigate('/portfolio-profile');
      } else {
        navigate('/portfolio-setup-test');
      }
      return;
    }
    // ...add other menu items if needed...
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div
      className={`fixed h-screen bg-white shadow-lg transition-all duration-300 font-jakarta ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Toggle Button */}
      <button
        className="absolute top-4 -right-4 w-8 h-8 bg-[#EA540C] text-white rounded-full flex items-center justify-center z-50"
        onClick={toggleSidebar}
      >
        {isCollapsed ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        )}
      </button>

      {/* Sidebar Header */}
      <div className="p-6">
        {!isCollapsed && (
          <>
            <h1 className="text-2xl font-bold text-[#EA540C] mb-2 font-aclonica">BuilderSync</h1>
            <div className="h-px bg-gray-100 my-2"></div>
            {companyData.loading ? (
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
            ) : (
              <p className="text-sm text-gray-600 mb-6">
                {companyData.companyName || "Company Name"}
              </p>
            )}
          </>
        )}
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFEEE8] flex items-center justify-center overflow-hidden">
            {companyData.loading ? (
              <div className="w-full h-full animate-pulse bg-gray-200"></div>
            ) : (
              <img
                src={companyData.companyLogo || "https://via.placeholder.com/50"}
                alt="Company Logo"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/50";
                }}
              />
            )}
          </div>
          
          {!isCollapsed && (
            <div>
              <p className="text-xs text-[#9C9AA5] uppercase">COMPANY</p>
              {companyData.loading ? (
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse my-1"></div>
              ) : (
                <p className="text-sm font-bold text-black truncate max-w-[120px]">
                  {companyData.contactPersonName || "Contact Person"}
                </p>
              )}
              {companyData.loading ? (
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                    {companyData.email || "No email available"}
                  </p>
                  {!companyData.isApproved && (
                    <p className="text-xs text-yellow-600 mt-1">Pending Approval</p>
                  )}
                </>
              )}
              {companyData.error && (
                <p className="text-xs text-red-500 mt-1">{companyData.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100 my-2"></div>

      {/* Menu Label */}
      {!isCollapsed && (
        <div className="px-6 py-2">
          <p className="text-xs text-[#9C9AA5] uppercase font-medium">MAIN</p>
        </div>
      )}

      {/* Sidebar Menu */}
      <div className="px-4">
        <ul className="space-y-1">
          {[
            { name: "Dashboard", icon: Category },
            { name: "Projects", icon: Note },
            { name: "Portfolio", icon: Gallery }, // New Portfolio menu item
            { name: "Proposals", icon: DocumentText },
            { name: "Team", icon: Profile2User },
            { name: "chat", icon: MessageNotif },
            { name: "Documents", icon: Folder },
            { name: "Reports", icon: StatusUp },
            { name: "Settings", icon: Setting2 },
          ].map((item) => (
            <li
              key={item.name}
              className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300 ${
                activeItem === item.name
                  ? "bg-[#FFEEE8] text-[#EA540C]"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => handleMenuClick(item.name)}
            >
              <item.icon
                size="24"
                variant={activeItem === item.name ? "Bold" : "Outline"}
                color={activeItem === item.name ? "#EA540C" : "#606060"}
              />
              {!isCollapsed && (
                <span className={`ml-3 ${activeItem === item.name ? "font-medium" : ""}`}>
                  {item.name}
                  {item.name === "Portfolio" && !portfolioComplete && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      New
                    </span>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      
      {/* Divider */}
      <div className="h-px bg-gray-100 my-2"></div>

      {/* Logout Button */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center">
        <button
          onClick={handleLogout}
          className="flex items-center text-red-600 hover:text-red-700 transition-colors duration-300"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!isCollapsed && <span className="ml-2">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default CompanySidebar;