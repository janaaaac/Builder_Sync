import React, { useState, useEffect } from 'react';
import AdminSidebar from '../Admin/Sidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CompanyManagement = () => {
  const [companyStatus, setCompanyStatus] = useState("all");
  const [openDialog, setOpenDialog] = useState(false);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Axios instance with base URL and auth headers
  const api = axios.create({
    baseURL: 'http://localhost:5001/api/admin',
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

  // Verify authentication on component mount
  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!token || user?.role !== 'admin') {
        localStorage.clear();
        return navigate('/login', { replace: true });
      }

      try {
        await axios.get('http://localhost:5001/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchCompanies(companyStatus);
      } catch (error) {
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    };

    verifyAuth();
  }, [companyStatus, navigate]);

  // Fetch companies based on status
  const fetchCompanies = async (status = 'all') => {
    try {
      setLoading(true);
      let endpoint = '/companies';
      if (status === 'pending') {
        endpoint = '/companies/pending';
      } else if (status === 'approved') {
        endpoint = '/companies';
      } else if (status === 'rejected') {
        // You may need to adjust this based on your backend
        endpoint = '/companies?status=rejected';
      }
      
      const response = await api.get(endpoint);
      setCompanies(response.data);
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error('Failed to fetch companies');
        console.error('Error fetching companies:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Approve a company
  const handleApprove = async (companyId) => {
    try {
      await api.patch(`/companies/${companyId}/approve`);
      toast.success('Company approved successfully');
      fetchCompanies(companyStatus);
      setOpenDialog(false);
    } catch (error) {
      toast.error('Failed to approve company');
      console.error('Error approving company:', error);
    }
  };

  // Reject a company
  const handleReject = async (companyId) => {
    try {
      await api.delete(`/companies/${companyId}/reject`);
      toast.success('Company rejected successfully');
      fetchCompanies(companyStatus);
      setOpenDialog(false);
    } catch (error) {
      toast.error('Failed to reject company');
      console.error('Error rejecting company:', error);
    }
  };

  // Fetch company details with presigned URLs for files
  const fetchCompanyDetails = async (companyId) => {
    try {
      setLoading(true);
      const response = await api.get(`/companies/${companyId}`);
      
      // Process file URLs - ensure arrays are properly formatted
      const companyData = {
        ...response.data,
        // For logo, use the provided URL or default image
        companyLogo: response.data.companyLogo || response.data.companyLogoUrl || '/default-company.png',
        
        // For document arrays, handle all possible response formats:
        // 1. Array of URLs (backend returns licensesUrls array) 
        // 2. Legacy format (backend returns specializedLicenses array)
        // 3. Single URL (not in array)
        // 4. Null/undefined case
        specializedLicenses: response.data.licensesUrls 
          ? Array.isArray(response.data.licensesUrls)
            ? response.data.licensesUrls
            : [response.data.licensesUrls]
          : Array.isArray(response.data.specializedLicenses)
            ? response.data.specializedLicenses
            : response.data.specializedLicenses 
              ? [response.data.specializedLicenses] 
              : [],
              
        isoCertifications: response.data.certificationsUrls
          ? Array.isArray(response.data.certificationsUrls)
            ? response.data.certificationsUrls
            : [response.data.certificationsUrls]
          : Array.isArray(response.data.isoCertifications)
            ? response.data.isoCertifications
            : response.data.isoCertifications
              ? [response.data.isoCertifications]
              : []
      };

      return companyData;
    } catch (error) {
      toast.error('Failed to fetch company details');
      console.error('Error fetching company details:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // View company details
  const viewCompanyDetails = async (company) => {
    try {
      const companyData = await fetchCompanyDetails(company._id);
      setCurrentCompany({
        ...companyData,
        status: companyData.isApproved ? 'approved' : companyData.isRejected ? 'rejected' : 'pending'
      });
      setOpenDialog(true);
    } catch (error) {
      console.error('Error viewing company details:', error);
    }
  };

  // Filter companies based on status
  const filteredCompanies = companyStatus === "all" 
    ? companies 
    : companies.filter(company => 
        companyStatus === "pending" ? !company.isApproved && !company.isRejected :
        companyStatus === "approved" ? company.isApproved :
        companyStatus === "rejected" ? company.isRejected :
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
            <h2 className="text-xl font-semibold text-gray-800">Manage Companies</h2>
            <button 
              className="bg-[#EA540C] hover:bg-[#c64509] text-white px-6 py-2 rounded-full flex items-center"
              onClick={() => navigate('/admin/companies/new')}
            >
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
                      <tr key={company._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{company.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.companyName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{company.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${company.isApproved ? "bg-green-100 text-green-800" : 
                              company.isRejected ? "bg-red-100 text-red-800" : 
                              "bg-yellow-100 text-yellow-800"}`}>
                            {company.isApproved ? "approved" : company.isRejected ? "rejected" : "pending"}
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
      {openDialog && currentCompany && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="bg-[#F8F9FA] border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-[#333] flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Company Details
              </h2>
              <button onClick={() => setOpenDialog(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column - Company Overview */}
              <div className="md:col-span-1 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div className="flex flex-col items-center">
                  {/* Company Logo */}
                  <div className="w-36 h-36 rounded-lg border-4 border-[#EA540C]/20 overflow-hidden mb-4">
                    {currentCompany.companyLogo ? (
                      <img 
                        src={currentCompany.companyLogo} 
                        alt="Company Logo" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log("Company logo load error, using default");
                          e.target.onerror = null; // Prevent infinite loop
                          e.target.src = '/default-company.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#EA540C]/10 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-[#EA540C]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium 
                    ${currentCompany.status === "approved" ? "bg-green-100 text-green-800" : 
                      currentCompany.status === "rejected" ? "bg-red-100 text-red-800" : 
                      "bg-yellow-100 text-yellow-800"}`}>
                    {currentCompany.status}
                  </span>
                </div>

                <div className="mt-6 space-y-4 border-t pt-4 border-gray-200">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">{currentCompany.email}</span>
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-[#EA540C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-600">{currentCompany.contactPhoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Right Columns - Detailed Information */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Registration Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    Registration Details
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Business Registration</label>
                      <p className="text-sm font-medium text-[#333]">{currentCompany.businessRegNumber}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Establishment Year</label>
                      <p className="text-sm font-medium text-[#333]">{currentCompany.establishmentYear}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">CIDA Registration</label>
                      <p className="text-sm font-medium text-[#333]">{currentCompany.cidaRegNumber}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">CIDA Grade</label>
                      <p className="text-sm font-medium text-[#333]">{currentCompany.cidaGrade}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Contact Person</label>
                      <p className="text-sm font-medium text-[#333]">{currentCompany.contactPersonName}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Registered Office</label>
                      <p className="text-sm font-medium text-[#333]">{currentCompany.registeredOfficeAddress}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Branch Office</label>
                      <p className="text-sm font-medium text-[#333]">{currentCompany.branchOfficeAddress || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Website</label>
                      <a 
                        href={currentCompany.websiteURL} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-[#EA540C] hover:underline"
                      >
                        {currentCompany.websiteURL || 'N/A'}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Documents Section - safer implementation */}

                <div className="md:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h4 className="text-base font-semibold text-[#333] border-b border-gray-200 pb-2 mb-4">
                    Company Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Specialized Licenses */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">Specialized Licenses</label>
                      {currentCompany.specializedLicenses && currentCompany.specializedLicenses.length > 0 ? (
                        <div className="space-y-2">
                          {currentCompany.specializedLicenses.map((license, index) => (
                            license ? (
                              <a 
                                key={index}
                                href={license} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-[#EA540C] hover:underline flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                License {index + 1}
                              </a>
                            ) : null
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No license documents available</p>
                      )}
                    </div>

                    {/* ISO Certifications */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-2">ISO Certifications</label>
                      {currentCompany.isoCertifications && currentCompany.isoCertifications.length > 0 ? (
                        <div className="space-y-2">
                          {currentCompany.isoCertifications.map((cert, index) => (
                            cert ? (
                              <a 
                                key={index}
                                href={cert} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-[#EA540C] hover:underline flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                                Certification {index + 1}
                              </a>
                            ) : null
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No certification documents available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {currentCompany.status === "pending" && (
                <div className="md:col-span-3 flex justify-center gap-4 mt-6 border-t border-gray-200 pt-6">
                  <button 
                    onClick={() => handleApprove(currentCompany._id)}
                    className="flex items-center px-6 py-2 bg-[#4BD963] text-white rounded-full hover:bg-[#3fb354] transition-colors duration-300 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Approve Company
                  </button>
                  <button 
                    onClick={() => handleReject(currentCompany._id)}
                    className="flex items-center px-6 py-2 bg-[#CF4F4A] text-white rounded-full hover:bg-[#b8443f] transition-colors duration-300 shadow-md"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Reject Company
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

export default CompanyManagement;