/**
 * Contact Controller
 * Handles contact management endpoints
 */

const { contactService } = require("../services");
const { formatSuccessResponse } = require("../utils/formatters");
const { asyncHandler } = require("../middlewares");

/**
 * Get all contacts
 * GET /api/contacts
 */
const getAllContacts = asyncHandler(async (req, res) => {
  const contacts = await contactService.getAllContacts();
  res.json(
    formatSuccessResponse(contacts, `Retrieved ${contacts.length} contacts`)
  );
});

/**
 * Get contact by ID
 * GET /api/contacts/:id
 */
const getContactById = asyncHandler(async (req, res) => {
  const contact = await contactService.getContactById(req.params.id);
  res.json(formatSuccessResponse(contact, "Contact retrieved"));
});

/**
 * Check if number is registered
 * POST /api/contacts/check
 */
const checkNumber = asyncHandler(async (req, res) => {
  const { phoneNumber, phoneNumbers } = req.body;

  if (phoneNumbers && Array.isArray(phoneNumbers)) {
    const results = await contactService.checkMultipleNumbers(phoneNumbers);
    res.json(formatSuccessResponse(results, "Numbers checked"));
  } else {
    const result = await contactService.checkNumber(phoneNumber);
    res.json(formatSuccessResponse(result, "Number checked"));
  }
});

/**
 * Get profile picture
 * GET /api/contacts/:id/picture
 */
const getProfilePicture = asyncHandler(async (req, res) => {
  const result = await contactService.getProfilePicture(req.params.id);
  res.json(formatSuccessResponse(result, "Profile picture retrieved"));
});

/**
 * Get common groups
 * GET /api/contacts/:id/groups
 */
const getCommonGroups = asyncHandler(async (req, res) => {
  const groups = await contactService.getCommonGroups(req.params.id);
  res.json(
    formatSuccessResponse(groups, `Found ${groups.length} common groups`)
  );
});

/**
 * Block contact
 * POST /api/contacts/:id/block
 */
const blockContact = asyncHandler(async (req, res) => {
  await contactService.blockContact(req.params.id);
  res.json(formatSuccessResponse(null, "Contact blocked"));
});

/**
 * Unblock contact
 * POST /api/contacts/:id/unblock
 */
const unblockContact = asyncHandler(async (req, res) => {
  await contactService.unblockContact(req.params.id);
  res.json(formatSuccessResponse(null, "Contact unblocked"));
});

/**
 * Get blocked contacts
 * GET /api/contacts/blocked
 */
const getBlockedContacts = asyncHandler(async (req, res) => {
  const contacts = await contactService.getBlockedContacts();
  res.json(
    formatSuccessResponse(
      contacts,
      `Retrieved ${contacts.length} blocked contacts`
    )
  );
});

/**
 * Search contacts
 * GET /api/contacts/search
 */
const searchContacts = asyncHandler(async (req, res) => {
  const { query } = req.query;
  const contacts = await contactService.searchContacts(query);
  res.json(
    formatSuccessResponse(contacts, `Found ${contacts.length} contacts`)
  );
});

module.exports = {
  getAllContacts,
  getContactById,
  checkNumber,
  getProfilePicture,
  getCommonGroups,
  blockContact,
  unblockContact,
  getBlockedContacts,
  searchContacts,
};
