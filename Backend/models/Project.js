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
  // Add more fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
