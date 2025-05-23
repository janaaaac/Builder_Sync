import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserCheck, FaUserSlash, FaUsers, FaLock, FaGlobe, FaUserTag } from 'react-icons/fa';

const DocumentSharing = ({ document, onUpdatePermissions }) => {
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(document?.accessControl?.isPublic || false);
  const [allowedRoles, setAllowedRoles] = useState(document?.accessControl?.allowedRoles || []);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (document) {
      setIsPublic(document.accessControl?.isPublic || false);
      setAllowedRoles(document.accessControl?.allowedRoles || []);
      
      // Set initially selected users
      if (document.accessControl?.allowedUsers) {
        setSelectedUsers(document.accessControl.allowedUsers);
      }
    }
    
    fetchAvailableUsers();
  }, [document]);

  const fetchAvailableUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      let projectId = null;
      if (document && document.project) {
        projectId = typeof document.project === 'object' ? document.project._id : document.project;
      }

      let response;
      if (projectId) {
        // If document is project-specific, get users from that project
        response = await axios.get(`${API_URL}/api/projects/${projectId}/staff`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      } else {
        // Only allow company users to fetch all staff
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'company') {
          response = await axios.get(`${API_URL}/api/staff`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } else {
          // For non-company users, do not fetch all staff, just use allowedUsers if present
          setAvailableUsers(document?.accessControl?.allowedUsers || []);
          setLoading(false);
          return;
        }
      }
      if (response && response.data.success) {
        setAvailableUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAvailableUsers(document?.accessControl?.allowedUsers || []); // fallback
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role) => {
    if (allowedRoles.includes(role)) {
      setAllowedRoles(allowedRoles.filter(r => r !== role));
    } else {
      setAllowedRoles([...allowedRoles, role]);
    }
  };

  const toggleUser = (userId) => {
    if (selectedUsers.some(user => user._id === userId)) {
      setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
    } else {
      const user = availableUsers.find(user => user._id === userId);
      if (user) {
        setSelectedUsers([...selectedUsers, user]);
      }
    }
  };

  const savePermissions = async () => {
    setLoading(true);
    try {
      const updatedAccessControl = {
        isPublic,
        allowedRoles,
        allowedUsers: selectedUsers.map(user => user._id),
        userModel: 'Staff' // Default to Staff for now
      };
      
      onUpdatePermissions(updatedAccessControl);
    } catch (error) {
      console.error('Error updating permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(user => 
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Document Sharing Settings</h3>
      
      {/* Access Type */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Access Type</p>
        <div className="flex space-x-2">
          <button
            className={`flex items-center px-3 py-2 rounded-md ${isPublic ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
            onClick={() => setIsPublic(true)}
          >
            <FaGlobe className="mr-2" /> Public
          </button>
          <button
            className={`flex items-center px-3 py-2 rounded-md ${!isPublic ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
            onClick={() => setIsPublic(false)}
          >
            <FaLock className="mr-2" /> Restricted
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {isPublic 
            ? 'All project members can access this document' 
            : 'Only selected roles and users can access this document'}
        </p>
      </div>
      
      {/* Role-based Access */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Role-based Access</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {['company', 'project_manager', 'architect', 'engineer', 'quantity_surveyor', 'client'].map(role => (
            <button
              key={role}
              className={`flex items-center px-3 py-2 rounded-md text-sm ${allowedRoles.includes(role) ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}
              onClick={() => toggleRole(role)}
            >
              <FaUserTag className="mr-2" /> 
              {role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>
      
      {/* User-based Access */}
      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">User-based Access</p>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search users..."
          className="w-full p-2 border border-gray-300 rounded-md mb-3"
        />
        
        <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredUsers.map(user => (
                <li key={user._id} className="p-3 hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        {user.profilePicture ? (
                          <img 
                            src={user.profilePicture} 
                            alt={user.fullName} 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">
                            {user.fullName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{user.fullName}</p>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUser(user._id)}
                      className={`p-1 rounded-full ${
                        selectedUsers.some(u => u._id === user._id)
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {selectedUsers.some(u => u._id === user._id) ? (
                        <FaUserCheck className="w-5 h-5" />
                      ) : (
                        <FaUserSlash className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No users found</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-2">Selected Users ({selectedUsers.length})</p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <div key={user._id} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                <span>{user.fullName}</span>
                <button 
                  onClick={() => toggleUser(user._id)}
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePermissions}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <FaUsers className="mr-2" /> Save Permissions
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentSharing;
