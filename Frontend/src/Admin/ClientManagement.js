import React, { useState, useEffect } from 'react';
import AdminSidebar from '../Admin/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ClientManagementA = () => {
  const [clientStatus, setClientStatus] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Create axios instance with base URL
  const api = axios.create({
    baseURL: 'http://localhost:5001/api/admin',
  });
  
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    config.headers.Authorization = token ? `Bearer ${token}` : '';
    return config;
  });
  
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login'; // Force full page reload
      }
      return Promise.reject(error);
    }
  );

  // Add this after your interceptors
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Immediate redirect if no valid credentials
      if (!token || user?.role !== 'admin') {
        localStorage.clear();
        return navigate('/login', { replace: true });
      }
  
      try {
        // Verify token with backend
        await axios.get('http://localhost:5001/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Only fetch clients after successful verification
        fetchClients(clientStatus);
      } catch (error) {
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    };
  
    verifyAuth();
  }, [clientStatus, navigate]);

  // Fetch clients based on status
  const fetchClients = async (status = 'all') => {
    try {
      setLoading(true);
      let endpoint = '/clients';
      if (status === 'pending') {
        endpoint = '/clients/pending';
      }
      const response = await api.get(endpoint);
      setClients(response.data);
    } catch (error) {
      if (error.response?.status !== 401) { // Don't show toast for 401 as it's handled globally
        toast.error('Failed to fetch clients');
        console.error('Error fetching clients:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Approve a client
  const handleApprove = async (clientId) => {
    try {
      await api.patch(`/clients/${clientId}/approve`);
      toast.success('Client approved successfully');
      fetchClients(clientStatus);
      setOpenDialog(false);
    } catch (error) {
      toast.error('Failed to approve client');
      console.error('Error approving client:', error);
    }
  };

  // Reject a client
  const handleReject = async (clientId) => {
    try {
      await api.patch(`/clients/${clientId}/reject`);
      toast.success('Client rejected successfully');
      fetchClients(clientStatus);
      setOpenDialog(false);
    } catch (error) {
      toast.error('Failed to reject client');
      console.error('Error rejecting client:', error);
    }
  };

  // Update the fetchClientDetails function to handle images properly

const fetchClientDetails = async (clientId) => {
  try {
    setLoading(true);
    const response = await api.get(`/clients/${clientId}`);
    
    // Backend should now return presigned URLs directly
    const clientData = {
      ...response.data,
      // Set default images only if no URL is returned by the backend
      profilePicture: response.data.profilePicture || null,
      nicPassportFile: response.data.nicPassportFile || null
    };
    
    return clientData;
  } catch (error) {
    toast.error('Failed to fetch client details');
    console.error('Error fetching client details:', error);
    throw error;
  } finally {
    setLoading(false);
  }
};

  // View client details
  const viewClientDetails = async (client) => {
    try {
      const clientData = await fetchClientDetails(client._id);
      setCurrentClient({
        ...clientData,
        status: clientData.isApproved ? 'approved' : 'pending'
      });
      setOpenDialog(true);
    } catch (error) {
      console.error('Error viewing client details:', error);
    }
  };

  // Load clients when component mounts or status changes
  useEffect(() => {
    fetchClients(clientStatus);
  }, [clientStatus]);

  const filteredClients = clientStatus === "all" 
    ? clients 
    : clients.filter(client => 
        clientStatus === "pending" ? !client.isApproved : 
        clientStatus === "approved" ? client.isApproved : 
        false
      );

  const handleCollapseChange = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar onCollapseChange={handleCollapseChange} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EA540C]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar onCollapseChange={handleCollapseChange} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Manage Clients</h2>
          </div>
          
          <div className="bg-white rounded-md shadow-sm">
            <div className="bg-[#3E3E3E] text-white p-4 rounded-t-md">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Client List</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setClientStatus("all")}
                    className={`px-4 py-1 rounded-full text-sm ${clientStatus === "all" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setClientStatus("pending")}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${clientStatus === "pending" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pending
                  </button>
                  <button 
                    onClick={() => setClientStatus("approved")}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${clientStatus === "approved" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Approved
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${client.isApproved ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                            {client.isApproved ? "approved" : "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => viewClientDetails(client)}
                            className="text-[#EA540C] hover:text-[#c64509] flex items-center rounded-full px-3 py-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Client Details Modal */}
      {openDialog && currentClient && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-[#F8F9FA] border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#333] flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6 mr-3 text-[#EA540C]" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Client Details
              </h2>
              <button 
                onClick={() => setOpenDialog(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Profile Overview */}
              <div className="md:col-span-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="w-36 h-36 rounded-full border-4 border-[#EA540C]/20 overflow-hidden mb-4">
                    {currentClient.profilePicture ? (
                      <img 
                        src={currentClient.profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("Profile image error, using default image");
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.src = '/default-avatar.png'; // Use a default image
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EA540C]/10 flex items-center justify-center">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-16 w-16 text-[#EA540C]/50" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-[#333] mb-1">
                    {currentClient.fullName}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {currentClient.clientType} Client
                  </p>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium 
                    ${currentClient.status === "approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                    {currentClient.status}
                  </span>
                </div>

                <div className="mt-6 space-y-4 border-t pt-4 border-gray-200">
                  <div className="flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-3 text-[#EA540C]" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{currentClient.email}</span>
                  </div>
                  <div className="flex items-center">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-5 w-5 mr-3 text-[#EA540C]" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-600">{currentClient.primaryContact}</span>
                  </div>
                </div>
              </div>

              {/* Right Columns - Detailed Information */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Company</label>
                      <p className="text-sm font-medium text-[#333]">{currentClient.companyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Address</label>
                      <p className="text-sm font-medium text-[#333]">{currentClient.address}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Preferred Communication</label>
                      <p className="text-sm font-medium text-[#333]">{currentClient.preferredCommunication}</p>
                    </div>
                  </div>
                </div>

                {/* Identification */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    Identification
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">NIC/Passport Number</label>
                      <p className="text-sm font-medium text-[#333]">{currentClient.nicPassportNumber}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Registration Date</label>
                      <p className="text-sm font-medium text-[#333]">
                        {new Date(currentClient.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* NIC/Passport Image */}
                <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    NIC/Passport Document
                  </h4>
                  <div className="mt-4 flex justify-center">
                    {currentClient.nicPassportFile ? (
                      <div className="w-full flex flex-col items-center">
                        <img 
                          src={currentClient.nicPassportFile} 
                          alt="NIC/Passport" 
                          className="max-h-64 rounded-lg shadow-md object-contain border border-gray-200"
                          onError={(e) => {
                            console.log("Document image error, using fallback");
                            e.target.onerror = null; // Prevent infinite loop
                            e.target.src = '/document-placeholder.png';
                          }}
                        />
                        <a 
                          href={currentClient.nicPassportFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 flex items-center px-4 py-2 bg-[#EA540C] text-white rounded-md hover:bg-[#c64509] transition-colors"
                        >
                          View Full Document
                        </a>
                      </div>
                    ) : (
                      <div className="w-full text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="mx-auto h-16 w-16 text-gray-400 mb-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500">No document image available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {currentClient.status === "pending" && (
                <div className="md:col-span-3 flex justify-center gap-4 mt-6 border-t border-gray-200 pt-6">
                  <button 
                    onClick={() => handleApprove(currentClient._id)}
                    className="flex items-center px-6 py-2 bg-[#4BD963] text-white rounded-full hover:bg-[#3fb354] transition-colors duration-300 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Approve Client
                  </button>
                  <button 
                    onClick={() => handleReject(currentClient._id)}
                    className="flex items-center px-6 py-2 bg-[#CF4F4A] text-white rounded-full hover:bg-[#b8443f] transition-colors duration-300 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reject Client
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ClientManagementA;