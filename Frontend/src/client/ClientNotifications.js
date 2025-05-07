import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckCircle, Calendar, MessageSquare, X, Info, AlertTriangle, Clock, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ClientSidebar from './clientSidebar';

const ClientNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllNotifications, setShowAllNotifications] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up polling to check for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, [activeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        // Try to recover the user ID from token verification
        try {
          const verifyResponse = await axios.get('http://localhost:5001/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (verifyResponse.data.success && verifyResponse.data.user && verifyResponse.data.user.id) {
            // Store the recovered user ID
            localStorage.setItem('userId', verifyResponse.data.user.id);
            // Now use the recovered ID
            fetchNotificationsWithUserId(verifyResponse.data.user.id, token);
          } else {
            setError('User ID not found - please log in again');
            setLoading(false);
          }
        } catch (verifyErr) {
          console.error('Token verification failed:', verifyErr);
          setError('Authentication failed - please log in again');
          setLoading(false);
        }
        return;
      }

      fetchNotificationsWithUserId(userId, token);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Error fetching notifications');
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setTimeout(() => setIsRefreshing(false), 1000); // Show spinner for at least 1 second
  };

  const fetchNotificationsWithUserId = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/notifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Filter notifications if needed
        let filteredNotifications = response.data.data;
        if (activeFilter !== 'all') {
          if (activeFilter === 'unread') {
            filteredNotifications = filteredNotifications.filter(n => !n.isRead);
          } else {
            filteredNotifications = filteredNotifications.filter(n => n.type.includes(activeFilter));
          }
        }
        
        setNotifications(filteredNotifications);
        // Count unread notifications
        const unread = response.data.data.filter(notification => !notification.isRead).length;
        setUnreadCount(unread);
        setError(null);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications with userId:', err);
      if (err.response && err.response.status === 401) {
        setError('Session expired - please log in again');
      } else {
        setError('Error fetching notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    
    // Redirect to login
    navigate('/login');
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(`http://localhost:5001/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const userId = localStorage.getItem('userId');
      if (!userId) return;

      await axios.put(`http://localhost:5001/api/notifications/user/${userId}/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({
          ...notification,
          isRead: true
        }))
      );

      // Update unread count
      setUnreadCount(0);
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read first
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'meeting_invite' || 
        notification.type === 'meeting_update' || 
        notification.type === 'meeting_reminder') {
      navigate('/client/calendar'); // Navigate to calendar to view the meeting
    } else if (notification.type === 'proposal_approved' || notification.type === 'proposal_rejected') {
      if (notification.proposal) {
        navigate(`/client/projects/${notification.proposal}`);
      }
    } else if (notification.type === 'message') {
      navigate('/client/chat');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meeting_invite':
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'meeting_update':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'meeting_reminder':
        return <Clock className="w-5 h-5 text-green-500" />;
      case 'meeting_canceled':
        return <X className="w-5 h-5 text-red-500" />;
      case 'proposal_approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'proposal_rejected':
        return <X className="w-5 h-5 text-red-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Info className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTimeLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getNotificationType = (type) => {
    if (type.includes('meeting')) return 'Meeting';
    if (type.includes('proposal')) return 'Proposal';
    if (type === 'message') return 'Message';
    return 'System';
  };

  const groupNotificationsByDate = () => {
    const groups = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const dateStr = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      
      groups[dateStr].push(notification);
    });
    
    return groups;
  };

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Group notifications by date
  const groupedNotifications = groupNotificationsByDate();
  const sortedDates = Object.keys(groupedNotifications).sort().reverse();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className={`h-full fixed left-0 top-0 z-20 transition-all duration-300 bg-white border-r border-gray-200 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <ClientSidebar onCollapseChange={setIsCollapsed} isCollapsed={isCollapsed} />
      </div>
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={refreshNotifications}
                  className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-md text-sm text-orange-600 hover:bg-orange-100 transition-colors"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            </div>
            
            {/* Filters */}
            <div className="mb-6 flex items-center overflow-x-auto pb-2">
              <div className="flex space-x-2">
                <button 
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'all' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setActiveFilter('unread')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'unread' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button 
                  onClick={() => setActiveFilter('meeting')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'meeting' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Meetings
                </button>
                <button 
                  onClick={() => setActiveFilter('proposal')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'proposal' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Proposals
                </button>
                <button 
                  onClick={() => setActiveFilter('message')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === 'message' 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Messages
                </button>
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
              <div className="divide-y divide-gray-100">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="animate-pulse flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-8 text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-orange-500" />
                    <p className="text-gray-700 mb-4">{error}</p>
                    {(error.includes('log in') || error.includes('session')) && (
                      <button 
                        onClick={handleLoginRedirect}
                        className="px-5 py-2.5 bg-orange-500 text-white rounded-md text-sm hover:bg-orange-600 transition-colors"
                      >
                        Go to Login
                      </button>
                    )}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-10 text-center text-gray-500">
                    <Bell className="w-14 h-14 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg mb-1">No notifications</p>
                    <p className="text-sm text-gray-400">
                      {activeFilter !== 'all' 
                        ? `You don't have any ${activeFilter} notifications` 
                        : "You're all caught up!"}
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[700px] overflow-y-auto">
                    {sortedDates.map(dateStr => (
                      <div key={dateStr}>
                        <div className="bg-gray-50 px-4 py-2 sticky top-0 z-10">
                          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                            {formatDateHeader(dateStr)}
                          </p>
                        </div>
                        {groupedNotifications[dateStr].map(notification => (
                          <div 
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-orange-50 cursor-pointer transition-colors ${
                              !notification.isRead ? 'bg-orange-50' : ''
                            }`}
                          >
                            <div className="flex">
                              <div className="mr-4 mt-1">
                                <div className="p-2 rounded-full bg-white border border-gray-200 shadow-sm">
                                  {getNotificationIcon(notification.type)}
                                </div>
                              </div>
                              <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                                    {getNotificationType(notification.type)}
                                  </span>
                                  <p className="text-xs text-gray-500">
                                    {getTimeLabel(notification.createdAt)}
                                  </p>
                                </div>
                                <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                  {notification.message}
                                </p>
                              </div>
                              {!notification.isRead && (
                                <div className="ml-2 flex-shrink-0">
                                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientNotifications;