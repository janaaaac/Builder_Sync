// Frontend/src/Staff/StaffProjectDetail.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StaffSidebar from './staffSideBar';
import { Building, Calendar, MapPin, DollarSign, Users, Clock, CheckCircle, FileText, ArrowLeft, Upload, Download, Trash2, Plus, X, ClipboardList, FileUp, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const StaffProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [plans, setPlans] = useState([]);
  const [showPlanUploadModal, setShowPlanUploadModal] = useState(false);
  const [planUploadLoading, setPlanUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [planDescription, setPlanDescription] = useState('');
  const [planVersion, setPlanVersion] = useState('1.0');
  const [selectedPlanType, setSelectedPlanType] = useState('floorPlans');
  const fileInputRef = useRef(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState('');
  const [unauthorizedMsg, setUnauthorizedMsg] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `${API_URL}/api/projects/staff/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.success) {
          setProject(data.data);
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, navigate]);

  // Fetch project plans when component mounts
  useEffect(() => {
    fetchProjectPlans();
  }, [projectId]);

  // Fetch plans for the current project
  const fetchProjectPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/projects/${projectId}/plans`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching project plans:', error);
    }
  };

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // Handle plan file selection
  const handlePlanFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Upload plan files
  const handlePlanUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setPlanUploadLoading(true);
      setUploadProgress(0);
      setErrorMessage('');

      const token = localStorage.getItem('token');
      
      // Create form data
      const formData = new FormData();
      
      // Add all selected files under the selected plan type
      Array.from(files).forEach(file => {
        formData.append(selectedPlanType, file);
      });
      
      // Add description and version
      formData.append('description', planDescription);
      formData.append('version', planVersion);

      // Upload files
      const response = await axios.post(
        `${API_URL}/api/projects/${projectId}/plans`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      );

      if (response.data.success) {
        // Reset form
        setPlanDescription('');
        setPlanVersion('1.0');
        setSelectedPlanType('floorPlans');
        
        // Refresh plans
        await fetchProjectPlans();
        
        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // Close modal
        setShowPlanUploadModal(false);
      } else {
        setErrorMessage(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading plans:', error);
      setErrorMessage(error.response?.data?.message || 'Error uploading plans');
    } finally {
      setPlanUploadLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete a plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `${API_URL}/api/projects/${projectId}/plans/${planId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        // Remove plan from state
        setPlans(plans.filter(plan => plan._id !== planId));
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan. Please try again.');
    }
  };

  // Function to get status badge styling
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={16} className="mr-1" /> },
      'ongoing': { bg: 'bg-primary-light/20', text: 'text-primary-dark', icon: <Clock size={16} className="mr-1" /> },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={16} className="mr-1" /> },
      'delayed': { bg: 'bg-red-100', text: 'text-red-800', icon: <Clock size={16} className="mr-1" /> },
    };
    
    const defaultStyle = { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Clock size={16} className="mr-1" /> };
    return statusMap[status?.toLowerCase()] || defaultStyle;
  };

  // Function to get file icon based on mime type
  const getFileIcon = (mimeType, fileName) => {
    if (mimeType?.includes('image/')) {
      return <img 
        src={fileName} 
        alt="Plan thumbnail" 
        className="w-10 h-10 object-cover rounded" 
        onError={(e) => {
          e.target.onError = null;
          e.target.src = "https://via.placeholder.com/40?text=Plan";
        }}
      />;
    }
    
    // Return appropriate icon based on file type
    if (mimeType?.includes('pdf')) {
      return <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center text-red-600">PDF</div>;
    } else if (mimeType?.includes('word')) {
      return <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600">DOC</div>;
    } else if (mimeType?.includes('sheet') || mimeType?.includes('excel')) {
      return <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center text-green-600">XLS</div>;
    } else if (fileName?.endsWith('.dwg') || fileName?.endsWith('.dxf') || mimeType?.includes('acad')) {
      return <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center text-purple-600">CAD</div>;
    }
    
    // Default icon
    return <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-gray-600"><FileText size={20} /></div>;
  };

  // Format bytes to human readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to format plan type
  const formatPlanType = (planType) => {
    if (!planType) return 'Other Plans';
    
    // Convert camelCase to Title Case with Spaces
    return planType
      .replace(/([A-Z])/g, ' $1') // Add space before uppercase letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace('Plans', ' Plans') // Add space before "Plans"
      .trim(); // Remove any extra spaces
  };

  // Get current user's role
  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/api/staff/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setCurrentUserRole(response.data.data.role);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchCurrentUserProfile();
  }, []);

  // Check if current user is an architect
  const isArchitect = () => {
    return currentUserRole === 'architect';
  };

  // Handle plan upload button click with role check
  const handleUploadButtonClick = () => {
    if (isArchitect()) {
      setShowPlanUploadModal(true);
      setUnauthorizedMsg(false);
    } else {
      setUnauthorizedMsg(true);
      setTimeout(() => setUnauthorizedMsg(false), 5000);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  
  if (!project) return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="text-red-500 text-5xl mb-4">404</div>
        <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
        <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <button 
          onClick={() => navigate('/staff-projects')} 
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-all"
        >
          Back to Projects
        </button>
      </div>
    </div>
  );

  const statusBadge = getStatusBadge(project.status);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <StaffSidebar onCollapseChange={handleSidebarCollapse} />

      <div 
        className="flex-1 transition-all duration-300 overflow-y-auto"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >
        {/* Back Button & Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center text-gray-600 hover:text-primary transition-colors"
            >
              <ArrowLeft size={18} className="mr-1" />
              <span>Back to Projects</span>
            </button>
            
            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
              {statusBadge.icon}
              <span className="capitalize">{project.status}</span>
            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Project Header Card */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
            <div className="md:flex">
              <div className="p-8 md:flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                <p className="text-gray-600 mb-6">{project.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <Building className="h-5 w-5 text-primary mt-0.5 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company</p>
                      <p className="font-medium">{project.company?.name || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-primary mt-0.5 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Client</p>
                      <p className="font-medium">{project.client?.fullName || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 text-primary mt-0.5 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-medium">${project.budget || 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Location</p>
                      <p className="font-medium">{project.location || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Project Timeline Card */}
              <div className="bg-gray-50 md:w-64 p-6 flex flex-col justify-center">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-primary" />
                  Timeline
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Created on</p>
                    <p className="font-medium">{new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Updated on</p>
                    <p className="font-medium">{new Date(project.updatedAt).toLocaleDateString()}</p>
                  </div>
                  
                  {project.startDate && (
                    <div>
                      <p className="text-xs text-gray-500">Start Date</p>
                      <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  
                  {project.endDate && (
                    <div>
                      <p className="text-xs text-gray-500">End Date</p>
                      <p className="font-medium">{new Date(project.endDate).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Team Members Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-primary" />
              Team Members
            </h2>
            
            {(project.staff || []).length > 0 ? (
              <div className="overflow-x-auto">
                {(() => {
                  // Group members by role
                  const membersByRole = {};
                  (project.staff || []).forEach(member => {
                    const role = member.role || 'other';
                    if (!membersByRole[role]) {
                      membersByRole[role] = [];
                    }
                    membersByRole[role].push(member);
                  });
                  
                  // Sort roles by count (descending) and then alphabetically
                  const sortedRoles = Object.keys(membersByRole).sort((a, b) => {
                    const countDiff = membersByRole[b].length - membersByRole[a].length;
                    if (countDiff !== 0) return countDiff;
                    return a.localeCompare(b);
                  });
                  
                  // Format role name for display
                  const formatRoleName = (role) => {
                    return role.replace(/_/g, ' ').split(' ').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                    ).join(' ');
                  };
                  
                  return (
                    <div>
                      <div className="overflow-hidden border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">#</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {/* First row showing all roles */}
                            <tr className="bg-gray-50">
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 font-medium">Roles</td>
                              <td colSpan="2" className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {sortedRoles.map(role => (
                                    <div key={role} className="bg-white px-3 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 flex items-center">
                                      {formatRoleName(role)}
                                      <span className="ml-1.5 bg-primary text-white text-xs rounded-full px-2 py-0.5">{membersByRole[role].length}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                            
                            {/* All team members */}
                            {sortedRoles.flatMap((role, roleIndex) => 
                              membersByRole[role].map((member, memberIndex) => (
                                <tr key={`member-${member._id}`} className={memberIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                    {memberIndex + 1}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center">
                                      <img
                                        src={member.profilePicture || '/Assets/default-avatar.png'}
                                        alt={member.fullName}
                                        className="w-9 h-9 rounded-full object-cover border-2 border-white shadow mr-3"
                                        onError={e => { e.target.onerror = null; e.target.src = '/Assets/default-avatar.png'; }}
                                      />
                                      <div className="font-medium text-gray-900">{member.fullName}</div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                    <span className="px-2.5 py-0.5 rounded-full bg-primary bg-opacity-10 text-primary">
                                      {formatRoleName(role)}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <p className="text-gray-500 italic">No team members assigned yet.</p>
            )}
          </div>
          
          {/* Project Plans Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-primary" />
                Project Plans
              </h2>
              
              <button
                onClick={handleUploadButtonClick}
                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${isArchitect() ? 'bg-primary text-white hover:bg-primary-dark' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                title={isArchitect() ? "Upload Plans" : "Only architects can upload plans"}
              >
                <FileUp size={16} className="mr-1" />
                Upload Plans
              </button>
            </div>
            
            {showSuccessMessage && (
              <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg border border-green-200 flex items-center">
                <CheckCircle size={18} className="mr-2" />
                Plans uploaded successfully!
              </div>
            )}

            {unauthorizedMsg && (
              <div className="mb-4 p-3 bg-amber-50 text-amber-700 rounded-lg border border-amber-200 flex items-center">
                <AlertCircle size={18} className="mr-2" />
                Only architects can upload project plans. Please contact an architect for plan uploads.
              </div>
            )}
            
            {plans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans.map((plan, index) => (
                      <tr key={`${plan._id}-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {getFileIcon(plan.type, plan.url)}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                              <div className="text-xs text-gray-500 max-w-xs truncate">{plan.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatPlanType(plan.planType)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {plan.version || '1.0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(plan.uploadDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatBytes(plan.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <a
                              href={plan.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary-dark"
                              title="Download"
                            >
                              <Download size={18} />
                            </a>
                            {isArchitect() && (
                              <button
                                onClick={() => handleDeletePlan(plan._id)}
                                className="text-red-500 hover:text-red-700"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-gray-500 mb-1">No plans available</h3>
                <p className="text-sm text-gray-400">Project plans will appear here when added</p>
                {!isArchitect() && (
                  <p className="text-sm text-amber-500 mt-3">
                    Only architects can upload project plans
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Project Documents Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              Project Documents
            </h2>
            
            {project.documents && project.documents.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.documents.map((doc, index) => (
                  <a 
                    key={`doc-${doc._id || index}-${index}`}
                    href={doc.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    <div className="p-2 rounded bg-primary-light/20 text-primary-dark mr-3">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name || 'Document'}</p>
                      <p className="text-xs text-gray-500">{doc.size || 'Unknown size'}</p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-gray-500 mb-1">No documents available</h3>
                <p className="text-sm text-gray-400">Project documents will appear here when added</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan Upload Modal - Only shown to architects */}
      {showPlanUploadModal && isArchitect() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Upload Project Plans</h3>
              <button 
                onClick={() => setShowPlanUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
                {errorMessage}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Type
                </label>
                <select
                  value={selectedPlanType}
                  onChange={(e) => setSelectedPlanType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                >
                  <option value="floorPlans">Floor Plans</option>
                  <option value="elevationPlans">Elevation Plans</option>
                  <option value="sectionPlans">Section Plans</option>
                  <option value="sitePlans">Site Plans</option>
                  <option value="structuralPlans">Structural Plans</option>
                  <option value="electricalPlans">Electrical Plans</option>
                  <option value="plumbingPlans">Plumbing Plans</option>
                  <option value="otherPlans">Other Plans</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  placeholder="Enter plan description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={planVersion}
                  onChange={(e) => setPlanVersion(e.target.value)}
                  placeholder="1.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Files
                </label>
                <div 
                  onClick={handlePlanFileSelect}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, CAD files, Images, Word, Excel (max. 500MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handlePlanUpload}
                    className="hidden"
                  />
                </div>
              </div>
              
              {planUploadLoading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-primary h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-center mt-2 text-gray-600">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
              
              <div className="flex justify-end pt-2 mt-4 border-t">
                <button
                  onClick={() => setShowPlanUploadModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePlanFileSelect}
                  className="px-4 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  disabled={planUploadLoading}
                >
                  {planUploadLoading ? 'Uploading...' : 'Select Files'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProjectDetail;