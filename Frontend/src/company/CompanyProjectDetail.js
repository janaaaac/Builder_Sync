import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CompanySidebar from './CompanySideBar';
import { Building, Calendar, MapPin, DollarSign, Users, Clock, CheckCircle, FileText, ArrowLeft, Upload, Download, Trash2, Plus, X, ClipboardList, FileUp, AlertCircle } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const CompanyProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(
          `${API_URL}/api/projects/${projectId}`,
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

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
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
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-orange-500" />
              Team Members
            </h2>
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
          </div>
          {/* Project Documents Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
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
        </div>
      </div>
    </div>
  );
};

export default CompanyProjectDetail;
