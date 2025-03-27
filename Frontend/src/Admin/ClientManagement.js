import React, { useState } from 'react';
import AdminSidebar from './Sidebar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ClientManagement = () => {
  const [clientStatus, setClientStatus] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentClient, setCurrentClient] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Mock data with extended client information
  const clients = [
    { 
      id: 1, 
      username: "client1", 
      fullName: "John Doe", 
      email: "john@example.com", 
      companyName: "ABC Corp", 
      status: "pending",
      clientType: "Individual",
      nicPassportNumber: "ABC123456",
      primaryContact: "+1 234 567 8900",
      address: "123 Main Street, New York, NY 10001",
      preferredCommunication: "Email",
      profilePicture: null,
      nicPassportImage: null,
      registrationDate: "2024-03-27"
    },
    { 
      id: 2, 
      username: "client2", 
      fullName: "Jane Smith", 
      email: "jane@example.com", 
      companyName: "XYZ Ltd", 
      status: "approved",
      clientType: "Corporate",
      nicPassportNumber: "XYZ789012",
      primaryContact: "+1 987 654 3210",
      address: "456 Business Ave, Los Angeles, CA 90001",
      preferredCommunication: "Phone",
      profilePicture: null,
      nicPassportImage: null,
      registrationDate: "2024-03-25"
    },
    { 
      id: 3, 
      username: "client3", 
      fullName: "Mike Johnson", 
      email: "mike@example.com", 
      companyName: "123 Industries", 
      status: "rejected",
      clientType: "Individual",
      nicPassportNumber: "DEF345678",
      primaryContact: "+1 456 789 0123",
      address: "789 Tech Road, San Francisco, CA 94105",
      preferredCommunication: "Email",
      profilePicture: null,
      nicPassportImage: null,
      registrationDate: "2024-03-20"
    },
  ];

  const viewClientDetails = (client) => {
    setCurrentClient(client);
    setOpenDialog(true);
  };

  const filteredClients = clientStatus === "all" 
    ? clients 
    : clients.filter(client => client.status === clientStatus);

  const handleCollapseChange = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar onCollapseChange={handleCollapseChange} />
      
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Manage Clients</h2>
            <button className="bg-[#EA540C] hover:bg-[#c64509] text-white px-6 py-2 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add New Client
            </button>
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
                  <button 
                    onClick={() => setClientStatus("rejected")}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${clientStatus === "rejected" ? "bg-[#EA540C]" : "bg-gray-600"}`}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredClients.map((client) => (
                      <tr key={client.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.fullName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.companyName}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${client.status === "approved" ? "bg-green-100 text-green-800" : 
                              client.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                              "bg-red-100 text-red-800"}`}>
                            {client.status}
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
{openDialog && (
  <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
    <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
      {/* Modal Header */}
      <div className="bg-[#F8F9FA] border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#333] flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6 mr-3 text-[#EA540C]" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
            />
          </svg>
          Client Details
        </h2>
        <button 
          onClick={() => setOpenDialog(false)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
      </div>

      {/* Modal Content */}
      {currentClient && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Overview */}
          <div className="md:col-span-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex flex-col items-center">
              {/* Profile Picture */}
              <div className="w-36 h-36 rounded-full border-4 border-[#EA540C]/20 overflow-hidden mb-4">
                {currentClient.profilePicture ? (
                  <img 
                    src={currentClient.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
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
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1} 
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                      />
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
              
              <span 
                className={`px-3 py-1 rounded-full text-xs font-medium 
                ${currentClient.status === "approved" ? "bg-green-100 text-green-800" : 
                  currentClient.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                  "bg-red-100 text-red-800"}`}
              >
                {currentClient.status.charAt(0).toUpperCase() + currentClient.status.slice(1)}
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
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                  />
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
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
                  />
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
                    {new Date(currentClient.registrationDate).toLocaleDateString('en-US', {
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
                {currentClient.nicPassportImage ? (
                  <img 
                    src={currentClient.nicPassportImage} 
                    alt="NIC/Passport" 
                    className="max-h-64 rounded-lg shadow-md object-contain border border-gray-200"
                  />
                ) : (
                  <div className="w-full text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="mx-auto h-16 w-16 text-gray-400 mb-4" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1} 
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                      />
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
                className="flex items-center px-6 py-2 bg-[#4BD963] text-white rounded-full 
                hover:bg-[#3fb354] transition-colors duration-300 shadow-md"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                Approve Client
              </button>
              <button 
                className="flex items-center px-6 py-2 bg-[#CF4F4A] text-white rounded-full 
                hover:bg-[#b8443f] transition-colors duration-300 shadow-md"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 mr-2" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                Reject Client
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}
      
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default ClientManagement;