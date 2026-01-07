/**
 * Message Controller
 * Handles individual message operations
 */

const { messageService } = require("../services");
const { formatSuccessResponse } = require("../utils/formatters");
const { asyncHandler } = require("../middlewares");

/**
 * Send message
 * POST /api/messages/send
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content, mentions, quotedMessageId } = req.body;
  const message = await messageService.sendMessage(chatId, content, {
    mentions,
    quotedMessageId,
  });
  res.json(formatSuccessResponse(message, "Message sent"));
});

/**
 * Send media
 * POST /api/messages/media
 */
const sendMedia = asyncHandler(async (req, res) => {
  const {
    chatId,
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
    chatId,
    { url, path, base64, mimetype, filename },
    { caption, sendAsSticker, viewOnce }
  );
  res.json(formatSuccessResponse(message, "Media sent"));
});

/**
 * Reply to message
 * POST /api/messages/:id/reply
 */
const replyToMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  const message = await messageService.replyToMessage(req.params.id, content, {
    chatId,
  });
  res.json(formatSuccessResponse(message, "Reply sent"));
});

/**
 * Forward message
 * POST /api/messages/:id/forward
 */
const forwardMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const message = await messageService.forwardMessage(req.params.id, chatId);
  res.json(formatSuccessResponse(message, "Message forwarded"));
});

/**
 * React to message
 * POST /api/messages/:id/react
 */
const reactToMessage = asyncHandler(async (req, res) => {
  const { emoji } = req.body;
  await messageService.reactToMessage(req.params.id, emoji);
  res.json(formatSuccessResponse(null, "Reaction added"));
});

/**
 * Edit message
 * PUT /api/messages/:id
 */
const editMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const message = await messageService.editMessage(req.params.id, content);
  res.json(formatSuccessResponse(message, "Message edited"));
});

/**
 * Delete message
 * DELETE /api/messages/:id
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const { everyone } = req.query;
  await messageService.deleteMessage(req.params.id, everyone === "true");
  res.json(formatSuccessResponse(null, "Message deleted"));
});

/**
 * Star message
 * POST /api/messages/:id/star
 */
const starMessage = asyncHandler(async (req, res) => {
  await messageService.starMessage(req.params.id);
  res.json(formatSuccessResponse(null, "Message starred"));
});

/**
 * Unstar message
 * DELETE /api/messages/:id/star
 */
const unstarMessage = asyncHandler(async (req, res) => {
  await messageService.unstarMessage(req.params.id);
  res.json(formatSuccessResponse(null, "Message unstarred"));
});

/**
 * Get message by ID
 * GET /api/messages/:id
 */
const getMessageById = asyncHandler(async (req, res) => {
  const message = await messageService.getMessageById(req.params.id);
  res.json(formatSuccessResponse(message, "Message retrieved"));
});

/**
 * Download media from message
 * GET /api/messages/:id/media
 */
const downloadMedia = asyncHandler(async (req, res) => {
  const media = await messageService.downloadMedia(req.params.id);

  // Convert base64 to buffer
  const buffer = Buffer.from(media.data, "base64");

  // Set appropriate headers
  res.set({
    "Content-Type": media.mimetype,
    "Content-Length": buffer.length,
    "Content-Disposition": `inline; filename="${media.filename || "media"}"`,
  });

  res.send(buffer);
});

module.exports = {
  sendMessage,
  sendMedia,
  replyToMessage,
  forwardMessage,
  reactToMessage,
  editMessage,
  deleteMessage,
  starMessage,
  unstarMessage,
  getMessageById,
  downloadMedia,
};
