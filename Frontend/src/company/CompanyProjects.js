import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CompanyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [staffList, setStaffList] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState([]);
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/projects/company', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProjects(res.data.data || []);
      } catch (err) {
        setError('Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Fetch staff list when assigning
  const openAssignStaff = async (project) => {
    setSelectedProject(project);
    setSelectedStaff(project.staff ? project.staff.map(s => s._id) : []);
    setSuccessMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5001/api/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaffList(res.data.data || []);
    } catch {
      setStaffList([]);
    }
  };

  const handleStaffChange = (staffId) => {
    setSelectedStaff(prev =>
      prev.includes(staffId)
        ? prev.filter(id => id !== staffId)
        : [...prev, staffId]
    );
  };

  const assignStaff = async () => {
    if (!selectedProject) return;
    setAssigning(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/projects/${selectedProject._id}/add-staff`, {
        staffIds: selectedStaff
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccessMsg('Staff assigned successfully!');
      // Refresh projects
      const res = await axios.get('http://localhost:5001/api/projects/company', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data.data || []);
      setSelectedProject(null);
    } catch {
      setSuccessMsg('Failed to assign staff.');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Company Projects</h2>
      {projects.length === 0 ? (
        <div>No projects found.</div>
      ) : (
        <ul className="space-y-4">
          {projects.map(project => (
            <li key={project._id} className="border rounded p-4 bg-white shadow">
              <h3 className="font-semibold text-lg">{project.title}</h3>
              <div className="text-gray-600">{project.description}</div>
              <div className="text-sm text-gray-500 mt-2">Status: {project.status}</div>
              <div className="text-sm text-gray-500">Client: {project.client?.fullName}</div>
              <div className="text-sm text-gray-500">Budget: {project.budget}</div>
              <div className="text-sm text-gray-500">Location: {project.location}</div>
              <div className="text-sm text-gray-500">Staff: {project.staff?.map(s => s.fullName).join(', ') || 'None'}</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.staff?.length ? project.staff.map(s => (
                  <div key={s._id} className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
                    <img
                      src={s.profilePicture ? s.profilePicture : "/Assets/default-avatar.png"}
                      alt={s.fullName}
                      className="w-7 h-7 rounded-full object-cover border"
                      onError={e => { e.target.onerror = null; e.target.src = "/Assets/default-avatar.png"; }}
                    />
                    <span className="text-xs font-medium">{s.fullName}</span>
                    <span className="text-xs text-gray-500">({s.role})</span>
                  </div>
                )) : <span className="text-xs text-gray-400">No staff assigned</span>}
              </div>
              <button className="mt-2 px-4 py-1 bg-blue-500 text-white rounded" onClick={() => openAssignStaff(project)}>
                Assign Staff
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Assign Staff Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold mb-4">Assign Staff to {selectedProject.title}</h3>
            <div className="mb-4 max-h-60 overflow-y-auto">
              {staffList.length === 0 ? (
                <div>No staff found.</div>
              ) : (
                staffList.map(staff => (
                  <label key={staff._id} className="flex items-center gap-3 mb-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                    <img
                      src={staff.profilePicture ? staff.profilePicture : "/Assets/default-avatar.png"}
                      alt={staff.fullName}
                      className="w-10 h-10 rounded-full object-cover border"
                      onError={e => { e.target.onerror = null; e.target.src = "/Assets/default-avatar.png"; }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{staff.fullName}</div>
                      <div className="text-xs text-gray-500">{staff.role}</div>
                      <div className="text-xs text-gray-400">{staff.email}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(staff._id)}
                      onChange={() => handleStaffChange(staff._id)}
                      className="ml-2"
                    />
                  </label>
                ))
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setSelectedProject(null)}>
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={assignStaff} disabled={assigning}>
                {assigning ? 'Assigning...' : 'Assign Staff'}
              </button>
            </div>
            {successMsg && <div className="mt-2 text-green-600">{successMsg}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProjects;
