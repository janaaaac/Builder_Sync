const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  proposal: { type: Schema.Types.ObjectId, ref: 'Proposal', required: true },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  budget: { type: Number },
  location: { type: String },
  staff: [{ type: Schema.Types.ObjectId, ref: 'Staff' }],
  plans: [{
    name: { type: String, default: 'Unnamed Plan' },
    url: { type: String, required: true },
    type: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    description: { type: String, default: '' },
    version: { type: String, default: '1.0' },
    planType: { type: String, default: 'otherPlans' },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      refPath: 'plans.uploaderModel'
    },
    uploaderModel: {
      type: String,
      enum: ['Staff', 'Company', 'Client'],
      default: 'Staff'
    },
    uploadDate: { type: Date, default: Date.now }
  }],
  // Add more fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
