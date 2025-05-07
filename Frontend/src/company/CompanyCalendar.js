import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import axios from 'axios';
import CompanySidebar from './CompanySideBar';
import './Calendar.css'; // We'll create this file for custom styling

const CompanyCalendar = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
    <div className="flex min-h-screen bg-gray-50">
      <div className={`h-full fixed left-0 top-0 z-20 transition-all duration-300 bg-white border-r border-gray-200 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <CompanySidebar onCollapseChange={setIsCollapsed} isCollapsed={isCollapsed} />
      </div>
      <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Company Meetings Calendar</h2>
          {loading ? (
            <div className="flex justify-center py-20">
              <div data-testid="loading-spinner" className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                eventClick={info => setSelectedEvent(info.event.extendedProps)}
                height="auto"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  meridiem: true
                }}
                eventClassNames="meeting-event" // For custom styling
              />
            </div>
          )}
        </div>
      </div>
      
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h3>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4 text-gray-700">{selectedEvent.description}</div>
            <div className="bg-orange-50 p-3 rounded-lg mb-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-gray-700">Start: {new Date(selectedEvent.startTime).toLocaleString()}</div>
              </div>
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-gray-700">End: {new Date(selectedEvent.endTime).toLocaleString()}</div>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm font-medium text-orange-600">{getTimeRemaining(selectedEvent.startTime)}</div>
              </div>
            </div>
            
            <div className="mb-4">
              <a 
                href={selectedEvent.zoomLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center justify-center w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Join Meeting
              </a>
            </div>
            
            <div className="mb-2 font-medium">Participants:</div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex flex-wrap -space-x-2 mb-2">
                {selectedEvent.participants?.map((p, i) => (
                  <div key={i} className="relative" title={p.user?.fullName || 'Participant'}>
                    {p.user?.profilePicture ? (
                      <img 
                        src={p.user.profilePicture} 
                        alt={p.user?.fullName || 'Participant'} 
                        className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                      />
                    ) : (
                      <div className={`inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center 
                        ${p.userType === 'Client' ? 'bg-blue-100 text-blue-800' : 
                          p.userType === 'Staff' ? 'bg-green-100 text-green-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {p.user?.fullName?.charAt(0) || '?'}
                      </div>
                    )}
                    <span className={`absolute -top-1 -right-1 block h-3 w-3 rounded-full ${
                      p.status === 'confirmed' ? 'bg-green-400' : 'bg-yellow-400'
                    } ring-2 ring-white`}></span>
                  </div>
                ))}
              </div>
              
              <ul className="text-sm">
                {selectedEvent.participants?.map((p, i) => (
                  <li key={i} className="mb-1 flex items-center justify-between">
                    <span>{p.user?.fullName} ({p.userType})</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      p.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyCalendar;