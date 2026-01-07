/**
 * Watchlist Service
 * Manages monitored chats for the dashboard
 */

const { getClient, isClientReady } = require("../config/whatsapp");
const { Watchlist, Message } = require("../models");
const { ERROR_MESSAGES, CHAT_TYPES } = require("../config/constants");
const { formatChat, formatMessage } = require("../utils/formatters");
const {
  normalizePhoneNumber,
  normalizeGroupId,
  isGroupId,
} = require("../utils/helpers");
const logger = require("../utils/logger");

class WatchlistService {
  /**
   * Get all active watchlist items
   */
  async getWatchlist() {
    return Watchlist.getActiveWatchlist();
  }

  /**
   * Add a chat to the watchlist
   */
  async addToWatchlist(chatId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    // Get chat info from WhatsApp
    const chat = await client.getChatById(normalizedId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    // Determine chat type
    let chatType = CHAT_TYPES.PRIVATE;
    if (chat.isGroup) chatType = CHAT_TYPES.GROUP;

    // Get profile picture
    let profilePicUrl = null;
    try {
      profilePicUrl = await client.getProfilePicUrl(normalizedId);
    } catch (err) {
      // Profile picture not available
    }

    // Build watchlist entry
    const chatData = {
      chatId: normalizedId,
      chatName: chat.name || chat.pushname || "Unknown",
      chatType,
      profilePicUrl,
      metadata: {
        participantCount: chat.participants?.length || 0,
        description: chat.description || "",
        isReadOnly: chat.isReadOnly || false,
        isMuted: chat.isMuted || false,
      },
    };

    // Add last message if available
    if (chat.lastMessage) {
      chatData.lastMessage = {
        content: chat.lastMessage.body || "",
        timestamp: chat.lastMessage.timestamp
          ? new Date(chat.lastMessage.timestamp * 1000)
          : new Date(),
        from: chat.lastMessage.author || chat.lastMessage.from,
        fromMe: chat.lastMessage.fromMe || false,
        type: chat.lastMessage.type || "chat",
      };
    }

    const watchlistItem = await Watchlist.addToWatchlist(chatData);

    logger.info(`Added chat ${normalizedId} to watchlist`);

    return watchlistItem;
  }

  /**
   * Remove a chat from the watchlist
   */
  async removeFromWatchlist(chatId) {
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    const result = await Watchlist.removeFromWatchlist(normalizedId);

    if (!result) {
      throw new Error(ERROR_MESSAGES.WATCHLIST_NOT_FOUND);
    }

    logger.info(`Removed chat ${normalizedId} from watchlist`);

    return result;
  }

  /**
   * Get a single watchlist item
   */
  async getWatchlistItem(chatId) {
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    const item = await Watchlist.findOne({
      chatId: normalizedId,
      isActive: true,
    });

    if (!item) {
      throw new Error(ERROR_MESSAGES.WATCHLIST_NOT_FOUND);
    }

    return item;
  }

  /**
   * Update watchlist item
   */
  async updateWatchlistItem(chatId, updates) {
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    return Watchlist.updateChatInfo(normalizedId, updates);
  }

  /**
   * Toggle pin status
   */
  async togglePin(chatId) {
    const item = await this.getWatchlistItem(chatId);
    return item.togglePin();
  }

  /**
   * Toggle notifications
   */
  async toggleNotifications(chatId) {
    const item = await this.getWatchlistItem(chatId);
    return item.toggleNotifications();
  }

  /**
   * Mark watchlist chat as read
   */
  async markAsRead(chatId) {
    const item = await this.getWatchlistItem(chatId);

    // Also mark as read in WhatsApp
    if (isClientReady()) {
      const client = getClient();
      try {
        await client.sendSeen(item.chatId);
      } catch (err) {
        logger.warn(`Could not mark ${chatId} as seen in WhatsApp`);
      }
    }

    return item.markAsRead();
  }

  /**
   * Reorder watchlist items
   */
  async reorderWatchlist(orderedIds) {
    return Watchlist.reorder(orderedIds);
  }

  /**
   * Get messages for a watchlist chat
   */
  async getWatchlistMessages(chatId, options = {}) {
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    // Verify chat is in watchlist
    const item = await Watchlist.findOne({
      chatId: normalizedId,
      isActive: true,
    });
    if (!item) {
      throw new Error(ERROR_MESSAGES.WATCHLIST_NOT_FOUND);
    }

    // Always try to fetch from WhatsApp first if ready
    if (isClientReady()) {
      try {
        const client = getClient();
        const chat = await client.getChatById(normalizedId);
        const waMessages = await chat.fetchMessages({
          limit: options.limit || 100,
        });

        // Background sync to DB (optional, but good for history)
        // We don't await this to keep response fast
        Promise.all(waMessages.map((msg) => Message.logMessage(msg))).catch(
          (err) => logger.warn(`Failed to sync messages to DB: ${err.message}`)
        );

        return waMessages.map(formatMessage);
      } catch (err) {
        logger.warn(
          `Failed to fetch from WhatsApp, falling back to DB: ${err.message}`
        );
      }
    }

    // Fallback to DB
    return await Message.getChatMessages(normalizedId, options);
  }

  /**
   * Handle new message for watchlist
   */
  async handleNewMessage(message) {
    const chatId = message.from.includes("@g.us")
      ? message.from
      : message.fromMe
      ? message.to
      : message.from;

    // Check if chat is in watchlist
    const item = await Watchlist.findOne({ chatId, isActive: true });

    if (item) {
      // Update last message
      await item.updateLastMessage(message);

      // Log message
      await Message.logMessage(message);

      return { inWatchlist: true, item };
    }

    return { inWatchlist: false };
  }

  /**
   * Refresh watchlist chat info
   */
  async refreshChatInfo(chatId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    const item = await Watchlist.findOne({
      chatId: normalizedId,
      isActive: true,
    });
    if (!item) {
      throw new Error(ERROR_MESSAGES.WATCHLIST_NOT_FOUND);
    }

    const chat = await client.getChatById(normalizedId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    // Get updated profile picture
    let profilePicUrl = null;
    try {
      profilePicUrl = await client.getProfilePicUrl(normalizedId);
    } catch (err) {
      // Profile picture not available
    }

    // Update watchlist item
    const updates = {
      chatName: chat.name || chat.pushname || item.chatName,
      profilePicUrl,
      metadata: {
        participantCount: chat.participants?.length || 0,
        description: chat.description || "",
        isReadOnly: chat.isReadOnly || false,
        isMuted: chat.isMuted || false,
      },
    };

    return Watchlist.updateChatInfo(normalizedId, updates);
  }

  /**
   * Get all available chats for adding to watchlist
   */
  async getAvailableChats() {
    this.ensureReady();
    const client = getClient();

    const chats = await client.getChats();
    const watchlistItems = await Watchlist.find({ isActive: true })
      .select("chatId")
      .lean();
    const watchlistIds = new Set(watchlistItems.map((item) => item.chatId));

    return chats.map((chat) => ({
      ...formatChat(chat),
      isInWatchlist: watchlistIds.has(chat.id._serialized),
    }));
  }

  /**
   * Add notes to a watchlist item
   */
  async addNotes(chatId, notes) {
    return this.updateWatchlistItem(chatId, { notes });
  }

  /**
   * Add tags to a watchlist item
   */
  async addTags(chatId, tags) {
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    return Watchlist.findOneAndUpdate(
      { chatId: normalizedId, isActive: true },
      { $addToSet: { tags: { $each: tags } } },
      { new: true }
    );
  }

  /**
   * Remove tag from a watchlist item
   */
  async removeTag(chatId, tag) {
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    return Watchlist.findOneAndUpdate(
      { chatId: normalizedId, isActive: true },
      { $pull: { tags: tag } },
      { new: true }
    );
  }

  ensureReady() {
    if (!isClientReady()) {
      throw new Error(ERROR_MESSAGES.CLIENT_NOT_READY);
    }
  }
}

module.exports = new WatchlistService();
