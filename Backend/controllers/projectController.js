const Project = require('../models/Project');
const Staff = require('../models/Staff');
const Proposal = require('../models/Proposal');
const Notification = require('../models/Notification');

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

// Get single project detail for staff
exports.getStaffProjectDetail = async (req, res) => {
  console.log('getStaffProjectDetail:', 'projectId=', req.params.projectId, 'user=', req.user?._id);
  try {
    const { projectId } = req.params;
    console.log('Looking up project by ID:', projectId);
    const staffId = req.user._id.toString();
    const project = await Project.findById(projectId)
      .populate('client', 'fullName email')
      .populate('company', 'name')
      .populate('staff', 'fullName email role profilePicture');
    console.log('Project fetch result:', project);
    if (!project) {
      console.log('Project not found, returning 404');
      return res.status(404).json({ success: false, message: 'Project not found' });
    }
    // Ensure staff is assigned to this project
    const assigned = project.staff.some(s => s._id.toString() === staffId);
    console.log('Assigned check:', assigned);
    if (!assigned) {
      console.log('User not assigned to project, returning 403');
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: project });
  } catch (err) {
    console.error('Error in getStaffProjectDetail:', err);
    res.status(500).json({ success: false, message: 'Error fetching project', error: err.message });
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
    
    // Track existing staff before update
    const existingStaff = (project.staff || []).map(id => id.toString());
    // Add staff (merge unique)
    project.staff = Array.from(new Set([...(project.staff || []), ...staffIds]));
    await project.save();
   
    // Notify newly assigned staff members
    const newlyAssigned = project.staff
      .map(id => id.toString())
      .filter(id => !existingStaff.includes(id));
    for (const staffId of newlyAssigned) {
      const notif = await Notification.create({
        userId: staffId,
        userType: 'Staff', // specify user type for validation
        type: 'project_assigned',
        message: `You have been assigned to project ${project.title}`,
        data: { projectId: project._id },
        isRead: false
      });
      console.log('Notification saved to DB:', notif);
      // Emit real-time notification to the staff member
      const io = req.app.get('io');
      if (io) {
        io.to(`notifications:${staffId}`).emit('notification', notif);
      }
    }
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

// Upload project plans
exports.uploadProjectPlans = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { description, version } = req.body;
    
    console.log('Files received:', JSON.stringify(req.files));
    console.log('Body received:', req.body);
    
    // Ensure files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No plan files uploaded'
      });
    }
    
    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check authorization
    // For staff, check if they have the architect role for plan uploads
    let isAuthorized = false;
    let uploaderModel = '';
    
    if (req.user.role === 'company' && project.company.toString() === req.user._id.toString()) {
      isAuthorized = true;
      uploaderModel = 'Company';
    } else if (req.user.role === 'client' && project.client.toString() === req.user._id.toString()) {
      isAuthorized = true;
      uploaderModel = 'Client';
    } else if (req.user.role === 'staff') {
      // Get the staff details to check role
      const staff = await Staff.findById(req.user._id);
      
      // Only authorize if staff is assigned to project AND is an architect
      if (staff && 
          project.staff.some(staffId => staffId.toString() === req.user._id.toString())) {
        isAuthorized = true;
        uploaderModel = 'Staff';
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload plans to this project'
      });
    }
    
    // Process uploaded files - handling multer-s3 format
    const uploadedPlans = [];
    
    try {
      // Loop through each field type (floorPlans, elevationPlans, etc.)
      for (const fieldName in req.files) {
        const files = req.files[fieldName];
        
        if (!Array.isArray(files) || files.length === 0) {
          console.log(`No files found for field: ${fieldName}`);
          continue;
        }
        
        // Process each file in this field
        for (const file of files) {
          if (!file.location) {
            console.warn(`File missing location property:`, file);
            continue;
          }
          
          uploadedPlans.push({
            name: file.originalname || 'Unnamed file',
            url: file.location, // S3 URL
            type: file.mimetype || 'application/octet-stream',
            size: file.size || 0,
            description: description || '',
            version: version || '1.0',
            uploadedBy: req.user._id,
            uploaderModel: uploaderModel,
            uploadDate: new Date(),
            planType: fieldName // Store the plan type
          });
        }
      }
    } catch (fileErr) {
      console.error('Error processing uploaded files:', fileErr);
      return res.status(500).json({
        success: false,
        message: 'Error processing uploaded files',
        error: fileErr.message
      });
    }
    
    if (uploadedPlans.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid plan files were processed'
      });
    }
    
    // Add the plans to the project
    if (!project.plans) {
      project.plans = [];
    }

    try {
      console.log('Starting to add plans to project:', project._id);
      
      // Track how many plans were successfully added
      let successfullyAddedPlans = 0;
      
      // Process all uploaded plans
      for (let i = 0; i < uploadedPlans.length; i++) {
        const plan = uploadedPlans[i];
        
        try {
          // Create a clean object with only the required fields
          const planData = {
            name: plan.name || 'Unnamed Plan',
            url: plan.url,
            type: plan.type || 'application/octet-stream',
            size: plan.size || 0,
            description: plan.description || '',
            version: plan.version || '1.0',
            uploadedBy: plan.uploadedBy,
            uploaderModel: plan.uploaderModel || 'Staff',
            uploadDate: new Date(),
            planType: plan.planType || 'otherPlans'
          };
          
          // Add the plan to the project's plans array
          project.plans.push(planData);
          successfullyAddedPlans++;
          
          console.log(`Added plan ${i+1}/${uploadedPlans.length}: ${planData.name}`);
        } catch (planErr) {
          console.error(`Error adding plan ${i+1}/${uploadedPlans.length}:`, planErr);
          // Continue processing other plans
        }
      }
      
      // Save the project with a promise to better handle errors
      console.log('Saving project with', successfullyAddedPlans, 'new plans...');
      
      try {
        await project.save();
        console.log('Project saved successfully with new plans');
        
        return res.status(200).json({
          success: true,
          message: `${successfullyAddedPlans} plan files uploaded successfully`,
          data: uploadedPlans
        });
      } catch (mongooseError) {
        console.error('Mongoose save error:', mongooseError);
        
        // If there's a validation error, provide more details
        if (mongooseError.name === 'ValidationError') {
          console.error('Validation errors:', JSON.stringify(mongooseError.errors));
        }
        
        return res.status(500).json({
          success: false,
          message: 'Error saving project with new plans',
          error: mongooseError.message
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `${uploadedPlans.length} plan files uploaded successfully`,
        data: uploadedPlans
      });
    } catch (saveError) {
      console.error('Error saving plans to project:', saveError);
      return res.status(500).json({
        success: false,
        message: 'Server error saving plans to project',
        error: saveError.message
      });
    }
  } catch (error) {
    console.error('Error in uploadProjectPlans:', error);
    
    // Additional error details for debugging
    if (error.name === 'CastError') {
      console.error('Cast Error Details:', {
        path: error.path,
        kind: error.kind,
        value: typeof error.value === 'object' ? 'object' : error.value,
        valueType: error.valueType
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error uploading plans',
      error: error.message
    });
  }
};

