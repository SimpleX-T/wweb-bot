/**
 * WhatsApp Event Handlers
 * Handles all WhatsApp client events and broadcasts them via WebSocket
 */

const { getClient, clientEvents } = require("../config/whatsapp");
const { Session, Watchlist, Message, GroupSettings } = require("../models");
const {
  WS_EVENTS,
  AUTO_MESSAGE_TYPES,
  CLIENT_STATUS,
} = require("../config/constants");
const {
  formatMessage,
  formatGroupNotification,
  formatReaction,
} = require("../utils/formatters");
const { delay } = require("../utils/helpers");
const logger = require("../utils/logger");

// Store for WebSocket broadcast function
let broadcastFn = null;

/**
 * Set the broadcast function for WebSocket events
 */
function setBroadcastFunction(fn) {
  broadcastFn = fn;
}

/**
 * Broadcast event to all connected WebSocket clients
 */
function broadcast(event, data) {
  if (broadcastFn) {
    broadcastFn(event, data);
  }
}

/**
 * Initialize all event handlers
 */
function initializeEventHandlers() {
  const client = getClient();
  if (!client) {
    logger.warn("Cannot initialize event handlers: client not available");
    return;
  }

  // Message received (from others)
  client.on("message", async (message) => {
    try {
      await handleMessage(message);
    } catch (error) {
      logger.error(`Error handling message: ${error.message}`);
    }
  });

  // Message created (sent or received)
  client.on("message_create", async (message) => {
    try {
      await handleMessageCreate(message);
    } catch (error) {
      logger.error(`Error handling message_create: ${error.message}`);
    }
  });

  // Message acknowledgement (sent, delivered, read)
  client.on("message_ack", async (message, ack) => {
    try {
      await handleMessageAck(message, ack);
    } catch (error) {
      logger.error(`Error handling message_ack: ${error.message}`);
    }
  });

  // Message revoked/deleted
  client.on("message_revoke_everyone", async (message, revokedMsg) => {
    try {
      await handleMessageRevoke(message, revokedMsg);
    } catch (error) {
      logger.error(`Error handling message_revoke: ${error.message}`);
    }
  });

  // Message edited
  client.on("message_edit", async (message, newBody, oldBody) => {
    try {
      await handleMessageEdit(message, newBody, oldBody);
    } catch (error) {
      logger.error(`Error handling message_edit: ${error.message}`);
    }
  });

  // Message reaction
  client.on("message_reaction", async (reaction) => {
    try {
      await handleMessageReaction(reaction);
    } catch (error) {
      logger.error(`Error handling message_reaction: ${error.message}`);
    }
  });

  // Group join
  client.on("group_join", async (notification) => {
    try {
      await handleGroupJoin(notification);
    } catch (error) {
      logger.error(`Error handling group_join: ${error.message}`);
    }
  });

  // Group leave
  client.on("group_leave", async (notification) => {
    try {
      await handleGroupLeave(notification);
    } catch (error) {
      logger.error(`Error handling group_leave: ${error.message}`);
    }
  });

  // Group update (settings changed)
  client.on("group_update", async (notification) => {
    try {
      await handleGroupUpdate(notification);
    } catch (error) {
      logger.error(`Error handling group_update: ${error.message}`);
    }
  });

  // Group admin changed
  client.on("group_admin_changed", async (notification) => {
    try {
      await handleGroupAdminChanged(notification);
    } catch (error) {
      logger.error(`Error handling group_admin_changed: ${error.message}`);
    }
  });

  // Group membership request
  client.on("group_membership_request", async (notification) => {
    try {
      await handleGroupMembershipRequest(notification);
    } catch (error) {
      logger.error(`Error handling group_membership_request: ${error.message}`);
    }
  });

  // Contact changed
  client.on("contact_changed", async (message, oldId, newId, isContact) => {
    try {
      broadcast(WS_EVENTS.CONTACT_CHANGED, { oldId, newId, isContact });
    } catch (error) {
      logger.error(`Error handling contact_changed: ${error.message}`);
    }
  });

  // Chat archived
  client.on("chat_archived", async (chat, currState, prevState) => {
    try {
      broadcast(WS_EVENTS.CHAT_ARCHIVED, {
        chatId: chat.id._serialized,
        archived: currState,
      });
    } catch (error) {
      logger.error(`Error handling chat_archived: ${error.message}`);
    }
  });

  logger.info("✅ Event handlers initialized");
}

/**
 * Handle incoming message
 */
