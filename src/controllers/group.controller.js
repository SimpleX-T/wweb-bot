/**
 * Group Controller
 * Handles group management endpoints
 */

const { groupService, messageService } = require("../services");
const { formatSuccessResponse } = require("../utils/formatters");
const { asyncHandler } = require("../middlewares");

/**
 * Get all groups
 * GET /api/groups
 */
const getAllGroups = asyncHandler(async (req, res) => {
  const groups = await groupService.getAllGroups();
  res.json(formatSuccessResponse(groups, `Retrieved ${groups.length} groups`));
});

/**
 * Get group by ID
 * GET /api/groups/:id
 */
const getGroupById = asyncHandler(async (req, res) => {
  const group = await groupService.getGroupById(req.params.id);
  res.json(formatSuccessResponse(group, "Group retrieved"));
});

/**
 * Get group participants
 * GET /api/groups/:id/participants
 */
const getParticipants = asyncHandler(async (req, res) => {
  const participants = await groupService.getParticipants(req.params.id);
  res.json(
    formatSuccessResponse(
      participants,
      `Retrieved ${participants.length} participants`
    )
  );
});

/**
 * Tag all members (@everyone)
 * POST /api/groups/:id/tag-all
 */
const tagAll = asyncHandler(async (req, res) => {
  const { message, hideMentions } = req.body;
  const result = await groupService.tagAllMembers(req.params.id, message, {
    hideMentions,
  });
  res.json(formatSuccessResponse(result, "Tagged all members"));
});

/**
 * Add participants to group
 * POST /api/groups/:id/members/add
 */
const addParticipants = asyncHandler(async (req, res) => {
  const { participants } = req.body;
  const result = await groupService.addParticipants(
    req.params.id,
    participants
  );
  res.json(formatSuccessResponse(result, "Participants added"));
});

/**
 * Remove participants from group
 * DELETE /api/groups/:id/members
 */
const removeParticipants = asyncHandler(async (req, res) => {
  const { participants } = req.body;
  const result = await groupService.removeParticipants(
    req.params.id,
    participants
  );
  res.json(formatSuccessResponse(result, "Participants removed"));
});

/**
 * Promote participants to admin
 * PUT /api/groups/:id/admins/promote
 */
const promoteAdmins = asyncHandler(async (req, res) => {
  const { participants } = req.body;
  await groupService.promoteParticipants(req.params.id, participants);
  res.json(formatSuccessResponse(null, "Participants promoted to admin"));
});

/**
 * Demote admins
 * PUT /api/groups/:id/admins/demote
 */
const demoteAdmins = asyncHandler(async (req, res) => {
  const { participants } = req.body;
  await groupService.demoteParticipants(req.params.id, participants);
  res.json(formatSuccessResponse(null, "Admins demoted"));
});

/**
 * Update group subject (name)
 * PUT /api/groups/:id/subject
 */
const updateSubject = asyncHandler(async (req, res) => {
  const { subject } = req.body;
  await groupService.setSubject(req.params.id, subject);
  res.json(formatSuccessResponse(null, "Group subject updated"));
});

/**
 * Update group description
 * PUT /api/groups/:id/description
 */
const updateDescription = asyncHandler(async (req, res) => {
  const { description } = req.body;
  await groupService.setDescription(req.params.id, description);
  res.json(formatSuccessResponse(null, "Group description updated"));
});

/**
 * Update group settings
 * PUT /api/groups/:id/settings
 */
const updateSettings = asyncHandler(async (req, res) => {
  const { messagesAdminsOnly, infoAdminsOnly, addMembersAdminsOnly } = req.body;
  const groupId = req.params.id;

  if (messagesAdminsOnly !== undefined) {
    await groupService.setMessagesAdminsOnly(groupId, messagesAdminsOnly);
  }
  if (infoAdminsOnly !== undefined) {
    await groupService.setInfoAdminsOnly(groupId, infoAdminsOnly);
  }
  if (addMembersAdminsOnly !== undefined) {
    await groupService.setAddMembersAdminsOnly(groupId, addMembersAdminsOnly);
  }

  res.json(formatSuccessResponse(null, "Group settings updated"));
});

/**
 * Get group invite link
 * GET /api/groups/:id/invite
 */
