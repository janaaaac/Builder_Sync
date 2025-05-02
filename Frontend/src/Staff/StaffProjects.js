import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StaffProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/projects/staff', {
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

  if (loading) return <div>Loading projects...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">My Assigned Projects</h2>
      {projects.length === 0 ? (
        <div>No projects assigned.</div>
      ) : (
        <ul className="space-y-4">
          {projects.map(project => (
            <li key={project._id} className="border rounded p-4 bg-white shadow">
              <div className="flex items-center gap-4 mb-2">
                {/* Company Logo */}
                {project.company?.logo && (
                  <img
                    src={project.company.logo}
                    alt="Company Logo"
                    className="w-12 h-12 object-contain rounded border"
                    onError={e => { e.target.onerror = null; e.target.src = '/Assets/default-avatar.png'; }}
                  />
                )}
                <div>
                  <h3 className="font-semibold text-lg">{project.title}</h3>
                  <div className="text-gray-600">{project.description}</div>
                  <div className="text-sm text-gray-500 mt-1">Status: {project.status}</div>
                  <div className="text-sm text-gray-500">Client: {project.client?.fullName}</div>
                  <div className="text-sm text-gray-500">Company: {project.company?.name}</div>
                  <div className="text-sm text-gray-500">Budget: {project.budget}</div>
                  <div className="text-sm text-gray-500">Location: {project.location}</div>
                </div>
              </div>
              {/* Teammates */}
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Team Members:</div>
                <div className="flex flex-wrap gap-2">
                  {project.staff?.length ? project.staff.map(member => (
                    <div key={member._id} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                      <img
                        src={member.profilePicture || '/Assets/default-avatar.png'}
                        alt={member.fullName}
                        className="w-7 h-7 rounded-full object-cover border"
                        onError={e => { e.target.onerror = null; e.target.src = '/Assets/default-avatar.png'; }}
                      />
                      <span className="text-xs font-medium">{member.fullName}</span>
                      <span className="text-xs text-gray-400">({member.role})</span>
                    </div>
                  )) : <span className="text-xs text-gray-400">No team assigned</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StaffProjects;
