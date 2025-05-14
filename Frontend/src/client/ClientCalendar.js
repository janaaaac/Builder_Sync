import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import ClientSidebar from './clientSidebar';

const ClientCalendar = () => {
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

  // Convert meetings to FullCalendar events
  const events = meetings.map(m => ({
    id: m._id,
    title: m.title,
    start: m.startTime,
    end: m.endTime,
    extendedProps: m
  }));

  // Time remaining helper
  const getTimeRemaining = (startTime) => {
    const diff = new Date(startTime) - new Date();
    if (diff <= 0) return 'Started';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m remaining`;
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className={`h-full fixed left-0 top-0 z-20 transition-all duration-300 bg-white border-r border-gray-200`}>
        <ClientSidebar onCollapseChange={setIsCollapsed} />
      </div>
      <div className={`flex-1 transition-all duration-300`} style={{ marginLeft: isCollapsed ? "5rem" : "16rem" }}>
        <div className="p-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">My Meetings Calendar</h2>
            {loading ? (
              <div className="p-6 text-center bg-white rounded-lg shadow">
                <div className="animate-pulse flex flex-col items-center">
                  <div className="w-14 h-14 bg-gray-200 rounded-full mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center bg-white rounded-lg shadow">
                <div className="text-red-500">{error}</div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={events}
                  eventClick={info => setSelectedEvent(info.event.extendedProps)}
                  height="auto"
                />
              </div>
            )}
            
            {/* Meeting Details Modal */}
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
                  <button className="mt-2 px-4 py-2 bg-gray-300 rounded" onClick={() => setSelectedEvent(null)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientCalendar;