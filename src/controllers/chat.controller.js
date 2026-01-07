/**
 * Chat Controller
 * Handles chat and message endpoints
 */

const {
  whatsappService,
  messageService,
  contactService,
} = require("../services");
const { formatSuccessResponse } = require("../utils/formatters");
const { asyncHandler } = require("../middlewares");

/**
 * Get all chats
 * GET /api/chats
 */
const getAllChats = asyncHandler(async (req, res) => {
  const chats = await whatsappService.getChats();
  res.json(formatSuccessResponse(chats, `Retrieved ${chats.length} chats`));
});

/**
 * Get chat by ID
 * GET /api/chats/:id
 */
const getChatById = asyncHandler(async (req, res) => {
  const chat = await whatsappService.getChatById(req.params.id);
  res.json(formatSuccessResponse(chat, "Chat retrieved"));
});

/**
 * Get chat messages
 * GET /api/chats/:id/messages
 */
const getMessages = asyncHandler(async (req, res) => {
  const { limit } = req.query;
  const messages = await messageService.getChatMessages(req.params.id, {
    limit: parseInt(limit) || 100,
  });
  res.json(
    formatSuccessResponse(messages, `Retrieved ${messages.length} messages`)
  );
});

/**
 * Send message to chat
 * POST /api/chats/:id/messages
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { content, mentions, quotedMessageId } = req.body;
  const message = await messageService.sendMessage(req.params.id, content, {
    mentions,
    quotedMessageId,
  });
  res.json(formatSuccessResponse(message, "Message sent"));
});

/**
 * Send media to chat
 * POST /api/chats/:id/media
 */
const sendMedia = asyncHandler(async (req, res) => {
  const {
    url,
    path,
    base64,
    mimetype,
    filename,
    caption,
    sendAsSticker,
    viewOnce,
  } = req.body;
  const message = await messageService.sendMedia(
    req.params.id,
    { url, path, base64, mimetype, filename },
    { caption, sendAsSticker, viewOnce }
  );
  res.json(formatSuccessResponse(message, "Media sent"));
});

/**
 * Send location to chat
 * POST /api/chats/:id/location
 */
const sendLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, name, address } = req.body;
  const message = await messageService.sendLocation(
    req.params.id,
    latitude,
    longitude,
    {
      name,
      address,
    }
  );
  res.json(formatSuccessResponse(message, "Location sent"));
});

/**
 * Send contact to chat
 * POST /api/chats/:id/contact
 */
const sendContact = asyncHandler(async (req, res) => {
  const { contactIds } = req.body;
  const message = await messageService.sendContact(req.params.id, contactIds);
  res.json(formatSuccessResponse(message, "Contact sent"));
});

/**
 * Send poll to chat
 * POST /api/chats/:id/poll
 */
const sendPoll = asyncHandler(async (req, res) => {
  const { question, options, allowMultipleAnswers } = req.body;
  const message = await messageService.sendPoll(
    req.params.id,
    question,
    options,
    {
      allowMultipleAnswers,
    }
  );
  res.json(formatSuccessResponse(message, "Poll sent"));
});

/**
 * Archive chat
 * POST /api/chats/:id/archive
 */
const archiveChat = asyncHandler(async (req, res) => {
  await whatsappService.archiveChat(req.params.id);
  res.json(formatSuccessResponse(null, "Chat archived"));
});

/**
 * Unarchive chat
 * POST /api/chats/:id/unarchive
 */
const unarchiveChat = asyncHandler(async (req, res) => {
  await whatsappService.unarchiveChat(req.params.id);
  res.json(formatSuccessResponse(null, "Chat unarchived"));
});

/**
 * Mute chat
 * POST /api/chats/:id/mute
 */
const muteChat = asyncHandler(async (req, res) => {
  const { duration } = req.body; // Duration in seconds
  const unmuteDate = duration ? new Date(Date.now() + duration * 1000) : null;
  await whatsappService.muteChat(req.params.id, unmuteDate);
  res.json(formatSuccessResponse(null, "Chat muted"));
});

/**
 * Unmute chat
 * POST /api/chats/:id/unmute
 */
const unmuteChat = asyncHandler(async (req, res) => {
  await whatsappService.unmuteChat(req.params.id);
  res.json(formatSuccessResponse(null, "Chat unmuted"));
});

/**
 * Pin chat
 * POST /api/chats/:id/pin
 */
const pinChat = asyncHandler(async (req, res) => {
  await whatsappService.pinChat(req.params.id);
  res.json(formatSuccessResponse(null, "Chat pinned"));
});

/**
 * Unpin chat
 * POST /api/chats/:id/unpin
 */
const unpinChat = asyncHandler(async (req, res) => {
  await whatsappService.unpinChat(req.params.id);
  res.json(formatSuccessResponse(null, "Chat unpinned"));
});

/**
 * Mark chat as read
 * POST /api/chats/:id/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  await whatsappService.markChatAsRead(req.params.id);
  res.json(formatSuccessResponse(null, "Chat marked as read"));
});

/**
 * Mark chat as unread
 * POST /api/chats/:id/unread
 */
const markAsUnread = asyncHandler(async (req, res) => {
  await whatsappService.markChatAsUnread(req.params.id);
  res.json(formatSuccessResponse(null, "Chat marked as unread"));
});

/**
 * Clear chat messages
 * DELETE /api/chats/:id/messages
 */
const clearChat = asyncHandler(async (req, res) => {
  await whatsappService.clearChat(req.params.id);
  res.json(formatSuccessResponse(null, "Chat cleared"));
});

/**
 * Delete chat
 * DELETE /api/chats/:id
 */
const deleteChat = asyncHandler(async (req, res) => {
  await whatsappService.deleteChat(req.params.id);
  res.json(formatSuccessResponse(null, "Chat deleted"));
});

/**
 * Send typing indicator
 * POST /api/chats/:id/typing
 */
const sendTyping = asyncHandler(async (req, res) => {
  await whatsappService.sendTyping(req.params.id);
  res.json(formatSuccessResponse(null, "Typing indicator sent"));
});

/**
 * Send recording indicator
 * POST /api/chats/:id/recording
 */
const sendRecording = asyncHandler(async (req, res) => {
  await whatsappService.sendRecording(req.params.id);
  res.json(formatSuccessResponse(null, "Recording indicator sent"));
});

/**
 * Clear typing/recording state
 * POST /api/chats/:id/clear-state
 */
const clearState = asyncHandler(async (req, res) => {
  await whatsappService.clearState(req.params.id);
  res.json(formatSuccessResponse(null, "State cleared"));
});

/**
 * Search messages
 * GET /api/chats/search
 */
const searchMessages = asyncHandler(async (req, res) => {
  const { query, chatId, limit } = req.query;
  const messages = await whatsappService.searchMessages(query, {
    chatId,
    limit: parseInt(limit) || 50,
  });
  res.json(
    formatSuccessResponse(messages, `Found ${messages.length} messages`)
  );
});

module.exports = {
  getAllChats,
  getChatById,
  getMessages,
  sendMessage,
  sendMedia,
  sendLocation,
  sendContact,
  sendPoll,
  archiveChat,
  unarchiveChat,
  muteChat,
  unmuteChat,
  pinChat,
  unpinChat,
  markAsRead,
  markAsUnread,
  clearChat,
  deleteChat,
  sendTyping,
  sendRecording,
  clearState,
  searchMessages,
};
