import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Bell, X, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationBell = ({ userType }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Set the appropriate notification page route based on user type
  const notificationPageRoute = userType === 'client' 
    ? '/client/notifications' 
    : userType === 'staff' 
      ? '/staff/notifications' 
      : '/company/notifications';

  useEffect(() => {
    // Fetch notifications when component mounts
    fetchNotifications();
    
    // Set up polling to check for new notifications every minute
    const intervalId = setInterval(fetchNotifications, 60000);
    
    // Add click outside listener to close dropdown
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setAuthError(false);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      const userId = localStorage.getItem('userId');
      if (!userId) {
        setAuthError(true);
        setLoading(false);
        // Try to recover user ID from token verification if possible
        try {
          const verifyResponse = await axios.get('http://localhost:5001/api/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (verifyResponse.data.success && verifyResponse.data.user && verifyResponse.data.user.id) {
            // Store the recovered user ID
            localStorage.setItem('userId', verifyResponse.data.user.id);
            // Now that we have the userId, try fetching notifications again
            fetchNotificationsWithUserId(verifyResponse.data.user.id, token);
          }
        } catch (verifyErr) {
          console.error('Token verification failed:', verifyErr);
          // If token verification fails, it's a truly invalid session
          handleLogout();
        }
        return;
      }

      fetchNotificationsWithUserId(userId, token);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      if (err.response && err.response.status === 401) {
        setAuthError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationsWithUserId = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:5001/api/notifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const notifications = response.data.data;
        // Count unread notifications
        const unread = notifications.filter(notification => !notification.isRead).length;
        setUnreadCount(unread);
        
        // Get recent notifications (last 5)
        setRecentNotifications(notifications.slice(0, 5));
        setAuthError(false);
      }
    } catch (err) {
      console.error('Error fetching notifications with userId:', err);
      if (err.response && err.response.status === 401) {
        setAuthError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    
    // Redirect to login page
    navigate('/login');
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    
    // If there's an auth error and the dropdown is being opened, offer to redirect to login
    if (authError && !showDropdown) {
      const confirmLogin = window.confirm('Your session has expired or you need to log in. Would you like to go to the login page?');
      if (confirmLogin) {
        handleLogout();
      }
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(`http://localhost:5001/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setRecentNotifications(prevNotifications => 
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
    
    // Close dropdown
    setShowDropdown(false);
    
    // Navigate based on notification type and user type
    if (notification.type.includes('meeting')) {
      navigate(`/${userType}/calendar`);
    } else if (notification.type === 'message') {
      navigate(`/${userType}/chat`);
    } else if (notification.type.includes('proposal')) {
      if (userType === 'client') {
        navigate(`/client/projects/${notification.proposal}`);
      } else {
        navigate(`/${userType}/proposals`);
      }
    }
  };

  const viewAllNotifications = () => {
    setShowDropdown(false);
    navigate(notificationPageRoute);
  };

  // Helper function to get relative time
  const getTimeLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  // Apply different color schemes based on user type
  const getBellColor = () => {
    switch(userType) {
      case 'client':
        return unreadCount > 0 ? 'text-blue-500' : 'text-gray-500';
      case 'staff':
        return unreadCount > 0 ? 'text-yellow-500' : 'text-gray-500';
      case 'company':
        return unreadCount > 0 ? 'text-orange-500' : 'text-gray-500';
      default:
        return unreadCount > 0 ? 'text-blue-500' : 'text-gray-500';
    }
  };

  const getCountBgColor = () => {
    switch(userType) {
      case 'client': return 'bg-blue-500';
      case 'staff': return 'bg-yellow-500';
      case 'company': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className={`w-6 h-6 ${authError ? 'text-red-500' : getBellColor()}`} />
        {unreadCount > 0 && !authError && (
          <div className={`absolute top-0 right-0 ${getCountBgColor()} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
        {authError && (
          <div className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            !
          </div>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
            <button 
              onClick={() => setShowDropdown(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center p-4">
                <div className="w-6 h-6 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            ) : authError ? (
              <div className="p-4 text-center">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-700 mb-2">Authentication error</p>
                <p className="text-xs text-gray-500 mb-4">Please log in again to view notifications</p>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                >
                  Go to Login
                </button>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div>
                {recentNotifications.map(notification => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className={`text-xs ${!notification.isRead ? 'font-semibold' : 'text-gray-700'}`}>
                        {notification.message.length > 120
                          ? `${notification.message.substring(0, 120)}...`
                          : notification.message}
                      </p>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1 ml-2"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{getTimeLabel(notification.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {!authError && (
            <div className="px-4 py-3 text-center border-t border-gray-200">
              <button 
                onClick={viewAllNotifications}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;