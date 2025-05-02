const Project = require('../models/Project');
const Staff = require('../models/Staff');
const Proposal = require('../models/Proposal');

// Get all projects for the logged-in client
exports.getClientProjects = async (req, res) => {
  try {
    const projects = await Project.find({ client: req.user._id })
      .populate('company', 'name')
      .populate('staff', 'fullName email');
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching projects', error: err.message });
  }
};

// Get all projects for the logged-in company
exports.getCompanyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ company: req.user._id })
      .populate('client', 'fullName email')
      .populate('staff', 'fullName email role profilePicture');
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching projects', error: err.message });
  }
};

// Get all projects assigned to the logged-in staff
exports.getStaffProjects = async (req, res) => {
  try {
    const staffId = req.user._id;
    const projects = await Project.find({ staff: staffId })
      .populate('client', 'fullName email')
      .populate('company', 'name')
      .populate('staff', 'fullName email role profilePicture');
    res.json({ success: true, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching staff projects', error: err.message });
  }
};

// Add staff to a project
exports.addStaffToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { staffIds } = req.body; // Array of staff IDs
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    // Only the company that owns the project can add staff
    if (project.company.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    // Add staff (merge unique)
    project.staff = Array.from(new Set([...(project.staff || []), ...staffIds]));
    await project.save();
    res.json({ success: true, message: 'Staff added to project', data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error adding staff', error: err.message });
  }
};

// Create project from proposal (client triggers this)
exports.createProjectFromProposal = async (req, res) => {
  try {
    const { proposalId } = req.params;
    const proposal = await Proposal.findById(proposalId);
    if (!proposal || proposal.status !== 'accepted') {
      return res.status(400).json({ success: false, message: 'Proposal not approved' });
    }
    // Prevent duplicate project creation
    const Project = require('../models/Project');
    const existing = await Project.findOne({ proposal: proposalId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Project already created' });
    }
    const project = await Project.create({
      title: proposal.projectTitle,
      description: proposal.projectDescription,
      client: proposal.client,
      company: proposal.company,
      proposal: proposal._id,
      budget: proposal.budget,
      location: proposal.projectLocation
    });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating project', error: err.message });
  }
};

// Get project statistics for the dashboard
exports.getProjectStats = async (req, res) => {
  try {
    // Determine which user type is making the request
    const userType = req.user.role || (req.user.isAdmin ? 'admin' : req.user.companyName ? 'company' : 'client');
    
    let query = {};
    
    // Filter projects based on user type
    if (userType === 'company') {
      query.company = req.user._id;
    } else if (userType === 'client') {
      query.client = req.user._id;
    } else if (userType === 'staff') {
      query.staff = req.user._id;
    }
    
    // Count total projects
    const totalProjects = await Project.countDocuments(query);
    
    // Count projects by status
    const ongoingProjects = await Project.countDocuments({ ...query, status: 'ongoing' });
    const completedProjects = await Project.countDocuments({ ...query, status: 'completed' });
    const delayedProjects = await Project.countDocuments({ ...query, status: 'delayed' });
    const pendingProjects = await Project.countDocuments({ ...query, status: 'pending' });
    
    res.json({
      success: true,
      data: {
        total: totalProjects,
        ongoing: ongoingProjects,
        completed: completedProjects,
        delayed: delayedProjects,
        pending: pendingProjects
      }
    });
  } catch (err) {
    console.error('Error getting project stats:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching project statistics', 
      error: err.message 
    });
  }
};
