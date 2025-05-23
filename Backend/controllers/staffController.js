const Staff = require("../models/Staff");
const Company = require("../models/Company");
const { generatePresignedUrl } = require("../utils/s3Presigner");
const Project = require("../models/Project");
const Proposal = require("../models/Proposal");

exports.createStaff = async (req, res) => {
  try {
    const { username, email, password, fullName, role } = req.body;
    const companyId = req.user._id;

    // Validate input
    if (!username || !email || !password || !fullName || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check for existing user
    const existingUser = await Staff.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or username already exists"
      });
    }

    // Create new staff
    const newStaff = new Staff({
      username,
      email,
      password,
      fullName,
      role,
      company: companyId,
      isFirstLogin: true,
      isApproved: true // Auto-approve staff created by company
    });

    await newStaff.save();

    // Remove password from response
    const staffResponse = newStaff.toObject();
    delete staffResponse.password;

    res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff: staffResponse
    });

  } catch (error) {
    console.error("Error creating staff:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// First login setup
exports.firstLoginSetup = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const staffId = req.user._id;
      const files = req.fileKeys || {};
  
      const staff = await Staff.findById(staffId);
      if (!staff) {
        return res.status(404).json({ 
          success: false,
          message: "Staff not found" 
        });
      }
  
      // Verify current password
      const isMatch = await staff.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect"
        });
      }
  
      // Update profile picture if uploaded
      if (files.profilePicture) {
        staff.profilePicture = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${files.profilePicture}`;
      }
  
      // Update password and status
      staff.password = newPassword;
      staff.isFirstLogin = false;
      await staff.save();
  
      // Generate presigned URLs for immediate access
      const staffWithUrls = await generatePresignedUrlsForStaff(staff);
  
      res.status(200).json({
        success: true,
        message: "First login setup completed",
        staff: staffWithUrls
      });
  
    } catch (error) {
      console.error("First login error:", error);
      res.status(500).json({ 
        success: false,
        message: "Server error during setup",
        error: error.message
      });
    }
  };

// Get all staff for a company
exports.getCompanyStaff = async (req, res) => {
  try {
    const staff = await Staff.find({ company: req.user._id });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching staff', error: err.message });
  }
};

// Staff profile update with file handling
exports.updateStaffProfile = async (req, res) => {
  try {
    const staffId = req.user._id;
    const updates = req.body;
    const files = req.fileKeys || {};

    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff not found" 
      });
    }

    // Handle file updates
    if (files.profilePicture) {
      staff.profilePicture = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${files.profilePicture}`;
    }

    // Handle other file uploads
    if (files.qualifications) {
      const newQualifications = Array.isArray(files.qualifications) 
        ? files.qualifications.map(key => 
            `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
          )
        : [`https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${files.qualifications}`];
      
      staff.qualifications = [...(staff.qualifications || []), ...newQualifications];
    }

    // Update other fields
    const allowedUpdates = ['fullName', 'contactNumber', 'specialization'];
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        staff[field] = updates[field];
      }
    });

    await staff.save();

    // Generate presigned URLs for immediate access
    const staffWithUrls = await generatePresignedUrlsForStaff(staff);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      staff: staffWithUrls
    });

  } catch (error) {
    console.error("Staff profile update error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get staff profile with presigned URLs
exports.getStaffProfile = async (req, res) => {
  try {
    const staff = await Staff.findById(req.user._id).select('-password');
    if (!staff) {
      return res.status(404).json({ 
        success: false,
        message: "Staff not found" 
      });
    }

    const staffWithUrls = await generatePresignedUrlsForStaff(staff);
    
    res.status(200).json({
      success: true,
      data: staffWithUrls
    });

  } catch (error) {
    console.error("Get staff profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Staff dashboard data
exports.getDashboard = async (req, res) => {
  try {
    const staffId = req.user._id;
    
    // Get staff details
    const staff = await Staff.findById(staffId).select('-password');
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff not found"
      });
    }
    
    // Project manager specific dashboard
    if (staff.role === 'project_manager') {
      // Fetch projects assigned to this manager
      const projects = await Project.find({ staff: staffId });
      const totalProjects = projects.length;
      const ongoing = projects.filter(p => p.status === 'ongoing').length;
      const completed = projects.filter(p => p.status === 'completed').length;
      const pending = projects.filter(p => p.status === 'pending').length;
      // Sum budgets
      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      // Pending proposals count
      const pendingProposals = await Proposal.countDocuments({ company: staff.company, status: 'pending' });
      return res.status(200).json({
        success: true,
        data: {
          name: staff.fullName,
          role: staff.role,
          totalProjects,
          ongoing,
          completed,
          pending,
          totalBudget,
          pendingProposals,
          assignedProjects: projects
        }
      });
    }
    
    // Sample dashboard data - replace with actual DB queries
    // You would typically fetch this data from your project and task models
    const dashboardData = {
      name: staff.fullName,
      role: staff.role,
      profilePicture: staff.profilePicture,
      projectCount: 3, // Sample data - replace with actual count
      taskCount: 8,    // Sample data - replace with actual count
      upcomingTasks: [
        {
          id: "task1",
          title: "Complete site measurement",
          dueDate: new Date(Date.now() + 86400000), // Tomorrow
          priority: "high"
        },
        {
          id: "task2",
          title: "Review design documents",
          dueDate: new Date(Date.now() + 172800000), // Day after tomorrow
          priority: "medium"
        }
      ],
      recentDocuments: [
        {
          id: "doc1",
          title: "Project Brief.pdf",
          uploadedAt: new Date(Date.now() - 86400000), // Yesterday
          type: "pdf"
        }
      ]
    };
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
    
  } catch (error) {
    console.error("Staff dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message
    });
  }
};

// Get staff statistics for the dashboard
exports.getStaffStats = async (req, res) => {
  try {
    // Only company users should access this endpoint
    const companyId = req.user._id;
    
    // Count all staff for the company
    const totalStaff = await Staff.countDocuments({ company: companyId });
    
    // Count staff by role if needed
    const architectCount = await Staff.countDocuments({ company: companyId, role: 'ARCHITECT' });
    const engineerCount = await Staff.countDocuments({ company: companyId, role: 'ENGINEER' });
    const designerCount = await Staff.countDocuments({ company: companyId, role: 'DESIGNER' });
    const managerCount = await Staff.countDocuments({ company: companyId, role: 'PROJECT_MANAGER' });
    
    // Get company staffing limit from company model if it exists
    const company = await Company.findById(companyId);
    const staffLimit = company?.staffLimit || 120; // Default to 120 if not set
    
    res.json({
      success: true,
      data: {
        total: totalStaff,
        limit: staffLimit,
        roles: {
          architects: architectCount,
          engineers: engineerCount,
          designers: designerCount,
          managers: managerCount
        }
      }
    });
  } catch (err) {
    console.error('Error fetching staff stats:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching staff statistics', 
      error: err.message 
    });
  }
};

// Helper function to generate presigned URLs
async function generatePresignedUrlsForStaff(staff) {
  const staffObj = staff.toObject ? staff.toObject() : { ...staff };
  
  // Generate URLs for all file fields
  const fileFields = ['profilePicture', 'qualifications', 'certifications'];
  for (const field of fileFields) {
    if (staffObj[field]) {
      if (Array.isArray(staffObj[field])) {
        staffObj[`${field}Urls`] = [];
        for (const fileUrl of staffObj[field]) {
          const presignedUrl = await generatePresignedUrl(fileUrl);
          staffObj[`${field}Urls`].push(presignedUrl || fileUrl);
        }
      } else {
        const presignedUrl = await generatePresignedUrl(staffObj[field]);
        staffObj[`${field}Url`] = presignedUrl || staffObj[field];
      }
    }
  }
  
  return staffObj;
}

// Delete staff member
exports.deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const companyId = req.user._id;

    // Find the staff member
    const staff = await Staff.findById(staffId);
    
    // Check if staff exists
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Staff member not found"
      });
    }
    
    // Check if the staff belongs to the company making the request
    if (staff.company.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete staff members from your company"
      });
    }
    
    // Delete the staff member
    await Staff.findByIdAndDelete(staffId);
    
    res.status(200).json({
      success: true,
      message: "Staff member deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Fetch staff by clientId (admin only)
exports.getStaffByClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const staffMembers = await Staff.find({ client: clientId }).select('-password');
    res.status(200).json({
      success: true,
      data: staffMembers
    });
  } catch (error) {
    console.error("Get staff by client error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// Get all staff for staff (same company)
exports.getStaffByCompany = async (req, res) => {
  try {
    const companyId = req.user.company;
    const staff = await Staff.find({ company: companyId, isApproved: true });
    const result = staff.map(({ _id, fullName, role, profilePicture }) => ({ _id, fullName, role, profilePicture }));
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching company staff', error: err.message });
  }
};
