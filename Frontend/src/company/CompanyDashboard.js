import { useState, useEffect } from 'react';
import { ChevronDown, Mail, Clock, Calendar, Plus } from 'lucide-react';
import CompanySidebar from './CompanySideBar';
import MeetingCreate from './MeetingCreate';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [refreshMeetings, setRefreshMeetings] = useState(false);
  const [latestMeeting, setLatestMeeting] = useState(null);
  const [loadingMeeting, setLoadingMeeting] = useState(true);
  const [staffTeam, setStaffTeam] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [projectStats, setProjectStats] = useState({
    total: 0,
    limit: 100,
    loading: true
  });
  const [staffStats, setStaffStats] = useState({
    total: 4,
    limit: 120,
    loading: false
  });

  // Add Total revenue stat
  const stats = [
    { title: 'Total revenue', value: '$0', icon: 'chart' },
    { 
      title: 'Projects', 
      value: projectStats.loading ? '...' : projectStats.total.toString(), 
      total: `/${projectStats.limit}`, 
      icon: 'briefcase' 
    },
    { title: 'Time spent', value: '0', total: '/1000 Hrs', icon: 'clock' },
    { 
      title: 'Resources', 
      value: staffStats.loading ? '...' : staffStats.total.toString(), 
      total: `/${staffStats.limit}`, 
      icon: 'user' 
    },
  ];

  // Create dynamic stats array using fetched project and staff data
  const getStats = () => [
    { title: 'Total revenue', value: '$0', icon: 'chart' },
    { 
      title: 'Projects', 
      value: projectStats.loading ? '...' : projectStats.total.toString(), 
      total: `/${projectStats.limit}`, 
      icon: 'briefcase' 
    },
    { title: 'Time spent', value: '0', total: '/1000 Hrs', icon: 'clock' },
    { 
      title: 'Employees', 
      value: staffStats.loading ? '...' : staffStats.total.toString(), 
      total: `/${staffStats.limit}`, 
      icon: 'user' 
    },
  ];

  // Construction-related dummy projects
  const projects = [
    { 
      name: 'Skyline Tower Construction', 
      manager: 'Ava Mason', 
      dueDate: 'May 25, 2025', 
      status: 'Completed' 
    },
    { 
      name: 'Greenfield Mall Renovation', 
      manager: 'Liam Carter', 
      dueDate: 'Jun 20, 2025', 
      status: 'Delayed' 
    },
    { 
      name: 'Sunrise Apartments Build', 
      manager: 'Olivia Turner', 
      dueDate: 'July 13, 2025', 
      status: 'At risk' 
    },
    { 
      name: 'Harbor Bridge Expansion', 
      manager: 'Noah Bennett', 
      dueDate: 'Dec 20, 2025', 
      status: 'Completed' 
    }
  ];

  // Construction-related dummy tasks
  const tasks = [
    { 
      name: 'Site inspection for Skyline Tower', 
      status: 'Approved' 
    },
    { 
      name: 'Review safety protocols for Greenfield Mall', 
      status: 'In review' 
    },
    { 
      name: 'Finalize blueprints for Sunrise Apartments', 
      status: 'In review' 
    },
    { 
      name: 'Order materials for Harbor Bridge', 
      status: 'On going' 
    }
  ];

  // Construction-related dummy team
  const team = [
    { name: 'Billy Parker', role: 'SITE ENGINEER' },
    { name: 'Nancy Salmon', role: 'PROJECT MANAGER' },
    { name: 'Stella Maxwell', role: 'ARCHITECT' }
  ];

  // Helper function to get appropriate color for status
  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Delayed':
        return 'bg-yellow-100 text-yellow-800';
      case 'At risk':
        return 'bg-red-100 text-red-800';
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'In review':
        return 'bg-red-100 text-red-800';
      case 'On going':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get appropriate icon for stats card
  const getStatIcon = (icon) => {
    switch(icon) {
      case 'chart':
        return (
          <div className="bg-purple-100 p-3 rounded-full">
            <div className="w-6 h-6 flex items-center justify-center text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
              </svg>
            </div>
          </div>
        );
      case 'briefcase':
        return (
          <div className="bg-orange-100 p-3 rounded-full">
            <div className="w-6 h-6 flex items-center justify-center text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M7.5 5.25a3 3 0 013-3h3a3 3 0 013 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0112 15.75c-2.73 0-5.357-.442-7.814-1.259-1.202-.4-1.936-1.541-1.936-2.752V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 017.5 5.455V5.25zm7.5 0v.09a49.488 49.488 0 00-6 0v-.09a1.5 1.5 0 011.5-1.5h3a1.5 1.5 0 011.5 1.5zm-3 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                <path d="M3 18.4v-2.796a4.3 4.3 0 00.713.31A26.226 26.226 0 0012 17.25c2.892 0 5.68-.468 8.287-1.335.252-.084.49-.189.713-.311V18.4c0 1.452-1.047 2.728-2.523 2.923-2.12.282-4.282.427-6.477.427a49.19 49.19 0 01-6.477-.427C4.047 21.128 3 19.852 3 18.4z" />
              </svg>
            </div>
          </div>
        );
      case 'clock':
        return (
          <div className="bg-blue-100 p-3 rounded-full">
            <div className="w-6 h-6 flex items-center justify-center text-blue-600">
              <Clock size={24} />
            </div>
          </div>
        );
      case 'user':
        return (
          <div className="bg-yellow-100 p-3 rounded-full">
            <div className="w-6 h-6 flex items-center justify-center text-yellow-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Helper function to get avatar placeholder
  const getAvatar = (name) => {
    return (
      <div className="bg-gray-200 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold">
        {name.split(' ').map(n => n[0]).join('')}
      </div>
    );
  };

  const handleMeetingCreated = (meeting) => {
    setShowMeetingModal(false);
    setRefreshMeetings(!refreshMeetings);
    // You can add a notification or update the UI here if needed
  };

  // Fetch the latest meeting
  useEffect(() => {
    const fetchLatestMeeting = async () => {
      try {
        setLoadingMeeting(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/meetings/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // Sort by creation date to get the latest meeting
          const meetings = response.data.data.sort((a, b) => 
            new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime)
          );
          setLatestMeeting(meetings[0]);
        }
      } catch (error) {
        console.error('Error fetching latest meeting:', error);
      } finally {
        setLoadingMeeting(false);
      }
    };
    
    fetchLatestMeeting();
  }, [refreshMeetings]);

  // Fetch staff team members
  useEffect(() => {
    const fetchStaffTeam = async () => {
      try {
        setLoadingStaff(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/staff', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.data) {
          setStaffTeam(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching staff team:', error);
      } finally {
        setLoadingStaff(false);
      }
    };
    
    fetchStaffTeam();
  }, []);

  // Fetch project stats for dashboard
  useEffect(() => {
    const fetchProjectStats = async () => {
      try {
        setProjectStats(prev => ({...prev, loading: true}));
        
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/projects/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setProjectStats({
            total: response.data.data.total || 0,
            limit: 100,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error fetching project stats:', error);
        setProjectStats(prev => ({...prev, loading: false}));
      }
    };
    
    fetchProjectStats();
  }, []);

  // Fetch staff statistics for the dashboard
  useEffect(() => {
    const fetchStaffStats = async () => {
      try {
        setStaffStats(prev => ({...prev, loading: true}));
        
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5001/api/staff/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setStaffStats({
            total: response.data.data.total || 0,
            limit: response.data.data.limit || 120,
            loading: false
          });
        }
      } catch (error) {
        console.error('Error fetching staff stats:', error);
        setStaffStats(prev => ({...prev, loading: false}));
      }
    };
    
    fetchStaffStats();
  }, []);

  // Navigate to staff management page
  const handleInviteNewTeamMember = () => {
    navigate('/staff-management');
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'short'
    });
  };
  
  // Format time for display (11:00 - 12:30 format)
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    return `${start.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })} - ${end.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className={`h-full fixed left-0 top-0 z-20 transition-all duration-300 bg-white border-r border-gray-200 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <CompanySidebar onCollapseChange={setIsCollapsed} isCollapsed={isCollapsed} />
      </div>
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {getStats().map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <div className="flex items-baseline mt-1">
                      {(projectStats.loading && stat.title === "Projects") || 
                       (staffStats.loading && stat.title === "Employees") ? (
                        <div className="flex items-center">
                          <h3 className="text-2xl font-bold animate-pulse bg-gray-200 h-7 w-16 rounded"></h3>
                          <span className="text-gray-500 ml-1 animate-pulse bg-gray-200 h-5 w-10 rounded"></span>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-2xl font-bold">{stat.value}</h3>
                          <span className="text-gray-500 ml-1">{stat.total}</span>
                        </>
                      )}
                    </div>
                  </div>
                  {getStatIcon(stat.icon)}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm mb-6">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Project summary</h2>
                    <div className="flex space-x-2">
                      <button className="flex items-center px-3 py-1 bg-white border border-gray-200 rounded text-sm">
                        Project
                        <ChevronDown size={16} className="ml-2" />
                      </button>
                      <button className="flex items-center px-3 py-1 bg-white border border-gray-200 rounded text-sm">
                        Project manager
                        <ChevronDown size={16} className="ml-2" />
                      </button>
                      <button className="flex items-center px-3 py-1 bg-white border border-gray-200 rounded text-sm">
                        Status
                        <ChevronDown size={16} className="ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Name</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Project manager</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Due date</th>
                        <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectStats.loading ? (
                        // Show loading skeleton for projects
                        Array(4).fill().map((_, index) => (
                          <tr key={index} className="border-t border-gray-100">
                            <td className="p-4">
                              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                            </td>
                            <td className="p-4">
                              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                            </td>
                            <td className="p-4">
                              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            </td>
                            <td className="p-4">
                              <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        projects.map((project, index) => (
                          <tr key={index} className="border-t border-gray-100">
                            <td className="p-4 text-sm">{project.name}</td>
                            <td className="p-4 text-sm">{project.manager}</td>
                            <td className="p-4 text-sm">{project.dueDate}</td>
                            <td className="p-4">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold">Today task</h2>
                </div>
                <div className="p-4 border-b border-gray-100">
                  <div className="flex space-x-4">
                    <button 
                      className={`text-sm pb-2 ${activeTab === 'All' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('All')}
                    >
                      All <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">10</span>
                    </button>
                    <button 
                      className={`text-sm pb-2 ${activeTab === 'Important' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('Important')}
                    >
                      Important
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <ul className="space-y-3">
                    {projectStats.loading ? (
                      // Task loading animations
                      Array(4).fill().map((_, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-gray-200 rounded-full w-5 h-5 mr-3 animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
                        </li>
                      ))
                    ) : (
                      tasks.map((task, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-orange-500 rounded-full w-5 h-5 flex items-center justify-center mr-3">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-sm">{task.name}</span>
                          </div>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Team</h2>
                <div className="space-y-4">
                  {loadingStaff ? (
                    <div className="space-y-4">
                      {Array(3).fill().map((_, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-gray-200 w-10 h-10 rounded-full animate-pulse mr-3"></div>
                            <div>
                              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
                              <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </div>
                          </div>
                          <div className="bg-gray-200 w-6 h-6 rounded-full animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  ) : staffTeam && staffTeam.length > 0 ? (
                    <>
                      {staffTeam.slice(0, 3).map((member, index) => (
                        <div key={member._id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            {member.profilePicture ? (
                              <img 
                                src={member.profilePicture} 
                                alt={member.fullName} 
                                className="w-10 h-10 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center text-gray-600 text-sm mr-3">
                                {member.fullName ? member.fullName.split(' ').map(n => n[0]).join('') : '??'}
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{member.fullName}</h3>
                              <p className="text-xs text-gray-500">
                                {member.role ? member.role.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ').toUpperCase() : 'TEAM MEMBER'}
                              </p>
                            </div>
                          </div>
                          <a href={`mailto:${member.email}`} className="text-orange-500">
                            <Mail size={20} />
                          </a>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No team members found
                    </div>
                  )}
                  
                  <button 
                    className="flex items-center text-gray-700 mt-2 hover:text-orange-600 transition-colors"
                    onClick={handleInviteNewTeamMember}
                  >
                    <div className="bg-orange-100 w-10 h-10 rounded-full flex items-center justify-center text-orange-500 mr-3">
                      <Plus size={20} />
                    </div>
                    <span>Added new team member</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-xs text-gray-500 mb-1">MEETING</div>
                
                {loadingMeeting ? (
                  <div className="space-y-4 py-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    <div className="flex items-center my-4">
                      <div className="bg-gray-200 w-6 h-6 rounded-full animate-pulse mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    </div>
                    <div className="flex items-center mb-4">
                      <div className="bg-gray-200 w-6 h-6 rounded-full animate-pulse mr-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/5 animate-pulse"></div>
                    </div>
                    <div className="flex -space-x-2 overflow-hidden my-4">
                      {[1, 2, 3].map((_, i) => (
                        <div key={i} className="bg-gray-200 w-8 h-8 rounded-full animate-pulse"></div>
                      ))}
                    </div>
                    <div className="h-10 bg-gray-200 rounded w-full animate-pulse mt-6"></div>
                  </div>
                ) : latestMeeting ? (
                  <>
                    <h2 className="text-xl font-bold mb-2">{latestMeeting.title}</h2>
                    <p className="text-gray-500 text-sm mb-6">
                      {latestMeeting.description || "No description provided"}
                    </p>
                    
                    <div className="flex items-center mb-4">
                      <Clock size={20} className="text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        {formatTimeRange(latestMeeting.startTime, latestMeeting.endTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center mb-4">
                      <Calendar size={20} className="text-gray-500 mr-2" />
                      <span className="text-gray-700">
                        {formatDate(latestMeeting.startTime)}
                      </span>
                    </div>

                    {/* Participant images */}
                    {latestMeeting.participants && latestMeeting.participants.length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Participants</h3>
                        <div className="flex -space-x-2 overflow-hidden">
                          {latestMeeting.participants.map((participant, i) => (
                            <div key={i} className="relative" title={participant.user?.fullName || 'Participant'}>
                              {participant.user?.profilePicture ? (
                                <img 
                                  src={participant.user.profilePicture} 
                                  alt={participant.user?.fullName || 'Participant'} 
                                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                                />
                              ) : (
                                <div className={`inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center 
                                  ${participant.userType === 'Client' ? 'bg-blue-100 text-blue-800' : 
                                    participant.userType === 'Staff' ? 'bg-green-100 text-green-800' : 
                                    'bg-gray-100 text-gray-800'}`}>
                                  {participant.user?.fullName?.charAt(0) || '?'}
                                </div>
                              )}
                              <span className={`absolute -top-1 -right-1 block h-3 w-3 rounded-full ${
                                participant.status === 'confirmed' ? 'bg-green-400' : 'bg-yellow-400'
                              } ring-2 ring-white`}></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <a 
                      href={latestMeeting.zoomLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors"
                    >
                      Join Meeting
                    </a>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-bold mb-2">No meetings scheduled</h2>
                    <p className="text-gray-500 text-sm mb-6">
                      You don't have any meetings yet. Create one to get started.
                    </p>
                  </>
                )}
                
                <button 
                  onClick={() => setShowMeetingModal(true)}
                  className={`mt-4 flex items-center justify-center w-full ${
                    latestMeeting ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
                  } text-white py-2 px-4 rounded-md transition-colors`}
                >
                  <Plus size={18} className="mr-2" />
                  {latestMeeting ? 'Create Another Meeting' : 'Create Meeting'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Meeting Create Modal */}
      {showMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Create Meeting</h2>
              <button 
                onClick={() => setShowMeetingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <MeetingCreate onMeetingCreated={handleMeetingCreated} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}