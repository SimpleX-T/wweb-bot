/**
 * Watchlist Controller
 * Handles watchlist management endpoints
 */

const { watchlistService } = require("../services");
const { formatSuccessResponse } = require("../utils/formatters");
const { asyncHandler } = require("../middlewares");

/**
 * Get watchlist
 * GET /api/watchlist
 */
const getWatchlist = asyncHandler(async (req, res) => {
  const watchlist = await watchlistService.getWatchlist();
  res.json(
    formatSuccessResponse(watchlist, `Retrieved ${watchlist.length} items`)
  );
});

/**
 * Add to watchlist
 * POST /api/watchlist
 */
const addToWatchlist = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const item = await watchlistService.addToWatchlist(chatId);
  res.json(formatSuccessResponse(item, "Added to watchlist"));
});

/**
 * Remove from watchlist
 * DELETE /api/watchlist/:chatId
 */
const removeFromWatchlist = asyncHandler(async (req, res) => {
  await watchlistService.removeFromWatchlist(req.params.chatId);
  res.json(formatSuccessResponse(null, "Removed from watchlist"));
});

/**
 * Get watchlist item
 * GET /api/watchlist/:chatId
 */
const getWatchlistItem = asyncHandler(async (req, res) => {
  const item = await watchlistService.getWatchlistItem(req.params.chatId);
  res.json(formatSuccessResponse(item, "Item retrieved"));
});

/**
 * Update watchlist item
 * PUT /api/watchlist/:chatId
 */
const updateWatchlistItem = asyncHandler(async (req, res) => {
  const item = await watchlistService.updateWatchlistItem(
    req.params.chatId,
    req.body
  );
  res.json(formatSuccessResponse(item, "Item updated"));
});

/**
 * Toggle pin
 * POST /api/watchlist/:chatId/pin
 */
const togglePin = asyncHandler(async (req, res) => {
  const item = await watchlistService.togglePin(req.params.chatId);
  res.json(formatSuccessResponse(item, "Pin toggled"));
});

/**
 * Toggle notifications
 * POST /api/watchlist/:chatId/notifications
 */
const toggleNotifications = asyncHandler(async (req, res) => {
  const item = await watchlistService.toggleNotifications(req.params.chatId);
  res.json(formatSuccessResponse(item, "Notifications toggled"));
});

/**
 * Mark as read
 * POST /api/watchlist/:chatId/read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const item = await watchlistService.markAsRead(req.params.chatId);
  res.json(formatSuccessResponse(item, "Marked as read"));
});

/**
 * Reorder watchlist
 * PUT /api/watchlist/reorder
 */
const reorderWatchlist = asyncHandler(async (req, res) => {
  const { orderedIds } = req.body;
  await watchlistService.reorderWatchlist(orderedIds);
  res.json(formatSuccessResponse(null, "Watchlist reordered"));
});

/**
 * Get watchlist messages
 * GET /api/watchlist/:chatId/messages
 */
const getMessages = asyncHandler(async (req, res) => {
  const { limit, before, after } = req.query;
  const messages = await watchlistService.getWatchlistMessages(
    req.params.chatId,
    {
      limit: parseInt(limit) || 50,
      before,
      after,
    }
  );
  res.json(
    formatSuccessResponse(messages, `Retrieved ${messages.length} messages`)
  );
});

/**
 * Get available chats for watchlist
 * GET /api/watchlist/available
 */
const getAvailableChats = asyncHandler(async (req, res) => {
  const chats = await watchlistService.getAvailableChats();
  res.json(formatSuccessResponse(chats, `Retrieved ${chats.length} chats`));
});

/**
 * Refresh chat info
 * POST /api/watchlist/:chatId/refresh
 */
const refreshChatInfo = asyncHandler(async (req, res) => {
  const item = await watchlistService.refreshChatInfo(req.params.chatId);
  res.json(formatSuccessResponse(item, "Chat info refreshed"));
});

/**
 * Add notes
 * PUT /api/watchlist/:chatId/notes
 */
const addNotes = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const item = await watchlistService.addNotes(req.params.chatId, notes);
  res.json(formatSuccessResponse(item, "Notes updated"));
});

/**
 * Add tags
 * POST /api/watchlist/:chatId/tags
 */
const addTags = asyncHandler(async (req, res) => {
  const { tags } = req.body;
  const item = await watchlistService.addTags(req.params.chatId, tags);
  res.json(formatSuccessResponse(item, "Tags added"));
});

/**
 * Remove tag
 * DELETE /api/watchlist/:chatId/tags/:tag
 */
const removeTag = asyncHandler(async (req, res) => {
  const item = await watchlistService.removeTag(
    req.params.chatId,
    req.params.tag
  );
  res.json(formatSuccessResponse(item, "Tag removed"));
});

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getWatchlistItem,
  updateWatchlistItem,
  togglePin,
  toggleNotifications,
  markAsRead,
  reorderWatchlist,
  getMessages,
  getAvailableChats,
  refreshChatInfo,
  addNotes,
  addTags,
  removeTag,
};
