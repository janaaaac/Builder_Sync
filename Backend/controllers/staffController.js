const Staff = require("../models/Staff");
const Company = require("../models/Company");
const { generatePresignedUrl } = require("../utils/s3Presigner");

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
    const staffMembers = await Staff.find({ company: req.user._id }).select('-password');
    
    // Generate presigned URLs for staff profiles
    const staffWithUrls = [];
    for (const staff of staffMembers) {
      staffWithUrls.push(await generatePresignedUrlsForStaff(staff));
    }
    
    res.status(200).json({
      success: true,
      data: staffWithUrls
    });
  } catch (error) {
    console.error("Get company staff error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
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