const getInviteLink = asyncHandler(async (req, res) => {
  const link = await groupService.getInviteCode(req.params.id);
  res.json(formatSuccessResponse({ link }, "Invite link retrieved"));
});

/**
 * Revoke group invite link
 * POST /api/groups/:id/invite/revoke
 */
const revokeInviteLink = asyncHandler(async (req, res) => {
  const link = await groupService.revokeInvite(req.params.id);
  res.json(
    formatSuccessResponse({ link }, "Invite link revoked, new link generated")
  );
});

/**
 * Leave group
 * POST /api/groups/:id/leave
 */
const leaveGroup = asyncHandler(async (req, res) => {
  await groupService.leaveGroup(req.params.id);
  res.json(formatSuccessResponse(null, "Left group successfully"));
});

/**
 * Get membership requests
 * GET /api/groups/:id/requests
 */
const getMembershipRequests = asyncHandler(async (req, res) => {
  const requests = await groupService.getMembershipRequests(req.params.id);
  res.json(formatSuccessResponse(requests, "Membership requests retrieved"));
});

/**
 * Approve membership requests
 * POST /api/groups/:id/requests/approve
 */
const approveRequests = asyncHandler(async (req, res) => {
  const { requestIds } = req.body;
  const result = await groupService.approveMembershipRequests(
    req.params.id,
    requestIds
  );
  res.json(formatSuccessResponse(result, "Requests approved"));
});

/**
 * Reject membership requests
 * POST /api/groups/:id/requests/reject
 */
const rejectRequests = asyncHandler(async (req, res) => {
  const { requestIds } = req.body;
  const result = await groupService.rejectMembershipRequests(
    req.params.id,
    requestIds
  );
  res.json(formatSuccessResponse(result, "Requests rejected"));
});

/**
 * Get group settings
 * GET /api/groups/:id/auto-message
 */
const getGroupSettings = asyncHandler(async (req, res) => {
  const settings = await groupService.getGroupSettings(req.params.id);
  res.json(formatSuccessResponse(settings, "Group settings retrieved"));
});

/**
 * Update auto-message settings
 * PUT /api/groups/:id/auto-message
 */
const updateAutoMessage = asyncHandler(async (req, res) => {
  const { type, ...config } = req.body;
  const settings = await groupService.updateAutoMessage(
    req.params.id,
    type,
    config
  );
  res.json(formatSuccessResponse(settings, "Auto-message settings updated"));
});

/**
 * Toggle auto-message
 * POST /api/groups/:id/auto-message/:type/toggle
 */
const toggleAutoMessage = asyncHandler(async (req, res) => {
  const settings = await groupService.toggleAutoMessage(
    req.params.id,
    req.params.type
  );
  res.json(formatSuccessResponse(settings, "Auto-message toggled"));
});

/**
 * Set group rules
 * PUT /api/groups/:id/rules
 */
const setGroupRules = asyncHandler(async (req, res) => {
  const { rules } = req.body;
  const settings = await groupService.setGroupRules(req.params.id, rules);
  res.json(formatSuccessResponse(settings, "Group rules updated"));
});

/**
 * Get group messages
 * GET /api/groups/:id/messages
 */
const getMessages = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const messages = await messageService.getChatMessages(req.params.id, {
    limit: parseInt(limit) || 50,
  });
  res.json(
    formatSuccessResponse(messages, `Retrieved ${messages.length} messages`)
  );
});

/**
 * Send message to group
 * POST /api/groups/:id/messages
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { content, mentions } = req.body;
  const message = await messageService.sendMessage(req.params.id, content, {
    mentions,
  });
  res.json(formatSuccessResponse(message, "Message sent"));
});

module.exports = {
  getAllGroups,
  getGroupById,
  getParticipants,
  tagAll,
  addParticipants,
  removeParticipants,
  promoteAdmins,
  demoteAdmins,
  updateSubject,
  updateDescription,
  updateSettings,
  getInviteLink,
  revokeInviteLink,
  leaveGroup,
  getMembershipRequests,
  approveRequests,
  rejectRequests,
  getGroupSettings,
  updateAutoMessage,
  toggleAutoMessage,
  setGroupRules,
  getMessages,
  sendMessage,
};
