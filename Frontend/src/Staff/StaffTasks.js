import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import StaffSidebar from './staffSideBar';
import { Plus, CheckCircle, Clock, AlertTriangle, XCircle, Calendar, FileText, Users, ChevronDown, ChevronUp, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const StaffTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');
  const [projectColors, setProjectColors] = useState({});
  const [expandedProjects, setExpandedProjects] = useState({});
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTasks(res.data.data);
        // Initialize project colors
        const colors = {};
        const colorOptions = [
          'border-l-blue-500',
          'border-l-purple-500',
          'border-l-indigo-500',
          'border-l-pink-500',
          'border-l-teal-500',
          'border-l-orange-500',
          'border-l-emerald-500',
          'border-l-amber-500',
          'border-l-cyan-500',
          'border-l-lime-500'
        ];
        res.data.data.forEach(task => {
          if (task.project?._id && !colors[task.project._id]) {
            const colorIndex = Object.keys(colors).length % colorOptions.length;
            colors[task.project._id] = colorOptions[colorIndex];
          }
        });
        setProjectColors(colors);
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks(); // Initial fetch
    // fetch user role for create permission
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/staff/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setUserRole(res.data.data.role);
      } catch (err) {
        console.error('Failed to fetch user role', err);
      } finally {
        setLoadingUser(false);
      }
    })();
  }, []);

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };
  
  // Toggle expanded state for a project
  const toggleProjectExpand = (projectId) => {
    setExpandedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Helper function to get status badge
  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed':
        return { 
          color: 'bg-green-100 text-green-800', 
          icon: <CheckCircle size={16} className="mr-1.5" /> 
        };
      case 'in progress':
        return { 
          color: 'bg-blue-100 text-blue-800', 
          icon: <Clock size={16} className="mr-1.5" /> 
        };
      case 'pending':
        return { 
          color: 'bg-amber-100 text-amber-800', 
          icon: <Clock size={16} className="mr-1.5" /> 
        };
      case 'overdue':
        return { 
          color: 'bg-red-100 text-red-800', 
          icon: <AlertTriangle size={16} className="mr-1.5" /> 
        };
      case 'cancelled':
        return { 
          color: 'bg-gray-100 text-gray-800', 
          icon: <XCircle size={16} className="mr-1.5" /> 
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800', 
          icon: <Clock size={16} className="mr-1.5" /> 
        };
    }
  };

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Generate a consistent color based on project ID
  const getProjectColor = (projectId) => {
    if (!projectId) return 'border-l-gray-400'; // Default color for tasks without a project
    
    // Check if we've already assigned a color to this project
    if (projectColors[projectId]) {
      return projectColors[projectId];
    }
    
    // List of border colors to cycle through
    const colorOptions = [
      'border-l-blue-500',
      'border-l-purple-500',
      'border-l-indigo-500',
      'border-l-pink-500',
      'border-l-teal-500',
      'border-l-orange-500',
      'border-l-emerald-500',
      'border-l-amber-500',
      'border-l-cyan-500',
      'border-l-lime-500'
    ];
    
    // Assign the next available color
    const colorIndex = Object.keys(projectColors).length % colorOptions.length;
    const newColor = colorOptions[colorIndex];
    
    // Save this color for the project for future reference
    setProjectColors(prev => ({
      ...prev,
      [projectId]: newColor
    }));
    
    return newColor;
  };

  // Filter tasks
  const filteredTasks = tasks
    .filter(task => {
      // Filter by status
      if (filterStatus !== 'all' && task.status?.toLowerCase() !== filterStatus) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort tasks
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      } else if (sortBy === 'priority') {
        const priorityMap = { high: 3, medium: 2, low: 1 };
        return priorityMap[b.priority?.toLowerCase() || 'low'] - priorityMap[a.priority?.toLowerCase() || 'low'];
      } else if (sortBy === 'status') {
        const statusMap = { 'pending': 1, 'in progress': 2, 'completed': 3, 'overdue': 0, 'cancelled': 4 };
        return statusMap[a.status?.toLowerCase() || 'pending'] - statusMap[b.status?.toLowerCase() || 'pending'];
      }
      return 0;
    });
    
  // Group tasks by project
  const tasksByProject = {};
  const projectOrder = [];
  
  // Group filtered tasks by project
  filteredTasks.forEach(task => {
    const projectId = task.project?._id || 'no-project';
    const projectTitle = task.project?.title || 'No Project';
    
    if (!tasksByProject[projectId]) {
      tasksByProject[projectId] = {
        id: projectId,
        title: projectTitle,
        tasks: [],
        color: task.project?._id ? projectColors[task.project._id] || getProjectColor(task.project._id) : 'border-l-gray-400'
      };
      projectOrder.push(projectId);
    }
    
    tasksByProject[projectId].tasks.push(task);
  });

  if (loadingUser) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <StaffSidebar onCollapseChange={handleSidebarCollapse} />

      <div 
        className="flex-1 transition-all duration-300 overflow-y-auto"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >
        {/* Header with black background */}
        <div className="bg-black text-white shadow-md">
          <div className="max-w-6xl mx-auto p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl font-bold">Task Management</h1>
                <p className="text-gray-300">
                  Your role: <span className="font-medium capitalize">{userRole.replace('_', ' ')}</span>
                </p>
              </div>
              
              {userRole === 'project_manager' && (
                <button 
                  onClick={() => setIsTaskFormOpen(true)}
                  className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors shadow-sm font-medium"
                >
                  <Plus size={18} className="mr-1.5" />
                  Create New Task
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          {/* Filter and Search Controls */}
          <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex flex-1 gap-3">
                <div className="w-full md:w-64">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">All Tasks</option>
                    <option value="pending">Pending</option>
                    <option value="in progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="w-full md:w-64">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="dueDate">Due Date</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Search Tasks</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by task title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Tasks Display - New Design */}
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Your Tasks</h2>
              <div className="ml-2 px-2.5 py-1 bg-gray-100 rounded-md text-sm text-gray-600">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </div>
            </div>

            {loadingTasks ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks found</h3>
                <p className="text-gray-500 mb-6">
                  {searchQuery || filterStatus !== 'all' 
                    ? 'Try changing your search or filter criteria' 
                    : 'You don\'t have any tasks assigned at the moment'}
                </p>
                
                {userRole === 'project_manager' && (
                  <button 
                    onClick={() => setIsTaskFormOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus size={18} className="mr-1.5" />
                    Create Your First Task
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {projectOrder.map(projectId => {
                  const projectData = tasksByProject[projectId];
                  const displayTasks = expandedProjects[projectId] 
                    ? projectData.tasks 
                    : projectData.tasks.slice(0, 3);
                  const hasMoreTasks = projectData.tasks.length > 3;
                  
                  return (
                    <div key={projectId} className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${projectData.color.replace('border-l-', 'bg-')}`}></div>
                          <h3 className="text-lg font-semibold text-gray-800 ml-2">{projectData.title}</h3>
                          <div className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">
                            {projectData.tasks.length} {projectData.tasks.length === 1 ? 'task' : 'tasks'}
                          </div>
                        </div>
                        {/* Adjusted See More button */}
                        {hasMoreTasks && (
                          <div 
                            onClick={() => toggleProjectExpand(projectId)}
                            className="flex items-center justify-center rounded-lg border border-gray-200 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ml-2"
                          >
                            <span className="text-gray-600 text-sm font-medium mr-1.5">
                              {expandedProjects[projectId] ? 'Show Less' : `See ${projectData.tasks.length - 3} More`}
                            </span>
                            {expandedProjects[projectId] ? (
                              <ChevronUp size={16} className="text-gray-500" />
                            ) : (
                              <ChevronDown size={16} className="text-gray-500" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {displayTasks.map(task => {
                          const statusBadge = getStatusBadge(task.status);
                          
                          // Calculate if task is overdue
                          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status?.toLowerCase() !== 'completed';
                          
                          // Determine priority color
                          const priorityColor = task.priority?.toLowerCase() === 'high' 
                            ? 'bg-red-50 border-red-200' 
                            : task.priority?.toLowerCase() === 'medium'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-green-50 border-green-200';
                            
                          return (
                            <div 
                              key={task._id} 
                              className={`rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md border-l-4 ${projectData.color}`}
                            >
                              <div className={`p-5 bg-white`}>
                                <div className="flex justify-between items-start">
                                  <div className={`px-2.5 py-1 rounded-md text-xs font-medium ${priorityColor} capitalize`}>
                                    {task.priority || 'Low'} Priority
                                  </div>
                                  <div className={`flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${statusBadge.color}`}>
                                    {statusBadge.icon}
                                    <span className="capitalize">{task.status || 'Pending'}</span>
                                  </div>
                                </div>
                                
                                <Link 
                                  to={`/staff-tasks/${task._id}`} 
                                  className="block mt-3 text-lg font-medium text-gray-900 hover:text-black transition-colors"
                                >
                                  {task.title}
                                </Link>
                                
                                <p className="mt-2 text-gray-600 line-clamp-2 text-sm min-h-[40px]">
                                  {task.description || 'No description provided'}
                                </p>
                                
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center text-sm text-gray-600">
                                      <Calendar size={14} className="mr-1.5 text-gray-400" />
                                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                        {formatDate(task.dueDate)}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center">
                                      {task.assignee?.image ? (
                                        <img 
                                          src={task.assignee.image} 
                                          alt={task.assignee.name}
                                          className="w-8 h-8 rounded-full object-cover border-2 border-white"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = '/Assets/default-avatar.png';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium text-sm">
                                          {task.assignee?.name?.charAt(0) || 'U'}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Task Form Modal */}
      <TaskFormModal 
        isOpen={isTaskFormOpen} 
        onClose={() => setIsTaskFormOpen(false)} 
        onTaskCreated={fetchTasks} 
      />
    </div>
  );
};

// Task Form Modal Component
const TaskFormModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [availableStaff, setAvailableStaff] = useState([]);
  const [assignedTo, setAssignedTo] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch projects when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  // Fetch projects the PM is assigned to
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/projects/staff`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // Update available staff when a project is selected
  useEffect(() => {
    const proj = projects.find(p => p._id === selectedProject);
    if (proj) {
      // Filter by roles architect, engineer, quantity_surveyor
      const filtered = proj.staff.filter(s => 
        ['architect', 'engineer', 'quantity_surveyor'].includes(s.role)
      );
      setAvailableStaff(filtered);
    } else {
      setAvailableStaff([]);
      setAssignedTo([]);
    }
  }, [selectedProject, projects]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title || !selectedProject) {
      setError('Title and project are required');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = { 
        title, 
        description, 
        dueDate, 
        priority, 
        project: selectedProject, 
        assignedTo 
      };
      
      const res = await axios.post(`${API_URL}/api/tasks`, payload, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.data.success) {
        resetForm();
        onTaskCreated();
        onClose();
      } else {
        setError(res.data.message || 'Failed to create task');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Server error');
    } finally {
      setLoading(false);
    }
  };

const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setSelectedProject('');
    setAssignedTo([]);
    setError('');
  };

  // Dedupe available staff by _id
  const uniqueStaff = availableStaff.filter((s, idx, arr) => 
    arr.findIndex(u => u._id === s._id) === idx
  );

  // Dedupe projects by ID
  const uniqueProjects = projects.filter((proj, idx, self) => 
    self.findIndex(p => p._id === proj._id) === idx
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Create New Task</h2>
          <button 
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
                disabled={loading || uniqueProjects.length === 0}
              >
                <option value="">-- Select project --</option>
                {uniqueProjects.map((p, idx) => (
                  <option key={`${p._id}-${idx}`} value={p._id}>{p.title}</option>
                ))}
              </select>
              {uniqueProjects.length === 0 && !loading && (
                <p className="text-sm text-orange-500 mt-1">
                  No projects available. You need to be assigned to a project first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={4}
                placeholder="Enter task description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {uniqueStaff.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  multiple
                  value={assignedTo}
                  onChange={e => setAssignedTo(Array.from(e.target.selectedOptions, opt => opt.value))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 h-32"
                >
                  {uniqueStaff.map((s, index) => (
                    <option key={`${s._id}-${index}`} value={s._id}>
                      {s.fullName} ({s.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Hold Ctrl (or Cmd) to select multiple staff members
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-70"
              >
                {loading ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffTasks;

// Task Form Modal Component