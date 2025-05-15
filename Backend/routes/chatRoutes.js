const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

// Company: get all staff and clients
router.get(
  "/company/contacts",
  requireAuth,
  requireRole("company"),
  chatController.getCompanyContacts
);

// Staff: get all staff (except self) and company
router.get(
  "/staff/contacts",
  requireAuth,
  requireRole("staff"),
  chatController.getStaffContacts
);

// Staff: get only contacts from their own company
router.get(
  "/staff/company-contacts",
  requireAuth,
  requireRole("staff"),
  chatController.getStaffCompanyContacts
);

// Client: get all companies and staff from their proposals
router.get(
  "/client/contacts",
  requireAuth,
  requireRole("client"),
  chatController.getClientContacts
);

// Legacy/direct: Get all contacts for a client by clientId param
router.get(
  "/client/:clientId/contacts",
  requireAuth,
  chatController.getContactsForClientById
);

// Legacy/direct: Get all contacts for a company by companyId param
router.get(
  "/:companyId/contacts",
  requireAuth,
  chatController.getContactsForCompanyById
);

// Legacy/direct: Get all contacts for a staff member by staffId param
router.get(
  "/:staffId/contacts",
  requireAuth,
  chatController.getContactsForStaffById
);

// Get all staff in the same company (for staff role)
router.get(
  '/my-company-staff',
  requireAuth,
  requireRole('staff'),
  chatController.getMyCompanyStaff
);

// Send a chat message (with permission enforcement)
router.post(
  "/send-message",
  requireAuth,
  chatController.sendMessage
);

module.exports = router;