// Get all plans for a project
exports.getProjectPlans = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check authorization - same as upload
    let isAuthorized = false;
    
    if (req.user.role === 'company' && project.company.toString() === req.user._id.toString()) {
      isAuthorized = true;
    } else if (req.user.role === 'client' && project.client.toString() === req.user._id.toString()) {
      isAuthorized = true;
    } else if (req.user.role === 'staff' && project.staff.some(staffId => staffId.toString() === req.user._id.toString())) {
      isAuthorized = true;
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view plans for this project'
      });
    }
    
    // Sort plans by uploadDate (newest first)
    const plans = project.plans.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    
    res.status(200).json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error getting project plans:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving plans'
    });
  }
};

// Get a specific plan by ID
exports.getPlanById = async (req, res) => {
  try {
    const { projectId, planId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Find the plan in the project
    const plan = project.plans.id(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    // Check authorization (same as getProjectPlans)
    let isAuthorized = false;
    
    if (req.user.role === 'company' && project.company.toString() === req.user._id.toString()) {
      isAuthorized = true;
    } else if (req.user.role === 'client' && project.client.toString() === req.user._id.toString()) {
      isAuthorized = true;
    } else if (req.user.role === 'staff' && project.staff.some(staffId => staffId.toString() === req.user._id.toString())) {
      isAuthorized = true;
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this plan'
      });
    }
    
    res.status(200).json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error getting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving plan'
    });
  }
};

// Delete a plan
exports.deletePlan = async (req, res) => {
  try {
    const { projectId, planId } = req.params;
    
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check authorization - only company or staff can delete plans
    let isAuthorized = false;
    
    if (req.user.role === 'company' && project.company.toString() === req.user._id.toString()) {
      isAuthorized = true;
    } else if (req.user.role === 'staff' && project.staff.some(staffId => staffId.toString() === req.user._id.toString())) {
      isAuthorized = true;
    }
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete plans for this project'
      });
    }
    
    // Find and remove the plan
    const planIndex = project.plans.findIndex(plan => plan._id.toString() === planId);
    if (planIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found'
      });
    }
    
    project.plans.splice(planIndex, 1);
    await project.save();
    
    res.status(200).json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting plan'
    });
  }
};

// Get staff assigned to a specific project
exports.getProjectStaff = async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId)
      .populate('staff', 'fullName email role profilePicture');
    
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // Check if user has access to this project
    if (req.user.role === 'staff') {
      // Staff can only see other staff if they are part of the project
      const staffId = req.user._id.toString();
      const isAssignedToProject = project.staff.some(s => s._id.toString() === staffId);
      
      if (!isAssignedToProject) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this project staff' });
      }
    } else if (req.user.role === 'client') {
      // Client can only see staff if they own the project
      if (project.client.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this project staff' });
      }
    } else if (req.user.role === 'company') {
      // Company can only see staff if they own the project
      if (project.company.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this project staff' });
      }
    }
    
    // Return the staff members assigned to the project
    res.json({ success: true, data: project.staff || [] });
  } catch (err) {
    console.error('Error fetching project staff:', err);
    res.status(500).json({ success: false, message: 'Error fetching project staff', error: err.message });
  }
};
