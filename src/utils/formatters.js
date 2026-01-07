/**
 * Data Formatters
 * Transform WhatsApp objects into API-friendly formats
 */

const {
  MESSAGE_TYPES,
  MESSAGE_ACK,
  CHAT_TYPES,
} = require("../config/constants");

/**
 * Format chat object for API response
 * @param {Object} chat
 * @returns {Object}
 */
function formatChat(chat) {
  if (!chat) return null;

  return {
    id: chat.id?._serialized || chat.id,
    name: chat.name || chat.pushname || "Unknown",
    isGroup: chat.isGroup || false,
    isReadOnly: chat.isReadOnly || false,
    isMuted: chat.isMuted || false,
    muteExpiration: chat.muteExpiration || null,
    pinned: chat.pinned || false,
    archived: chat.archived || false,
    timestamp: chat.timestamp ? new Date(chat.timestamp * 1000) : null,
    unreadCount: chat.unreadCount || 0,
    lastMessage: chat.lastMessage
      ? formatMessagePreview(chat.lastMessage)
      : null,
    chatType: determineChattType(chat),
  };
}

/**
 * Determine chat type from chat object
 * @param {Object} chat
 * @returns {string}
 */
function determineChattType(chat) {
  const id = chat.id?._serialized || chat.id;
  if (id?.endsWith("@g.us")) return CHAT_TYPES.GROUP;
  if (id?.endsWith("@broadcast")) return CHAT_TYPES.BROADCAST;
  if (id?.endsWith("@newsletter")) return CHAT_TYPES.CHANNEL;
  return CHAT_TYPES.PRIVATE;
}

/**
 * Format group object for API response
 * @param {Object} group
 * @returns {Object}
 */
function formatGroup(group) {
  if (!group) return null;

  return {
    id: group.id?._serialized || group.id,
    name: group.name || "Unknown Group",
    description: group.description || "",
    owner: group.owner?._serialized || group.owner,
    createdAt: group.createdAt ? new Date(group.createdAt * 1000) : null,
    participants: (group.participants || []).map(formatParticipant),
    participantCount: group.participants?.length || 0,
    isReadOnly: group.isReadOnly || false,
    isMuted: group.isMuted || false,
    archived: group.archived || false,
    pinned: group.pinned || false,
  };
}

/**
 * Format participant object
 * @param {Object} participant
 * @returns {Object}
 */
function formatParticipant(participant) {
  if (!participant) return null;

  return {
    id: participant.id?._serialized || participant.id,
    isAdmin: participant.isAdmin || false,
    isSuperAdmin: participant.isSuperAdmin || false,
  };
}

/**
 * Format contact object for API response
 * @param {Object} contact
 * @returns {Object}
 */
function formatContact(contact) {
  if (!contact) return null;

  return {
    id: contact.id?._serialized || contact.id,
    name: contact.name || null,
    pushname: contact.pushname || null,
    shortName: contact.shortName || null,
    number: contact.number || null,
    isMe: contact.isMe || false,
    isUser: contact.isUser || false,
    isGroup: contact.isGroup || false,
    isWAContact: contact.isWAContact || false,
    isMyContact: contact.isMyContact || false,
    isBlocked: contact.isBlocked || false,
    isBusiness: contact.isBusiness || false,
    isEnterprise: contact.isEnterprise || false,
    profilePicUrl: null, // Set separately via getProfilePicUrl
  };
}

/**
 * Format message object for API response
 * @param {Object} message
 * @returns {Object}
 */
function formatMessage(message) {
  if (!message) return null;

  return {
    id: message.id?._serialized || message.id,
    body: message.body || "",
    type: message.type || MESSAGE_TYPES.TEXT,
    timestamp: message.timestamp
      ? new Date(message.timestamp * 1000)
      : new Date(),
    from: message.from,
    to: message.to,
    author: message.author || null,
    fromMe: message.fromMe || false,
    hasMedia: message.hasMedia || false,
    hasQuotedMsg: message.hasQuotedMsg || false,
    isForwarded: message.isForwarded || false,
    forwardingScore: message.forwardingScore || 0,
    isStarred: message.isStarred || false,
    isStatus: message.isStatus || false,
    broadcast: message.broadcast || false,
    mentionedIds: message.mentionedIds || [],
    groupMentions: message.groupMentions || [],
    ack: formatAck(message.ack),
    hasReaction: message.hasReaction || false,
    links: message.links || [],
    vCards: message.vCards || [],
    location: message.location ? formatLocation(message.location) : null,
    deviceType: message.deviceType || "unknown",
  };
}

