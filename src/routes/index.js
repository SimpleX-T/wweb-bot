/**
 * API Routes
 * Defines all API endpoints
 */

const express = require("express");
const {
  authController,
  groupController,
  chatController,
  watchlistController,
  messageController,
  contactController,
} = require("../controllers");
const {
  validateBody,
  validateChatId,
  validateParticipants,
  validateAutoMessage,
  validateMedia,
  validatePoll,
  sanitizeInput,
} = require("../middlewares");

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// ==================== AUTH ROUTES ====================
router.post("/auth/initialize", authController.initialize);
router.get("/auth/qr", authController.getQR);
router.get("/auth/status", authController.getStatus);
router.get("/auth/info", authController.getInfo);
router.post("/auth/logout", authController.logout);
router.post("/auth/clear-session", authController.clearSession);

// ==================== GROUP ROUTES ====================
router.get("/groups", groupController.getAllGroups);
router.get("/groups/:id", groupController.getGroupById);
router.get("/groups/:id/participants", groupController.getParticipants);
router.post("/groups/:id/tag-all", groupController.tagAll);
router.post(
  "/groups/:id/members/add",
  validateParticipants,
  groupController.addParticipants
);
router.delete(
  "/groups/:id/members",
  validateParticipants,
  groupController.removeParticipants
);
router.put(
  "/groups/:id/admins/promote",
  validateParticipants,
  groupController.promoteAdmins
);
router.put(
  "/groups/:id/admins/demote",
  validateParticipants,
  groupController.demoteAdmins
);
router.put(
  "/groups/:id/subject",
  validateBody(["subject"]),
  groupController.updateSubject
);
router.put("/groups/:id/description", groupController.updateDescription);
router.put("/groups/:id/settings", groupController.updateSettings);
router.get("/groups/:id/invite", groupController.getInviteLink);
router.post("/groups/:id/invite/revoke", groupController.revokeInviteLink);
router.post("/groups/:id/leave", groupController.leaveGroup);
router.get("/groups/:id/requests", groupController.getMembershipRequests);
router.post("/groups/:id/requests/approve", groupController.approveRequests);
router.post("/groups/:id/requests/reject", groupController.rejectRequests);
router.get("/groups/:id/auto-message", groupController.getGroupSettings);
router.put(
  "/groups/:id/auto-message",
  validateAutoMessage,
  groupController.updateAutoMessage
);
router.post(
  "/groups/:id/auto-message/:type/toggle",
  groupController.toggleAutoMessage
);
router.put(
  "/groups/:id/rules",
  validateBody(["rules"]),
  groupController.setGroupRules
);
router.get("/groups/:id/messages", groupController.getMessages);
router.post(
  "/groups/:id/messages",
  validateBody(["content"]),
  groupController.sendMessage
);

// ==================== CHAT ROUTES ====================
router.get("/chats", chatController.getAllChats);
router.get("/chats/search", chatController.searchMessages);
router.get("/chats/:id", chatController.getChatById);
router.get("/chats/:id/messages", chatController.getMessages);
router.post(
  "/chats/:id/messages",
  validateBody(["content"]),
  chatController.sendMessage
);
router.post("/chats/:id/media", validateMedia, chatController.sendMedia);
router.post(
  "/chats/:id/location",
  validateBody(["latitude", "longitude"]),
  chatController.sendLocation
);
router.post(
  "/chats/:id/contact",
  validateBody(["contactIds"]),
  chatController.sendContact
);
router.post("/chats/:id/poll", validatePoll, chatController.sendPoll);
router.post("/chats/:id/archive", chatController.archiveChat);
router.post("/chats/:id/unarchive", chatController.unarchiveChat);
router.post("/chats/:id/mute", chatController.muteChat);
router.post("/chats/:id/unmute", chatController.unmuteChat);
router.post("/chats/:id/pin", chatController.pinChat);
router.post("/chats/:id/unpin", chatController.unpinChat);
router.post("/chats/:id/read", chatController.markAsRead);
router.post("/chats/:id/unread", chatController.markAsUnread);
router.delete("/chats/:id/messages", chatController.clearChat);
router.delete("/chats/:id", chatController.deleteChat);
router.post("/chats/:id/typing", chatController.sendTyping);
router.post("/chats/:id/recording", chatController.sendRecording);
router.post("/chats/:id/clear-state", chatController.clearState);

// ==================== WATCHLIST ROUTES ====================
router.get("/watchlist", watchlistController.getWatchlist);
router.get("/watchlist/available", watchlistController.getAvailableChats);
router.put(
  "/watchlist/reorder",
  validateBody(["orderedIds"]),
  watchlistController.reorderWatchlist
);
router.post(
  "/watchlist",
  validateBody(["chatId"]),
  watchlistController.addToWatchlist
);
router.get("/watchlist/:chatId", watchlistController.getWatchlistItem);
router.put("/watchlist/:chatId", watchlistController.updateWatchlistItem);
router.delete("/watchlist/:chatId", watchlistController.removeFromWatchlist);
router.post("/watchlist/:chatId/pin", watchlistController.togglePin);
router.post(
  "/watchlist/:chatId/notifications",
  watchlistController.toggleNotifications
);
router.post("/watchlist/:chatId/read", watchlistController.markAsRead);
router.post("/watchlist/:chatId/refresh", watchlistController.refreshChatInfo);
router.get("/watchlist/:chatId/messages", watchlistController.getMessages);
router.put("/watchlist/:chatId/notes", watchlistController.addNotes);
router.post(
  "/watchlist/:chatId/tags",
  validateBody(["tags"]),
  watchlistController.addTags
);
router.delete("/watchlist/:chatId/tags/:tag", watchlistController.removeTag);

// ==================== MESSAGE ROUTES ====================
router.post(
  "/messages/send",
  validateBody(["chatId", "content"]),
  messageController.sendMessage
);
router.post(
  "/messages/media",
  validateBody(["chatId"]),
  validateMedia,
  messageController.sendMedia
);
router.get("/messages/:id", messageController.getMessageById);
router.put(
  "/messages/:id",
  validateBody(["content"]),
  messageController.editMessage
);
router.delete("/messages/:id", messageController.deleteMessage);
router.post(
  "/messages/:id/reply",
  validateBody(["content"]),
  messageController.replyToMessage
);
router.post(
  "/messages/:id/forward",
  validateBody(["chatId"]),
  messageController.forwardMessage
);
router.post(
  "/messages/:id/react",
  validateBody(["emoji"]),
  messageController.reactToMessage
);
router.post("/messages/:id/star", messageController.starMessage);
router.delete("/messages/:id/star", messageController.unstarMessage);
router.get("/messages/:id/media", messageController.downloadMedia);

// ==================== CONTACT ROUTES ====================
router.get("/contacts", contactController.getAllContacts);
router.get("/contacts/blocked", contactController.getBlockedContacts);
router.get("/contacts/search", contactController.searchContacts);
router.post("/contacts/check", contactController.checkNumber);
router.get("/contacts/:id", contactController.getContactById);
router.get("/contacts/:id/picture", contactController.getProfilePicture);
router.get("/contacts/:id/groups", contactController.getCommonGroups);
router.post("/contacts/:id/block", contactController.blockContact);
router.post("/contacts/:id/unblock", contactController.unblockContact);

module.exports = router;
