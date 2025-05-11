const Document = require('../models/Document');
const Project = require('../models/Project');
const Staff = require('../models/Staff');
const Company = require('../models/Company');
const Client = require('../models/Client');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Create a new document
exports.createDocument = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      tags,
      version,
      project,
      accessControl
    } = req.body;

    // Validate project if provided
    if (project) {
      const projectExists = await Project.findById(project);
      if (!projectExists) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has access to the project
      let hasAccess = false;
      if (req.user.role === 'company' && projectExists.company.toString() === req.user._id.toString()) {
        hasAccess = true;
      } else if (req.user.role === 'client' && projectExists.client.toString() === req.user._id.toString()) {
        hasAccess = true;
      } else if (projectExists.staff && projectExists.staff.some(staffId => staffId.toString() === req.user._id.toString())) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to upload documents to this project'
        });
      }
    }

    // Ensure files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Process the uploaded file
    const file = req.files.document[0]; // Get the first uploaded file
    
    // Determine file URL based on storage type
    let fileUrl;
    if (file.location) {
      // S3 storage
      fileUrl = file.location;
    } else {
      // Local storage - create a URL path
      fileUrl = `/uploads/documents/${file.filename}`;
    }
    
    // Determine uploader model based on user role
    let uploaderModel;
    if (req.user.role === 'company') {
      uploaderModel = 'Company';
    } else if (req.user.role === 'client') {
      uploaderModel = 'Client';
    } else {
      uploaderModel = 'Staff';
    }

    // Create document object
    const document = new Document({
      name: name || file.originalname,
      description: description || '',
      fileUrl: fileUrl,
      fileType: file.mimetype,
      fileSize: file.size,
      category: category || 'other',
      tags: tags || [],
      version: version || '1.0',
      uploadedBy: req.user._id,
      uploaderModel: uploaderModel,
      project: project || null,
      accessControl: accessControl || {
        isPublic: false,
        allowedRoles: [req.user.role]
      }
    });

    // Log document details for debugging
    console.log('Document being created:', {
      name: document.name,
      uploadedBy: document.uploadedBy,
      uploaderModel: document.uploaderModel,
      accessControl: document.accessControl
    });

    await document.save();

    // If project-specific document, notify relevant users
    if (project) {
      await notifyRelevantUsers(req, document, project);
    }

    return res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document
    });
  } catch (error) {
    console.error('Error creating document:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error uploading document',
      error: error.message
    });
  }
};

// Get all documents with filtering options
exports.getAllDocuments = async (req, res) => {
  try {
    const {
      category,
      project,
      search,
      tags,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;

    // Build query based on user role and filters
    const query = buildDocumentQuery(req.user, {
      category,
      project,
      search,
      tags,
      startDate,
      endDate
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch documents with pagination
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'fullName username email companyName')
      .populate('project', 'title');

    // Get total count for pagination
    const total = await Document.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching documents',
      error: error.message
    });
  }
};

// Get document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId)
      .populate('uploadedBy', 'fullName username email companyName')
      .populate('project', 'title')
      .populate('approvedBy', 'fullName username email companyName');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to this document
    const hasAccess = await checkDocumentAccess(req.user, document);
    
    // Log document access for debugging
    console.log(`User ${req.user._id} (${req.user.role}) access to document ${documentId}: ${hasAccess}`);
    console.log(`Document uploader: ${document.uploaderModel}, allowedRoles: ${JSON.stringify(document.accessControl.allowedRoles)}`);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this document'
      });
    }

    return res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching document',
      error: error.message
    });
  }
};

