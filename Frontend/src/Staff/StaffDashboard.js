import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import StaffSidebar from './staffSideBar';
import { 
  Calendar, 
  Task, 
  Note, 
  DocumentText,
  Chart,
  Notification,
  Clock,
  TaskSquare,
  TickCircle,
  FilterSearch,
  ArrowRight2,
  SearchNormal,
  Timer1,
  Building,
  Edit,
  ArchiveBook,
  Profile2User
} from "iconsax-react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    name: '',
    role: '',
    totalProjects: 0,
    ongoing: 0,
    completed: 0,
    pending: 0,
    totalBudget: 0,
    pendingProposals: 0,
    assignedProjects: [],
    projectCount: 0,
    taskCount: 0,
    upcomingTasks: [],
    recentDocuments: []
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [progressEdits, setProgressEdits] = useState({});
  const [progressSaving, setProgressSaving] = useState({});
  const [progressError, setProgressError] = useState({});
  const [projectFilter, setProjectFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectsSortOrder, setProjectsSortOrder] = useState('dueDate');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        
        if (!token) {
          navigate('/login');
          return;
        }
        
        // Fetch dashboard summary data
        const response = await axios.get(`${API_URL}/api/staff/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setDashboardData(response.data.data);
        } else {
          console.error("Failed to fetch dashboard data:", response.data.message);
        }
      } catch (error) {
        console.error("Dashboard Error:", error);
        
        // Handle specific errors
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [navigate]);

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  // Helper: check if current user is project manager for a project
  const isProjectManagerFor = (proj) => {
    // If dashboardData._id is available and matches proj.manager?._id or proj.managerId
    if (!dashboardData || !dashboardData._id) return false;
    return (
      proj.manager?._id === dashboardData._id ||
      proj.managerId === dashboardData._id ||
      proj.projectManager?._id === dashboardData._id // fallback
    );
  };

  const handleProgressChange = (projectId, value) => {
    setProgressEdits((prev) => ({ ...prev, [projectId]: value }));
  };

  const handleSaveProgress = async (projectId) => {
    setProgressSaving((prev) => ({ ...prev, [projectId]: true }));
    setProgressError((prev) => ({ ...prev, [projectId]: '' }));
    try {
      const token = localStorage.getItem('token');
      const progress = progressEdits[projectId];
      const response = await axios.put(
        `${API_URL}/api/projects/${projectId}`,
        { progress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        // Update assignedProjects in dashboardData
        setDashboardData((prev) => ({
          ...prev,
          assignedProjects: prev.assignedProjects.map((p) =>
            p._id === projectId ? { ...p, progress } : p
          ),
        }));
      } else {
        setProgressError((prev) => ({ ...prev, [projectId]: response.data.message || 'Failed to update progress' }));
      }
    } catch (err) {
      setProgressError((prev) => ({ ...prev, [projectId]: err.response?.data?.message || 'Error updating progress' }));
    } finally {
      setProgressSaving((prev) => ({ ...prev, [projectId]: false }));
    }
  };

  // Helper function to check if a project is overdue
  const isProjectOverdue = (project) => {
    return project.dueDate && new Date(project.dueDate) < new Date() && project.status !== 'Completed';
  };

  // Helper function to check if a project is at risk
  const isProjectAtRisk = (project) => {
    return project.status && (
      project.status.toLowerCase().includes('risk') || 
      (project.dueDate && 
        new Date(project.dueDate) > new Date() && 
        new Date(project.dueDate) - new Date() < 7 * 24 * 60 * 60 * 1000 && // less than 7 days left
        project.progress < 70)
    );
  };

  // Project filtering logic
  const filterProjects = () => {
    if (!dashboardData.assignedProjects) return [];

    let filtered = [...dashboardData.assignedProjects];
    
    // Apply status filter
    if (projectFilter !== 'all') {
      filtered = filtered.filter(proj => 
        proj.status && proj.status.toLowerCase() === projectFilter.toLowerCase()
      );
    }
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(proj => 
        (proj.title && proj.title.toLowerCase().includes(term)) ||
        (proj.name && proj.name.toLowerCase().includes(term)) ||
        (proj.client && proj.client.fullName && proj.client.fullName.toLowerCase().includes(term))
      );
    }
    
    // Sort projects
    filtered.sort((a, b) => {
      switch(projectsSortOrder) {
        case 'dueDate':
          // Sort by due date (most urgent first)
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'progress':
          // Sort by progress (lowest first)
          return (a.progress || 0) - (b.progress || 0);
        case 'title':
          // Sort alphabetically
          return (a.title || a.name || '').localeCompare(b.title || b.name || '');
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Calculate remaining days
  const getRemainingDays = (dueDate) => {
    if (!dueDate) return null;
    
    const due = new Date(dueDate);
    const today = new Date();
    
    // Remove time portion for accurate day calculation
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get remaining days display with appropriate styling
  const getRemainingDaysDisplay = (dueDate) => {
    const days = getRemainingDays(dueDate);
    
    if (days === null) return null;
    
    if (days < 0) {
      return <span className="text-red-600 font-medium">{Math.abs(days)} days overdue</span>;
    } else if (days === 0) {
      return <span className="text-red-600 font-medium">Due today</span>;
    } else if (days <= 7) {
      return <span className="text-yellow-600 font-medium">{days} days left</span>;
    } else {
      return <span className="text-gray-600">{days} days left</span>;
    }
  };

  // Function to handle project click to view details
  const handleProjectClick = (project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
  };

  // Navigate to project detail page
  const navigateToProjectDetail = (projectId) => {
    navigate(`/staff-project-detail/${projectId}`);
  };

  const filteredProjects = filterProjects();

  const ProjectDetailModal = ({ project, onClose }) => {
    if (!project) return null;
    
    const remainingDays = getRemainingDays(project.dueDate);
    const isOverdue = isProjectOverdue(project);
    const isAtRisk = isProjectAtRisk(project);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h3 className="text-xl font-semibold text-gray-800">Project Details</h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-y-auto p-6 flex-grow">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{project.title || project.name}</h2>
                <p className="text-gray-600 mt-1">{project.description || 'No description provided'}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                project.status === 'Completed' ? 'bg-green-100 text-green-800' : 
                project.status === 'Ongoing' ? 'bg-blue-100 text-blue-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {project.status}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Project Information</h4>
                
                <div className="space-y-4">
                  <div className="flex">
                    <Building className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Client</p>
                      <p className="font-medium">{project.client?.fullName || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <Profile2User className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Manager</p>
                      <p className="font-medium">{project.manager?.fullName || project.projectManager?.fullName || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <ArchiveBook className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Budget</p>
                      <p className="font-medium">${project.budget?.toLocaleString() || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-3">Timeline</h4>
                
                <div className="space-y-4">
                  <div className="flex">
                    <Calendar className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Start Date</p>
                      <p className="font-medium">{project.startDate ? formatDate(project.startDate) : 'Not specified'}</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <Timer1 className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Due Date</p>
                      <p className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                        {project.dueDate ? formatDate(project.dueDate) : 'Not specified'}
                        {remainingDays !== null && (
                          <span className="ml-2 text-sm">{getRemainingDaysDisplay(project.dueDate)}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <Chart className="h-5 w-5 text-primary mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Progress</p>
                      <div className="mt-1">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-2 ${
                              project.progress >= 100 ? 'bg-green-500' : 
                              project.progress >= 70 ? 'bg-blue-500' : 
                              project.progress >= 40 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-500">{project.progress || 0}%</span>
                          {isAtRisk && !isOverdue && (
                            <span className="text-xs text-yellow-600 font-medium">At risk</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Project management console */}
            {isProjectManagerFor(project) && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Edit className="h-5 w-5 text-primary mr-2" />
                  Project Management
                </h4>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-auto flex-1">
                    <label htmlFor="progress-input" className="block text-sm font-medium text-gray-700 mb-1">
                      Update Progress
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="progress-input"
                        type="number"
                        min={0}
                        max={100}
                        value={progressEdits[project._id] !== undefined ? progressEdits[project._id] : project.progress || 0}
                        onChange={e => handleProgressChange(project._id, Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-20 px-3 py-2 border border-primary rounded text-sm focus:ring-2 focus:ring-primary focus:border-primary transition"
                        disabled={progressSaving[project._id]}
                      />
                      <span className="text-gray-600">%</span>
                      <button
                        onClick={() => handleSaveProgress(project._id)}
                        className="px-4 py-2 bg-primary text-white rounded text-sm flex items-center gap-2 shadow hover:bg-primary/90 disabled:opacity-60 transition ml-2"
                        disabled={progressSaving[project._id]}
                      >
                        {progressSaving[project._id] ? (
                          <span className="loader w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <TickCircle size={18} />
                        )}
                        Save
                      </button>
                    </div>
                    {progressError[project._id] && (
                      <p className="text-sm text-red-500 mt-1">{progressError[project._id]}</p>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => navigateToProjectDetail(project._id)}
                    className="px-4 py-2 bg-gray-800 text-white rounded text-sm flex items-center gap-2 shadow hover:bg-gray-700 transition"
                  >
                    Manage Project
                    <ArrowRight2 size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end bg-gray-50">
            <button
              onClick={() => navigateToProjectDetail(project._id)}
              className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              View Full Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <StaffSidebar onCollapseChange={handleSidebarCollapse} />
      
      {/* Main Content */}
      <div 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >
        {/* Top Header */}
        <header className="bg-white shadow-sm py-4 px-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
            <div className="flex space-x-4 items-center">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Notification variant="Outline" size={24} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 rounded-full bg-[#FFEEE8] flex items-center justify-center overflow-hidden">
                  {isLoading ? (
                    <div className="animate-pulse w-full h-full bg-gray-200"></div>
                  ) : dashboardData.profilePicture ? (
                    <img 
                      src={dashboardData.profilePicture}
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/40?text=Profile";
                      }}
                    />
                  ) : (
                    <span className="text-gray-700 font-medium text-lg">
                      {dashboardData.name?.charAt(0) || "S"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="p-6">
          {/* Project Manager Dashboard */}
          { !isLoading && dashboardData.role === 'project_manager' ? (
            <>
              {/* Welcome Section for Project Manager */}
              <section className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-gray-800">
                        {isLoading ? (
                          <span className="block h-7 w-48 bg-gray-200 rounded animate-pulse"></span>
                        ) : (
                          `Welcome back, ${dashboardData.name || 'Project Manager'}!`
                        )}
                      </h2>
                      <p className="text-gray-500 mt-1">
                        {isLoading ? (
                          <span className="block h-5 w-72 bg-gray-200 rounded animate-pulse mt-2"></span>
                        ) : (
                          `${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                        )}
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/staff-tasks')}
                      className="px-4 py-2 bg-[#EA540C] text-white rounded-lg hover:bg-[#EA540C]/90 transition-colors"
                    >
                      View Tasks
                    </button>
                  </div>
                </div>
              </section>
              
              {/* Stats Row for Project Manager */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Active Projects */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Active Projects</p>
                      {isLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                      ) : (
                        <h3 className="text-2xl font-bold mt-2">{dashboardData.ongoing || 0}</h3>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Note variant="Bold" size={20} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                
                {/* Pending Tasks */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Pending Tasks</p>
                      {isLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                      ) : (
                        <h3 className="text-2xl font-bold mt-2">{dashboardData.taskCount || 0}</h3>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Task variant="Bold" size={20} className="text-orange-600" />
                    </div>
                  </div>
                </div>
                
                {/* Upcoming Meetings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Upcoming Meetings</p>
                      {isLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                      ) : (
                        <h3 className="text-2xl font-bold mt-2">{dashboardData.upcomingMeetings !== undefined ? dashboardData.upcomingMeetings : 2}</h3>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Calendar variant="Bold" size={20} className="text-purple-600" />
                    </div>
                  </div>
                </div>
                
                {/* Document Updates */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Recent Documents</p>
                      {isLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                      ) : (
                        <h3 className="text-2xl font-bold mt-2">{dashboardData.recentDocuments?.length || 0}</h3>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <DocumentText variant="Bold" size={20} className="text-green-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* My Projects section replacing the Project Analytics */}
              <section className="bg-white rounded-xl shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center">
                    <TaskSquare variant="Bulk" size={20} className="mr-2 text-primary" /> 
                    My Projects
                  </h3>
                  <button 
                    onClick={() => navigate('/staff-projects')} 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View All <ArrowRight2 size={16} className="ml-1" />
                  </button>
                </div>
                <div className="p-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2].map(i => (
                        <div key={i} className="h-36 bg-gray-100 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : !filteredProjects || filteredProjects.length === 0 ? (
                    <div className="py-10 text-center">
                      <Note className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <h3 className="text-gray-500 mb-1">No projects assigned</h3>
                      <p className="text-sm text-gray-400">Projects you're assigned to will appear here</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredProjects.slice(0, 4).map((project, index) => {
                        // Calculate progress color
                        const progressColor = project.progress >= 100 ? 'bg-green-500' : 
                                             project.progress >= 70 ? 'bg-blue-500' : 
                                             project.progress >= 40 ? 'bg-yellow-500' : 'bg-orange-500';
                                             
                        // Calculate status badge
                        const getStatusBadge = (status) => {
                          switch(status?.toLowerCase()) {
                            case 'completed': return 'bg-green-100 text-green-800';
                            case 'ongoing': return 'bg-blue-100 text-blue-800';
                            case 'pending': return 'bg-yellow-100 text-yellow-800';
                            default: return 'bg-gray-100 text-gray-800';
                          }
                        };
                        
                        return (
                          <div 
                            key={project._id || index} 
                            className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/staff-project-detail/${project._id}`)}
                          >
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{project.title || project.name}</h4>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(project.status)}`}>
                                  {project.status}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                {project.description?.substring(0, 120) || 'No description provided'}
                              </p>
                              
                              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                <div className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  Due: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
                                </div>
                                <div>
                                  {project.progress || 0}% Complete
                                </div>
                              </div>
                              
                              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-1.5 ${progressColor} rounded-full transition-all duration-300`}
                                  style={{ width: `${project.progress || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </>
          ) : (
            <> {/* enhanced general staff view */}
              {/* Welcome Section */}
              <section className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-gray-800">
                        {isLoading ? (
                          <span className="block h-7 w-48 bg-gray-200 rounded animate-pulse"></span>
                        ) : (
                          `Welcome back, ${dashboardData.name || 'Staff Member'}!`
                        )}
                      </h2>
                      <p className="text-gray-500 mt-1">
                        {isLoading ? (
                          <span className="block h-5 w-72 bg-gray-200 rounded animate-pulse mt-2"></span>
                        ) : (
                          `${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                        )}
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/staff-tasks')}
                      className="px-4 py-2 bg-[#EA540C] text-white rounded-lg hover:bg-[#EA540C]/90 transition-colors"
                    >
                      View Tasks
                    </button>
                  </div>
                </div>
              </section>
              
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Active Projects */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Active Projects</p>
                      {isLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                      ) : (
                        <h3 className="text-2xl font-bold mt-2">
                          {dashboardData.assignedProjects?.filter(p => p.status?.toLowerCase() === 'ongoing').length || 0}
                        </h3>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Note variant="Bold" size={20} className="text-blue-600" />
                    </div>
                  </div>
                </div>
                
                {/* Pending Tasks */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Pending Tasks</p>
                      {isLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                      ) : (
                        <h3 className="text-2xl font-bold mt-2">{dashboardData.taskCount}</h3>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Task variant="Bold" size={20} className="text-orange-600" />
                    </div>
                  </div>
                </div>
                
                {/* Upcoming Meetings */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Upcoming Meetings</p>
                      {isLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                      ) : (
                        <h3 className="text-2xl font-bold mt-2">{dashboardData.upcomingMeetings !== undefined ? dashboardData.upcomingMeetings : 2}</h3>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Calendar variant="Bold" size={20} className="text-purple-600" />
                    </div>
                  </div>
                </div>
                
                {/* Document Updates */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-500 text-sm">Recent Documents</p>
                      {isLoading ? (
                        <div className="h-9 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
                      ) : (
                        <h3 className="text-2xl font-bold mt-2">{dashboardData.recentDocuments?.length || 0}</h3>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <DocumentText variant="Bold" size={20} className="text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Assigned Projects Section */}
              <section className="bg-white rounded-xl shadow-sm mb-6">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center">
                    <TaskSquare variant="Bulk" size={20} className="mr-2 text-primary" /> 
                    My Projects
                  </h3>
                  <button 
                    onClick={() => navigate('/staff-projects')} 
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View All <ArrowRight2 size={16} className="ml-1" />
                  </button>
                </div>
                <div className="p-6">
                  {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[1, 2].map(i => (
                        <div key={i} className="h-36 bg-gray-100 rounded-lg animate-pulse"></div>
                      ))}
                    </div>
                  ) : !dashboardData.assignedProjects || dashboardData.assignedProjects.length === 0 ? (
                    <div className="py-10 text-center">
                      <Note className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <h3 className="text-gray-500 mb-1">No projects assigned</h3>
                      <p className="text-sm text-gray-400">Projects you're assigned to will appear here</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {dashboardData.assignedProjects.slice(0, 4).map((project, index) => {
                        // Calculate progress color
                        const progressColor = project.progress >= 100 ? 'bg-green-500' : 
                                             project.progress >= 70 ? 'bg-blue-500' : 
                                             project.progress >= 40 ? 'bg-yellow-500' : 'bg-orange-500';
                                             
                        // Calculate status badge
                        const getStatusBadge = (status) => {
                          switch(status?.toLowerCase()) {
                            case 'completed': return 'bg-green-100 text-green-800';
                            case 'ongoing': return 'bg-blue-100 text-blue-800';
                            case 'pending': return 'bg-yellow-100 text-yellow-800';
                            default: return 'bg-gray-100 text-gray-800';
                          }
                        };
                        
                        return (
                          <div 
                            key={project._id || index} 
                            className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => navigate(`/staff-project-detail/${project._id}`)}
                          >
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{project.title}</h4>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(project.status)}`}>
                                  {project.status}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                {project.description?.substring(0, 120) || 'No description provided'}
                              </p>
                              
                              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                                <div className="flex items-center">
                                  <Calendar size={14} className="mr-1" />
                                  Due: {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : 'Not set'}
                                </div>
                                <div>
                                  {project.progress || 0}% Complete
                                </div>
                              </div>
                              
                              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-1.5 ${progressColor} rounded-full transition-all duration-300`}
                                  style={{ width: `${project.progress || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            
          
                
              
            </>
          )}
        </main>
      </div>
      
      {/* Project Detail Modal */}
      {showProjectModal && selectedProject && (
        <ProjectDetailModal 
          project={selectedProject} 
          onClose={() => setShowProjectModal(false)} 
        />
      )}
    </div>
  );
};

export default StaffDashboard;