async function handleMessage(message) {
  const chatId = message.from;

  // Log group IDs prominently for easy copying
  if (chatId.includes("@g.us")) {
    const chat = await message.getChat();
    logger.info(
      `📥 GROUP MESSAGE - ID: ${chatId} | Name: "${chat.name || "Unknown"}"`
    );
    logger.info(`   └─ Copy this Group ID to add to watchlist: ${chatId}`);
  } else {
    logger.debug(`📥 Message from: ${chatId}`);
  }

  // Check if message is from a watchlist chat
  const watchlistItem = await Watchlist.findOne({ chatId, isActive: true });

  if (watchlistItem) {
    // Update last message
    await watchlistItem.updateLastMessage(message);

    // Log message to database
    await Message.logMessage(message);

    // Broadcast to WebSocket
    broadcast(WS_EVENTS.WATCHLIST_MESSAGE, {
      chatId,
      message: formatMessage(message),
    });
  }

  // Broadcast general message event
  broadcast(WS_EVENTS.MESSAGE_NEW, formatMessage(message));
}

/**
 * Handle message creation (sent messages)
 */
async function handleMessageCreate(message) {
  if (message.fromMe) {
    // Log sent messages
    const chatId = message.to;
    const watchlistItem = await Watchlist.findOne({ chatId, isActive: true });

    if (watchlistItem) {
      await watchlistItem.updateLastMessage(message);
      await Message.logMessage(message);

      broadcast(WS_EVENTS.WATCHLIST_MESSAGE, {
        chatId,
        message: formatMessage(message),
      });
    }
  }
}

/**
 * Handle message acknowledgement
 */
async function handleMessageAck(message, ack) {
  const messageId = message.id._serialized;

  // Update in database
  await Message.findOneAndUpdate({ messageId }, { ack });

  broadcast(WS_EVENTS.MESSAGE_ACK, {
    messageId,
    ack,
    ackLabel: ["error", "pending", "sent", "received", "read", "played"][
      ack + 1
    ],
  });
}

/**
 * Handle message revocation/deletion
 */
async function handleMessageRevoke(message, revokedMsg) {
  if (revokedMsg) {
    const messageId = revokedMsg.id._serialized;

    // Update in database
    await Message.findOneAndUpdate(
      { messageId },
      { isDeleted: true, body: "This message was deleted" }
    );

    broadcast(WS_EVENTS.MESSAGE_REVOKED, { messageId });
  }
}

/**
 * Handle message edit
 */
async function handleMessageEdit(message, newBody, oldBody) {
  const messageId = message.id._serialized;

  // Update in database
  await Message.findOneAndUpdate(
    { messageId },
    { body: newBody, isEdited: true }
  );

  broadcast(WS_EVENTS.MESSAGE_EDIT, { messageId, newBody, oldBody });
}

/**
 * Handle message reaction
 */
async function handleMessageReaction(reaction) {
  const formattedReaction = formatReaction(reaction);

  // Update in database
  const messageId = reaction.msgId._serialized;
  if (reaction.reaction) {
    await Message.findOneAndUpdate(
      { messageId },
      {
        $push: {
          reactions: {
            emoji: reaction.reaction,
            senderId: reaction.senderId,
            timestamp: new Date(),
          },
        },
      }
    );
  } else {
    // Remove reaction
    await Message.findOneAndUpdate(
      { messageId },
      { $pull: { reactions: { senderId: reaction.senderId } } }
    );
  }

  broadcast(WS_EVENTS.MESSAGE_REACTION, formattedReaction);
}

/**
 * Handle group join - send welcome message if configured
 */
async function handleGroupJoin(notification) {
  const groupId = notification.chatId;
  const joinedIds = notification.recipientIds;

  logger.info(`New member(s) joined group ${groupId}: ${joinedIds.join(", ")}`);

  // Broadcast event
  broadcast(WS_EVENTS.GROUP_JOIN, formatGroupNotification(notification));

  // Check if auto-welcome is enabled
  const settings = await GroupSettings.findOne({ groupId, isActive: true });

  if (settings?.autoMessages?.welcome?.enabled) {
    const client = getClient();
    const config = settings.autoMessages.welcome;

    // Wait configured delay
    await delay(config.delay || 3000);

    try {
      // Build welcome message
      let message = config.message;

      // Get joined contacts for mentions
      const mentions = [];
      for (const id of joinedIds) {
        try {
          const contact = await client.getContactById(id);
          mentions.push(contact);

          // Replace placeholder with mention
          if (config.mentionUser) {
            message = message.replace(
              "{user}",
              `@${contact.number || contact.id.user}`
            );
            message = message.replace(
              "@{user}",
              `@${contact.number || contact.id.user}`
            );
          }
        } catch (err) {
          logger.warn(`Could not get contact for ${id}`);
        }
      }

      // Include group rules if configured
      if (config.includeGroupRules && settings.groupRules) {
        message += `\n\n📋 *Group Rules*:\n${settings.groupRules}`;
      }

      // Send welcome message
      const chat = await client.getChatById(groupId);
      await chat.sendMessage(message, {
        mentions: config.mentionUser ? mentions : [],
      });

      logger.info(`Sent welcome message in group ${groupId}`);
    } catch (error) {
      logger.error(`Failed to send welcome message: ${error.message}`);
    }
  }

  // Update watchlist if group is monitored
  const watchlistItem = await Watchlist.findOne({
    chatId: groupId,
    isActive: true,
  });
  if (watchlistItem) {
    broadcast(WS_EVENTS.WATCHLIST_UPDATE, {
      chatId: groupId,
      event: "member_join",
      members: joinedIds,
    });
  }
}

