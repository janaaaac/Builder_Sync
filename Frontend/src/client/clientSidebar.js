import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Category,
  Note,
  People,
  Profile2User,
  ShoppingBag,
  Chart,
  Setting2,
  DocumentText,
} from "iconsax-react";
import axios from "axios";
// Use a placeholder image as fallback
import DefaultAvatar from "../Assets/default-avatar.png"; 

const ClientSidebar = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClientProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        
        if (!token) {
          console.error("No authentication token found");
          navigate('/login');
          return;
        }
        
        const response = await axios.get("http://localhost:5001/api/clients/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Profile API response:", response); // Log successful response
        
        setClientData({
          fullName: response.data.fullName || "Client User",
          email: response.data.email || "No email available",
          profilePicture: response.data.profilePicture || DefaultAvatar,
          username: response.data.username || "",
          companyName: response.data.companyName || ""
        });
        
      } catch (error) {
        console.error("Detailed client profile error:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: error.config
        });
        
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate('/login');
          return;
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
        navigate('/client-documents');
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
                src={clientData?.profilePicture || DefaultAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite loop
                  e.target.src = DefaultAvatar;
                }}
              />
            )}
          </div>
          
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