// Update document
exports.updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const {
      name,
      description,
      category,
      tags,
      version,
      accessControl,
      status
    } = req.body;

    // Find document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to update
    const canModify = await checkDocumentModifyPermission(req.user, document);
    if (!canModify) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this document'
      });
    }

    // Check if a new file was uploaded
    let newFileUploaded = false;
    let fileUrl = document.fileUrl;
    let fileType = document.fileType;
    let fileSize = document.fileSize;

    if (req.files && req.files.document && req.files.document.length > 0) {
      const file = req.files.document[0];
      fileUrl = file.location;
      fileType = file.mimetype;
      fileSize = file.size;
      newFileUploaded = true;

      // Add previous version to revision history
      document.revisionHistory.push({
        version: document.version,
        fileUrl: document.fileUrl,
        updatedBy: req.user._id,
        updaterModel: req.user.role === 'company' ? 'Company' : (req.user.role === 'client' ? 'Client' : 'Staff'),
        updateDate: new Date(),
        changeNotes: req.body.changeNotes || 'Document updated'
      });
    }

    // Update document fields
    document.name = name || document.name;
    document.description = description !== undefined ? description : document.description;
    document.category = category || document.category;
    document.tags = tags || document.tags;
    document.version = version || (newFileUploaded ? incrementVersion(document.version) : document.version);
    document.fileUrl = fileUrl;
    document.fileType = fileType;
    document.fileSize = fileSize;

    // Update access control if provided
    if (accessControl) {
      document.accessControl = {
        ...document.accessControl,
        ...accessControl
      };
    }

    // Update status if provided
    if (status) {
      document.status = status;

      // If document is being approved
      if (status === 'approved' && document.status !== 'approved') {
        document.approvedBy = req.user._id;
        document.approverModel = req.user.role === 'company' ? 'Company' : (req.user.role === 'client' ? 'Client' : 'Staff');
        document.approvalDate = new Date();
      }
    }

    await document.save();

    // Notify relevant users about the update
    if (document.project) {
      await notifyDocumentUpdate(req, document);
    }

    return res.status(200).json({
      success: true,
      message: 'Document updated successfully',
      data: document
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error updating document',
      error: error.message
    });
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Find document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to delete
    const canDelete = await checkDocumentDeletePermission(req.user, document);
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this document'
      });
    }

    // Delete document
    await Document.findByIdAndDelete(documentId);

    return res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error deleting document',
      error: error.message
    });
  }
};

// Get project documents
exports.getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      category,
      search,
      tags,
      page = 1,
      limit = 20
    } = req.query;

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user has access to the project
    let hasAccess = false;
    if (req.user.role === 'company' && project.company.toString() === req.user._id.toString()) {
      hasAccess = true;
    } else if (req.user.role === 'client' && project.client.toString() === req.user._id.toString()) {
      hasAccess = true;
    } else if (project.staff && project.staff.some(staffId => staffId.toString() === req.user._id.toString())) {
      hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view documents for this project'
      });
    }

    // Build query
    const query = {
      project: projectId,
      ...buildFilterQuery({ category, search, tags })
    };

    // If not company or client, filter by role access
    if (req.user.role !== 'company' && req.user.role !== 'client') {
      query.$or = [
        { 'accessControl.isPublic': true },
        { 'accessControl.allowedRoles': req.user.role },
        { 'accessControl.allowedUsers': req.user._id }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Fetch documents
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'fullName username email companyName')
      .populate('approvedBy', 'fullName username email companyName');

    // Get total count
    const total = await Document.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching project documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error fetching project documents',
      error: error.message
    });
  }
};

// Helper Functions

