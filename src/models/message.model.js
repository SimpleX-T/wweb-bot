/**
 * Message Log Model
 * Stores message history for monitored chats
 */

const mongoose = require("mongoose");
const { MESSAGE_TYPES, MESSAGE_ACK } = require("../config/constants");

const messageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      default: null,
    },
    body: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: Object.values(MESSAGE_TYPES),
      default: MESSAGE_TYPES.TEXT,
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    fromMe: {
      type: Boolean,
      default: false,
    },
    ack: {
      type: Number,
      enum: Object.values(MESSAGE_ACK),
      default: MESSAGE_ACK.PENDING,
    },
    hasMedia: {
      type: Boolean,
      default: false,
    },
    media: {
      mimetype: { type: String, default: null },
      filename: { type: String, default: null },
      filesize: { type: Number, default: null },
      url: { type: String, default: null },
    },
    hasQuotedMsg: {
      type: Boolean,
      default: false,
    },
    quotedMessageId: {
      type: String,
      default: null,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
    forwardingScore: {
      type: Number,
      default: 0,
    },
    isStarred: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    mentionedIds: [
      {
        type: String,
      },
    ],
    groupMentions: [
      {
        type: String,
      },
    ],
    links: [
      {
        link: String,
        isSuspicious: Boolean,
      },
    ],
    location: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      description: { type: String, default: null },
    },
    reactions: [
      {
        emoji: { type: String },
        senderId: { type: String },
        timestamp: { type: Date },
      },
    ],
    vCards: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ chatId: 1, isDeleted: 1, timestamp: -1 });
messageSchema.index({ from: 1, timestamp: -1 });

// Virtual for formatted timestamp
messageSchema.virtual("formattedTime").get(function () {
  return this.timestamp.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
});

// Instance methods
messageSchema.methods.updateAck = async function (ack) {
  this.ack = ack;
  return this.save();
};

messageSchema.methods.addReaction = async function (emoji, senderId) {
  // Remove existing reaction from same sender
  this.reactions = this.reactions.filter((r) => r.senderId !== senderId);

  // Add new reaction if not empty (empty means reaction removed)
  if (emoji) {
    this.reactions.push({
      emoji,
      senderId,
      timestamp: new Date(),
    });
  }
  return this.save();
};

messageSchema.methods.markAsDeleted = async function () {
  this.isDeleted = true;
  this.body = "This message was deleted";
  return this.save();
};

messageSchema.methods.markAsEdited = async function (newBody) {
  this.body = newBody;
  this.isEdited = true;
  return this.save();
};

// Static methods
messageSchema.statics.logMessage = async function (message) {
  const existingMessage = await this.findOne({
    messageId: message.id?._serialized || message.id,
  });

  if (existingMessage) {
    return existingMessage;
  }

  return this.create({
    messageId: message.id?._serialized || message.id,
    chatId: message.from.includes("@g.us")
      ? message.from
      : message.fromMe
      ? message.to
      : message.from,
    from: message.from,
    to: message.to,
    author: message.author || null,
    body: message.body || "",
    type: message.type || MESSAGE_TYPES.TEXT,
    timestamp: message.timestamp
      ? new Date(message.timestamp * 1000)
      : new Date(),
    fromMe: message.fromMe || false,
    ack: message.ack,
    hasMedia: message.hasMedia || false,
    hasQuotedMsg: message.hasQuotedMsg || false,
    isForwarded: message.isForwarded || false,
    forwardingScore: message.forwardingScore || 0,
    isStarred: message.isStarred || false,
    mentionedIds: message.mentionedIds || [],
    groupMentions: message.groupMentions || [],
    links: message.links || [],
    vCards: message.vCards || [],
  });
};

messageSchema.statics.getChatMessages = async function (chatId, options = {}) {
  const {
    limit = 50,
    before = null,
    after = null,
    includeDeleted = false,
  } = options;

  const query = { chatId };

  if (!includeDeleted) {
    query.isDeleted = { $ne: true };
  }

  if (before) {
    query.timestamp = { $lt: new Date(before) };
  } else if (after) {
    query.timestamp = { $gt: new Date(after) };
  }

  const messages = await this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
  return messages.reverse();
};

messageSchema.statics.getStarredMessages = async function (chatId = null) {
  const query = { isStarred: true };
  if (chatId) query.chatId = chatId;

  return this.find(query).sort({ timestamp: -1 }).lean();
};

messageSchema.statics.searchMessages = async function (
  chatId,
  searchQuery,
  limit = 50
) {
  return this.find({
    chatId,
    body: { $regex: searchQuery, $options: "i" },
    isDeleted: { $ne: true },
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
