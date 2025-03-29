import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  BriefcaseBusiness
} from 'lucide-react';

const ClientSidebar = ({ onCollapseChange }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const handleToggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    if (onCollapseChange) {
      onCollapseChange(newState);
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: <Home size={20} />, path: '/client/dashboard' },
    { name: 'Messages', icon: <MessageSquare size={20} />, path: '/client/messages' },
    { name: 'Projects', icon: <FileText size={20} />, path: '/client/projects' },
    { name: 'Companies', icon: <BriefcaseBusiness size={20} />, path: '/client/companies' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/client/settings' }
  ];

  return (
    <div 
      className={`fixed top-0 left-0 h-full bg-white shadow-sm transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className={`flex items-center ${collapsed ? 'justify-center py-6' : 'px-6 py-6'}`}>
          {!collapsed && <span className="text-xl font-bold text-gray-800">Builder Sync</span>}
          {collapsed && <span className="text-xl font-bold text-gray-800">BS</span>}
        </div>
        
        <div className="mt-6 flex-1 overflow-y-auto">
          <ul className="space-y-2 px-3">
            {menuItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-3 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-orange-100 text-orange-500'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="ml-3 text-sm font-medium">{item.name}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 border-t">
          <button
            onClick={handleToggleCollapse}
            className="w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            {!collapsed && <span className="ml-2 text-sm">Collapse</span>}
          </button>
          
          <Link
            to="/logout"
            className="mt-2 w-full flex items-center justify-center p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            {!collapsed && <span className="ml-2 text-sm">Logout</span>}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClientSidebar;