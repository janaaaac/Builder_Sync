const Proposal = require('../models/Proposal');
const Client = require('../models/Client');
const fs = require('fs');
const path = require('path');
const { uploadProposalAttachments, deleteFileFromS3 } = require('../utils/uploadProposal');

// Submit a new proposal
exports.submitProposal = async (req, res) => {
  try {
    const { 
      projectTitle, projectLocation, budget, timeline, 
      projectDescription, requirements, 
      month, year, companyId
    } = req.body;
    
    // Get client ID from the authenticated user
    const clientId = req.user._id;
    
    // Check if client exists
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }
    
    // Create new proposal
    const proposal = new Proposal({
      client: clientId,
      projectTitle,
      projectLocation,
      budget,
      timeline: new Date(timeline),
      month,
      year,
      projectDescription,
      requirements,
      company: companyId
    });
    
    // Handle file attachments if any
    if (req.files && req.files.length > 0) {
      // Upload files to S3 and get their information
      const s3Attachments = await uploadProposalAttachments(req.files);
      
      // Add attachment info to the proposal
      proposal.attachments = s3Attachments.map(att => ({
        filename: att.originalName,
        path: att.url,
        key: att.key,
        mimetype: att.fileType,
        size: att.fileSize
      }));
    }
    
    await proposal.save();
    
    res.status(201).json({
      success: true,
      data: proposal,
      message: 'Proposal submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit proposal',
      error: error.message
    });
  }
};

// Get proposals for the logged-in client
exports.getClientProposals = async (req, res) => {
  try {
    const clientId = req.user._id;
    
    const proposals = await Proposal.find({ client: clientId })
      .populate('company', 'name email phone profileImage')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (error) {
    console.error('Error getting client proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving proposals',
      error: error.message
    });
  }
};

// Update the getProposalById method to use the populate options
exports.getProposalById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;
    
    // Default populate if no specific options provided
    let clientPopulateOptions = { path: 'client', select: 'fullName email primaryContact' };
    let companyPopulateOptions = { path: 'company', select: 'name email phone profileImage' };
    
    // Use custom populate options if provided (from the middleware)
    if (req.populateOptions) {
      clientPopulateOptions = req.populateOptions;
    }
    
    const proposal = await Proposal.findById(id)
      .populate(clientPopulateOptions)
      .populate(companyPopulateOptions);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }
    
    // Security check: ensure only the client who submitted the proposal or the company it was sent to can view it
    if (
      (userRole === 'client' && proposal.client._id.toString() !== userId.toString()) &&
      (userRole === 'company' && proposal.company._id.toString() !== userId.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this proposal'
      });
    }
    
    res.status(200).json({
      success: true,
      data: proposal
    });
  } catch (error) {
    console.error('Error getting proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving proposal',
      error: error.message
    });
  }
};

// Update proposal status (for companies)
exports.updateProposalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const companyId = req.user._id;
    
    // Map 'approved' to 'accepted' for frontend compatibility
    let statusToSave = status;
    if (status === 'approved') {
      statusToSave = 'accepted';
    }
    
    // Verify valid status
    const validStatuses = ['pending', 'reviewing', 'accepted', 'rejected'];
    if (!validStatuses.includes(statusToSave)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value: ${statusToSave}. Valid values are: ${validStatuses.join(', ')}`,
      });
    }
    
    // Find the proposal
    const proposal = await Proposal.findById(id)
      .populate('client', 'fullName email username'); // Populate client data for notifications
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }
    
    // Ensure the company updating the proposal is the one it was sent to
    if (proposal.company.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this proposal'
      });
    }
    
    // Update proposal
    proposal.status = statusToSave;
    
    // Store rejection reason if provided
    if (status === 'rejected' && reason) {
      proposal.rejectionReason = reason;
    }
    
    await proposal.save();

    // Send notification to client if approved
    if (statusToSave === 'accepted') {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: proposal.client._id || proposal.client, // handle both populated and unpopulated
        userType: 'Client', // FIXED: must be capital 'C' to match enum
        type: 'proposal_approved',
        message: `Your proposal "${proposal.projectTitle}" has been approved!`,
        proposal: proposal._id,
        data: {
          proposalId: proposal._id,
          projectTitle: proposal.projectTitle
        }
      });

      // Automatically create a new Project for the client and company
      const Project = require('../models/Project');
      await Project.create({
        title: proposal.projectTitle,
        description: proposal.projectDescription,
        client: proposal.client._id || proposal.client,
        company: proposal.company,
        proposal: proposal._id,
        budget: proposal.budget,
        location: proposal.projectLocation
      });
    }
    
    res.status(200).json({
      success: true,
      data: proposal,
      message: 'Proposal status updated successfully'
    });
  } catch (error) {
    console.error('Error updating proposal status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating proposal status',
      error: error.message
    });
  }
};

// Delete a proposal (client can delete their own proposals)
exports.deleteProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user._id;
    
    const proposal = await Proposal.findById(id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }
    
    // Security check: ensure only the client who submitted can delete it
    if (proposal.client.toString() !== clientId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this proposal'
      });
    }
    
    // Delete attachment files from S3 if they exist
    if (proposal.attachments && proposal.attachments.length > 0) {
      const deletePromises = proposal.attachments.map(attachment => {
        if (attachment.key) {
          return deleteFileFromS3(attachment.key);
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
    }
    
    await Proposal.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting proposal',
      error: error.message
    });
  }
};

// Update the getCompanyProposals method to use the populate options
exports.getCompanyProposals = async (req, res) => {
  try {
    const companyId = req.user._id;
    
    // Default populate if no specific options provided
    let populateOptions = { path: 'client', select: 'fullName email primaryContact' };
    
    // Use custom populate options if provided (from the middleware)
    if (req.populateOptions) {
      populateOptions = req.populateOptions;
    }
    
    const proposals = await Proposal.find({ company: companyId })
      .populate(populateOptions)
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (error) {
    console.error('Error getting company proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving proposals',
      error: error.message
    });
  }
};

// Get clients with approved proposals for the company
exports.getClientsWithApprovedProposals = async (req, res) => {
  try {
    const companyId = req.user._id;
    
    // Find proposals that have been accepted for this company
    const approvedProposals = await Proposal.find({ 
      company: companyId,
      status: 'accepted' // Use 'accepted' since 'approved' gets mapped to 'accepted'
    })
    .populate({
      path: 'client',
      select: '_id fullName email primaryContact companyName' // Include only necessary client fields
    });
    
    console.log(`Found ${approvedProposals.length} approved proposals for company ${companyId}`);
    
    // Extract client information with project details
    const clientsMap = new Map();
    
    approvedProposals.forEach(proposal => {
      // Only process if we have client data
      if (proposal.client && proposal.client._id) {
        const clientId = proposal.client._id.toString();
        
        // If we haven't seen this client yet, add them to our map
        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, {
            _id: proposal.client._id,
            fullName: proposal.client.fullName || 'Unknown Client',
            email: proposal.client.email,
            primaryContact: proposal.client.primaryContact,
            companyName: proposal.client.companyName,
            projectTitle: proposal.projectTitle, // Include the project title from the proposal
            proposalId: proposal._id
          });
        }
      }
    });
    
    // Convert map to array
    const clientsWithApprovedProposals = Array.from(clientsMap.values());
    
    console.log(`Returning ${clientsWithApprovedProposals.length} unique clients with approved proposals`);
    
    res.status(200).json({
      success: true,
      count: clientsWithApprovedProposals.length,
      data: clientsWithApprovedProposals
    });
  } catch (error) {
    console.error('Error getting clients with approved proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving clients with approved proposals',
      error: error.message
    });
  }
};
