import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Clock, 
  Calendar, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle, 
  Building, 
  Plus, 
  Search, 
  ArrowRight, 
  FileText,
  Bell,
  ChevronRight
} from 'lucide-react';
import ClientSidebar from './clientSidebar';
import NotificationBell from '../components/NotificationBell';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Skeleton loader components
const StatCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4 animate-pulse">
    <div className="h-10 w-10 bg-gray-200 rounded-full mb-3"></div>
    <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
  </div>
);

const ProjectCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-3 animate-pulse">
    <div className="flex justify-between items-start">
      <div>
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded"></div>
    </div>
    <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
    <div className="flex justify-between">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
    </div>
  </div>
);

const MeetingCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-4 mb-3 animate-pulse">
    <div className="flex items-start">
      <div className="h-10 w-10 bg-gray-200 rounded-full mr-3"></div>
      <div className="flex-1">
        <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    name: '',
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    upcomingMeetings: [],
    recentProjects: [],
    recentNotifications: [],
    unreadMessages: 0
  });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Fetch client profile
        const profileResponse = await axios.get(`${API_URL}/api/clients/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch projects
        const projectsResponse = await axios.get(`${API_URL}/api/projects/client`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch meetings
        const meetingsResponse = await axios.get(`${API_URL}/api/meetings/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Fetch notifications
        const notificationsResponse = await axios.get(`${API_URL}/api/notifications/user/${profileResponse.data.data._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Count projects by status
        const projects = projectsResponse.data.data || [];
        const activeProjects = projects.filter(p => p.status.toLowerCase() === 'in progress').length;
        const completedProjects = projects.filter(p => p.status.toLowerCase() === 'completed').length;
        
        // Get upcoming meetings
        const meetings = meetingsResponse.data.data || [];
        const upcomingMeetings = meetings
          .filter(m => new Date(m.startTime) > new Date())
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 3);
        
        // Get recent projects
        const recentProjects = [...projects]
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 4);

        // Count unread notifications
        const unreadCount = notificationsResponse.data.success 
          ? notificationsResponse.data.data.filter(n => !n.isRead).length 
          : 0;

        // Combine all data
        setDashboardData({
          name: profileResponse.data.data?.fullName || 'Client',
          totalProjects: projects.length,
          activeProjects,
          completedProjects,
          upcomingMeetings,
          recentProjects,
          unreadMessages: unreadCount
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  // Helper function to format dates
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Helper function for meeting time formatting
  const formatMeetingTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };
    const dateOptions = { month: 'short', day: 'numeric' };
    
    const timeStr = date.toLocaleTimeString('en-US', timeOptions);
    const dateStr = date.toLocaleDateString('en-US', dateOptions);
    
    return isToday ? `Today at ${timeStr}` : `${dateStr} at ${timeStr}`;
  };

  // Helper function for status colors
  const getStatusColor = (status) => {
    const statusMap = {
      'completed': 'bg-green-100 text-green-800',
      'in progress': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    
    return statusMap[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Helper for status icons
  const getStatusIcon = (status) => {
    const statusMap = {
      'completed': <CheckCircle className="w-4 h-4 mr-1" />,
      'in progress': <Clock className="w-4 h-4 mr-1" />,
      'pending': <AlertCircle className="w-4 h-4 mr-1" />,
      'cancelled': <AlertCircle className="w-4 h-4 mr-1" />
    };
    
    return statusMap[status?.toLowerCase()] || <Clock className="w-4 h-4 mr-1" />;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className={`h-full fixed left-0 top-0 z-20 transition-all duration-300 bg-white border-r border-gray-200`}>
        <ClientSidebar onCollapseChange={setIsCollapsed} />
      </div>
      
      <div className={`flex-1 transition-all duration-300`} style={{ marginLeft: isCollapsed ? "5rem" : "16rem" }}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {/* Dashboard Header */}
            <header className="mb-8 flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  Welcome back, {dashboardData.name}
                </h1>
                <p className="text-gray-600">
                  Here's an overview of your projects and upcoming activities
                </p>
              </div>
              <div className="relative">

                          <NotificationBell userType="client" />
         
              </div>
            </header>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {isLoading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  {/* Total Projects */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
                        <h3 className="text-2xl font-bold text-gray-900">{dashboardData.totalProjects}</h3>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Briefcase className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button 
                        onClick={() => navigate('/client-projects')}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        View all projects
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>

                  {/* Active Projects */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Active Projects</p>
                        <h3 className="text-2xl font-bold text-gray-900">{dashboardData.activeProjects}</h3>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Clock className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                          {dashboardData.totalProjects > 0 && (
                            <div 
                              style={{ width: `${(dashboardData.activeProjects / dashboardData.totalProjects) * 100}%` }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {dashboardData.totalProjects ? 
                            `${Math.round((dashboardData.activeProjects / dashboardData.totalProjects) * 100)}% of total` : 
                            'No projects yet'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Completed Projects */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Completed Projects</p>
                        <h3 className="text-2xl font-bold text-gray-900">{dashboardData.completedProjects}</h3>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="relative pt-1">
                        <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                          {dashboardData.totalProjects > 0 && (
                            <div 
                              style={{ width: `${(dashboardData.completedProjects / dashboardData.totalProjects) * 100}%` }} 
                              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
                            />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {dashboardData.totalProjects ? 
                            `${Math.round((dashboardData.completedProjects / dashboardData.totalProjects) * 100)}% of total` : 
                            'No projects yet'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Meetings */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Upcoming Meetings</p>
                        <h3 className="text-2xl font-bold text-gray-900">{dashboardData.upcomingMeetings.length}</h3>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Calendar className="h-6 w-6 text-purple-500" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <button 
                        onClick={() => navigate('/client-calendar')}
                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                      >
                        View calendar
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Recent Projects Section */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Recent Projects</h2>
                      <button 
                        onClick={() => navigate('/client-projects')}
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        View all
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {isLoading ? (
                      <>
                        <div className="p-6"><ProjectCardSkeleton /></div>
                        <div className="p-6"><ProjectCardSkeleton /></div>
                        <div className="p-6"><ProjectCardSkeleton /></div>
                      </>
                    ) : dashboardData.recentProjects.length === 0 ? (
                      <div className="p-10 text-center">
                        <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
                        <p className="text-gray-500 mb-4">You don't have any projects yet.</p>
                        <button 
                          onClick={() => navigate('/send-proposal')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Start a new project
                        </button>
                      </div>
                    ) : (
                      dashboardData.recentProjects.map(project => (
                        <div key={project._id} className="p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                            <div className="mb-3 sm:mb-0">
                              <h3 className="text-md font-semibold text-gray-900 mb-1">
                                {project.title}
                              </h3>
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Building className="h-4 w-4 mr-1 text-gray-400" />
                                  {project.company?.name || 'Unknown Company'}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <FileText className="h-4 w-4 mr-1 text-gray-400" />
                                  {project.projectType || 'General Project'}
                                </div>
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                              {getStatusIcon(project.status)}
                              {project.status || 'Unknown Status'}
                            </span>
                          </div>
                          
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {project.description || 'No description provided.'}
                          </p>
                          
                          <div className="mt-3 flex justify-between items-center">
                            <div className="text-xs text-gray-500">
                              Updated {formatDate(project.updatedAt)}
                            </div>
                            <button 
                              onClick={() => navigate(`/client-project-details/${project._id}`)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              View details
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Upcoming Meetings */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-800">Upcoming Meetings</h2>
                      <button 
                        onClick={() => navigate('/client-calendar')}
                        className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                      >
                        View calendar
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {isLoading ? (
                      <>
                        <div className="p-4"><MeetingCardSkeleton /></div>
                        <div className="p-4"><MeetingCardSkeleton /></div>
                      </>
                    ) : dashboardData.upcomingMeetings.length === 0 ? (
                      <div className="p-8 text-center">
                        <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                        <h3 className="text-gray-500 mb-1">No upcoming meetings</h3>
                        <p className="text-sm text-gray-400">Upcoming meetings will appear here when scheduled</p>
                      </div>
                    ) : (
                      dashboardData.upcomingMeetings.map(meeting => (
                        <div key={meeting._id} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start">
                            <div className="p-2 bg-purple-100 rounded-lg mr-4">
                              <Calendar className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-900 mb-1">{meeting.title}</h3>
                              <p className="text-xs text-gray-500 mb-1">{formatMeetingTime(meeting.startTime)}</p>
                              {meeting.zoomLink && (
                                <a 
                                  href={meeting.zoomLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Join meeting
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Search Companies */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Find Construction Companies</h2>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Search companies..."
                      onClick={() => navigate('/all-companies')}
                      readOnly
                    />
                  </div>
                  <button
                    onClick={() => navigate('/all-companies')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                  >
                    Browse All Companies
                  </button>
                </div>
                

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
