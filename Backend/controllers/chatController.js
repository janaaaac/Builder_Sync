const Staff = require("../models/Staff");
const Client = require("../models/Client");
const Company = require("../models/Company");
const Proposal = require("../models/Proposal");

// Get all contacts (staff and clients) for the authenticated company
exports.getCompanyContacts = async (req, res) => {
  try {
    const companyId = req.user._id;
    // Get clients from company's proposals
    const proposals = await Proposal.find({ company: companyId });
    let clientIds = [...new Set(proposals.map(p => p.client?.toString()).filter(Boolean))];
    if (clientIds.length === 0) {
      const allClients = await Client.find({}).select("_id");
      clientIds = allClients.map(client => client._id.toString());
    }
    const clients = await Client.find({ _id: { $in: clientIds } }).select(
      "fullName profilePicture email phone lastSeen"
    );
    const staffMembers = await Staff.find({ company: companyId }).select(
      "fullName profilePicture email phone lastSeen"
    );
    const clientContacts = clients.map(client => ({
      _id: client._id,
      name: client.fullName,
      avatar: client.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: client.lastSeen || new Date(),
      online: false,
      read: true,
      type: "client"
    }));
    const staffContacts = staffMembers.map(staff => ({
      _id: staff._id,
      name: staff.fullName,
      avatar: staff.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: staff.lastSeen || new Date(),
      online: false,
      read: true,
      type: "staff"
    }));
    const allContacts = [...clientContacts, ...staffContacts];
    res.status(200).json(allContacts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contacts", error: error.message });
  }
};

// Get all contacts (staff and company) for the authenticated client
exports.getClientContacts = async (req, res) => {
  try {
    const clientId = req.user._id;
    // Find proposals for this client
    const proposals = await Proposal.find({ client: clientId });
    let companyIds = [...new Set(proposals.map(p => p.company?.toString()).filter(Boolean))];
    // Get companies
    const companies = await Company.find({ _id: { $in: companyIds } }).select(
      "companyName companyLogo email contactPersonName lastSeen"
    );
    // Get staff for these companies
    const staffMembers = await Staff.find({ company: { $in: companyIds } }).select(
      "fullName profilePicture email phone lastSeen company"
    );
    const companyContacts = companies.map(company => ({
      _id: company._id,
      name: company.companyName,
      avatar: company.companyLogo || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: company.lastSeen || new Date(),
      online: false,
      read: true,
      type: "company"
    }));
    const staffContacts = staffMembers.map(staff => ({
      _id: staff._id,
      name: staff.fullName,
      avatar: staff.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: staff.lastSeen || new Date(),
      online: false,
      read: true,
      type: "staff",
      company: staff.company
    }));
    const allContacts = [...companyContacts, ...staffContacts];
    res.status(200).json(allContacts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contacts", error: error.message });
  }
};

// Get all contacts (staff and company) for the authenticated staff
exports.getStaffContacts = async (req, res) => {
  try {
    const staffId = req.user._id;
    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    const companyId = staff.company;
    // Get all staff in the same company except self
    const staffMembers = await Staff.find({ company: companyId, _id: { $ne: staffId } }).select(
      "fullName profilePicture email phone lastSeen"
    );
    // Get the company
    const company = await Company.findById(companyId).select(
      "companyName companyLogo email contactPersonName lastSeen"
    );
    const staffContacts = staffMembers.map(s => ({
      _id: s._id,
      name: s.fullName,
      avatar: s.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: s.lastSeen || new Date(),
      online: false,
      read: true,
      type: "staff"
    }));
    const companyContact = company ? [{
      _id: company._id,
      name: company.companyName,
      avatar: company.companyLogo || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: company.lastSeen || new Date(),
      online: false,
      read: true,
      type: "company"
    }] : [];
    const allContacts = [...companyContact, ...staffContacts];
    res.status(200).json(allContacts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching contacts", error: error.message });
  }
};

// Get all contacts for a client by clientId (legacy or direct access)
// This is a route handler function, not an export for use with router directly
exports.getContactsForClientById = async (req, res) => {
  try {
    const { clientId } = req.params;
    const client = await Client.findById(clientId);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    console.log(`Fetching contacts for client ${clientId}`);
    // APPROACH 1: Get companies from client's proposals
    const proposals = await Proposal.find({ clientId });
    let companyIds = [...new Set(proposals.map(p => p.companyId?.toString()).filter(Boolean))];
    console.log(`Found ${companyIds.length} companies from proposals`);
    // APPROACH 2: If no companies from proposals, get all companies
    if (companyIds.length === 0) {
      console.log("No companies found from proposals, getting all companies instead");
      const allCompanies = await Company.find({}).select("_id");
      companyIds = allCompanies.map(company => company._id.toString());
      console.log(`Found ${companyIds.length} total companies`);
    }
    // Fetch company details
    const companies = await Company.find({ _id: { $in: companyIds } }).select(
      "companyName companyLogo email phone lastSeen"
    );
    console.log(`Fetched details for ${companies.length} companies`);
    // Format companies as contacts
    const companyContacts = companies.map(company => ({
      _id: company._id,
      name: company.companyName,
      avatar: company.companyLogo || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: company.lastSeen || new Date(),
      online: false,
      read: true,
      type: "company"
    }));
    console.log(`Returning ${companyContacts.length} contacts to client`);
    res.status(200).json(companyContacts);
  } catch (error) {
    console.error("Error fetching client contacts:", error);
    res.status(500).json({ message: "Error fetching contacts", error: error.message });
  }
};

// Get all contacts for a company by companyId (direct/legacy access)
exports.getContactsForCompanyById = async (req, res) => {
  try {
    const { companyId } = req.params;
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    console.log(`Fetching contacts for company ${companyId}`);
    // APPROACH 1: Get clients from company's proposals
    const proposals = await Proposal.find({ companyId });
    let clientIds = [...new Set(proposals.map(p => p.clientId?.toString()).filter(Boolean))];
    console.log(`Found ${clientIds.length} clients from proposals`);
    // APPROACH 2: If no clients from proposals, get all clients
    if (clientIds.length === 0) {
      console.log("No clients found from proposals, getting all clients instead");
      const allClients = await Client.find({}).select("_id");
      clientIds = allClients.map(client => client._id.toString());
      console.log(`Found ${clientIds.length} total clients`);
    }
    // Fetch client details
    const clients = await Client.find({ _id: { $in: clientIds } }).select(
      "fullName profilePicture email phone lastSeen"
    );
    console.log(`Fetched details for ${clients.length} clients`);
    // Get all staff members belonging to this company
    const staffMembers = await Staff.find({ companyId }).select(
      "fullName profilePicture email phone lastSeen"
    );
    console.log(`Found ${staffMembers.length} staff members for this company`);
    // Format clients as contacts
    const clientContacts = clients.map(client => ({
      _id: client._id,
      name: client.fullName,
      avatar: client.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: client.lastSeen || new Date(),
      online: false,
      read: true,
      type: "client"
    }));
    // Format staff as contacts
    const staffContacts = staffMembers.map(staff => ({
      _id: staff._id,
      name: staff.fullName,
      avatar: staff.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: staff.lastSeen || new Date(),
      online: false,
      read: true,
      type: "staff"
    }));
    // Combine all contacts
    const allContacts = [...clientContacts, ...staffContacts];
    console.log(`Returning ${allContacts.length} contacts to company (${clientContacts.length} clients, ${staffContacts.length} staff)`);
    res.status(200).json(allContacts);
  } catch (error) {
    console.error("Error fetching company contacts:", error);
    res.status(500).json({ message: "Error fetching contacts", error: error.message });
  }
};

// Get all contacts for a staff member by staffId (legacy/direct access)
exports.getContactsForStaffById = async (req, res) => {
  try {
    const { staffId } = req.params;
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    console.log(`Fetching contacts for staff ${staffId}`);
    // Fetch the company this staff belongs to
    const company = await Company.findById(staff.companyId).select(
      "companyName companyLogo email phone lastSeen"
    );
    console.log(`Found company: ${company ? company.companyName : 'None'}`);
    // Find all staff members from the same company
    const coworkers = await Staff.find({ 
      companyId: staff.companyId,
      _id: { $ne: staffId }
    }).select("fullName profilePicture email phone lastSeen");
    console.log(`Found ${coworkers.length} coworkers`);
    // APPROACH 1: Find clients assigned to this staff member (from proposals)
    const assignedProposals = await Proposal.find({ assignedStaff: staffId });
    let clientIds = [...new Set(assignedProposals.map(p => p.clientId?.toString()).filter(Boolean))];
    console.log(`Found ${clientIds.length} clients from assigned proposals`);
    // APPROACH 2: If no assigned clients, get all clients
    if (clientIds.length === 0) {
      console.log("No assigned clients found, getting all clients instead");
      const allClients = await Client.find({}).select("_id");
      clientIds = allClients.map(client => client._id.toString());
      console.log(`Found ${clientIds.length} total clients`);
    }
    // Fetch client details
    const clients = await Client.find({ _id: { $in: clientIds } }).select(
      "fullName profilePicture email phone lastSeen"
    );
    console.log(`Fetched details for ${clients.length} clients`);
    // Format company as contact
    const companyContact = company ? [{
      _id: company._id,
      name: company.companyName,
      avatar: company.companyLogo || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: company.lastSeen || new Date(),
      online: false,
      read: true,
      type: "company"
    }] : [];
    // Format coworkers as contacts
    const staffContacts = coworkers.map(coworker => ({
      _id: coworker._id,
      name: coworker.fullName,
      avatar: coworker.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: coworker.lastSeen || new Date(),
      online: false,
      read: true,
      type: "staff"
    }));
    // Format clients as contacts
    const clientContacts = clients.map(client => ({
      _id: client._id,
      name: client.fullName,
      avatar: client.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: client.lastSeen || new Date(),
      online: false,
      read: true,
      type: "client"
    }));
    // Combine all contacts
    const allContacts = [...companyContact, ...staffContacts, ...clientContacts];
    console.log(`Returning ${allContacts.length} contacts to staff (${companyContact.length} company, ${staffContacts.length} coworkers, ${clientContacts.length} clients)`);
    res.status(200).json(allContacts);
  } catch (error) {
    console.error("Error fetching staff contacts:", error);
    res.status(500).json({ message: "Error fetching contacts", error: error.message });
  }
};

// Get all staff in the same company (for staff role)
exports.getMyCompanyStaff = async (req, res) => {
  try {
    const staffMembers = await Staff.find({
      company: req.user.company, // or req.user.companyId depending on your schema
      _id: { $ne: req.user._id }
    }).select('-password');
    res.status(200).json(staffMembers);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get contacts only from staff member's own company
exports.getStaffCompanyContacts = async (req, res) => {
  try {
    const staffId = req.user._id;
    const staff = await Staff.findById(staffId);
    
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }
    
    const companyId = staff.company;
    
    // Get all staff in the same company except self
    const staffMembers = await Staff.find({ 
      company: companyId, 
      _id: { $ne: staffId } 
    }).select("fullName profilePicture email phone lastSeen");
    
    // Get the company
    const company = await Company.findById(companyId).select(
      "companyName companyLogo email contactPersonName lastSeen"
    );
    
    // Format staff as contacts
    const staffContacts = staffMembers.map(s => ({
      _id: s._id,
      name: s.fullName,
      avatar: s.profilePicture || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: s.lastSeen || new Date(),
      online: false,
      read: true,
      type: "staff"
    }));
    
    // Format company as contact
    const companyContact = company ? [{
      _id: company._id,
      name: company.companyName,
      avatar: company.companyLogo || "/Assets/default-avatar.png",
      lastMessage: "Start a conversation",
      time: company.lastSeen || new Date(),
      online: false,
      read: true,
      type: "company"
    }] : [];
    
    // Create the final contacts array with only company and coworkers
    const allContacts = [...companyContact, ...staffContacts];
    
    res.status(200).json(allContacts);
  } catch (error) {
    console.error("Error fetching staff company contacts:", error);
    res.status(500).json({ 
      message: "Error fetching contacts", 
      error: error.message 
    });
  }
};

// Helper: Check if sender can chat with recipient
async function canChat(sender, senderType, recipient, recipientType) {
  const Proposal = require("../models/Proposal");
  const Staff = require("../models/Staff");
  const Client = require("../models/Client");
  const Company = require("../models/Company");

  // Company <-> Client: Only if proposal exists
  if (
    (senderType === "company" && recipientType === "client") ||
    (senderType === "client" && recipientType === "company")
  ) {
    const companyId = senderType === "company" ? sender : recipient;
    const clientId = senderType === "client" ? sender : recipient;
    const proposal = await Proposal.findOne({ company: companyId, client: clientId });
    return !!proposal;
  }
  // Company <-> Staff: Only if staff belongs to company
  if (
    (senderType === "company" && recipientType === "staff") ||
    (senderType === "staff" && recipientType === "company")
  ) {
    const companyId = senderType === "company" ? sender : recipient;
    const staffId = senderType === "staff" ? sender : recipient;
    const staff = await Staff.findById(staffId);
    return staff && staff.company && staff.company.toString() === companyId.toString();
  }
  // Client <-> Staff: Only if staff assigned to client's project/proposal
  if (
    (senderType === "client" && recipientType === "staff") ||
    (senderType === "staff" && recipientType === "client")
  ) {
    const clientId = senderType === "client" ? sender : recipient;
    const staffId = senderType === "staff" ? sender : recipient;
    // Check if staff is assigned to any proposal/project for this client
    const proposal = await Proposal.findOne({ client: clientId, assignedStaff: staffId });
    return !!proposal;
  }
  // Default: not allowed
  return false;
}

// POST /api/chat/send-message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, recipientType, message } = req.body;
    const senderId = req.user._id;
    const senderType = req.user.role; // 'client', 'company', or 'staff'

    // Permission check
    const allowed = await canChat(senderId, senderType, recipientId, recipientType);
    if (!allowed) {
      return res.status(403).json({ message: "You are not allowed to chat with this user." });
    }

    // Save message logic here (pseudo, adapt to your Chat model)
    // Example: create or update chat room, then push message
    // ...
    // const chat = await Chat.findOneAndUpdate(...)
    // For now, just return success
    res.status(200).json({ success: true, message: "Message sent (permission granted)" });
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};
