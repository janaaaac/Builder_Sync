const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProposalSchema = new Schema({
  // Reference to the Client model for client information
  client: {
    type: Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  
  // Project Information
  projectTitle: {
    type: String,
    required: true,
    trim: true
  },
  projectLocation: {
    type: String,
    required: true,
    trim: true
  },
  budget: {
    type: String,
    required: true,
    trim: true
  },
  timeline: {
    type: Date,
    required: true
  },
  
  // Additional timeline details
  month: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  },
  
  // Proposal Details
  projectDescription: {
    type: String,
    required: true,
    trim: true
  },
  
  // Key Requirements (checkboxes from the form)
  requirements: {
    architecturalDesign: { type: Boolean, default: false },
    electricalInstallations: { type: Boolean, default: false },
    interiorDesign: { type: Boolean, default: false },
    structuralEngineering: { type: Boolean, default: false },
    plumbingAndSanitation: { type: Boolean, default: false },
    landscaping: { type: Boolean, default: false }
  },
  
  // Attachments
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    size: Number,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Metadata
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'accepted', 'rejected'],
    default: 'pending'
  },
  
  rejectionReason: {
    type: String,
    default: null
  },
  
  submissionDate: {
    type: Date,
    default: Date.now
  },
  
  // Company the proposal is sent to
  company: {
    type: Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Proposal', ProposalSchema);
