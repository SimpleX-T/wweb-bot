/**
 * WhatsApp Service
 * Core WhatsApp operations and client management
 */

const {
  getClient,
  isClientReady,
  clientEvents,
  initializeClient,
  logoutClient,
} = require("../config/whatsapp");
const { Session } = require("../models");
const { ERROR_MESSAGES, CLIENT_STATUS } = require("../config/constants");
const { formatContact, formatChat } = require("../utils/formatters");
const logger = require("../utils/logger");

class WhatsAppService {
  /**
   * Initialize the WhatsApp client
   * @returns {Promise<Object>}
   */
  async initialize() {
    try {
      await initializeClient();
      return { success: true, message: "Client initialization started" };
    } catch (error) {
      logger.error("Failed to initialize WhatsApp client", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get current client status
   * @returns {Object}
   */
  getStatus() {
    const { getClientStatus, getCurrentQR } = require("../config/whatsapp");
    const status = getClientStatus();
    const qr = getCurrentQR();

    return {
      status,
      isReady: status === CLIENT_STATUS.READY,
      hasQR: !!qr,
      qr: qr,
    };
  }

  /**
   * Get client info
   * @returns {Promise<Object>}
   */
  async getClientInfo() {
    this.ensureReady();
    const client = getClient();

    const info = client.info;
    return {
      phoneNumber: info.wid?.user || info.wid?._serialized,
      pushname: info.pushname,
      platform: info.platform,
      wid: info.wid?._serialized,
    };
  }

  /**
   * Logout from WhatsApp
   * @returns {Promise<Object>}
   */
  async logout() {
    try {
      await logoutClient();
      return { success: true, message: "Logged out successfully" };
    } catch (error) {
      logger.error("Failed to logout", { error: error.message });
      throw error;
    }
  }

  /**
   * Get all chats
   * @returns {Promise<Array>}
   */
  async getChats() {
    this.ensureReady();
    const client = getClient();

    const chats = await client.getChats();
    return chats.map(formatChat);
  }

  /**
   * Get chat by ID
   * @param {string} chatId
   * @returns {Promise<Object>}
   */
  async getChatById(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return formatChat(chat);
  }

  /**
   * Get all contacts
   * @returns {Promise<Array>}
   */
  async getContacts() {
    this.ensureReady();
    const client = getClient();

    const contacts = await client.getContacts();
    return contacts.map(formatContact);
  }

  /**
   * Get contact by ID
   * @param {string} contactId
   * @returns {Promise<Object>}
   */
  async getContactById(contactId) {
    this.ensureReady();
    const client = getClient();

    const contact = await client.getContactById(contactId);
    if (!contact) {
      throw new Error(ERROR_MESSAGES.CONTACT_NOT_FOUND);
    }

    return formatContact(contact);
  }

  /**
   * Get profile picture URL
   * @param {string} contactId
   * @returns {Promise<string|null>}
   */
  async getProfilePicUrl(contactId) {
    this.ensureReady();
    const client = getClient();

    try {
      return await client.getProfilePicUrl(contactId);
    } catch {
      return null;
    }
  }

  /**
   * Check if number is registered on WhatsApp
   * @param {string} phoneNumber
   * @returns {Promise<Object>}
   */
  async checkNumberRegistered(phoneNumber) {
    this.ensureReady();
    const client = getClient();

    // Clean up phone number
    const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
    const numberId = await client.getNumberId(cleanNumber);

    return {
      registered: numberId !== null,
      numberId: numberId?._serialized || null,
    };
  }

  /**
   * Get common groups with a contact
   * @param {string} contactId
   * @returns {Promise<Array>}
   */
  async getCommonGroups(contactId) {
    this.ensureReady();
    const client = getClient();

    const groups = await client.getCommonGroups(contactId);
    return groups.map(formatChat);
  }

  /**
   * Block a contact
   * @param {string} contactId
   * @returns {Promise<boolean>}
   */
  async blockContact(contactId) {
    this.ensureReady();
    const client = getClient();

    const contact = await client.getContactById(contactId);
    if (!contact) {
      throw new Error(ERROR_MESSAGES.CONTACT_NOT_FOUND);
    }

    return contact.block();
  }

  /**
   * Unblock a contact
   * @param {string} contactId
   * @returns {Promise<boolean>}
   */
  async unblockContact(contactId) {
    this.ensureReady();
    const client = getClient();

    const contact = await client.getContactById(contactId);
    if (!contact) {
      throw new Error(ERROR_MESSAGES.CONTACT_NOT_FOUND);
    }

    return contact.unblock();
  }

  /**
   * Get blocked contacts
   * @returns {Promise<Array>}
   */
  async getBlockedContacts() {
    this.ensureReady();
    const client = getClient();

    const contacts = await client.getBlockedContacts();
    return contacts.map(formatContact);
  }

  /**
   * Archive a chat
   * @param {string} chatId
   * @returns {Promise<boolean>}
   */
  async archiveChat(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.archive();
  }

  /**
   * Unarchive a chat
   * @param {string} chatId
   * @returns {Promise<boolean>}
   */
  async unarchiveChat(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.unarchive();
  }

  /**
   * Mute a chat
   * @param {string} chatId
   * @param {Date} unmuteDate
   * @returns {Promise<void>}
   */
  async muteChat(chatId, unmuteDate = null) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.mute(unmuteDate);
  }

  /**
   * Unmute a chat
   * @param {string} chatId
   * @returns {Promise<void>}
   */
  async unmuteChat(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.unmute();
  }

  /**
   * Pin a chat
   * @param {string} chatId
   * @returns {Promise<boolean>}
   */
  async pinChat(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.pin();
  }

  /**
   * Unpin a chat
   * @param {string} chatId
   * @returns {Promise<boolean>}
   */
  async unpinChat(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.unpin();
  }

  /**
   * Mark chat as read
   * @param {string} chatId
   * @returns {Promise<boolean>}
   */
  async markChatAsRead(chatId) {
    this.ensureReady();
    const client = getClient();

    return client.sendSeen(chatId);
  }

  /**
   * Mark chat as unread
   * @param {string} chatId
   * @returns {Promise<void>}
   */
  async markChatAsUnread(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.markUnread();
  }

  /**
   * Clear chat messages
   * @param {string} chatId
   * @returns {Promise<boolean>}
   */
  async clearChat(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.clearMessages();
  }

  /**
   * Delete a chat
   * @param {string} chatId
   * @returns {Promise<boolean>}
   */
  async deleteChat(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.delete();
  }

  /**
   * Send typing indicator
   * @param {string} chatId
   * @returns {Promise<void>}
   */
  async sendTyping(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.sendStateTyping();
  }

  /**
   * Send recording indicator
   * @param {string} chatId
   * @returns {Promise<void>}
   */
  async sendRecording(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.sendStateRecording();
  }

  /**
   * Clear typing/recording state
   * @param {string} chatId
   * @returns {Promise<void>}
   */
  async clearState(chatId) {
    this.ensureReady();
    const client = getClient();

    const chat = await client.getChatById(chatId);
    if (!chat) {
      throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    }

    return chat.clearState();
  }

  /**
   * Search messages
   * @param {string} query
   * @param {Object} options
   * @returns {Promise<Array>}
   */
  async searchMessages(query, options = {}) {
    this.ensureReady();
    const client = getClient();

    const messages = await client.searchMessages(query, options);
    return messages;
  }

  /**
   * Ensure client is ready, throw error if not
   */
  ensureReady() {
    if (!isClientReady()) {
      throw new Error(ERROR_MESSAGES.CLIENT_NOT_READY);
    }
  }
}

module.exports = new WhatsAppService();
