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
  TaskSquare
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
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <p className="text-gray-500 text-sm">Total Projects</p>
                  <h3 className="text-2xl font-bold mt-2">{dashboardData.totalProjects}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <p className="text-gray-500 text-sm">Ongoing</p>
                  <h3 className="text-2xl font-bold mt-2">{dashboardData.ongoing}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <p className="text-gray-500 text-sm">Completed</p>
                  <h3 className="text-2xl font-bold mt-2">{dashboardData.completed}</h3>
                </div>
              </section>
              <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <p className="text-gray-500 text-sm">Pending</p>
                  <h3 className="text-2xl font-bold mt-2">{dashboardData.pending}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <p className="text-gray-500 text-sm">Total Budget</p>
                  <h3 className="text-2xl font-bold mt-2">${dashboardData.totalBudget.toLocaleString()}</h3>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <p className="text-gray-500 text-sm">Pending Proposals</p>
                  <h3 className="text-2xl font-bold mt-2">{dashboardData.pendingProposals}</h3>
                </div>
              </section>
              <section className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Assigned Projects</h3>
                {dashboardData.assignedProjects.length > 0 ? (
                  <ul className="space-y-2">
                    {dashboardData.assignedProjects.map(proj => (
                      <li key={proj._id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                        <span>{proj.title}</span>
                        <span className="text-sm text-gray-500">{proj.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No projects assigned.</p>
                )}
              </section>
            </>
          ) : (
            <>  {/* existing general staff view */}
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
                <button className="px-4 py-2 bg-[#EA540C] text-white rounded-lg hover:bg-[#EA540C]/90 transition-colors">
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
                    <h3 className="text-2xl font-bold mt-2">{dashboardData.projectCount}</h3>
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
                    <h3 className="text-2xl font-bold mt-2">2</h3>
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
          
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Tasks */}
            <section className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">Upcoming Tasks</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800">View All</button>
              </div>
              <div className="px-6 py-4">
                {isLoading ? (
                  Array(3).fill().map((_, i) => (
                    <div key={i} className="py-3 border-b border-gray-100 last:border-b-0">
                      <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse mt-2"></div>
                    </div>
                  ))
                ) : dashboardData.upcomingTasks && dashboardData.upcomingTasks.length > 0 ? (
                  dashboardData.upcomingTasks.slice(0, 5).map((task, index) => (
                    <div key={index} className="flex items-center py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center mr-4">
                        <TaskSquare variant="Outline" size={20} className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800">{task.title}</h4>
                        <p className="text-xs text-gray-500">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' : 
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-gray-500">
                    <Clock className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                    <p>No upcoming tasks</p>
                    <button className="mt-2 text-sm text-[#EA540C] hover:underline">
                      Create a task
                    </button>
                  </div>
                )}
              </div>
            </section>
            
            {/* Recent Activity */}
            <section className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-800">Recent Activity</h3>
              </div>
              <div className="px-6 py-4">
                {isLoading ? (
                  Array(5).fill().map((_, i) => (
                    <div key={i} className="flex py-3 border-b border-gray-100 last:border-b-0">
                      <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                      <div className="flex-1">
                        <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse mt-1"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex py-3 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                        <DocumentText size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">You uploaded <strong>project-brief.pdf</strong></p>
                        <p className="text-xs text-gray-500">Today, 9:42 AM</p>
                      </div>
                    </div>
                    <div className="flex py-3 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Task size={16} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">You completed <strong>Site Survey</strong> task</p>
                        <p className="text-xs text-gray-500">Yesterday, 4:30 PM</p>
                      </div>
                    </div>
                    <div className="flex py-3 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                        <Calendar size={16} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">Meeting scheduled: <strong>Project Review</strong></p>
                        <p className="text-xs text-gray-500">Yesterday, 2:15 PM</p>
                      </div>
                    </div>
                    <div className="flex py-3 border-b border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                        <Chart size={16} className="text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">You created <strong>Progress Report</strong></p>
                        <p className="text-xs text-gray-500">Mar 29, 11:20 AM</p>
                      </div>
                    </div>
                    <div className="flex py-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                        <Note size={16} className="text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-800">You were assigned to <strong>Riverfront Project</strong></p>
                        <p className="text-xs text-gray-500">Mar 28, 10:00 AM</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
          </>
          )}
        </main>
      </div>
    </div>
  );
};

export default StaffDashboard;