// Build document query based on user role and filters
const buildDocumentQuery = (user, filters) => {
  const { category, project, search, tags, startDate, endDate } = filters;
  let query = {};

  // Base filter conditions
  if (category) {
    query.category = category;
  }

  if (project) {
    query.project = project;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  // Role-based access control
  if (user.role === 'company') {
    // Company can see all their documents and documents shared with them
    query.$or = [
      { 'uploadedBy': user._id, 'uploaderModel': 'Company' },
      { 'accessControl.allowedUsers': user._id, 'accessControl.userModel': 'Company' },
      { 'accessControl.allowedRoles': { $in: ['company'] } }, // Properly query for array membership
      // Documents from their projects
      {
        'project': { $in: user.projects || [] }
      }
    ];
  } else if (user.role === 'client') {
    // Clients can see documents from their projects and those explicitly shared with them
    query.$or = [
      { 'uploadedBy': user._id, 'uploaderModel': 'Client' },
      { 'accessControl.allowedUsers': user._id, 'accessControl.userModel': 'Client' },
      { 'accessControl.allowedRoles': { $in: ['client'] } }, // Properly query for array membership
      // Documents from their projects
      {
        'project': { $in: user.projects || [] }
      }
    ];
  } else {
    // Staff can see documents they're allowed to access based on role or explicit user permission
    query.$or = [
      { 'uploadedBy': user._id, 'uploaderModel': 'Staff' },
      { 'accessControl.isPublic': true },
      { 'accessControl.allowedRoles': { $in: [user.role, 'staff'] } }, // Properly query for array membership, including generic staff role
      { 'accessControl.allowedUsers': user._id, 'accessControl.userModel': 'Staff' }
    ];
  }

  return query;
};

// Check if user has access to document
const checkDocumentAccess = async (user, document) => {
  // Document owner always has access
  if (
    (document.uploaderModel === 'Company' && user.role === 'company' && document.uploadedBy.toString() === user._id.toString()) ||
    (document.uploaderModel === 'Client' && user.role === 'client' && document.uploadedBy.toString() === user._id.toString()) ||
    (document.uploaderModel === 'Staff' && document.uploadedBy.toString() === user._id.toString())
  ) {
    return true;
  }

  // Public document
  if (document.accessControl.isPublic) {
    return true;
  }

  // Role-based access
  if (document.accessControl.allowedRoles && Array.isArray(document.accessControl.allowedRoles)) {
    if (document.accessControl.allowedRoles.includes(user.role)) {
      console.log(`User role ${user.role} has access to document ${document._id} via role-based access`);
      return true;
    }
  }
  
  // Special case for company role
  if (user.role === 'company' && document.accessControl.allowedRoles && 
      Array.isArray(document.accessControl.allowedRoles) && 
      document.accessControl.allowedRoles.includes('company')) {
    console.log('Company user accessing document shared with company role:', document._id);
    return true;
  }

  // User-specific access
  if (document.accessControl.allowedUsers.some(userId => userId.toString() === user._id.toString())) {
    return true;
  }

  // Project-based access
  if (document.project) {
    const project = await Project.findById(document.project);
    if (project) {
      if (user.role === 'company' && project.company.toString() === user._id.toString()) {
        return true;
      }
      if (user.role === 'client' && project.client.toString() === user._id.toString()) {
        return true;
      }
      if (project.staff && project.staff.some(staffId => staffId.toString() === user._id.toString())) {
        return true;
      }
    }
  }

  return false;
};

// Check if user has permission to modify document
const checkDocumentModifyPermission = async (user, document) => {
  // Document owner can modify
  if (
    (document.uploaderModel === 'Company' && user.role === 'company' && document.uploadedBy.toString() === user._id.toString()) ||
    (document.uploaderModel === 'Client' && user.role === 'client' && document.uploadedBy.toString() === user._id.toString()) ||
    (document.uploaderModel === 'Staff' && document.uploadedBy.toString() === user._id.toString())
  ) {
    return true;
  }

  // Company can modify any document in their projects
  if (user.role === 'company' && document.project) {
    const project = await Project.findById(document.project);
    if (project && project.company.toString() === user._id.toString()) {
      return true;
    }
  }

  // Project managers can modify documents in their projects
  if (user.role === 'project_manager' && document.project) {
    const project = await Project.findById(document.project);
    if (project && project.staff && project.staff.some(staffId => staffId.toString() === user._id.toString())) {
      // Verify user is a project manager
      const staff = await Staff.findById(user._id);
      return staff && staff.role === 'project_manager';
    }
  }

  return false;
};

// Check if user has permission to delete document
const checkDocumentDeletePermission = async (user, document) => {
  // Only document owner or company can delete
  if (
    (document.uploaderModel === 'Company' && user.role === 'company' && document.uploadedBy.toString() === user._id.toString()) ||
    (document.uploaderModel === 'Staff' && document.uploadedBy.toString() === user._id.toString())
  ) {
    return true;
  }

  // Company can delete any document in their projects
  if (user.role === 'company' && document.project) {
    const project = await Project.findById(document.project);
    if (project && project.company.toString() === user._id.toString()) {
      return true;
    }
  }

  return false;
};

// Build filter query
const buildFilterQuery = ({ category, search, tags }) => {
  const query = {};

  if (category) {
    query.category = category;
  }

  if (tags && tags.length > 0) {
    query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  }

  if (search) {
    query.$text = { $search: search };
  }

  return query;
};

// Increment version number (e.g., 1.0 -> 1.1, 1.9 -> 2.0)
const incrementVersion = (version) => {
  const versionParts = version.split('.');
  if (versionParts.length !== 2) {
    return '1.0'; // Invalid format, return default
  }

  let major = parseInt(versionParts[0]);
  let minor = parseInt(versionParts[1]);

  minor++;
  if (minor >= 10) {
    major++;
    minor = 0;
  }

  return `${major}.${minor}`;
};

// Notify relevant users
const notifyRelevantUsers = async (req, document, projectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return;

    const notificationData = {
      type: 'new_document',
      message: `A new document "${document.name}" has been uploaded to project ${project.title}`,
      data: {
        documentId: document._id,
        projectId: project._id
      }
    };

    const io = req.app.get('io');
    
    // Notify company
    if (req.user._id.toString() !== project.company.toString()) {
      await Notification.create({
        userId: project.company,
        userType: 'Company',
        ...notificationData,
        isRead: false
      });
      
      if (io) {
        io.to(`notifications:company:${project.company}`).emit('notification', notificationData);
      }
    }
    
    // Notify client
    if (project.client && req.user._id.toString() !== project.client.toString()) {
      await Notification.create({
        userId: project.client,
        userType: 'Client',
        ...notificationData,
        isRead: false
      });
      
      if (io) {
        io.to(`notifications:client:${project.client}`).emit('notification', notificationData);
      }
    }
    
    // Notify staff based on access control
    if (project.staff && project.staff.length > 0) {
      const { allowedRoles = [] } = document.accessControl;
      
      for (const staffId of project.staff) {
        if (req.user._id.toString() === staffId.toString()) continue;
        
        const staff = await Staff.findById(staffId);
        if (!staff) continue;
        
        // Check if staff role is allowed or document is public
        if (document.accessControl.isPublic || allowedRoles.includes(staff.role)) {
          await Notification.create({
            userId: staffId,
            userType: 'Staff',
            ...notificationData,
            isRead: false
          });
          
          if (io) {
            io.to(`notifications:staff:${staffId}`).emit('notification', notificationData);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

// Notify about document updates
const notifyDocumentUpdate = async (req, document) => {
  try {
    const project = await Project.findById(document.project);
    if (!project) return;

    const notificationData = {
      type: 'document_updated',
      message: `Document "${document.name}" has been updated in project ${project.title}`,
      data: {
        documentId: document._id,
        projectId: project._id
      }
    };

    const io = req.app.get('io');
    
    // Similar notification logic as above
    // Notify company
    if (req.user._id.toString() !== project.company.toString()) {
      await Notification.create({
        userId: project.company,
        userType: 'Company',
        ...notificationData,
        isRead: false
      });
      
      if (io) {
        io.to(`notifications:company:${project.company}`).emit('notification', notificationData);
      }
    }
    
    // Notify client
    if (project.client && req.user._id.toString() !== project.client.toString()) {
      await Notification.create({
        userId: project.client,
        userType: 'Client',
        ...notificationData,
        isRead: false
      });
      
      if (io) {
        io.to(`notifications:client:${project.client}`).emit('notification', notificationData);
      }
    }
    
    // Notify staff based on access control
    // ... (similar logic as in notifyRelevantUsers)
  } catch (error) {
    console.error('Error sending update notifications:', error);
  }
};
