import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import StaffSidebar from './staffSideBar';

const StaffCalendar = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/meetings/my', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMeetings(res.data.data || []);
      } catch (err) {
        setError('Failed to fetch meetings');
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  const events = meetings.map(m => ({
    id: m._id,
    title: m.title,
    start: m.startTime,
    end: m.endTime,
    extendedProps: m
  }));

  const getTimeRemaining = (startTime) => {
    const diff = new Date(startTime) - new Date();
    if (diff <= 0) return 'Started';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <StaffSidebar onCollapseChange={handleSidebarCollapse} />
      
      {/* Main Content */}
      <div 
        className="flex-1 transition-all duration-300 overflow-y-auto"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >
        {/* Header */}
        <div className="bg-white shadow-sm py-4 px-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">My Calendar</h2>
          <p className="text-gray-600">View and manage your scheduled meetings</p>
        </div>
        
        {/* Calendar Container */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EA540C]"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                events={events}
                eventClick={info => setSelectedEvent(info.event.extendedProps)}
                height="auto"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,dayGridWeek,dayGridDay'
                }}
              />
            </div>
          )}
        </div>
        
        {/* Event Details Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-bold mb-2">{selectedEvent.title}</h3>
              <div className="mb-2 text-gray-700">{selectedEvent.description}</div>
              <div className="mb-2 text-sm text-gray-500">Start: {new Date(selectedEvent.startTime).toLocaleString()}</div>
              <div className="mb-2 text-sm text-gray-500">End: {new Date(selectedEvent.endTime).toLocaleString()}</div>
              <div className="mb-2 text-sm text-blue-600">Zoom Link: <a href={selectedEvent.zoomLink} target="_blank" rel="noopener noreferrer" className="underline">Join Meeting</a></div>
              <div className="mb-2 text-sm text-orange-600">{getTimeRemaining(selectedEvent.startTime)}</div>
              <div className="mb-2 text-sm">Participants:</div>
              <ul className="mb-2 text-xs">
                {selectedEvent.participants?.map((p, i) => (
                  <li key={i} className="mb-1">
                    {p.user?.fullName} ({p.userType}) - <span className={p.status === 'confirmed' ? 'text-green-600' : 'text-gray-500'}>{p.status}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-2 px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors" onClick={() => setSelectedEvent(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffCalendar;