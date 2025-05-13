import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage,
  FaFilePowerpoint, FaFileAlt, FaFileCode, FaFileArchive, FaFileVideo,
  FaFileAudio, FaSearch, FaFilter, FaUpload, FaTags, FaTrash,
  FaEye, FaDownload, FaEdit
} from 'react-icons/fa';
import StaffSidebar from './staffSideBar';
import DocumentSearch from '../components/DocumentSearch';
import DocumentSharing from '../components/DocumentSharing';

// Create axios instance with base URL and auth token
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const api = axios.create({
  baseURL: API_URL
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
      toast.error('Authentication expired. Please log in again.');
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const StaffDocuments = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('other');
  const [documentName, setDocumentName] = useState('');
  const [documentDescription, setDocumentDescription] = useState('');
  const [documentTags, setDocumentTags] = useState('');
  const [currentTag, setCurrentTag] = useState('');
  const [tagsArray, setTagsArray] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [projectStaff, setProjectStaff] = useState([]); // Store project staff members
  const [accessControl, setAccessControl] = useState({
    isPublic: true,
    allowedRoles: ['project_manager', 'architect', 'engineer', 'quantity_surveyor', 'company']
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Verify authentication on component mount
    const verifyAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        await axios.get(`${API_URL}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // If verification successful, fetch documents
        fetchDocuments();
      } catch (error) {
        console.error('Authentication verification failed:', error);
        toast.error('Authentication failed. Please log in again.');
        localStorage.clear();
        navigate('/login', { replace: true });
      }
    };

    verifyAuth();
  }, [projectId, filterCategory, navigate]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let url = '/api/documents';
      if (projectId) {
        url = `/api/documents/project/${projectId}`;
      }
      
      // Add filters if any
      const params = {};
      if (filterCategory) {
        params.category = filterCategory;
      }
      
      const response = await api.get(url, { params });
      if (response.data.success) {
        setDocuments(response.data.data.documents || response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Error fetching documents. Please try again.');
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    // Auto-set document name from file name if not set
    if (!documentName && e.target.files[0]) {
      const fileName = e.target.files[0].name.split('.')[0];
      setDocumentName(fileName);
    }
  };

  const addTag = () => {
    if (currentTag.trim() !== '' && !tagsArray.includes(currentTag.trim())) {
      setTagsArray([...tagsArray, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (index) => {
    const newTags = [...tagsArray];
    newTags.splice(index, 1);
    setTagsArray(newTags);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('name', documentName);
      formData.append('description', documentDescription);
      formData.append('category', documentType);
      formData.append('tags', JSON.stringify(tagsArray));
      
      // Ensure company role is included when sharing with company
      if (accessControl.allowedRoles && !accessControl.allowedRoles.includes('company')) {
        console.log('Company role was missing from allowedRoles but checkbox was checked - fixing');
        accessControl.allowedRoles.push('company');
      }
      
      // Log access control settings before submission
      console.log('Submitting document with access control:', accessControl);
      
      formData.append('accessControl', JSON.stringify(accessControl));
      
      if (projectId) {
        formData.append('project', projectId);
      }

      // Log FormData content for debugging
      for (let [key, value] of formData.entries()) {
        console.log(`FormData - ${key}:`, value);
      }

      const response = await api.post('/api/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      console.log('Upload Response:', response);

      if (response.data.success) {
        toast.success('Document uploaded successfully');
        setShowUploadModal(false);
        resetUploadForm();
        fetchDocuments();
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      console.error('Error Response:', err.response);
      toast.error(err.response?.data?.message || 'Error uploading document');
    } finally {
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setDocumentName('');
    setDocumentDescription('');
    setDocumentType('other');
    setTagsArray([]);
    setCurrentTag('');
    setAccessControl({
      isPublic: true,
      allowedRoles: ['project_manager', 'architect', 'engineer', 'quantity_surveyor', 'company']
    });
  };

  const handleDownload = (document) => {
    window.open(document.fileUrl, '_blank');
  };

  const handleView = (document) => {
    setSelectedDocument(document);
    setShowViewModal(true);
    
    // Reset project staff before fetching new data
    setProjectStaff([]);
    
    // If document has project, fetch project staff members
    if (document.project) {
      const projectId = typeof document.project === 'object' ? document.project._id : document.project;
      if (projectId) {
        console.log("Document has project ID:", projectId);
        fetchProjectStaff(projectId);
      } else {
        console.log("Document has project but no valid ID");
        setFallbackUserList();
      }
    } else {
      console.log("Document has no project, using document's allowed users");
      setFallbackUserList();
    }
  };
  
  const fetchProjectStaff = async (projectId) => {
    console.log("Fetching staff for project:", projectId);
    try {
      // Make sure we have a valid projectId
      if (!projectId) {
        console.warn("No projectId provided to fetchProjectStaff");
        setFallbackUserList();
        return;
      }
      
      const response = await api.get(`/api/projects/${projectId}/staff`);
      if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
        console.log("Successfully fetched project staff:", response.data.data.length, "members");
        setProjectStaff(response.data.data);
      } else {
        console.log("API returned empty or invalid data when fetching project staff");
        setFallbackUserList();
      }
    } catch (err) {
      console.error('Error fetching project staff:', err.message, err.response?.status);
      // Show a more user-friendly message for common errors
      if (err.response?.status === 403) {
        toast.warning("You don't have permission to view all project staff. Limited sharing options will be available.");
      } else if (err.response?.status === 404) {
        toast.warning("Project information not found. Limited sharing options will be available.");
      }
      setFallbackUserList();
    }
  };
  
  // Helper function to use document's allowed users as fallback
  const setFallbackUserList = () => {
    if (selectedDocument?.accessControl?.allowedUsers && 
        Array.isArray(selectedDocument.accessControl.allowedUsers) && 
        selectedDocument.accessControl.allowedUsers.length > 0) {
      console.log("Using document's allowedUsers as fallback:", selectedDocument.accessControl.allowedUsers.length, "users");
      setProjectStaff(selectedDocument.accessControl.allowedUsers);
    } else {
      console.log("No fallback users available in document");
      setProjectStaff([]);
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const response = await api.delete(`/api/documents/${documentId}`);
      if (response.data.success) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      } else {
        toast.error(response.data.message || 'Delete failed');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error(err.response?.data?.message || 'Error deleting document');
    }
  };

  const toggleCompanyAccess = async (document) => {
    try {
      // Create a copy of the current access control settings
      const updatedAccessControl = { 
        ...document.accessControl,
        allowedRoles: [...(document.accessControl?.allowedRoles || [])]
      };
      
      // Toggle the company role
      if (updatedAccessControl.allowedRoles.includes('company')) {
        updatedAccessControl.allowedRoles = updatedAccessControl.allowedRoles.filter(role => role !== 'company');
      } else {
        updatedAccessControl.allowedRoles.push('company');
      }
      
      const response = await api.put(`/api/documents/${document._id}`, {
        accessControl: updatedAccessControl
      });
      
      if (response.data.success) {
        toast.success('Document sharing settings updated');
        // Update locally if successful
        setSelectedDocument({
          ...selectedDocument,
          accessControl: updatedAccessControl
        });
        
        // Refresh the documents list
        fetchDocuments();
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Error updating document sharing:', err);
      toast.error(err.response?.data?.message || 'Error updating document sharing');
    }
  };
  
  const handleUpdateDocumentPermissions = async (documentId, accessControl) => {
    try {
      const response = await api.put(`/api/documents/${documentId}`, {
        accessControl: accessControl
      });
      
      if (response.data.success) {
        toast.success('Document sharing settings updated');
        // Update locally if successful
        setSelectedDocument({
          ...selectedDocument,
          accessControl: accessControl
        });
        
        // Refresh the documents list
        fetchDocuments();
      } else {
        toast.error(response.data.message || 'Update failed');
      }
    } catch (err) {
      console.error('Error updating document permissions:', err);
      toast.error(err.response?.data?.message || 'Error updating document permissions');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500" />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FaFileWord className="text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) return <FaFileExcel className="text-green-500" />;
    if (fileType.includes('image')) return <FaFileImage className="text-purple-500" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('ppt')) return <FaFilePowerpoint className="text-orange-500" />;
    if (fileType.includes('text')) return <FaFileAlt className="text-gray-600" />;
    if (fileType.includes('code') || fileType.includes('json') || fileType.includes('xml') || fileType.includes('html')) return <FaFileCode className="text-yellow-500" />;
    if (fileType.includes('zip') || fileType.includes('compressed')) return <FaFileArchive className="text-brown-500" />;
    if (fileType.includes('video')) return <FaFileVideo className="text-red-600" />;
    if (fileType.includes('audio')) return <FaFileAudio className="text-blue-600" />;
    return <FaFile className="text-gray-500" />;
  };

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );
 const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };
  return (
    <div className="flex h-screen bg-gray-50">
       <StaffSidebar onCollapseChange={handleSidebarCollapse} />
        <div 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? "5rem" : "16rem" }}
      >
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              {projectId ? 'Project Documents' : 'All Documents'}
            </h1>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full flex items-center"
            >
              <FaUpload className="mr-2" /> Upload Document
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <DocumentSearch 
                onSelectDocument={(doc) => handleView(doc)}
                projectId={projectId}
              />
              
              <div className="flex items-center gap-2">
                <FaFilter className="text-gray-500" />
                <select
                  className="border rounded-md px-3 py-2"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="architectural">Architectural</option>
                  <option value="engineering">Engineering</option>
                  <option value="contract">Contract</option>
                  <option value="financial">Financial</option>
                  <option value="legal">Legal</option>
                  <option value="communication">Communication</option>
                  <option value="report">Report</option>
                  <option value="timeline">Timeline</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 text-red-700 p-4 rounded-md">
                {error}
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center text-gray-500 py-10">
                No documents found. Upload some documents to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc) => (
                  <div key={doc._id} className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b flex items-start">
                      <div className="text-3xl mr-3">
                        {getFileIcon(doc.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate" title={doc.name}>
                          {doc.name}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {new Date(doc.createdAt).toLocaleDateString()} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{doc.description || 'No description'}</p>
                      
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {doc.tags.map((tag, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                            {doc.category}
                          </span>
                          {doc.accessControl?.allowedRoles?.includes('company') && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                              </svg>
                              Company
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleView(doc)}
                            className="text-blue-500 hover:text-blue-700"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button 
                            onClick={() => handleDownload(doc)}
                            className="text-green-500 hover:text-green-700"
                            title="Download"
                          >
                            <FaDownload />
                          </button>
                          {(doc.uploaderModel === 'Staff' && doc.uploadedBy?._id === localStorage.getItem('userId')) && (
                            <button 
                              onClick={() => handleDelete(doc._id)}
                              className="text-red-500 hover:text-red-700"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">Upload Document</h2>
            </div>
            
            <form onSubmit={handleUpload} className="p-6">
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  File *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Document Name *
                </label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter document name"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Description
                </label>
                <textarea
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="Enter document description"
                  rows="3"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="architectural">Architectural</option>
                  <option value="engineering">Engineering</option>
                  <option value="contract">Contract</option>
                  <option value="financial">Financial</option>
                  <option value="legal">Legal</option>
                  <option value="communication">Communication</option>
                  <option value="report">Report</option>
                  <option value="timeline">Timeline</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Tags
                </label>
                <div className="flex items-center mb-2">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    className="flex-1 border rounded-l-md p-2"
                    placeholder="Add tags"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-r-full"
                  >
                    <FaTags />
                  </button>
                </div>
                
                {tagsArray.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {tagsArray.map((tag, index) => (
                      <div key={index} className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full flex items-center text-sm">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-1 text-gray-500 hover:text-red-500"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Access Control
                </label>
                <div className="bg-gray-50 p-3 rounded-md border">
                  <div className="mb-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={accessControl.isPublic}
                        onChange={(e) => setAccessControl({...accessControl, isPublic: e.target.checked})}
                        className="form-checkbox"
                      />
                      <span className="ml-2">Make public to all project members</span>
                    </label>
                  </div>
                  
                  <div className="mb-3 border-t pt-3">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={accessControl.allowedRoles?.includes('company')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAccessControl({
                              ...accessControl,
                              allowedRoles: [...(accessControl.allowedRoles || []), 'company']
                            });
                          } else {
                            setAccessControl({
                              ...accessControl,
                              allowedRoles: (accessControl.allowedRoles || []).filter(r => r !== 'company')
                            });
                          }
                        }}
                        className="form-checkbox"
                      />
                      <span className="ml-2 font-medium">Share with Company</span>
                    </label>
                    <p className="text-sm text-gray-500 mt-1 ml-6">
                      Allow your company managers to view this document
                    </p>
                  </div>
                  
                  {!accessControl.isPublic && (
                    <div>
                      <p className="text-sm font-medium mb-2">Allow access to:</p>
                      <div className="space-y-1">
                        {['project_manager', 'architect', 'engineer', 'quantity_surveyor'].map(role => (
                          <label key={role} className="inline-flex items-center mr-4">
                            <input
                              type="checkbox"
                              checked={accessControl.allowedRoles.includes(role)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAccessControl({
                                    ...accessControl,
                                    allowedRoles: [...accessControl.allowedRoles, role]
                                  });
                                } else {
                                  setAccessControl({
                                    ...accessControl,
                                    allowedRoles: accessControl.allowedRoles.filter(r => r !== role)
                                  });
                                }
                              }}
                              className="form-checkbox"
                            />
                            <span className="ml-2 capitalize">{role.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {uploadProgress > 0 && (
                <div className="mb-4">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-600 text-right mt-1">{uploadProgress}%</p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 border border-orange-500 text-orange-500 hover:bg-orange-50 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full flex items-center"
                  disabled={!selectedFile || !documentName}
                >
                  <FaUpload className="mr-2" /> Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {showViewModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold truncate">{selectedDocument.name}</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownload(selectedDocument)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Download"
                >
                  <FaDownload />
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto relative">
              {selectedDocument.fileType.includes('pdf') ? (
                <div className="relative w-full h-full min-h-[70vh]">
                  <iframe
                    src={`${selectedDocument.fileUrl}#toolbar=1&scrollbar=1`}
                    className="w-full h-full absolute inset-0"
                    title={selectedDocument.name}
                  />
                </div>
              ) : selectedDocument.fileType.includes('image') ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                  <div className="relative cursor-move">
                    <img
                      src={selectedDocument.fileUrl}
                      alt={selectedDocument.name}
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4 flex justify-center">
                    {getFileIcon(selectedDocument.fileType)}
                  </div>
                  <p className="mb-4">This file type cannot be previewed directly.</p>
                  <button
                    onClick={() => handleDownload(selectedDocument)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md inline-flex items-center"
                  >
                    <FaDownload className="mr-2" /> Download
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 overflow-y-auto max-h-[30vh]">
              <div className="flex flex-wrap gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Uploaded By</h3>
                  <p className="text-gray-800">
                    {selectedDocument.uploadedBy?.fullName || selectedDocument.uploadedBy?.companyName || 'Unknown'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Upload Date</h3>
                  <p className="text-gray-800">
                    {new Date(selectedDocument.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">File Size</h3>
                  <p className="text-gray-800">
                    {(selectedDocument.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Category</h3>
                  <p className="text-gray-800 capitalize">
                    {selectedDocument.category}
                  </p>
                </div>
              </div>
              
              {selectedDocument.description && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-500">Description</h3>
                  <p className="text-gray-800 whitespace-pre-line">
                    {selectedDocument.description}
                  </p>
                </div>
              )}
              
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-500">Sharing</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedDocument.accessControl?.isPublic ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                      Public to all project members
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Restricted access
                    </span>
                  )}
                  
                  {selectedDocument.accessControl?.allowedRoles?.includes('company') && (
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Shared with Company
                    </span>
                  )}
                  
                  {selectedDocument.accessControl?.allowedRoles?.filter(role => role !== 'company').length > 0 && (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.660.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      Shared with specific roles
                    </span>
                  )}
                </div>
                
                {/* Only show this if the current user uploaded the document */}
                {selectedDocument.uploaderModel === 'Staff' && 
                 selectedDocument.uploadedBy?._id === localStorage.getItem('userId') && (
                  <div className="mt-3">
                    <button
                      onClick={() => toggleCompanyAccess(selectedDocument)}
                      className={`mt-2 text-sm px-3 py-1 rounded border flex items-center ${
                        selectedDocument.accessControl?.allowedRoles?.includes('company')
                          ? 'border-red-300 text-red-600 hover:bg-red-50'
                          : 'border-purple-300 text-purple-600 hover:bg-purple-50'
                      }`}
                    >
                      {selectedDocument.accessControl?.allowedRoles?.includes('company') ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                          Remove company access
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Share with company
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Advanced Document Sharing UI */}
                {selectedDocument.uploaderModel === 'Staff' && 
                 selectedDocument.uploadedBy?._id === localStorage.getItem('userId') && (
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-md font-semibold mb-3">Advanced Sharing Options</h3>
                    <DocumentSharing 
                      document={selectedDocument}
                      onUpdatePermissions={(accessControl) => {
                        // Update document access control
                        handleUpdateDocumentPermissions(selectedDocument._id, accessControl);
                      }}
                      // Pass project staff if available, or document's allowed users as fallback
                      availableUsersProp={projectStaff.length > 0 ? projectStaff : (
                        selectedDocument?.accessControl?.allowedUsers || []
                      )}
                    />
                  </div>
                )}
              </div>
              
              <div className="mt-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Tags</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDocument.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default StaffDocuments;
