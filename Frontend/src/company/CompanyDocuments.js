import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage,
  FaFilePowerpoint, FaFileAlt, FaFileCode, FaFileArchive, FaFileVideo,
  FaFileAudio, FaSearch, FaFilter, FaUpload, FaTags, FaTrash,
  FaEye, FaDownload, FaEdit, FaCheckCircle, FaTimesCircle
} from 'react-icons/fa';
import CompanySidebar from './CompanySideBar';
import DocumentSearch from '../components/DocumentSearch';
import DocumentSharing from '../components/DocumentSharing';

const CompanyDocuments = () => {
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
  const [accessControl, setAccessControl] = useState({
    isPublic: true,
    allowedRoles: ['project_manager', 'architect', 'engineer', 'quantity_surveyor']
  });
  const [staff, setStaff] = useState([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [documentToApprove, setDocumentToApprove] = useState(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [projects, setProjects] = useState([]); // Store the list of projects
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  useEffect(() => {
    fetchDocuments();
    fetchProjects(); // Fetch all company projects
    if (projectId) {
      fetchProjectStaff();
    }
  }, [projectId, filterCategory]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        setLoading(false);
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      let url = `${API_URL}/api/documents`;
      if (projectId) {
        url = `${API_URL}/api/documents/project/${projectId}`;
      }
      
      // Add filters if any
      const params = {};
      if (filterCategory) {
        params.category = filterCategory;
      }
      
      // Add query parameter to populate project data
      params.populate = 'project';
      
      const response = await axios.get(url, { 
        params,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        console.log('Fetched documents with project info:', response.data.data);
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

  const fetchProjectStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error('Authentication token not found. Please log in again.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${API_URL}/api/projects/staff/${projectId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.data.success) {
        setStaff(response.data.data.staff || []);
      }
    } catch (err) {
      console.error('Error fetching project staff:', err);
    }
  };

  // Fetch all company projects
  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error('Authentication token not found. Please log in again.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.get(`${API_URL}/api/projects/company`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('Fetched company projects:', response.data.data);
        setProjects(response.data.data);
      } else {
        console.error('Error fetching projects:', response.data.message);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
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
      
      // Prepare access control data
      const accessControlData = { ...accessControl };
      
      // Add allowed users if selected
      if (selectedStaffIds.length > 0) {
        accessControlData.allowedUsers = selectedStaffIds;
        accessControlData.userModel = 'Staff';
      }
      
      formData.append('accessControl', JSON.stringify(accessControlData));
      
      // Use either the URL parameter projectId or the selected project from dropdown
      if (projectId) {
        formData.append('project', projectId);
        console.log('Using URL projectId for document:', projectId);
      } else if (selectedProjectId) {
        formData.append('project', selectedProjectId);
        console.log('Using selected projectId for document:', selectedProjectId);
      } else {
        console.log('No project selected for document');
      }

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.post(`${API_URL}/api/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

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
    setSelectedStaffIds([]);
    setSelectedProjectId(''); // Reset selected project
    setAccessControl({
      isPublic: true,
      allowedRoles: ['project_manager', 'architect', 'engineer', 'quantity_surveyor']
    });
  };

  const handleDownload = (document) => {
    window.open(document.fileUrl, '_blank');
  };

  const handleView = (document) => {
    setSelectedDocument(document);
    setShowViewModal(true);
  };

  const handleUpdateDocumentPermissions = async (documentId, accessControl) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.put(`${API_URL}/api/documents/${documentId}`, {
        accessControl
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success('Document permissions updated successfully');
        // Update the document in the local state
        setDocuments(documents.map(doc => 
          doc._id === documentId ? { ...doc, accessControl } : doc
        ));
        
        // If a document is currently selected in the modal, update it
        if (selectedDocument && selectedDocument._id === documentId) {
          setSelectedDocument({
            ...selectedDocument,
            accessControl
          });
        }
      } else {
        toast.error(response.data.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating document permissions:', error);
      toast.error(error.response?.data?.message || 'Error updating document permissions');
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.delete(`${API_URL}/api/documents/${documentId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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

  const openApproveModal = (document) => {
    setDocumentToApprove(document);
    setApproveModalOpen(true);
  };

  const handleApproveDocument = async (approve) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await axios.put(`${API_URL}/api/documents/${documentToApprove._id}`, {
        status: approve ? 'approved' : 'rejected',
        changeNotes: approvalComment
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(`Document ${approve ? 'approved' : 'rejected'} successfully`);
        fetchDocuments();
        setApproveModalOpen(false);
        setApprovalComment('');
      } else {
        toast.error(response.data.message || 'Action failed');
      }
    } catch (err) {
      console.error(`Error ${approve ? 'approving' : 'rejecting'} document:`, err);
      toast.error(err.response?.data?.message || `Error ${approve ? 'approving' : 'rejecting'} document`);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Draft</span>;
      case 'pending_approval':
        return <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Pending Approval</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Approved</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">Rejected</span>;
      case 'archived':
        return <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Archived</span>;
      default:
        return null;
    }
  };

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const toggleStaffSelection = (staffId) => {
    if (selectedStaffIds.includes(staffId)) {
      setSelectedStaffIds(selectedStaffIds.filter(id => id !== staffId));
    } else {
      setSelectedStaffIds([...selectedStaffIds, staffId]);
    }
  };

  const handleCollapseChange = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
        <CompanySidebar onCollapseChange={handleCollapseChange} />
         <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        <main className="flex-1 overflow-y-auto p-5">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-800">
              {projectId ? 'Project Documents' : 'Company Documents'}
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
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500">
                            {new Date(doc.createdAt).toLocaleDateString()} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {getStatusBadge(doc.status)}
                        </div>
                        {/* Uploader info */}
                        {doc.uploadedBy && (
                          <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                            <span>Uploaded by:</span>
                            <span className="font-medium">{doc.uploadedBy.fullName || doc.uploadedBy.companyName || 'Unknown'}</span>
                            {doc.uploadedBy.role && (
                              <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full ml-1">{doc.uploadedBy.role.replace('_', ' ')}</span>
                            )}
                            {/* Essential badge for staff uploads */}
                            {doc.uploadedBy.role === 'staff' && (
                              <span className="ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">Essential</span>
                            )}
                          </div>
                        )}
                        
                        {/* Project info */}
                        {doc.project && doc.project.title && (
                          <div className="mt-1 text-xs text-gray-600 flex items-center gap-2">
                            <span>Project:</span>
                            <span className="font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{doc.project.title}</span>
                          </div>
                        )}
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
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                          {doc.category}
                        </span>
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
                          
                          {/* Approval button for company */}
                          {doc.status === 'pending_approval' && (
                            <button 
                              onClick={() => openApproveModal(doc)}
                              className="text-yellow-500 hover:text-yellow-700"
                              title="Review"
                            >
                              <FaEdit />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleDelete(doc._id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
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
                  Related Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="">-- Select a project (optional) --</option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Associate this document with a specific project for better organization
                </p>
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
                  
                  {!accessControl.isPublic && (
                    <div>
                      <p className="text-sm font-medium mb-2">Allow access to:</p>
                      <div className="space-y-1 mb-3">
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
                      
                      {projectId && staff.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Specific staff members:</p>
                          <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                            {staff.map(member => (
                              <label key={member._id} className="flex items-center p-1 hover:bg-gray-100 rounded">
                                <input
                                  type="checkbox"
                                  checked={selectedStaffIds.includes(member._id)}
                                  onChange={() => toggleStaffSelection(member._id)}
                                  className="form-checkbox"
                                />
                                <span className="ml-2">{member.fullName} ({member.role.replace('_', ' ')})</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
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
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-hidden flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold truncate">{selectedDocument.name}</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {selectedDocument.fileType.includes('pdf') ? (
                <iframe
                  src={`${selectedDocument.fileUrl}#toolbar=0`}
                  className="w-full h-full min-h-[70vh]"
                  title={selectedDocument.name}
                />
              ) : selectedDocument.fileType.includes('image') ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={selectedDocument.fileUrl}
                    alt={selectedDocument.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
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
            
            <div className="p-4 border-t bg-gray-50">
              <div className="flex flex-wrap gap-6 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Uploaded By</h3>
                  <p className="text-gray-800 flex items-center gap-2">
                    {selectedDocument.uploadedBy?.fullName || selectedDocument.uploadedBy?.companyName || 'Unknown'}
                    {selectedDocument.uploadedBy?.role && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full ml-1">{selectedDocument.uploadedBy.role.replace('_', ' ')}</span>
                    )}
                    {selectedDocument.uploadedBy?.role === 'staff' && (
                      <span className="ml-2 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">Essential</span>
                    )}
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
                
                {/* Project info */}
                {selectedDocument.project && selectedDocument.project.title && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-500">Project</h3>
                    <p className="text-gray-800">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {selectedDocument.project.title}
                      </span>
                    </p>
                  </div>
                )}
                
                {/* Document Status */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Status</h3>
                  <div>{getStatusBadge(selectedDocument.status)}</div>
                </div>
              </div>
              
              {/* Sharing settings for company users */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Sharing & Permissions</h3>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <DocumentSharing 
                    document={selectedDocument}
                    onUpdatePermissions={(accessControl) => {
                      // Update document access control
                      handleUpdateDocumentPermissions(selectedDocument._id, accessControl);
                    }}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500">Category</h3>
                  <p className="text-gray-800 capitalize">
                    {selectedDocument.category}
                  </p>
                </div>
                <div className="mt-2">
                  <h3 className="text-sm font-semibold text-gray-500">Status</h3>
                  <p className="text-gray-800">{getStatusBadge(selectedDocument.status)}</p>
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
              
              {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-500">Tags</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedDocument.tags.map((tag, idx) => (
                      <span key={idx} className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show approval information if available */}
              {selectedDocument.status === 'approved' && selectedDocument.approvedBy && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-500">Approved By</h3>
                  <p className="text-gray-800">
                    {selectedDocument.approvedBy.fullName || selectedDocument.approvedBy.companyName || 'Unknown'} 
                    on {new Date(selectedDocument.approvalDate).toLocaleString()}
                  </p>
                </div>
              )}
              
              {/* Show version history if available */}
              {selectedDocument.revisionHistory && selectedDocument.revisionHistory.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-500">Version History</h3>
                  <div className="mt-2 border rounded-md overflow-hidden">
                    {selectedDocument.revisionHistory.map((revision, idx) => (
                      <div key={idx} className={`p-2 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b`}>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Version {revision.version}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(revision.updateDate).toLocaleString()}
                          </span>
                        </div>
                        {revision.changeNotes && (
                          <p className="text-sm mt-1">{revision.changeNotes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Approval Modal */}
      {approveModalOpen && documentToApprove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">Review Document</h2>
            </div>
            
            <div className="p-4">
              <p className="mb-4">
                You are reviewing: <strong>{documentToApprove.name}</strong>
              </p>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Comments
                </label>
                <textarea
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  className="w-full border rounded-md p-2"
                  placeholder="Add review comments..."
                  rows="3"
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setApproveModalOpen(false); setDocumentToApprove(null); setApprovalComment(''); }}
                  className="px-4 py-2 border border-orange-500 text-orange-500 hover:bg-orange-50 rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveDocument(false)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full flex items-center"
                >
                  <FaTimesCircle className="mr-2" /> Reject
                </button>
                <button
                  type="button"
                  onClick={() => handleApproveDocument(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full flex items-center"
                >
                  <FaCheckCircle className="mr-2" /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDocuments;
