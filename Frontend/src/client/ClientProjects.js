import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProjectSkeleton = () => (
  <div className="border rounded p-4 bg-white shadow">
    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3 animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6 mb-4 animate-pulse"></div>
    <div className="flex flex-wrap gap-4">
      <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
      <div className="h-4 bg-gray-200 rounded w-1/5 animate-pulse"></div>
    </div>
  </div>
);

const ClientProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/projects/client', {
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

  if (error) return <div className="max-w-4xl mx-auto p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">My Projects</h2>
      {loading ? (
        <div className="space-y-4">
          {Array(4).fill().map((_, index) => (
            <ProjectSkeleton key={index} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div>No projects found.</div>
      ) : (
        <ul className="space-y-4">
          {projects.map(project => (
            <li key={project._id} className="border rounded p-4 bg-white shadow">
              <h3 className="font-semibold text-lg">{project.title}</h3>
              <div className="text-gray-600">{project.description}</div>
              <div className="text-sm text-gray-500 mt-2">Status: {project.status}</div>
              <div className="text-sm text-gray-500">Company: {project.company?.name}</div>
              <div className="text-sm text-gray-500">Budget: {project.budget}</div>
              <div className="text-sm text-gray-500">Location: {project.location}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientProjects;
