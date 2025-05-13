import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Briefcase, Users, DollarSign, MapPin, CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';
import ClientSidebar from './clientSidebar';

const ProjectSkeleton = () => (
  <div className="border rounded p-4 bg-white shadow">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6 mb-4 animate-pulse"></div>
    <div className="flex flex-wrap gap-4">
      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-1/5 animate-pulse"></div>
    </div>
  </div>
);

const statusColors = {
  completed: 'bg-green-100 text-green-800',
  'in progress': 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-red-100 text-red-800',
  default: 'bg-gray-100 text-gray-800',
};

const statusIcons = {
  completed: <CheckCircle className="w-4 h-4 mr-1" />,
  'in progress': <Clock className="w-4 h-4 mr-1" />,
  pending: <AlertCircle className="w-4 h-4 mr-1" />,
  cancelled: <AlertCircle className="w-4 h-4 mr-1" />,
  default: <Clock className="w-4 h-4 mr-1" />,
};

const getStatusColor = (status) => statusColors[(status || '').toLowerCase()] || statusColors.default;
const getStatusIcon = (status) => statusIcons[(status || '').toLowerCase()] || statusIcons.default;

const ClientProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/projects/client', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data.data || []);
      } catch (err) {
        setError('Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Dedupe projects by id
  const uniqueProjects = projects.filter((proj, idx, self) => self.findIndex(p => p._id === proj._id) === idx);

  // Filter projects based on status
  const filteredProjects = filterStatus === 'all'
    ? uniqueProjects
    : uniqueProjects.filter(project => (project.status || '').toLowerCase() === filterStatus);

  // Get status counts for the filter badges
  const statusCounts = uniqueProjects.reduce((acc, project) => {
    const status = (project.status || '').toLowerCase();
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto p-6 text-center">
      <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-medium text-red-800">{error}</h3>
      <p className="mt-2 text-gray-600">Please try refreshing the page or contact support if the issue persists.</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="h-full">
        <ClientSidebar onCollapseChange={handleSidebarCollapse} />
      </div>
      <div 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '5rem' : '16rem' }}
      >
        <div className="mx-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">My Projects</h2>
            <div className="flex space-x-2">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filterStatus === 'all' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({uniqueProjects.length})
              </button>
              {Object.keys(statusCounts).map(status => (
                <button 
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    filterStatus === status ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
                </button>
              ))}
            </div>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
              <p className="mt-2 text-gray-500">
                {filterStatus === 'all' 
                  ? "You don't have any projects yet." 
                  : `You don't have any ${filterStatus} projects at the moment.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map(project => (
                <div key={project._id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      {/* Company Logo */}
                      <div className="shrink-0">
                        <div className="w-16 h-16 rounded-lg border bg-gray-50 flex items-center justify-center overflow-hidden">
                          {project.company?.logo ? (
                            <img
                              src={project.company.logo}
                              alt={`${project.company?.name || 'Company'} logo`}
                              className="w-full h-full object-contain"
                              onError={e => { e.target.onerror = null; e.target.src = '/Assets/default-avatar.png'; }}
                            />
                          ) : (
                            <Briefcase className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            <Link to={`/client-project-details/${project._id}`} className="hover:text-orange-500 transition-colors">
                              {project.title}
                            </Link>
                          </h3>
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                            {getStatusIcon(project.status)}
                            <span>{project.status}</span>
                          </div>
                        </div>
                        <p className="text-gray-600 line-clamp-2">{project.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{project.company?.name || 'No company'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{project.budget || 'Budget not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{project.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{project.completionYear || 'Year not specified'}</span>
                      </div>
                    </div>
                    {/* Team Members */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-2">Team Members:</div>
                      {project.staff?.length ? (
                        <div className="flex flex-wrap -mx-1">
                          {[...new Map(project.staff.map(member => [member._id || member.email || member.fullName, member])).values()].map((member, idx) => (
                            <div key={`${member._id || member.email || member.fullName}-${idx}`} className="px-1 mb-2">
                              <div className="flex items-center gap-2 bg-gray-100 rounded-full pl-1 pr-3 py-1 border border-gray-200">
                                <div className="w-6 h-6 rounded-full bg-gray-200 border border-gray-300 overflow-hidden flex items-center justify-center">
                                  {member.profilePicture ? (
                                    <img
                                      src={member.profilePicture}
                                      alt={member.fullName}
                                      className="w-full h-full object-cover rounded-full"
                                      onError={e => { e.target.onerror = null; e.target.src = '/Assets/default-avatar.png'; }}
                                    />
                                  ) : (
                                    <img
                                      src={'/Assets/default-avatar.png'}
                                      alt="Default avatar"
                                      className="w-full h-full object-cover rounded-full"
                                    />
                                  )}
                                </div>
                                <span className="text-xs font-medium text-gray-900">{member.fullName}</span>
                                <span className="text-xs text-gray-500">{member.role}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">No team members assigned yet</div>
                      )}
                    </div>
                    <Link
                      to={`/client-project-details/${project._id}`}
                      className="block mt-4 text-center py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded font-medium text-sm transition-colors"
                    >
                      View Project Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProjects;
