import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export default function ProjectTasks({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await axios.get(`${API_URL}/api/tasks/project/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setTasks(res.data.data);
        } else {
          setError('Failed to fetch tasks');
        }
      } catch (err) {
        setError('Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [projectId]);

  if (loading) return <div className="py-8 text-center text-gray-500">Loading tasks...</div>;
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;
  if (!tasks.length) return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold flex items-center mb-4">
        <ClipboardList className="h-5 w-5 mr-2 text-orange-500" />
        Project Tasks
      </h2>
      <div className="text-center py-8 px-4">
        <h3 className="text-gray-500 mb-1">No tasks found for this project.</h3>
        <p className="text-sm text-gray-400">Project tasks will appear here when added</p>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold flex items-center mb-4">
        <ClipboardList className="h-5 w-5 mr-2 text-orange-500" />
        Project Tasks
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task, idx) => (
              <tr key={task._id || idx}>
                <td className="px-4 py-3 whitespace-nowrap font-medium">{task.title}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.description || '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 capitalize">{task.status}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                  {task.assignedTo && task.assignedTo.length > 0 ? (
                    <ul>
                      {task.assignedTo.map((user, i) => (
                        <li key={user._id || i}>{user.fullName || user.email || '-'}</li>
                      ))}
                    </ul>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
