import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckCircle, Calendar, MessageSquare, X, Info, AlertTriangle, Clock, ToolIcon, Briefcase, HardHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StaffNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // Set up polling to check for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

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

  const fetchNotificationsWithUserId = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/notifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setNotifications(response.data.data);
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

  const handleNotificationClick = (notification) => {
    // Mark as read first
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type
    if (notification.type === 'meeting_invite' || 
        notification.type === 'meeting_update' || 
        notification.type === 'meeting_reminder') {
      navigate('/staff/calendar'); // Navigate to staff calendar
    } else if (notification.type === 'message') {
      navigate('/staff/chat');
    } else if (notification.type.includes('project')) {
      navigate('/staff/projects');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meeting_invite':
        return <Calendar className="w-5 h-5 text-yellow-500" />;
      case 'meeting_update':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'meeting_reminder':
        return <Clock className="w-5 h-5 text-green-500" />;
      case 'meeting_canceled':
        return <X className="w-5 h-5 text-red-500" />;
      case 'project_assigned':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'project_update':
        return <HardHat className="w-5 h-5 text-indigo-500" />;
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

  // Display a limited number of notifications when not showing all
  const displayedNotifications = showAllNotifications 
    ? notifications 
    : notifications.slice(0, 5);

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
      <div className="p-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <Bell className="mr-2" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 bg-yellow-500 text-gray-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h2>
          {notifications.length > 0 && (
            <button 
              onClick={() => setShowAllNotifications(!showAllNotifications)}
              className="text-sm text-gray-300 hover:text-white"
            >
              {showAllNotifications ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-10 h-10 bg-gray-200 rounded-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-yellow-500" />
            <p className="text-gray-700 mb-4">{error}</p>
            {(error.includes('log in') || error.includes('session')) && (
              <button 
                onClick={handleLoginRedirect}
                className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700"
              >
                Go to Login
              </button>
            )}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          displayedNotifications.map(notification => (
            <div 
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-yellow-50' : ''}`}
            >
              <div className="flex">
                <div className="mr-3 mt-1 bg-gray-100 p-2 rounded-full">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className={`text-sm mb-1 ${!notification.isRead ? 'font-semibold' : 'text-gray-700'}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getTimeLabel(notification.createdAt)}
                  </p>
                  
                  {/* Show additional information for meeting notifications */}
                  {notification.type.includes('meeting') && notification.data && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs border-l-2 border-yellow-500">
                      <p className="font-medium">{notification.data.title}</p>
                      {notification.data.startTime && (
                        <p className="text-gray-600 mt-1">
                          {new Date(notification.data.startTime).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {!notification.isRead && (
                  <div className="ml-2 flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {notifications.length > 5 && !showAllNotifications && (
        <div className="p-3 text-center border-t">
          <button 
            onClick={() => setShowAllNotifications(true)}
            className="text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            View All ({notifications.length}) Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffNotifications;