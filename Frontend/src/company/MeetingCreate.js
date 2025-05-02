import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MeetingCreate = ({ onMeetingCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [participants, setParticipants] = useState([]); // [{user, userType}]
  const [staffList, setStaffList] = useState([]);
  const [clientList, setClientList] = useState([]);
  const [approvedProposalClients, setApprovedProposalClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Map staff roles to more readable formats
  const formatStaffRole = (role) => {
    const roleMap = {
      'project_manager': 'Project Manager',
      'architect': 'Architect',
      'engineer': 'Engineer',
      'qs': 'Quantity Surveyor',
      'site_supervisor': 'Site Supervisor'
    };
    return roleMap[role] || role;
  };

  // Default avatar for when profile image is missing
  const defaultAvatar = '/static/media/default-avatar.png';

  // Fetch staff and clients for participant selection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        // Fetch staff members
        const staffRes = await axios.get('http://localhost:5001/api/staff', { headers });
        setStaffList(staffRes.data.data || []);
        
        // Fetch all clients
        const clientRes = await axios.get('http://localhost:5001/api/clients', { headers });
        setClientList(clientRes.data.data || []);
        
        // Fetch clients with approved proposals - Fixed endpoint to use singular 'proposal'
        try {
          console.log('Fetching approved proposal clients...');
          const approvedRes = await axios.get('http://localhost:5001/api/proposal/approved-clients', { headers });
          console.log('Approved clients response:', approvedRes.data);
          
          if (approvedRes.data.success) {
            setApprovedProposalClients(approvedRes.data.data || []);
            console.log(`Found ${approvedRes.data.data.length} clients with approved proposals`);
          } else {
            console.error('API returned success: false');
            setFetchError('Failed to load approved clients');
          }
        } catch (err) {
          console.error('Error fetching clients with approved proposals:', err);
          setFetchError(`Error fetching approved clients: ${err.message}`);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    
    fetchUsers();
  }, []);

  const handleParticipantChange = (userId, userType, checked) => {
    setParticipants(prev => checked
      ? [...prev, { user: userId, userType }]
      : prev.filter(p => !(p.user === userId && p.userType === userType))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5001/api/meetings', {
        title, description, startTime, endTime, participants
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess('Meeting created!');
      setTitle(''); setDescription(''); setStartTime(''); setEndTime(''); setParticipants([]);
      if (onMeetingCreated) onMeetingCreated(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create meeting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="bg-white p-6 rounded-lg shadow-sm mb-6 max-w-xl mx-auto" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4 text-gray-800">Create Meeting</h2>
      {success && <div className="text-orange-600 mb-4 bg-orange-50 p-3 rounded-md border border-orange-200">{success}</div>}
      {error && <div className="text-red-600 mb-4 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>}
      {fetchError && <div className="text-amber-600 mb-4 bg-amber-50 p-3 rounded-md border border-amber-200">Note: {fetchError}</div>}
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input 
          className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition" 
          value={title} 
          onChange={e => setTitle(e.target.value)} 
          required 
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea 
          className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition" 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          rows="3"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input 
            type="datetime-local" 
            className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition" 
            value={startTime} 
            onChange={e => setStartTime(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input 
            type="datetime-local" 
            className="border border-gray-300 p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition" 
            value={endTime} 
            onChange={e => setEndTime(e.target.value)} 
            required 
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Add Staff</label>
        <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md border border-gray-200">
          {staffList.length > 0 ? (
            staffList.map(staff => (
              <label key={staff._id} className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition">
                <input 
                  type="checkbox" 
                  className="text-orange-500 focus:ring-orange-400"
                  checked={participants.some(p => p.user === staff._id && p.userType === 'Staff')} 
                  onChange={e => handleParticipantChange(staff._id, 'Staff', e.target.checked)} 
                />
                <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border">
                  <img 
                    src={staff.profilePicture || defaultAvatar} 
                    alt={staff.fullName} 
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.src = defaultAvatar; }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{staff.fullName}</span>
                  <span className="text-xs text-gray-500">{formatStaffRole(staff.role)}</span>
                </div>
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No staff members found</p>
          )}
        </div>
      </div>

      {/* Clients with Approved Proposals */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-orange-700 mb-2">
          Clients with Approved Proposals {approvedProposalClients.length > 0 ? `(${approvedProposalClients.length})` : ''}
        </label>
        <div className="bg-orange-50 p-3 rounded-md border border-orange-200">
          {approvedProposalClients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {approvedProposalClients.map(client => (
                <label key={client._id} className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-orange-200 shadow-sm hover:shadow-md transition">
                  <input 
                    type="checkbox" 
                    className="text-orange-500 focus:ring-orange-400"
                    checked={participants.some(p => p.user === client._id && p.userType === 'Client')} 
                    onChange={e => handleParticipantChange(client._id, 'Client', e.target.checked)} 
                  />
                  <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border">
                    <img 
                      src={client.profilePicture || defaultAvatar} 
                      alt={client.fullName} 
                      className="h-full w-full object-cover"
                      onError={(e) => { e.target.src = defaultAvatar; }}
                    />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-orange-800 truncate">
                      {client.fullName || client.email || 'Unnamed Client'}
                    </span>
                    {client.projectTitle && (
                      <span className="text-xs text-orange-600 italic truncate">
                        {client.projectTitle}
                      </span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No clients with approved proposals found</p>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">All Clients</label>
        <div className="flex flex-wrap gap-2 bg-gray-50 p-3 rounded-md border border-gray-200">
          {clientList.length > 0 ? (
            clientList.map(client => (
              <label key={client._id} className="flex items-center gap-1 px-2 py-1 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition">
                <input 
                  type="checkbox" 
                  className="text-orange-500 focus:ring-orange-400"
                  checked={participants.some(p => p.user === client._id && p.userType === 'Client')} 
                  onChange={e => handleParticipantChange(client._id, 'Client', e.target.checked)} 
                />
                <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border">
                  <img 
                    src={client.profilePicture || defaultAvatar} 
                    alt={client.fullName} 
                    className="h-full w-full object-cover"
                    onError={(e) => { e.target.src = defaultAvatar; }}
                  />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">
                    {client.fullName || client.email || 'Unnamed Client'}
                  </span>
                  {client.companyName && (
                    <span className="text-xs text-gray-500 truncate">
                      {client.companyName}
                    </span>
                  )}
                </div>
              </label>
            ))
          ) : (
            <p className="text-sm text-gray-500 italic">No clients found</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-md shadow-sm hover:shadow transition-all flex items-center justify-center gap-2" 
          disabled={loading}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            'Create Meeting'
          )}
        </button>
      </div>
    </form>
  );
};

export default MeetingCreate;