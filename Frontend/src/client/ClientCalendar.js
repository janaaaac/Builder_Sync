import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

const ClientCalendar = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

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
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">My Meetings Calendar</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          events={events}
          eventClick={info => setSelectedEvent(info.event.extendedProps)}
          height="auto"
        />
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
  );
};

export default ClientCalendar;