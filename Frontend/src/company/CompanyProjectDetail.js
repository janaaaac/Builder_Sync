import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CompanySidebar from './CompanySideBar';
import { Building, Calendar, MapPin, DollarSign, Users, Clock, CheckCircle, FileText, ArrowLeft, Upload, Download, Trash2, Plus, X, ClipboardList, FileUp, AlertCircle, LayoutPlanIcon, Eye, XCircle } from 'lucide-react';
import { Modal } from 'react-responsive-modal'; // If you use a modal library, otherwise use a custom modal
import 'react-responsive-modal/styles.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const CompanyProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [allStaff, setAllStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [showUploadPlanModal, setShowUploadPlanModal] = useState(false);
  const [planFile, setPlanFile] = useState(null);
  const [planType, setPlanType] = useState('Floor Plans');
  const [planVersion, setPlanVersion] = useState('1.0');
  const [uploadingPlan, setUploadingPlan] = useState(false);
  const [planError, setPlanError] = useState('');
  const [isArchitect, setIsArchitect] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch current staff profile to check if architect
        try {
          const staffProfileResponse = await axios.get(
            `${API_URL}/api/staff/profile`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (staffProfileResponse.data.success) {
            const staffData = staffProfileResponse.data.data;
            // Check if the staff role is "Architect" (case insensitive)
            setIsArchitect(staffData.role?.toLowerCase().includes('architect'));
          }
        } catch (profileErr) {
          console.error('Error fetching staff profile:', profileErr);
        }
        
        // Fetch project data
        const { data } = await axios.get(
          `${API_URL}/api/projects/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.success) {
          // Add mock plans data for demo purposes
          // This should be removed once real API endpoint for plans is implemented
          const projectWithPlans = {
            ...data.data,
            plans: [
              {
                _id: '1',
                name: '2df7b68f9801e0a6cd1dd80d53eda858.png',
                thumbnailUrl: '/Assets/default-avatar.png', // Replace with actual thumbnail
                type: 'Floor Plans',
                version: '1.0',
                uploadDate: '14 May 2025',
                size: '124.33 KB',
                url: '#',
                isNew: true
              }
            ]
          };
          setProject(projectWithPlans);
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

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const fetchAllStaff = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setAllStaff(data.data);
    } catch (err) {
      setAssignError('Failed to fetch staff list.');
    }
  };

  const openAssignModal = () => {
    setShowAssignModal(true);
    fetchAllStaff();
  };
  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedStaff([]);
    setAssignError('');
  };

  const handleStaffSelect = (staffId) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleAssignStaff = async () => {
    setAssigning(true);
    setAssignError('');
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/api/projects/${projectId}/add-staff`, // <-- fixed endpoint
        { staffIds: selectedStaff },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        // Refresh project data
        const { data: projData } = await axios.get(
          `${API_URL}/api/projects/${projectId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (projData.success) setProject(projData.data);
        closeAssignModal();
      } else {
        setAssignError(data.message || 'Failed to assign staff.');
      }
    } catch (err) {
      setAssignError('Failed to assign staff.');
    } finally {
      setAssigning(false);
    }
  };

  // Plan handling functions
  const handlePlanFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPlanFile(file);
      setPlanError('');
    }
  };

  const uploadPlan = async () => {
    if (!planFile) {
      setPlanError('Please select a file to upload.');
      return;
    }

    setUploadingPlan(true);
    setPlanError('');

    try {
      // In a real implementation, you would upload to your API
      // For now, we'll just simulate a successful upload
      
      // Mock implementation - would be replaced with actual API call
      setTimeout(() => {
        // Create a new plan object
        const newPlan = {
          _id: Date.now().toString(),
          name: planFile.name,
          thumbnailUrl: '/Assets/default-avatar.png', // Would be generated by backend
          type: planType,
          version: planVersion,
          uploadDate: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
          size: `${(planFile.size / 1024).toFixed(2)} KB`,
          url: '#',
          isNew: true
        };

        // Add the new plan to the project
        setProject(prev => ({
          ...prev,
          plans: [...(prev.plans || []), newPlan]
        }));

        // Close the modal and reset form
        setShowUploadPlanModal(false);
        setPlanFile(null);
        setPlanType('Floor Plans');
        setPlanVersion('1.0');
        setUploadingPlan(false);
      }, 1500);
      
    } catch (err) {
      setPlanError('Failed to upload plan. Please try again.');
      setUploadingPlan(false);
    }
  };

  const handleViewPlan = (plan) => {
    // Placeholder for viewing plan
    window.open(plan.url, '_blank');
  };

  const handleDownloadPlan = (plan) => {
    // Placeholder for downloading plan
    const link = document.createElement('a');
    link.href = plan.url;
    link.download = plan.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeletePlan = (planId) => {
    // Placeholder for deleting plan
    // In a real implementation, you would call your API
    setProject(prev => ({
      ...prev,
      plans: prev.plans.filter(p => p._id !== planId)
    }));
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (!project) return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
        <div className="text-red-500 text-5xl mb-4">404</div>
        <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
        <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <button 
          onClick={() => navigate('/company-projects')} 
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-all"
        >
          Back to Projects
        </button>
      </div>
    </div>
  );

  // Status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      'pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={16} className="mr-1" /> },
      'in progress': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Clock size={16} className="mr-1" /> },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle size={16} className="mr-1" /> },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle size={16} className="mr-1" /> },
    };
    const defaultStyle = { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Clock size={16} className="mr-1" /> };
    return statusMap[status?.toLowerCase()] || defaultStyle;
  };

  const statusBadge = getStatusBadge(project.status);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <CompanySidebar onCollapseChange={handleSidebarCollapse} />
      <div 
        className="flex-1 transition-all duration-300 overflow-y-auto"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >
        {/* Back Button & Header */}
        <div className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center text-gray-600 hover:text-orange-500 transition-colors"
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
                    <Building className="h-5 w-5 text-orange-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Company</p>
                      <p className="font-medium">{project.company?.name || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Users className="h-5 w-5 text-orange-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Client</p>
                      <p className="font-medium">{project.client?.fullName || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <DollarSign className="h-5 w-5 text-orange-500 mt-0.5 mr-3" />
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-medium">${project.budget || 'Not specified'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-orange-500 mt-0.5 mr-3" />
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
                  <Calendar className="h-5 w-5 mr-2 text-orange-500" />
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="h-5 w-5 mr-2 text-orange-500" />
                Team Members
              </h2>
              <button
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium shadow"
                onClick={openAssignModal}
              >
                Assign Team
              </button>
            </div>
            {(project.staff || []).length > 0 ? (
              <div className="overflow-x-auto">
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
                      {(project.staff || []).map((member, idx) => (
                        <tr key={`member-${member._id}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">{idx + 1}</td>
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
                            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                              {member.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic">No team members assigned yet.</p>
            )}
            {/* Assign Modal */}
            {showAssignModal && (
              <Modal open={showAssignModal} onClose={closeAssignModal} center>
                <h3 className="text-lg font-semibold mb-2">Assign Team Members</h3>
                {assignError && <div className="text-red-500 text-sm mb-2">{assignError}</div>}
                <input
                  type="text"
                  placeholder="Search staff by name or role..."
                  className="w-full mb-3 px-3 py-2 border border-gray-200 rounded text-sm"
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                />
                <div className="max-h-64 overflow-y-auto mb-4">
                  {allStaff.length === 0 ? (
                    <div className="text-gray-500">No staff available.</div>
                  ) : (
                    <ul>
                      {allStaff
                        .filter(staff =>
                          staff.fullName.toLowerCase().includes(staffSearch.toLowerCase()) ||
                          (staff.role && staff.role.toLowerCase().includes(staffSearch.toLowerCase()))
                        )
                        .map(staff => {
                          const alreadyAssigned = (project.staff || []).some(s => s._id === staff._id);
                          return (
                            <li key={staff._id} className="flex items-center mb-2">
                              <img
                                src={staff.profilePicture || '/Assets/default-avatar.png'}
                                alt={staff.fullName}
                                className="w-7 h-7 rounded-full object-cover border mr-2"
                                onError={e => { e.target.onerror = null; e.target.src = '/Assets/default-avatar.png'; }}
                              />
                              <input
                                type="checkbox"
                                id={`staff-${staff._id}`}
                                checked={selectedStaff.includes(staff._id) || alreadyAssigned}
                                onChange={() => handleStaffSelect(staff._id)}
                                className="mr-2"
                                disabled={alreadyAssigned}
                              />
                              <label htmlFor={`staff-${staff._id}`}>{staff.fullName} <span className="text-xs text-gray-500 ml-1">({staff.role})</span>{alreadyAssigned && <span className="ml-1 text-green-500 text-xs">(Assigned)</span>}</label>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <button onClick={closeAssignModal} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  <button
                    onClick={handleAssignStaff}
                    className="px-4 py-2 bg-orange-500 text-white rounded disabled:opacity-50"
                    disabled={assigning || selectedStaff.length === 0}
                  >
                    {assigning ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </Modal>
            )}
          </div>
          {/* Project Documents Section */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2 text-orange-500" />
                Project Documents
              </h2>
            </div>
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
                    <div className="p-2 rounded bg-orange-100 text-orange-700 mr-3">
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
          
          {/* Project Plans Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-orange-500" />
                Project Plans
              </h2>
              {isArchitect && (
                <button
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium shadow flex items-center"
                  onClick={() => setShowUploadPlanModal(true)}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Architectural Plans
                </button>
              )}
            </div>
            
            {project.plans && project.plans.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(project.plans || []).map((plan, index) => (
                      <tr key={`plan-${plan._id || index}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-12 flex-shrink-0 mr-3">
                              <img 
                                className="h-12 w-12 rounded object-cover border border-gray-200" 
                                src={plan.thumbnailUrl || '/Assets/default-plan.png'} 
                                alt="Plan thumbnail"
                                onError={e => { e.target.onerror = null; e.target.src = '/Assets/default-avatar.png'; }}
                              />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{plan.name || `Plan ${index + 1}`}</div>
                              {plan.isNew && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">New</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{plan.type || 'Floor Plans'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{plan.version || '1.0'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{plan.uploadDate || '14 May 2025'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{plan.size || '124.33 KB'}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <button 
                              className="p-1 rounded hover:bg-gray-100" 
                              title="View Plan"
                              onClick={() => handleViewPlan(plan)}
                            >
                              <Eye className="h-5 w-5 text-blue-500" />
                            </button>
                            <button 
                              className="p-1 rounded hover:bg-gray-100" 
                              title="Download Plan"
                              onClick={() => handleDownloadPlan(plan)}
                            >
                              <Download className="h-5 w-5 text-gray-500" />
                            </button>
                            {isArchitect && (
                              <button 
                                className="p-1 rounded hover:bg-gray-100" 
                                title="Delete Plan"
                                onClick={() => handleDeletePlan(plan._id)}
                              >
                                <XCircle className="h-5 w-5 text-red-500" />
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
                <h3 className="text-gray-500 mb-1">No plans uploaded yet</h3>
                <p className="text-sm text-gray-400">Project plans will appear here when uploaded</p>
              </div>
            )}
            
            {!project.plans?.length && !isArchitect && (
              <div className="text-center py-8 px-4">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-gray-500 mb-1">No plans uploaded yet</h3>
                <p className="text-sm text-gray-400">Only architectural staff can upload project plans</p>
              </div>
            )}
            
            {!project.plans?.length && isArchitect && (
              <div className="text-center py-8 px-4">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-gray-500 mb-1">No plans uploaded yet</h3>
                <p className="text-sm text-gray-400">Click the 'Upload Plans' button to add architectural plans</p>
              </div>
            )}
            
          </div>
        </div>
      </div>
      
      {/* Upload Plan Modal */}
      {showUploadPlanModal && (
        <Modal open={showUploadPlanModal} onClose={() => setShowUploadPlanModal(false)} center>
          <div className="w-full max-w-md p-2">
            <h3 className="text-lg font-semibold mb-4">Upload Architectural Plan</h3>
            {planError && <div className="text-red-500 mb-3 text-sm">{planError}</div>}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan File</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*,.pdf,.dwg"
                        onChange={handlePlanFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF, DWG up to 10MB</p>
                </div>
              </div>
              {planFile && (
                <div className="mt-2 text-sm text-gray-500">
                  Selected file: <span className="font-medium">{planFile.name}</span> ({(planFile.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
                <select
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value)}
                >
                  <option value="Floor Plans">Floor Plans</option>
                  <option value="Elevation Plans">Elevation Plans</option>
                  <option value="Section Plans">Section Plans</option>
                  <option value="Electrical Plans">Electrical Plans</option>
                  <option value="Plumbing Plans">Plumbing Plans</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                  value={planVersion}
                  onChange={(e) => setPlanVersion(e.target.value)}
                  placeholder="1.0"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowUploadPlanModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
              >
                Cancel
              </button>
              <button
                onClick={uploadPlan}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-medium disabled:opacity-50"
                disabled={uploadingPlan || !planFile}
              >
                {uploadingPlan ? 'Uploading...' : 'Upload Plan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CompanyProjectDetail;
