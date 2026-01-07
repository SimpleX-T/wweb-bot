/**
 * Watchlist Model
 * Tracks chats that are being monitored in the dashboard
 */

const mongoose = require("mongoose");
const { CHAT_TYPES } = require("../config/constants");

const watchlistSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    chatName: {
      type: String,
      required: true,
    },
    chatType: {
      type: String,
      enum: Object.values(CHAT_TYPES),
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notifications: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
    lastMessage: {
      content: { type: String, default: "" },
      timestamp: { type: Date, default: null },
      from: { type: String, default: null },
      fromMe: { type: Boolean, default: false },
      type: { type: String, default: "chat" },
    },
    profilePicUrl: {
      type: String,
      default: null,
    },
    metadata: {
      participantCount: { type: Number, default: 0 },
      description: { type: String, default: "" },
      isReadOnly: { type: Boolean, default: false },
      isMuted: { type: Boolean, default: false },
    },
    notes: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
      },
    ],
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
watchlistSchema.index({ isActive: 1, order: 1 });
watchlistSchema.index({ isActive: 1, pinned: -1, "lastMessage.timestamp": -1 });

// Virtual for display name
watchlistSchema.virtual("displayName").get(function () {
  return this.chatName || this.chatId;
});

// Instance methods
watchlistSchema.methods.updateLastMessage = async function (message) {
  this.lastMessage = {
    content: message.body || "",
    timestamp: message.timestamp
      ? new Date(message.timestamp * 1000)
      : new Date(),
    from: message.author || message.from,
    fromMe: message.fromMe || false,
    type: message.type || "chat",
  };
  if (!message.fromMe) {
    this.unreadCount += 1;
  }
  return this.save();
};

watchlistSchema.methods.markAsRead = async function () {
  this.unreadCount = 0;
  return this.save();
};

watchlistSchema.methods.togglePin = async function () {
  this.pinned = !this.pinned;
  return this.save();
};

watchlistSchema.methods.toggleNotifications = async function () {
  this.notifications = !this.notifications;
  return this.save();
};

// Static methods
watchlistSchema.statics.getActiveWatchlist = async function () {
  return this.find({ isActive: true })
    .sort({ pinned: -1, "lastMessage.timestamp": -1 })
    .lean();
};

watchlistSchema.statics.addToWatchlist = async function (chatData) {
  const existing = await this.findOne({ chatId: chatData.chatId });
  if (existing) {
    // Reactivate if was deactivated
    if (!existing.isActive) {
      existing.isActive = true;
      return existing.save();
    }
    return existing;
  }

  const maxOrder = await this.findOne({ isActive: true })
    .sort({ order: -1 })
    .select("order")
    .lean();

  return this.create({
    ...chatData,
    order: (maxOrder?.order || 0) + 1,
  });
};

watchlistSchema.statics.removeFromWatchlist = async function (chatId) {
  return this.findOneAndUpdate({ chatId }, { isActive: false }, { new: true });
};

watchlistSchema.statics.updateChatInfo = async function (chatId, updates) {
  return this.findOneAndUpdate({ chatId }, { $set: updates }, { new: true });
};

watchlistSchema.statics.reorder = async function (orderedIds) {
  const bulkOps = orderedIds.map((chatId, index) => ({
    updateOne: {
      filter: { chatId },
      update: { order: index },
    },
  }));
  return this.bulkWrite(bulkOps);
};

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

module.exports = Watchlist;