/**
 * Format message for preview (minimal info)
 * @param {Object} message
 * @returns {Object}
 */
function formatMessagePreview(message) {
  if (!message) return null;

  let preview = "";
  switch (message.type) {
    case MESSAGE_TYPES.IMAGE:
      preview = "📷 Photo";
      break;
    case MESSAGE_TYPES.VIDEO:
      preview = "🎥 Video";
      break;
    case MESSAGE_TYPES.AUDIO:
    case MESSAGE_TYPES.PTT:
      preview = "🎵 Audio";
      break;
    case MESSAGE_TYPES.DOCUMENT:
      preview = "📄 Document";
      break;
    case MESSAGE_TYPES.STICKER:
      preview = "🎨 Sticker";
      break;
    case MESSAGE_TYPES.LOCATION:
      preview = "📍 Location";
      break;
    case MESSAGE_TYPES.VCARD:
      preview = "👤 Contact";
      break;
    default:
      preview = message.body?.substring(0, 50) || "";
      if (message.body?.length > 50) preview += "...";
  }

  return {
    id: message.id?._serialized || message.id,
    preview,
    type: message.type,
    timestamp: message.timestamp
      ? new Date(message.timestamp * 1000)
      : new Date(),
    fromMe: message.fromMe || false,
  };
}

/**
 * Format message acknowledgement
 * @param {number} ack
 * @returns {Object}
 */
function formatAck(ack) {
  const ackLabels = {
    [MESSAGE_ACK.ERROR]: "error",
    [MESSAGE_ACK.PENDING]: "pending",
    [MESSAGE_ACK.SENT]: "sent",
    [MESSAGE_ACK.RECEIVED]: "received",
    [MESSAGE_ACK.READ]: "read",
    [MESSAGE_ACK.PLAYED]: "played",
  };

  return {
    status: ack,
    label: ackLabels[ack] || "unknown",
  };
}

/**
 * Format location object
 * @param {Object} location
 * @returns {Object}
 */
function formatLocation(location) {
  if (!location) return null;

  return {
    latitude: location.latitude,
    longitude: location.longitude,
    description: location.description || null,
    name: location.name || null,
    address: location.address || null,
    url: location.url || null,
  };
}

/**
 * Format group notification
 * @param {Object} notification
 * @returns {Object}
 */
function formatGroupNotification(notification) {
  if (!notification) return null;

  return {
    id: notification.id?._serialized || notification.id,
    type: notification.type,
    chatId: notification.chatId,
    author: notification.author,
    recipientIds: notification.recipientIds || [],
    timestamp: notification.timestamp
      ? new Date(notification.timestamp * 1000)
      : new Date(),
  };
}

/**
 * Format reaction object
 * @param {Object} reaction
 * @returns {Object}
 */
function formatReaction(reaction) {
  if (!reaction) return null;

  return {
    id: reaction.id?._serialized || reaction.id,
    reaction: reaction.reaction,
    senderId: reaction.senderId,
    timestamp: reaction.timestamp
      ? new Date(reaction.timestamp * 1000)
      : new Date(),
    orphaned: reaction.orphaned || false,
    msgId: reaction.msgId,
  };
}

/**
 * Format API success response
 * @param {any} data
 * @param {string} message
 * @returns {Object}
 */
function formatSuccessResponse(data, message = "Success") {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format API error response
 * @param {string} message
 * @param {string} code
 * @param {any} details
 * @returns {Object}
 */
function formatErrorResponse(message, code = "ERROR", details = null) {
  return {
    success: false,
    message,
    error: {
      code,
      details,
    },
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  formatChat,
  formatGroup,
  formatParticipant,
  formatContact,
  formatMessage,
  formatMessagePreview,
  formatAck,
  formatLocation,
  formatGroupNotification,
  formatReaction,
  formatSuccessResponse,
  formatErrorResponse,
  determineChattType,
};
