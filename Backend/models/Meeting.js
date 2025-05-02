const mongoose = require('mongoose');
const MeetingSchema = new mongoose.Schema({
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  zoomLink: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, refPath: 'participants.userType' },
    userType: { type: String, enum: ['Client', 'Staff', 'Company'] },
    status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' }
  }],
  notificationsSent: { type: Boolean, default: false },
  canceled: { type: Boolean, default: false },
  cancelReason: { type: String, default: '' },
  canceledAt: { type: Date },
  reminders: [{
    sentAt: Date,
    type: { type: String, enum: ['24h', '1h', '15min'] }
  }]
}, { timestamps: true });
module.exports = mongoose.model('Meeting', MeetingSchema);