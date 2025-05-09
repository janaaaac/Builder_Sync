import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import StaffSidebar from './staffSideBar';
import { ArrowLeft, Calendar, Clock, Tag, User, Users, FileText, Layers, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const StaffTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [newProgress, setNewProgress] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updatePercentage, setUpdatePercentage] = useState(task?.progress || 0);
  const [updateError, setUpdateError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projectColor, setProjectColor] = useState('border-blue-500');

  useEffect(() => {
    const fetchTask = async () => {
      const token = localStorage.getItem('token');
      try {
        const prof = await axios.get(`${API_URL}/api/staff/profile`, { headers: { Authorization: `Bearer ${token}` } });
        if (prof.data.success) {
          setUserRole(prof.data.data.role);
        }
      } catch {};
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/tasks/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setTask(res.data.data);
          setNewProgress(res.data.data.progress || 0);
          
          // Assign a project color based on project ID
          if (res.data.data.project?._id) {
            // Generate a color from project ID
            const projectId = res.data.data.project._id;
            const colorOptions = [
              'border-blue-500',
              'border-purple-500',
              'border-indigo-500',
              'border-pink-500',
              'border-teal-500',
              'border-orange-500',
              'border-emerald-500',
              'border-amber-500',
              'border-cyan-500',
              'border-lime-500'
            ];
            
            // Simple hash function to convert project ID to a number
            const hashCode = str => {
              let hash = 0;
              for (let i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash |= 0; // Convert to 32bit integer
              }
              return Math.abs(hash);
            };
            
            const colorIndex = hashCode(projectId) % colorOptions.length;
            setProjectColor(colorOptions[colorIndex]);
          }
        } else setError(res.data.message || 'Failed to load task');
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching task');
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [id]);

  const updateProgress = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/tasks/${id}`, { progress: newProgress }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setTask(res.data.data);
    } catch (err) {
      console.error('Error updating progress', err);
    } finally {
      setUpdating(false);
    }
  };

  const submitProgressUpdate = async () => {
    if (!updateTitle.trim()) {
      setUpdateError('Title is required'); return;
    }
    setUpdateLoading(true); setUpdateError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/tasks/${id}/update-progress`,
        { title: updateTitle, percentage: updatePercentage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setTask(res.data.data);
        setUpdateTitle('');
      } else setUpdateError(res.data.message);
    } catch (err) {
      setUpdateError(err.response?.data?.message || 'Error submitting update');
    } finally { setUpdateLoading(false); }
  };

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
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
          icon: <Clock size={16} className="mr-1.5" /> 
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

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
  if (error) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Task</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => navigate('/staff-tasks')} 
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Return to Tasks
        </button>
      </div>
    </div>
  );
  if (!task) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">Task Not Found</h3>
        <p className="text-gray-500 mb-4">The task you're looking for doesn't exist or may have been deleted.</p>
        <button 
          onClick={() => navigate('/staff-tasks')} 
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
        >
          Return to Tasks
        </button>
      </div>
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
        {/* Black Header */}
        <div className="bg-black text-white shadow-md">
          <div className="max-w-5xl mx-auto p-6">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/staff-tasks')}
                className="mr-4 flex items-center text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Task Details</h1>
                <p className="text-gray-300">
                  Your role: <span className="font-medium capitalize">{userRole.replace('_', ' ')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-5xl mx-auto p-6">
          {/* Task Card - Modern Glass Design - Reduced Height */}
          <div className={`bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-2xl border-l-4 border-t border-r border-b border-gray-100 ${projectColor}`}>
            {/* Task Header with Glass Effect */}
            <div className="relative">
              <div className={`w-full h-16 ${
                task.priority?.toLowerCase() === 'high' 
                  ? 'bg-gradient-to-r from-red-500/20 via-red-500/30 to-red-400/10' 
                  : task.priority?.toLowerCase() === 'medium'
                  ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-400/10'
                  : 'bg-gradient-to-r from-green-500/20 via-green-500/30 to-green-400/10'
              } backdrop-blur-md`}></div>
              
              {/* Task Status Indicator */}
              <div className="absolute -bottom-3 left-6">
                <div className={`h-6 w-6 rounded-full border-4 border-white shadow-md flex items-center justify-center ${
                  task.status?.toLowerCase() === 'completed' ? 'bg-green-500' :
                  task.status?.toLowerCase() === 'in progress' ? 'bg-blue-500' :
                  task.status?.toLowerCase() === 'overdue' ? 'bg-red-500' :
                  'bg-amber-500'
                }`}>
                </div>
              </div>
              
              {/* Priority indicator */}
              <div className="absolute top-3 right-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                  task.priority?.toLowerCase() === 'high' 
                    ? 'bg-red-100 text-red-800 border border-red-200' 
                    : task.priority?.toLowerCase() === 'medium'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-green-100 text-green-600 border border-green-200'
                }`}>
                  {task.priority || 'Low'} Priority
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-8">
              {/* Task Header */}
              <div className="flex flex-col mb-6">
                <div className="mb-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{task.title}</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-500 text-sm">
                    <Calendar size={14} className="mr-1.5" />
                    <span className={`${
                      task.dueDate && new Date(task.dueDate) < new Date() && task.status?.toLowerCase() !== 'completed' 
                        ? 'text-red-600 font-medium' 
                        : ''
                    }`}>
                      Due: {formatDate(task.dueDate)}
                    </span>
                  </div>
                  
                  {/* Status Badge */}
                  <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadge(task.status).color} shadow-sm`}>
                    {getStatusBadge(task.status).icon}
                    <span className="capitalize">{task.status || 'Pending'}</span>
                  </div>
                </div>
              </div>
              
              {/* Task Description */}
              <div className="mb-8 bg-gray-50/80 p-5 rounded-xl border border-gray-100">
                <h3 className="flex items-center text-gray-800 font-medium mb-3">
                  <FileText size={16} className="mr-2 text-gray-600" />
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {task.description ? task.description : (
                    <span className="text-gray-400 italic">No description provided.</span>
                  )}
                </p>
              </div>
              
              {/* Task Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Project Info */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="flex items-center text-gray-800 font-semibold">
                      <Layers size={18} className="mr-2 text-blue-500" />
                      Project Information
                    </h3>
                    <div className={`w-2 h-2 rounded-full ${projectColor.replace('border-', 'bg-')}`}></div>
                  </div>
                  <div className="p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100">
                    <p className="text-gray-900 font-medium text-lg mb-2">{task.project?.title || 'Not assigned to any project'}</p>
                    {task.project?.description ? (
                      <p className="text-gray-600 text-sm mt-1 line-clamp-3">{task.project.description}</p>
                    ) : (
                      <p className="text-gray-400 text-sm italic">No project description available</p>
                    )}
                  </div>
                </div>
                
                {/* Task Details */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                  <h3 className="flex items-center text-gray-800 font-semibold mb-4">
                    <FileText size={18} className="mr-2 text-blue-500" />
                    Task Details
                  </h3>
                  <div className="p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <Tag size={16} className="text-blue-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Priority</div>
                          <div className={`font-medium capitalize text-sm ${
                            task.priority?.toLowerCase() === 'high' 
                              ? 'text-red-600' 
                              : task.priority?.toLowerCase() === 'medium'
                              ? 'text-amber-600'
                              : 'text-green-600'
                          }`}>
                            {task.priority || 'Low'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                          <Calendar size={16} className="text-green-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Due Date</div>
                          <div className="font-medium text-sm">
                            {formatDate(task.dueDate)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                          <User size={16} className="text-purple-600" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Created By</div>
                          <div className="font-medium text-sm">
                            {task.createdBy?.fullName || 'Project Manager'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Progress Section */}
              <div className="mb-8">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-100 shadow-sm">
                  <h3 className="flex items-center text-gray-800 font-semibold mb-4">
                    <BarChart3 size={18} className="mr-2 text-blue-500" />
                    Completion Progress
                  </h3>
                  <div className="p-4 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-100">
                    <div className="flex flex-wrap items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <span className="text-sm text-gray-700 font-medium">Task Completion:</span>
                        <div className={`flex items-center px-3 py-1 rounded-lg ${
                          task.progress >= 100 ? 'bg-green-100 text-green-800 border border-green-200' :
                          task.progress >= 75 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                          task.progress >= 40 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          <span className="text-3xl font-bold">{task.progress}</span>
                          <span className="text-sm ml-0.5">%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-xs">
                        <div className="w-3 h-3 rounded-full bg-red-400 mr-1"></div>
                        <span className="text-gray-600 mr-3">0-39%</span>
                        
                        <div className="w-3 h-3 rounded-full bg-amber-400 mr-1"></div>
                        <span className="text-gray-600 mr-3">40-74%</span>
                        
                        <div className="w-3 h-3 rounded-full bg-blue-400 mr-1"></div>
                        <span className="text-gray-600 mr-3">75-99%</span>
                        
                        <div className="w-3 h-3 rounded-full bg-green-400 mr-1"></div>
                        <span className="text-gray-600">100%</span>
                      </div>
                    </div>
                    
                    <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
                      <div
                        className={`h-5 rounded-full ${
                          task.progress >= 100 
                            ? 'bg-gradient-to-r from-green-400 to-green-500' 
                            : task.progress >= 75
                            ? 'bg-gradient-to-r from-blue-400 to-blue-500' 
                            : task.progress >= 40 
                            ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                            : 'bg-gradient-to-r from-red-400 to-red-500'
                        } relative transition-all duration-1000 ease-out`}
                        style={{ width: `${task.progress}%` }}
                      >
                        {task.progress > 5 && (
                          <span className="absolute text-xs text-white font-bold inset-0 flex items-center justify-center drop-shadow-md">
                            {task.progress}% Complete
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <div className="text-center">
                        <div className="w-0.5 h-2 bg-gray-300 mx-auto mb-1"></div>
                        <span>0%</span>
                      </div>
                      <div className="text-center">
                        <div className="w-0.5 h-2 bg-gray-300 mx-auto mb-1"></div>
                        <span>25%</span>
                      </div>
                      <div className="text-center">
                        <div className="w-0.5 h-2 bg-gray-300 mx-auto mb-1"></div>
                        <span>50%</span>
                      </div>
                      <div className="text-center">
                        <div className="w-0.5 h-2 bg-gray-300 mx-auto mb-1"></div>
                        <span>75%</span>
                      </div>
                      <div className="text-center">
                        <div className="w-0.5 h-2 bg-gray-300 mx-auto mb-1"></div>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Assigned To Section */}
              <div className="mb-6">
                <h3 className="flex items-center text-gray-700 font-medium mb-3">
                  <Users size={18} className="mr-2 text-gray-500" />
                  Assigned Team Members
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {task.assignedTo && task.assignedTo.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {task.assignedTo.map(user => (
                        <div key={user._id} className="flex items-center p-2 bg-white rounded-lg border border-gray-100">
                          <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200 flex items-center justify-center">
                            {user.profilePicture ? (
                              <img
                                src={user.profilePicture}
                                alt={user.fullName}
                                className="w-full h-full object-cover"
                                onError={e => { e.target.onerror = null; e.target.src = '/Assets/default-avatar.png'; }}
                              />
                            ) : (
                              <span className="text-gray-500 font-medium">
                                {user.fullName?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{user.fullName}</div>
                            <div className="text-xs text-gray-500 capitalize">
                              {user.role ? user.role.replace('_',' ') : 'Staff'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-3 bg-white rounded-lg border border-gray-100">
                      <p className="text-gray-500">No team members assigned to this task.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Progress History */}
              <div className="mb-6">
                <h3 className="flex items-center text-gray-700 font-medium mb-3">
                  <Clock size={18} className="mr-2 text-gray-500" />
                  Progress Updates Timeline
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  {task.progressUpdates?.length ? (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                      
                      <div className="space-y-4">
                        {task.progressUpdates.map((update, idx) => (
                          <div key={idx} className="relative pl-10">
                            {/* Timeline dot */}
                            <div className="absolute left-0 top-3 w-8 h-8 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center text-xs font-medium text-blue-500">
                              {update.percentage}%
                            </div>
                            
                            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start">
                                <div className="font-medium text-gray-800 text-lg">{update.title}</div>
                                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                  {update.percentage}% Complete
                                </div>
                              </div>
                              <div className="text-sm text-gray-500 mt-2 flex items-center">
                                <User size={12} className="mr-1.5" />
                                {update.userId.fullName}
                              </div>
                              <div className="text-xs text-gray-400 mt-1 flex items-center">
                                <Calendar size={10} className="mr-1.5" />
                                {new Date(update.createdAt).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-white rounded-lg border border-gray-100">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Clock className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-800 font-medium">No Progress Updates Yet</p>
                      <p className="text-gray-500 text-sm mt-1">Updates will appear here as team members log progress.</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Submit Update Form */}
              {userRole !== 'project_manager' && (
                <div className="mt-8">
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                    <h3 className="flex items-center text-blue-800 font-semibold mb-4">
                      <Clock size={18} className="mr-2 text-blue-600" />
                      Submit New Progress Update
                    </h3>
                    {updateError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        <div className="flex items-center">
                          <AlertTriangle size={16} className="mr-2 flex-shrink-0" />
                          <span>{updateError}</span>
                        </div>
                      </div>
                    )}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">Update Title</label>
                        <input
                          type="text"
                          placeholder="Brief description of progress made"
                          value={updateTitle}
                          onChange={e => setUpdateTitle(e.target.value)}
                          className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">Progress Percentage: {updatePercentage}%</label>
                        <div className="flex items-center space-x-4">
                          <input
                            type="range"
                            min="0" max="100" step="5"
                            value={updatePercentage}
                            onChange={e => setUpdatePercentage(Number(e.target.value))}
                            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="min-w-[4rem] px-3 py-1.5 bg-white border border-blue-200 text-blue-700 rounded-lg text-center font-medium">
                            {updatePercentage}%
                          </div>
                        </div>
                        <div className="flex justify-between mt-1 text-xs text-blue-600">
                          <span>0%</span>
                          <span>25%</span>
                          <span>50%</span>
                          <span>75%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <button
                        onClick={submitProgressUpdate}
                        disabled={updateLoading}
                        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center font-medium"
                      >
                        {updateLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Submitting Update...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} className="mr-2" />
                            Submit Progress Update
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

     
};

export default StaffTaskDetail;