/**
 * Handle group leave - send farewell message if configured
 */
async function handleGroupLeave(notification) {
  const groupId = notification.chatId;
  const leftIds = notification.recipientIds;

  logger.info(`Member(s) left group ${groupId}: ${leftIds.join(", ")}`);

  // Broadcast event
  broadcast(WS_EVENTS.GROUP_LEAVE, formatGroupNotification(notification));

  // Check if auto-farewell is enabled
  const settings = await GroupSettings.findOne({ groupId, isActive: true });

  if (settings?.autoMessages?.farewell?.enabled) {
    const config = settings.autoMessages.farewell;

    // Wait configured delay
    await delay(config.delay || 3000);

    try {
      const client = getClient();
      let message = config.message;

      // Replace user placeholder (can't mention users who left)
      message = message.replace(
        "{user}",
        leftIds.length === 1 ? "member" : "members"
      );

      // Send farewell message
      const chat = await client.getChatById(groupId);
      await chat.sendMessage(message);

      logger.info(`Sent farewell message in group ${groupId}`);
    } catch (error) {
      logger.error(`Failed to send farewell message: ${error.message}`);
    }
  }

  // Update watchlist if group is monitored
  const watchlistItem = await Watchlist.findOne({
    chatId: groupId,
    isActive: true,
  });
  if (watchlistItem) {
    broadcast(WS_EVENTS.WATCHLIST_UPDATE, {
      chatId: groupId,
      event: "member_leave",
      members: leftIds,
    });
  }
}

/**
 * Handle group settings update
 */
async function handleGroupUpdate(notification) {
  const groupId = notification.chatId;

  logger.info(`Group ${groupId} was updated: ${notification.type}`);

  broadcast(WS_EVENTS.GROUP_UPDATE, formatGroupNotification(notification));

  // Update watchlist if group is monitored
  const watchlistItem = await Watchlist.findOne({
    chatId: groupId,
    isActive: true,
  });
  if (watchlistItem) {
    broadcast(WS_EVENTS.WATCHLIST_UPDATE, {
      chatId: groupId,
      event: "group_update",
      type: notification.type,
    });
  }
}

/**
 * Handle admin change
 */
async function handleGroupAdminChanged(notification) {
  const groupId = notification.chatId;

  logger.info(`Admin changed in group ${groupId}`);

  broadcast(
    WS_EVENTS.GROUP_ADMIN_CHANGED,
    formatGroupNotification(notification)
  );
}

/**
 * Handle membership request
 */
async function handleGroupMembershipRequest(notification) {
  const groupId = notification.chatId;

  logger.info(`Membership request in group ${groupId}`);

  broadcast(WS_EVENTS.GROUP_MEMBERSHIP_REQUEST, {
    groupId,
    requesterId: notification.author,
    timestamp: new Date(),
  });
}

// Listen for client status changes
clientEvents.on("status", async (status) => {
  broadcast(WS_EVENTS.CLIENT_STATUS, { status });

  // Update session in database
  await Session.findOneAndUpdate(
    { sessionId: "default" },
    { status, lastActive: new Date() },
    { upsert: true }
  );
});

// Listen for QR code
clientEvents.on("qr", (qr) => {
  broadcast(WS_EVENTS.CLIENT_QR, { qr });
});

// Listen for ready event
clientEvents.on("ready", async (info) => {
  broadcast(WS_EVENTS.CLIENT_READY, info);

  // Update session info
  await Session.updateClientInfo("default", info);

  // Initialize event handlers
  initializeEventHandlers();
});

// Listen for disconnect
clientEvents.on("disconnected", (reason) => {
  broadcast(WS_EVENTS.CLIENT_DISCONNECTED, { reason });
});

module.exports = {
  initializeEventHandlers,
  setBroadcastFunction,
  broadcast,
};
