/**
 * Group Service
 * Group management operations
 */

const { getClient, isClientReady } = require("../config/whatsapp");
const { GroupSettings } = require("../models");
const { ERROR_MESSAGES } = require("../config/constants");
const { formatGroup, formatParticipant } = require("../utils/formatters");
const {
  normalizeGroupId,
  normalizePhoneNumber,
  chunkArray,
  delay,
} = require("../utils/helpers");
const logger = require("../utils/logger");

class GroupService {
  /**
   * Get all groups
   * @returns {Promise<Array>}
   */
  async getAllGroups() {
    this.ensureReady();
    const client = getClient();

    const chats = await client.getChats();
    const groups = chats.filter((chat) => chat.isGroup);

    return groups.map(formatGroup);
  }

  /**
   * Get group by ID
   * @param {string} groupId
   * @returns {Promise<Object>}
   */
  async getGroupById(groupId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    return formatGroup(chat);
  }

  /**
   * Get group participants
   * @param {string} groupId
   * @returns {Promise<Array>}
   */
  async getParticipants(groupId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    // Get detailed contact info for each participant
    const participants = await Promise.all(
      chat.participants.map(async (p) => {
        try {
          const contact = await client.getContactById(p.id._serialized);
          return {
            ...formatParticipant(p),
            name: contact?.name || contact?.pushname || "Unknown",
            number: contact?.number || p.id.user,
          };
        } catch {
          return {
            ...formatParticipant(p),
            name: "Unknown",
            number: p.id?.user || "Unknown",
          };
        }
      })
    );

    return participants;
  }

  /**
   * Tag all members in a group (@everyone functionality)
   * @param {string} groupId
   * @param {string} message
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async tagAllMembers(groupId, message = "", options = {}) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    // Get all participant IDs for mentions
    const mentions = await Promise.all(
      chat.participants.map(async (p) => {
        return await client.getContactById(p.id._serialized);
      })
    );

    // Build the message with mentions
    let fullMessage;

    if (options.hideMentions) {
      // Just the message (or default), but with mentions array attached
      fullMessage = message || "@everyone";
    } else {
      // Original behavior: List all mentions
      const mentionText = mentions
        .map((contact) => `@${contact.number || contact.id.user}`)
        .join(" ");
      fullMessage = message ? `${message}\n\n${mentionText}` : mentionText;
    }

    // Send message with mentions
    const sentMessage = await chat.sendMessage(fullMessage, {
      mentions,
    });

    logger.info(`Tagged ${mentions.length} members in group ${groupId}`);

    return {
      success: true,
      messageId: sentMessage.id._serialized,
      mentionedCount: mentions.length,
    };
  }

  /**
   * Add participants to a group
   * @param {string} groupId
   * @param {string[]} participantIds
   * @returns {Promise<Object>}
   */
  async addParticipants(groupId, participantIds) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    // Normalize participant IDs
    const normalizedIds = participantIds.map(normalizePhoneNumber);

    // Add participants in chunks to avoid rate limiting
    const results = {
      success: [],
      failed: [],
    };

    const chunks = chunkArray(normalizedIds, 5);

    for (const chunk of chunks) {
      try {
        const result = await chat.addParticipants(chunk);

        // Process results
        Object.entries(result).forEach(([participantId, status]) => {
          if (status === 200 || status.code === 200) {
            results.success.push(participantId);
          } else {
            results.failed.push({
              id: participantId,
              reason: status.message || "Unknown error",
            });
          }
        });

        // Small delay between chunks
        await delay(1000);
      } catch (error) {
        chunk.forEach((id) => {
          results.failed.push({ id, reason: error.message });
        });
      }
    }

    logger.info(
      `Added ${results.success.length} participants to group ${groupId}`
    );

