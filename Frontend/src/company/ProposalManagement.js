import React, { useState, useEffect, useRef } from 'react';
import AdminSidebar from '../Admin/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CompanySidebar from './CompanySideBar';
import io from 'socket.io-client';

const ProposalManagement = () => {
  const [proposalStatus, setProposalStatus] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProposal, setCurrentProposal] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [proposalToReject, setProposalToReject] = useState(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Axios instance with base URL and auth headers
  const api = axios.create({
    baseURL: 'http://localhost:5001/api',
  });

  // Request interceptor for adding token
  api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    config.headers.Authorization = token ? `Bearer ${token}` : '';
    return config;
  });

  // Response interceptor for handling 401 errors
  api.interceptors.response.use(
    response => response,
    error => {
      if (error.response?.status === 401) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  // Add useEffect to fetch proposals on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || user?.role !== 'company') {
        localStorage.clear();
        return navigate('/login', { replace: true });
      }

      try {
        await axios.get('http://localhost:5001/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchProposals(proposalStatus);
      } catch (error) {
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    };

    verifyAuth();
  }, [proposalStatus, navigate]);

  // Initialize WebSocket connection
  useEffect(() => {
    // Create socket connection
    socketRef.current = io('http://localhost:5001');
    
    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Update fetchProposals to use company-specific endpoint with populated data
  const fetchProposals = async (status = 'all') => {
    try {
      setLoading(true);
      
      // Use the company endpoint with population query param to get client details
      const endpoint = '/proposal/company?populate=client';
      
      const response = await api.get(endpoint);
      console.log("Proposals data:", response.data);
      
      // Filter proposals based on status if needed
      let filteredData = response.data.data || [];
      
      // Don't filter on the API call - get all proposals and filter locally
      // This allows us to handle the accepted/approved terminology mismatch
      setProposals(filteredData);
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch proposals');
        console.error('Error fetching proposals:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Approve a proposal
  const handleApprove = async (proposalId) => {
    try {
      console.log('Approving proposal with ID:', proposalId);
      
      // Check if ID exists
      if (!proposalId) {
        toast.error('Missing proposal ID');
        return;
      }
      
      // Log the request details for debugging
      console.log('Request URL:', `/proposal/${proposalId}/status`);
      console.log('Request body:', { status: 'approved' });
      
      const response = await api.put(`/proposal/${proposalId}/status`, { status: 'approved' });
      console.log('Approval response:', response.data);
      
      const proposalData = response.data.data;
      const clientId = proposalData.client;
      
      // Create notification in database
      try {
        await api.post('/notifications', {
          userId: clientId,
          type: 'proposal_approved',
          message: `Your proposal "${proposalData.projectTitle}" has been approved!`,
          proposal: proposalId,
          data: {
            proposalId: proposalId,
            projectTitle: proposalData.projectTitle
          }
        });
        console.log('Approval notification saved to database');
      } catch (notifError) {
        console.error('Error saving approval notification to database:', notifError);
      }
      
      // Send notification via WebSocket
      if (socketRef.current && clientId) {
        socketRef.current.emit('sendNotification', {
          type: 'proposal_approved',
          message: `Your proposal "${proposalData.projectTitle}" has been approved!`,
          userId: clientId, // Send to specific client
          data: {
            proposalId: proposalId,
            projectTitle: proposalData.projectTitle
          }
        });
      }
      
      toast.success('Proposal approved successfully');
      fetchProposals(proposalStatus);
      setOpenDialog(false);
    } catch (error) {
      console.error('Error approving proposal:', error);
      
      // More detailed error logging to help diagnose the issue
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        toast.error(`Error ${error.response.status}: ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request error:', error.message);
        toast.error(`Request error: ${error.message}`);
      }
    }
  };

  // Show rejection form
  const showRejectionForm = (proposalId) => {
    setProposalToReject(proposalId);
    setRejectReason('');
    setShowRejectForm(true);
  };

  // Reject a proposal
  const handleReject = async () => {
    try {
      const proposalId = proposalToReject;
      console.log('Rejecting proposal with ID:', proposalId);
      
      // Check if ID exists
      if (!proposalId) {
        toast.error('Missing proposal ID');
        return;
      }
      
      // Log the request details for debugging
      console.log('Request URL:', `/proposal/${proposalId}/status`);
      console.log('Request body:', { status: 'rejected', reason: rejectReason });
      
      const response = await api.put(`/proposal/${proposalId}/status`, { 
        status: 'rejected',
        reason: rejectReason 
      });
      console.log('Rejection response:', response.data);
      
      const proposalData = response.data.data;
      const clientId = proposalData.client;
      
      // Create notification in database
      try {
        await api.post('/notifications', {
          userId: clientId,
          type: 'proposal_rejected',
          message: `Your proposal "${proposalData.projectTitle}" has been rejected.`,
          proposal: proposalId,
          data: {
            proposalId: proposalId,
            projectTitle: proposalData.projectTitle,
            reason: rejectReason
          }
        });
        console.log('Notification saved to database');
      } catch (notifError) {
        console.error('Error saving notification to database:', notifError);
      }
      
      // Send real-time notification via WebSocket
      if (socketRef.current && clientId) {
        socketRef.current.emit('sendNotification', {
          type: 'proposal_rejected',
          message: `Your proposal "${proposalData.projectTitle}" has been rejected.`,
          userId: clientId, // Send to specific client
          data: {
            proposalId: proposalId,
            projectTitle: proposalData.projectTitle,
            reason: rejectReason
          }
        });
        console.log('Real-time notification sent via WebSocket');
      }
      
      toast.success('Proposal rejected successfully');
      fetchProposals(proposalStatus);
      setOpenDialog(false);
      setShowRejectForm(false);
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      
      // More detailed error logging to help diagnose the issue
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        toast.error(`Error ${error.response.status}: ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('No response received from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request error:', error.message);
        toast.error(`Request error: ${error.message}`);
      }
    }
  };

  // Fetch proposal details
  const fetchProposalDetails = async (proposalId) => {
    try {
      setLoading(true);
      const response = await api.get(`/proposal/${proposalId}`);
      
      return response.data.data;
    } catch (error) {
      toast.error('Failed to fetch proposal details');
      console.error('Error fetching proposal details:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // View proposal details
  const viewProposalDetails = async (proposal) => {
    try {
      const proposalData = await fetchProposalDetails(proposal._id);
      setCurrentProposal({
        ...proposalData,
        status: proposalData.status || 'pending'
      });
      setOpenDialog(true);
    } catch (error) {
      console.error('Error viewing proposal details:', error);
    }
  };

  // Filter proposals based on status - UPDATED to handle the accepted/approved terminology mismatch
  const filteredProposals = proposalStatus === "all" 
    ? proposals 
    : proposals.filter(proposal => {
        if (proposalStatus === "pending") return proposal.status === 'pending';
        // Check for both "approved" and "accepted" when filtering for approved tab
        if (proposalStatus === "approved") return proposal.status === 'approved' || proposal.status === 'accepted';
        if (proposalStatus === "rejected") return proposal.status === 'rejected';
        return false;
      });

  const handleCollapseChange = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <CompanySidebar onCollapseChange={handleCollapseChange} />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#EA540C]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CompanySidebar onCollapseChange={handleCollapseChange} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Company Proposals</h2>
          </div>
          
          {/* Always show the table structure */}
          <div className="bg-white rounded-md shadow-sm">
            <div className="bg-[#3E3E3E] text-white p-4 rounded-t-md">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Proposal List</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setProposalStatus("all")}
                    className={`px-4 py-1 rounded-full text-sm ${proposalStatus === "all" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                  >
                    All
                  </button>
                  <button 
                      onClick={() => setProposalStatus("pending")}
                      className={`px-3 py-1 rounded-full text-sm flex items-center ${proposalStatus === "pending" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Pending
                    </button>
                    <button 
                      onClick={() => setProposalStatus("approved")}
                      className={`px-3 py-1 rounded-full text-sm flex items-center ${proposalStatus === "approved" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Approved
                    </button>
                    <button 
                      onClick={() => setProposalStatus("rejected")}
                      className={`px-3 py-1 rounded-full text-sm flex items-center ${proposalStatus === "rejected" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Rejected
                    </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProposals.length > 0 ? (
                      // Show proposals if there are any
                      filteredProposals.map((proposal) => (
                        <tr key={proposal._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{proposal.projectTitle}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {proposal.client ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">
                                  {proposal.client.fullName || proposal.client.name || 'Unknown'}
                                </span>
                                {proposal.client.email && (
                                  <span className="text-xs text-gray-500">{proposal.client.email}</span>
                                )}
                              </div>
                            ) : 'Unknown Client'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{proposal.budget}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${(proposal.status === "approved" || proposal.status === "accepted") ? "bg-green-100 text-green-800" : 
                                proposal.status === "rejected" ? "bg-red-100 text-red-800" : 
                                "bg-yellow-100 text-yellow-800"}`}>
                              {/* Display "Approved" for both approved and accepted statuses */}
                              {(proposal.status === "approved" || proposal.status === "accepted") ? "Approved" : 
                               proposal.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button 
                              onClick={() => viewProposalDetails(proposal)}
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
                      ))
                    ) : (
                      // Show "No proposals" message in the table - update colspan to 5 (from 7)
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No proposals yet</h3>
                          <p className="text-gray-500">You don't have any project proposals at the moment.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Proposal Details Modal */}
      {openDialog && currentProposal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-[#F8F9FA] border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#333] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {currentProposal.projectTitle || 'Project Proposal'}
              </h2>
              <button onClick={() => setOpenDialog(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Proposal Overview */}
              <div className="md:col-span-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex flex-col">
                  <h3 className="text-lg font-semibold text-[#333] mb-3">
                    Project Overview
                  </h3>
                  
                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit
                      ${(currentProposal.status === "approved" || currentProposal.status === "accepted") ? "bg-green-100 text-green-800" : 
                        currentProposal.status === "rejected" ? "bg-red-100 text-red-800" : 
                        "bg-yellow-100 text-yellow-800"}`}>
                      {/* Display "Approved" for both approved and accepted statuses */}
                      {(currentProposal.status === "approved" || currentProposal.status === "accepted") ? "Approved" : 
                       currentProposal.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="space-y-4 border-t pt-4 border-gray-200">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <span className="text-xs text-gray-500 block">Budget</span>
                        <span className="text-sm font-medium text-gray-700">
                          {currentProposal.budget ? `${currentProposal.budget}` : 'Not specified'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <span className="text-xs text-gray-500 block">Timeline</span>
                        <span className="text-sm font-medium text-gray-700">
                          {currentProposal.timeline ? new Date(currentProposal.timeline).toLocaleDateString() : 
                           (currentProposal.month && currentProposal.year) ? `${currentProposal.month}/${currentProposal.year}` : 
                           'Not specified'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <span className="text-xs text-gray-500 block">Location</span>
                        <span className="text-sm font-medium text-gray-700">
                          {currentProposal.projectLocation || 'Not specified'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Additional NIC information if available */}
                    {currentProposal.nic && (
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                        </svg>
                        <div>
                          <span className="text-xs text-gray-500 block">NIC</span>
                          <span className="text-sm font-medium text-gray-700">{currentProposal.nic}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Columns - Detailed Information */}
              <div className="md:col-span-2 grid grid-cols-1 gap-6">
                {/* Project Description */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    Project Description
                  </h4>
                  {currentProposal.projectDescription ? (
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {currentProposal.projectDescription}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No description provided</p>
                  )}
                </div>

                {/* Requirements Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    Project Requirements
                  </h4>
                  
                  {currentProposal.requirements && Object.entries(currentProposal.requirements).some(([_, value]) => value) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2">
                      {Object.entries(currentProposal.requirements).map(([key, value]) => (
                        value && (
                          <div key={key} className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#EA540C] mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-gray-700">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          </div>
                        )
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No specific requirements listed</p>
                  )}
                </div>

                {/* Attachments Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    Attachments
                  </h4>
                  
                  {currentProposal.attachments && currentProposal.attachments.length > 0 ? (
                    <div className="space-y-3">
                      {currentProposal.attachments.map((attachment, index) => {
                        const fileName = attachment.filename || attachment.originalname || `Attachment ${index + 1}`;
                        const fileUrl = attachment.path || attachment.url || '#';
                        
                        // Determine file type icon
                        const fileType = fileName.split('.').pop()?.toLowerCase();
                        let fileIcon = (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        );
                        
                        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileType)) {
                          fileIcon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          );
                        } else if (['pdf'].includes(fileType)) {
                          fileIcon = (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          );
                        }
                        
                        return (
                          <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                            <div className="flex items-center">
                              {fileIcon}
                              <div>
                                <span className="text-sm font-medium text-gray-700">{fileName}</span>
                                {attachment.size && (
                                  <span className="text-xs text-gray-500 block">
                                    {Math.round(attachment.size / 1024)} KB
                                  </span>
                                )}
                              </div>
                            </div>
                            <a 
                              href={fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-[#EA540C] hover:underline flex items-center bg-orange-50 px-3 py-1 rounded-full"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No attachments provided</p>
                  )}
                </div>
              </div>

              {/* Party Information */}
              <div className="md:col-span-3">
                {/* Client Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Client Information
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                    {currentProposal.client ? (
                      <>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Full Name</label>
                          <p className="text-sm font-medium text-[#333]">
                            {currentProposal.client.fullName || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Email</label>
                          <p className="text-sm font-medium text-[#333]">
                            {currentProposal.client.email || 'Not provided'}
                          </p>
                        </div>
                        {/* Removed Username field */}
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">NIC/Passport</label>
                          <p className="text-sm font-medium text-[#333]">
                            {currentProposal.client.nicPassportNumber || 'Not provided'}
                          </p>
                        </div>
                      
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Address</label>
                          <p className="text-sm font-medium text-[#333]">
                            {currentProposal.client.address || 'Not provided'}
                          </p>
                        </div>
                        {/* Removed Preferred Communication field */}
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 italic col-span-2">Client information not available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {currentProposal.status === "pending" && (
                <div className="md:col-span-3 flex justify-center gap-4 mt-6 border-t border-gray-200 pt-6">
                  <button 
                    onClick={() => handleApprove(currentProposal._id)}
                    className="flex items-center px-6 py-2 bg-[#4BD963] text-white rounded-full hover:bg-[#3fb354] transition-colors duration-300 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Approve Proposal
                  </button>
                  <button 
                    onClick={() => showRejectionForm(currentProposal._id)}
                    className="flex items-center px-6 py-2 bg-[#CF4F4A] text-white rounded-full hover:bg-[#b8443f] transition-colors duration-300 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reject Proposal
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
      
      {/* Rejection Reason Modal */}
      {showRejectForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200">
            <div className="bg-[#F8F9FA] border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#333] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-[#CF4F4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Reject Proposal
              </h2>
              <button onClick={() => setShowRejectForm(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="rejectReason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Rejection
                </label>
                <textarea
                  id="rejectReason"
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#EA540C] focus:border-[#EA540C]"
                  placeholder="Please provide details about why this proposal is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="px-4 py-2 bg-[#CF4F4A] text-white rounded-md text-sm font-medium hover:bg-[#b8443f] focus:outline-none"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ToastContainer position="bottom-right" />

    </div>
  );
};

export default ProposalManagement;
