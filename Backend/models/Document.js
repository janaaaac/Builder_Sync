const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DocumentSchema = new Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String,
    default: ''
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  fileType: { 
    type: String, 
    default: 'application/octet-stream'
  },
  fileSize: { 
    type: Number, 
    default: 0 
  },
  category: { 
    type: String, 
    enum: [
      'architectural', 
      'engineering', 
      'contract', 
      'financial', 
      'legal', 
      'communication', 
      'report',
      'timeline',
      'other'
    ],
    default: 'other' 
  },
  tags: [{ 
    type: String 
  }],
  version: { 
    type: String, 
    default: '1.0' 
  },
  uploadedBy: { 
    type: Schema.Types.ObjectId,
    refPath: 'uploaderModel',
    required: true
  },
  uploaderModel: {
    type: String,
    enum: ['Staff', 'Company', 'Client'],
    required: true
  },
  project: { 
    type: Schema.Types.ObjectId, 
    ref: 'Project',
    required: false // Not all documents are project-specific
  },
  accessControl: {
    isPublic: { 
      type: Boolean, 
      default: false // If true, accessible to all users related to the company
    },
    allowedRoles: [{ 
      type: String,
      enum: ['company', 'project_manager', 'architect', 'engineer', 'quantity_surveyor', 'client']
    }],
    allowedUsers: [{ 
      type: Schema.Types.ObjectId,
      refPath: 'accessControl.userModel'
    }],
    userModel: {
      type: String,
      enum: ['Staff', 'Company', 'Client'],
      default: 'Staff'
    }
  },
  // For document approval workflows
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'rejected', 'archived'],
    default: 'approved'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    refPath: 'approverModel',
    required: false
  },
  approverModel: {
    type: String,
    enum: ['Staff', 'Company', 'Client'],
    required: false
  },
  approvalDate: {
    type: Date,
    required: false
  },
  // Document history for version control
  revisionHistory: [{
    version: { type: String },
    fileUrl: { type: String },
    updatedBy: { 
      type: Schema.Types.ObjectId,
      refPath: 'revisionHistory.updaterModel'
    },
    updaterModel: {
      type: String,
      enum: ['Staff', 'Company', 'Client']
    },
    updateDate: { type: Date, default: Date.now },
    changeNotes: { type: String }
  }]
}, { timestamps: true });

// Add text index for search functionality
DocumentSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  category: 'text'
});

module.exports = mongoose.model('Document', DocumentSchema);
