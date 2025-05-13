import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Category,
  Note,
  MessageNotif,
  Calendar,
  Task,
  StatusUp,
  Setting2,
  Profile2User,
  DocumentText,
  Briefcase // Added for Tools icon, assuming it exists or using Setting2 as fallback
} from "iconsax-react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const StaffSidebar = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const navigate = useNavigate();
  
  // Staff data state management
  const [staffData, setStaffData] = useState({
    fullName: '',
    email: '',
    role: '',
    profilePicture: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchStaffProfile = async () => {
      try {
        setStaffData(prev => ({...prev, loading: true, error: null}));
        
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");

        const response = await axios.get(
          `${API_URL}/api/staff/profile`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log("Staff profile response:", response.data);
        
        if (response.data.success) {
          setStaffData({
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

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate('/login');
          return;
        }

        setStaffData(prev => ({
          ...prev,
          loading: false,
          error: "Failed to load profile. Please try again."
        }));
      }
    };

    fetchStaffProfile();
  }, [navigate]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newState = !prev;
      if (onCollapseChange) onCollapseChange(newState);
      return newState;
    });
  };

  const handleMenuClick = (item) => {
    setActiveItem(item);
    switch(item) {
      case "Dashboard":
        navigate('/staff-dashboard');
        break;
      case "Projects":
        navigate('/staff-projects');
        break;
      case "Tasks":
        navigate('/staff-tasks');
        break;
      case "Calendar":
        navigate('/staff-calendar');
        break;
      case "Documents":
        navigate('/staff-documents');
        break;
      case "Team":
        navigate('/staff-notification');
        break;
      case "Settings":
        navigate('/staff-settings');
        break;
      case "Chat":
        navigate('/staff-chat');
        break;
      case "Tools": // Added Tools case
        navigate('/qs-tools');
        break;
      default:
        break;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
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
            {staffData.loading ? (
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
            ) : (
              <p className="text-sm text-gray-600 mb-6">
                Staff Portal
              </p>
            )}
          </>
        )}
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FFEEE8] flex items-center justify-center overflow-hidden">
            {staffData.loading ? (
              <div className="w-full h-full animate-pulse bg-gray-200"></div>
            ) : staffData.profilePicture ? (
              <img
                src={staffData.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/50?text=Staff";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
                {staffData.fullName?.charAt(0) || "S"}
              </div>
            )}
          </div>
          
          {!isCollapsed && (
            <div>
              <p className="text-xs text-[#9C9AA5] uppercase">STAFF</p>
              {staffData.loading ? (
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse my-1"></div>
              ) : (
                <p className="text-sm font-bold text-black truncate max-w-[120px]">
                  {staffData.fullName || "Staff Member"}
                </p>
              )}
              {staffData.loading ? (
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <>
                  <p className="text-xs text-gray-500 truncate max-w-[120px]">
                    {staffData.email || "No email available"}
                  </p>
                  <p className="text-xs text-blue-600 mt-1 capitalize">
                    {staffData.role || "Staff"}
                  </p>
                </>
              )}
              {staffData.error && (
                <p className="text-xs text-red-500 mt-1">{staffData.error}</p>
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
            { name: "Tasks", icon: Task },
            { name: "Calendar", icon: Calendar },
            { name: "Chat", icon: MessageNotif },
            { name: "Documents", icon: DocumentText },
            { name: "Team", icon: Profile2User },
            // Conditionally add Tools menu item
            ...(staffData.role === 'quantity_surveyor' || staffData.role === 'qs' ? [{ name: "Tools", icon: Briefcase }] : []),
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

export default StaffSidebar;