    return results;
  }

  /**
   * Remove participants from a group
   * @param {string} groupId
   * @param {string[]} participantIds
   * @returns {Promise<Object>}
   */
  async removeParticipants(groupId, participantIds) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    const normalizedIds = participantIds.map(normalizePhoneNumber);

    try {
      await chat.removeParticipants(normalizedIds);
      logger.info(
        `Removed ${normalizedIds.length} participants from group ${groupId}`
      );
      return { success: true, removed: normalizedIds };
    } catch (error) {
      logger.error(`Failed to remove participants: ${error.message}`);
      throw error;
    }
  }

  /**
   * Promote participants to admin
   * @param {string} groupId
   * @param {string[]} participantIds
   * @returns {Promise<boolean>}
   */
  async promoteParticipants(groupId, participantIds) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    const normalizedIds = participantIds.map(normalizePhoneNumber);

    await chat.promoteParticipants(normalizedIds);
    logger.info(
      `Promoted ${normalizedIds.length} participants to admin in group ${groupId}`
    );

    return true;
  }

  /**
   * Demote participants from admin
   * @param {string} groupId
   * @param {string[]} participantIds
   * @returns {Promise<boolean>}
   */
  async demoteParticipants(groupId, participantIds) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    const normalizedIds = participantIds.map(normalizePhoneNumber);

    await chat.demoteParticipants(normalizedIds);
    logger.info(
      `Demoted ${normalizedIds.length} participants from admin in group ${groupId}`
    );

    return true;
  }

  /**
   * Change group subject (name)
   * @param {string} groupId
   * @param {string} subject
   * @returns {Promise<boolean>}
   */
  async setSubject(groupId, subject) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    await chat.setSubject(subject);
    logger.info(`Changed group subject to "${subject}" for ${groupId}`);

    return true;
  }

  /**
   * Change group description
   * @param {string} groupId
   * @param {string} description
   * @returns {Promise<boolean>}
   */
  async setDescription(groupId, description) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    await chat.setDescription(description);
    logger.info(`Changed group description for ${groupId}`);

    return true;
  }

  /**
   * Set group settings - who can send messages
   * @param {string} groupId
   * @param {boolean} adminsOnly
   * @returns {Promise<boolean>}
   */
  async setMessagesAdminsOnly(groupId, adminsOnly = true) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    await chat.setMessagesAdminsOnly(adminsOnly);
    logger.info(`Set messages admins only to ${adminsOnly} for ${groupId}`);

    return true;
  }

  /**
   * Set group settings - who can edit group info
   * @param {string} groupId
   * @param {boolean} adminsOnly
   * @returns {Promise<boolean>}
   */
  async setInfoAdminsOnly(groupId, adminsOnly = true) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    await chat.setInfoAdminsOnly(adminsOnly);
    logger.info(`Set info admins only to ${adminsOnly} for ${groupId}`);

    return true;
  }

  /**
   * Set group settings - who can add members
   * @param {string} groupId
   * @param {boolean} adminsOnly
   * @returns {Promise<boolean>}
   */
  async setAddMembersAdminsOnly(groupId, adminsOnly = true) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    await chat.setAddMembersAdminsOnly(adminsOnly);
    logger.info(`Set add members admins only to ${adminsOnly} for ${groupId}`);

    return true;
  }

  /**
   * Get group invite link
   * @param {string} groupId
   * @returns {Promise<string>}
   */
  async getInviteCode(groupId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    const code = await chat.getInviteCode();
    return `https://chat.whatsapp.com/${code}`;
  }

  /**
   * Revoke group invite link
   * @param {string} groupId
   * @returns {Promise<string>} New invite code
   */
  async revokeInvite(groupId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    const newCode = await chat.revokeInvite();
    logger.info(`Revoked invite link for group ${groupId}`);

    return `https://chat.whatsapp.com/${newCode}`;
  }

  /**
   * Leave a group
   * @param {string} groupId
   * @returns {Promise<boolean>}
   */
  async leaveGroup(groupId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    await chat.leave();
    logger.info(`Left group ${groupId}`);

    return true;
  }

  /**
   * Get group membership requests
   * @param {string} groupId
   * @returns {Promise<Array>}
   */
  async getMembershipRequests(groupId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    return chat.getGroupMembershipRequests();
  }

  /**
   * Approve membership requests
   * @param {string} groupId
   * @param {string[]} requestIds
   * @returns {Promise<Object>}
   */
  async approveMembershipRequests(groupId, requestIds = []) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    const options = requestIds.length > 0 ? { requesterIds: requestIds } : {};

    return chat.approveGroupMembershipRequests(options);
  }

  /**
   * Reject membership requests
   * @param {string} groupId
   * @param {string[]} requestIds
   * @returns {Promise<Object>}
   */
  async rejectMembershipRequests(groupId, requestIds = []) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizeGroupId(groupId);
    const chat = await client.getChatById(normalizedId);

    if (!chat || !chat.isGroup) {
      throw new Error(ERROR_MESSAGES.GROUP_NOT_FOUND);
    }

    const options = requestIds.length > 0 ? { requesterIds: requestIds } : {};

    return chat.rejectGroupMembershipRequests(options);
  }

  /**
   * Get or create group settings
   * @param {string} groupId
   * @returns {Promise<Object>}
   */
  async getGroupSettings(groupId) {
    const normalizedId = normalizeGroupId(groupId);

    // Get group info if client is ready
    let groupName = "Unknown Group";
    if (isClientReady()) {
      try {
        const group = await this.getGroupById(normalizedId);
        groupName = group.name;
      } catch {
        // Ignore error, use default name
      }
    }

    return GroupSettings.getOrCreate(normalizedId, groupName);
  }

  /**
   * Update auto-message settings
   * @param {string} groupId
   * @param {string} type
   * @param {Object} config
   * @returns {Promise<Object>}
   */
  async updateAutoMessage(groupId, type, config) {
    const settings = await this.getGroupSettings(groupId);
    return settings.updateAutoMessage(type, config);
  }

  /**
   * Toggle auto-message
   * @param {string} groupId
   * @param {string} type
   * @returns {Promise<Object>}
   */
  async toggleAutoMessage(groupId, type) {
    const settings = await this.getGroupSettings(groupId);
    return settings.toggleAutoMessage(type);
  }

  /**
   * Set group rules
   * @param {string} groupId
   * @param {string} rules
   * @returns {Promise<Object>}
   */
  async setGroupRules(groupId, rules) {
    const settings = await this.getGroupSettings(groupId);
    return settings.setGroupRules(rules);
  }

  /**
   * Ensure client is ready
   */
  ensureReady() {
    if (!isClientReady()) {
      throw new Error(ERROR_MESSAGES.CLIENT_NOT_READY);
    }
  }
}

module.exports = new GroupService();
