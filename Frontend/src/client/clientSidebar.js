import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Category,
  Note,
  DocumentText,
  Setting2,
} from "iconsax-react";
import axios from "axios";
import DefaultAvatar from "../Assets/default-avatar.png"; 

// API configuration
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";
const API_TIMEOUT = 8000; // 8 seconds

const ClientSidebar = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const profileImageRef = useRef(null);
  
  // Function to get a signed URL if direct access fails
  const getSignedProfileUrl = async (originalUrl) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      const response = await axios.post(
        `${API_URL}/api/utils/sign-url`,
        { url: originalUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      return response.data.signedUrl;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      return null;
    }
  };

  useEffect(() => {
    const fetchClientProfile = async () => {
      try {
        // Get authentication token
        const token = localStorage.getItem("token");
        
        if (!token) {
          console.error("No authentication token found");
          navigate('/login');
          return;
        }
        
        // Create axios instance with timeout
        const axiosInstance = axios.create({
          baseURL: API_URL,
          timeout: API_TIMEOUT,
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Make API request
        const response = await axiosInstance.get("/api/clients/profile");
        
        console.log("Profile API response:", response);
        
        // Check for different response structures
        let profileData;
        
        if (response.data.success && response.data.data) {
          // New API response structure with success and data fields
          profileData = response.data.data;
        } else {
          // Legacy API response structure
          profileData = response.data;
        }
        
        // Log the specific profile picture URL for debugging
        console.log("Profile picture URL from API:", profileData.profilePicture);

        // Set client data with proper fallbacks
        setClientData({
          fullName: profileData.fullName || profileData.username || "Client User",
          email: profileData.email || "No email available",
          profilePicture: profileData.profilePicture || DefaultAvatar,
          username: profileData.username || "",
          companyName: profileData.companyName || "",
          clientType: profileData.clientType || "individual"
        });
        
      } catch (error) {
        console.error("Client profile fetch error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        
        // Handle specific error cases
        if (error.response?.status === 401) {
          console.log("Authentication token expired or invalid");
          localStorage.removeItem("token");
          navigate('/login');
          return;
        } else if (error.code === 'ECONNABORTED') {
          console.error("Request timed out. Server might be down.");
          setError("Connection timed out. Please try again later.");
        } else if (!navigator.onLine) {
          console.error("No internet connection");
          setError("You appear to be offline. Please check your connection.");
        } else {
          setError("Failed to load profile. Please try again later.");
        }
        
        // Set fallback data
        setClientData({
          fullName: "Client User",
          email: "No email available",
          profilePicture: DefaultAvatar
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClientProfile();
  }, [navigate]);

  // Handle image error with better S3 handling
  const handleImageError = async (e) => {
    const originalSrc = e.target.src;
    console.log("Profile image failed to load:", originalSrc);
    
    if (originalSrc === DefaultAvatar) {
      return; // Already using default image
    }
    
    try {
      // Check if this is an S3 URL
      if (originalSrc.includes('amazonaws.com')) {
        // Extract filename - improved parsing
        let filename = originalSrc.split('/').pop().split('?')[0];
        
        // Check if we have an appropriate filename
        if (filename && filename.includes('-')) {
          // Use the proxy endpoint directly without trying the original URL first
          const proxyUrl = `${API_URL}/api/utils/s3-image/profile-pictures/${filename}`;
          console.log("Using direct S3 image URL:", proxyUrl);
          e.target.src = proxyUrl;
          return;
        }
      }
      
      // If we're here, we couldn't extract a good filename or it's not an S3 URL
      e.target.src = DefaultAvatar;
    } catch (error) {
      console.error("Error in image fallback logic:", error);
      e.target.src = DefaultAvatar;
    }
    
    // Prevent further error cycles
    e.target.onerror = null;
  };

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    
    if (onCollapseChange) {
      onCollapseChange(newState);
    }
  };

  const handleMenuClick = (item) => {
    setActiveItem(item);
    switch(item) {
      case "Dashboard":
        navigate('/client-dashboard');
        break;
      case "Projects":
        navigate('/client-projects');
        break;
      case "Documents":
        navigate('/all-companies');
        break;
      case "Settings":
        navigate('/client-profile');
        break;
      default:
        // For menu items still under development
        navigate(`/client-${item.toLowerCase()}`);
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/login');
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
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
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
          </>
        )}
        
        {/* User Profile Section */}
        <div className="flex items-center gap-4 mt-8">
          <div className="w-12 h-12 rounded-full bg-[#FFEEE8] flex items-center justify-center overflow-hidden">
            {loading ? (
              <div className="w-full h-full animate-pulse bg-gray-200"></div>
            ) : (
              <img
                ref={profileImageRef}
                src={clientData?.profilePicture || DefaultAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            )}
          </div>
          
          {/* Display error message if any */}
          {error && !isCollapsed && (
            <div className="absolute top-24 right-4 bg-red-50 border border-red-200 text-red-600 px-2 py-1 rounded text-xs">
              {error}
            </div>
          )}
          
          {!isCollapsed && (
            <div>
              <p className="text-xs text-[#9C9AA5] uppercase">CLIENT</p>
              {loading ? (
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse my-1"></div>
              ) : (
                <p className="text-sm font-bold text-black truncate max-w-[120px]">
                  {clientData?.fullName || "Client User"}
                </p>
              )}
              {loading ? (
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-xs text-gray-500 truncate max-w-[120px]">
                  {clientData?.email || "No email available"}
                </p>
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
          <p className="text-xs text-[#9C9AA5] uppercase font-medium">MAIN MENU</p>
        </div>
      )}

      {/* Sidebar Menu */}
      <div className="px-4">
        <ul className="space-y-1">
          {[
            { name: "Dashboard", icon: Category },
            { name: "Projects", icon: Note },
            { name: "Documents", icon: DocumentText },
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
          aria-label="Logout"
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

export default ClientSidebar;