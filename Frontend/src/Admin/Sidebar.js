import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import {
  Category,
  Note,
  People,
  Profile2User,
  Chart,
  Setting2,
} from "iconsax-react";
// Import the admin logo
import AdminLogo from "../Assets/AdminLogo.jpeg";
import { Building2 } from "lucide-react";

const AdminSidebar = ({ onCollapseChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");
  const navigate = useNavigate();

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
        navigate('/admin-dashboard');
        break;
      case "Client Management":
        navigate('/client-management'); // Updated to match the route in App.js
        break;
      case "Company Management":
        navigate('/company-management'); // Updated to match the route in App.js
        break;
      case "Projects":
        navigate('/projects'); // Adjust if needed based on your actual route
        break;
      case "Analytics":
        navigate('/analytics'); // Adjust if needed based on your actual route
        break;
      case "Settings":
        navigate('/settings'); // Adjust if needed based on your actual route
        break;
      default:
        break;
    }
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
            <h1 className="text-2xl font-bold text-[#EA540C] mb-2 font-aclonica">AdminPanel</h1>
            <div className="h-px bg-gray-100 my-2"></div>
          </>
        )}
        <div className="flex items-center gap-4 mt-8">
          <div className="w-12 h-12 rounded-full bg-[#FFEEE8] flex items-center justify-center">
            <img
              src={AdminLogo}
              alt="Admin Logo"
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div>
              <p className="text-xs text-[#9C9AA5] uppercase">ADMIN</p>
              <p className="text-sm font-bold text-black">Admin Name</p>
              <p className="text-xs text-gray-500">admin@example.com</p>
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
            //  { name: "Dashboard", icon: Category },
             { name: "Client Management", icon: People },
             { name: "Company Management", icon: Building2 },
            //  { name: "Projects", icon: Note },
            //  { name: "Analytics", icon: Chart },
            //  { name: "Settings", icon: Setting2 },
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

export default AdminSidebar;