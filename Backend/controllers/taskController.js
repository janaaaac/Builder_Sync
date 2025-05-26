const Task = require('../models/Task');

// Create a new task
exports.createTask = async (req, res) => {
  console.log('createTask called by:', req.user?._id, 'payload:', req.body);
  try {
    const { title, description, dueDate, priority, project, assignedTo } = req.body;
    if (!title || !project) {
      return res.status(400).json({ success: false, message: 'Title and project are required' });
    }
    const newTask = await Task.create({
      title,
      description,
      dueDate,
      priority,
      project,
      assignedTo,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: newTask });
  } catch (err) {
    console.error('Error in createTask:', err);
    res.status(500).json({ success: false, message: 'Error creating task', error: err.message });
  }
};

// Get all tasks for current user (created or assigned)
exports.getTasks = async (req, res) => {
  console.log('getTasks for user:', req.user._id);
  try {
    const userId = req.user._id;
    // Return tasks created by user or assigned to user
    const tasks = await Task.find({
      $or: [ { createdBy: userId }, { assignedTo: userId } ]
    })
      .populate('project', 'title status')
      .populate('assignedTo', 'fullName email role profilePicture');
    console.log('Tasks found:', tasks);
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching tasks', error: err.message });
  }
};

// Get all tasks for a specific project
exports.getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'fullName email role profilePicture')
      .populate('createdBy', 'fullName email role');
    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching project tasks', error: err.message });
  }
};

// Get a single task by ID
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title status')
      .populate('assignedTo', 'fullName email role profilePicture');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    // Allow creator or any assigned staff to view
    const userId = req.user._id.toString();
    const isCreator = task.createdBy.toString() === userId;
    const isAssigned = (task.assignedTo || []).some(u => u._id.toString() === userId);
    if (!isCreator && !isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching task', error: err.message });
  }
};

// Update a task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    Object.assign(task, req.body);
    await task.save();
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error updating task', error: err.message });
  }
};

// Assign staff to an existing task
exports.assignStaffToTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { staffIds } = req.body; // Array of staff IDs
    const task = await Task.findById(taskId).populate('project', 'title');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    // Only the creator (project manager) can assign
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const existing = (task.assignedTo || []).map(id => id.toString());
    // Merge unique
    task.assignedTo = Array.from(new Set([...(task.assignedTo || []), ...staffIds]));
    await task.save();

    // Notify new assignees
    for (const sid of staffIds) {
      if (!existing.includes(sid)) {
        const notif = await Notification.create({
          userId: sid,
          userType: 'Staff',
          type: 'task_assigned',
          message: `You have been assigned to task ${task.title}`,
          data: { taskId: task._id, projectId: task.project._id },
          isRead: false
        });
      }
    }
    res.json({ success: true, message: 'Staff assigned to task', data: task });
  } catch (err) {
    console.error('Error in assignStaffToTask:', err);
    res.status(500).json({ success: false, message: 'Error assigning staff', error: err.message });
  }
};

// Update progress with a title (assigned staff or creator)
exports.updateTaskProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage, title } = req.body;
    // Validate
    if (percentage == null || percentage < 0 || percentage > 100) {
      return res.status(400).json({ success: false, message: 'Invalid progress percentage' });
    }
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const userId = req.user._id.toString();
    // Only creator or assigned staff can update
    const isCreator = task.createdBy.toString() === userId;
    const isAssigned = task.assignedTo.map(a => a.toString()).includes(userId);
    if (!isCreator && !isAssigned) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    // Push to history
    task.progressUpdates.push({ userId: req.user._id, percentage, title });
    // Update main progress
    task.progress = percentage;
    // If fully complete, mark status accordingly
    if (percentage === 100) {
      task.status = 'completed';
    }
    await task.save();
    res.json({ success: true, data: task });
  } catch (err) {
    console.error('Error updating task progress:', err);
    res.status(500).json({ success: false, message: 'Error updating progress', error: err.message });
  }
};

// Delete a task
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await task.remove();
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting task', error: err.message });
  }
};