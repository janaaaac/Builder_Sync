const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  status: { type: String, enum: ['pending','in-progress','completed'], default: 'pending' },
  project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  assignedTo: [{ type: Schema.Types.ObjectId, ref: 'Staff' }],
  createdBy: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 }, // completion percentage
  // History of progress updates by staff
  progressUpdates: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'Staff' },
      percentage: { type: Number, min: 0, max: 100 },
      title: { type: String },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);
