const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  },
  userType: {
    type: String,
    enum: ['Client', 'Company', 'Staff', 'Admin'],
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'proposal_approved', 
      'proposal_rejected', 
      'message', 
      'system', 
      'meeting_invite', 
      'meeting_update', 
      'meeting_reminder',
      'meeting_canceled',
      'project_assigned',
      'task_assigned'
    ]
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: Object,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  proposal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proposal'
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
