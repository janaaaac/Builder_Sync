import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSearch, FaFile, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage } from 'react-icons/fa';

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with base URL and auth token
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
      console.error('Authentication failed in DocumentSearch component');
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

const DocumentSearch = ({ onSelectDocument, projectId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        performSearch();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchTerm]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      let url = '/api/documents';
      const params = { search: searchTerm };
      
      if (projectId) {
        url = `/api/documents/project/${projectId}`;
      }
      
      const response = await api.get(url, { params });
      if (response.data.success) {
        setSearchResults(response.data.data.documents || response.data.data);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500" />;
    if (fileType.includes('word') || fileType.includes('doc')) return <FaFileWord className="text-blue-500" />;
    if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('xls')) return <FaFileExcel className="text-green-500" />;
    if (fileType.includes('image')) return <FaFileImage className="text-purple-500" />;
    return <FaFile className="text-gray-500" />;
  };

  const handleSelectDocument = (document) => {
    onSelectDocument(document);
    setSearchTerm('');
    setShowResults(false);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search documents..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {showResults && searchResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          <ul className="py-1">
            {searchResults.map((doc) => (
              <li 
                key={doc._id}
                onClick={() => handleSelectDocument(doc)}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              >
                <span className="mr-2">{getFileIcon(doc.fileType)}</span>
                <div>
                  <p className="font-medium text-gray-800">{doc.name}</p>
                  <p className="text-xs text-gray-500 truncate">{doc.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {showResults && searchResults.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg p-4 text-center">
          <p className="text-gray-500">No documents found</p>
        </div>
      )}
    </div>
  );
};

export default DocumentSearch;
