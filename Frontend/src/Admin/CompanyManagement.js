import React, { useState } from 'react';
import AdminSidebar from './Sidebar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CompanyManagement = () => {
  const [companyStatus, setCompanyStatus] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Mock data with extended company information
  const companies = [
    { 
      id: 1, 
      username: "admin_abc_corp", 
      email: "info@abccorp.com", 
      companyName: "ABC Construction Solutions", 
      businessRegNumber: "BR-2024-001",
      businessType: "Construction",
      establishmentYear: 2010,
      registeredOfficeAddress: "123 Main Street, Business District, New York, NY 10001",
      branchOfficeAddress: "456 Tech Avenue, Silicon Valley, CA 94105",
      contactPersonName: "John Doe",
      contactPhoneNumber: "+1 (234) 567-8900",
      websiteURL: "https://www.abccorp.com",
      cidaRegNumber: "CIDA-NY-12345",
      cidaGrade: "A+",
      status: "approved",
      companyLogo: null,
      specializedLicenses: null,
      isoCertifications: null
    },
    { 
      id: 2, 
      username: "admin_xyz_engineering", 
      email: "contact@xyzeng.com", 
      companyName: "XYZ Engineering Consultants", 
      businessRegNumber: "BR-2024-002",
      businessType: "Engineering Consulting",
      establishmentYear: 2015,
      registeredOfficeAddress: "789 Innovation Road, Tech Park, San Francisco, CA 94110",
      branchOfficeAddress: "321 Design Street, Innovation Hub, Seattle, WA 98101",
      contactPersonName: "Jane Smith",
      contactPhoneNumber: "+1 (987) 654-3210",
      websiteURL: "https://www.xyzengineering.com",
      cidaRegNumber: "CIDA-CA-67890",
      cidaGrade: "A",
      status: "pending",
      companyLogo: null,
      specializedLicenses: null,
      isoCertifications: null
    },
    { 
      id: 3, 
      username: "admin_123_industries", 
      email: "support@123industries.com", 
      companyName: "123 Industrial Solutions", 
      businessRegNumber: "BR-2024-003",
      businessType: "Industrial Manufacturing",
      establishmentYear: 2005,
      registeredOfficeAddress: "456 Manufacturing Lane, Industrial Zone, Chicago, IL 60601",
      branchOfficeAddress: "789 Production Drive, Industrial Park, Detroit, MI 48201",
      contactPersonName: "Mike Johnson",
      contactPhoneNumber: "+1 (456) 789-0123",
      websiteURL: "https://www.123industries.com",
      cidaRegNumber: "CIDA-IL-54321",
      cidaGrade: "B+",
      status: "rejected",
      companyLogo: null,
      specializedLicenses: null,
      isoCertifications: null
    },
  ];

  const viewCompanyDetails = (company) => {
    setCurrentCompany(company);
    setOpenDialog(true);
  };

  const filteredCompanies = companyStatus === "all" 
    ? companies 
    : companies.filter(company => company.status === companyStatus);

  const handleCollapseChange = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar onCollapseChange={handleCollapseChange} />
      
      <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Manage Companies</h2>
            <button className="bg-[#EA540C] hover:bg-[#c64509] text-white px-6 py-2 rounded-full flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Add New Company
            </button>
          </div>
          
          <div className="bg-white rounded-md shadow-sm">
            <div className="bg-[#3E3E3E] text-white p-4 rounded-t-md">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Company List</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCompanyStatus("all")}
                    className={`px-4 py-1 rounded-full text-sm ${companyStatus === "all" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                  >
                    All
                  </button>
                  <button 
                    onClick={() => setCompanyStatus("pending")}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${companyStatus === "pending" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pending
                  </button>
                  <button 
                    onClick={() => setCompanyStatus("approved")}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${companyStatus === "approved" ? "bg-[#EA540C]" : "bg-gray-600"}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Approved
                  </button>
                  <button 
                    onClick={() => setCompanyStatus("rejected")}
                    className={`px-3 py-1 rounded-full text-sm flex items-center ${companyStatus === "rejected" ? "bg-[#EA540C]" : "bg-gray-600"}`}
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.map((company) => (
                      <tr key={company.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.companyName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.email}</td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${company.status === "approved" ? "bg-green-100 text-green-800" : 
                              company.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                              "bg-red-100 text-red-800"}`}>
                            {company.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button 
                            onClick={() => viewCompanyDetails(company)}
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
      
      {/* Company Details Modal */}
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                  />
                </svg>
                Company Details
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
            {currentCompany && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Company Overview */}
                <div className="md:col-span-1 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex flex-col items-center">
                    {/* Company Logo */}
                    <div className="w-36 h-36 rounded-lg border-4 border-[#EA540C]/20 overflow-hidden mb-4">
                      {currentCompany.companyLogo ? (
                        <img 
                          src={currentCompany.companyLogo} 
                          alt="Company Logo" 
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
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" 
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-[#333] mb-1">
                      {currentCompany.companyName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">
                      {currentCompany.businessType}
                    </p>
                    
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${currentCompany.status === "approved" ? "bg-green-100 text-green-800" : 
                        currentCompany.status === "pending" ? "bg-yellow-100 text-yellow-800" : 
                        "bg-red-100 text-red-800"}`}
                    >
                      {currentCompany.status.charAt(0).toUpperCase() + currentCompany.status.slice(1)}
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
                      <span className="text-sm text-gray-600">{currentCompany.email}</span>
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
                      <span className="text-sm text-gray-600">{currentCompany.contactPhoneNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Right Columns - Detailed Information */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company Registration */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                      Registration Details
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Business Registration Number</label>
                        <p className="text-sm font-medium text-[#333]">{currentCompany.businessRegNumber}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Establishment Year</label>
                        <p className="text-sm font-medium text-[#333]">{currentCompany.establishmentYear}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">CIDA Registration Number</label>
                        <p className="text-sm font-medium text-[#333]">{currentCompany.cidaRegNumber}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">CIDA Grade</label>
                        <p className="text-sm font-medium text-[#333]">{currentCompany.cidaGrade}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                      Contact Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Contact Person</label>
                        <p className="text-sm font-medium text-[#333]">{currentCompany.contactPersonName}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Registered Office Address</label>
                        <p className="text-sm font-medium text-[#333]">{currentCompany.registeredOfficeAddress}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Branch Office Address</label>
                        <p className="text-sm font-medium text-[#333]">{currentCompany.branchOfficeAddress}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Website</label>
                        <a 
                          href={currentCompany.websiteURL} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-sm text-[#EA540C] hover:underline"
                        >
                          {currentCompany.websiteURL}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Specialized Licenses */}
                  <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                      Additional Documents
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Specialized Licenses */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">Specialized Licenses</label>
                        {currentCompany.specializedLicenses ? (
                          <a 
                            href={currentCompany.specializedLicenses} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-[#EA540C] hover:underline flex items-center"
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
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" 
                              />
                            </svg>
                            View License Document
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500">No license document uploaded</p>
                        )}
                      </div>

                      {/* ISO Certifications */}
                      <div>
                        <label className="block text-xs text-gray-500 mb-2">ISO Certifications</label>
                        {currentCompany.isoCertifications ? (
                          <a 
                            href={currentCompany.isoCertifications} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-[#EA540C] hover:underline flex items-center"
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
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" 
                              />
                            </svg>
                            View ISO Certification
                          </a>
                        ) : (
                          <p className="text-sm text-gray-500">No ISO certification uploaded</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {currentCompany.status === "pending" && (
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
                      Approve Company
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
                      Reject Company
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

export default CompanyManagement;