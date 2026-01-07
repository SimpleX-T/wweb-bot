/**
 * Settings Model
 * Stores bot configuration and auto-message settings
 */

const mongoose = require("mongoose");
const { AUTO_MESSAGE_TYPES } = require("../config/constants");

// Auto-message configuration sub-schema
const autoMessageConfigSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      default: "",
    },
    includeGroupRules: {
      type: Boolean,
      default: false,
    },
    mentionUser: {
      type: Boolean,
      default: true,
    },
    includeMedia: {
      type: Boolean,
      default: false,
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    delay: {
      type: Number,
      default: 3000, // Delay in ms before sending
    },
  },
  { _id: false }
);

// Group-specific settings schema
const groupSettingsSchema = new mongoose.Schema(
  {
    groupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    groupName: {
      type: String,
      required: true,
    },
    autoMessages: {
      welcome: {
        type: autoMessageConfigSchema,
        default: () => ({
          enabled: false,
          message: "Welcome to the group, @{user}! 👋",
          mentionUser: true,
        }),
      },
      farewell: {
        type: autoMessageConfigSchema,
        default: () => ({
          enabled: false,
          message: "Goodbye, {user}! We'll miss you. 👋",
          mentionUser: false,
        }),
      },
      rules: {
        type: autoMessageConfigSchema,
        default: () => ({
          enabled: false,
          message: "",
          mentionUser: false,
        }),
      },
    },
    groupRules: {
      type: String,
      default: "",
    },
    commandPrefix: {
      type: String,
      default: "!",
    },
    enabledCommands: [
      {
        type: String,
      },
    ],
    disabledCommands: [
      {
        type: String,
      },
    ],
    antiSpam: {
      enabled: { type: Boolean, default: false },
      maxMessages: { type: Number, default: 10 },
      timeWindowSeconds: { type: Number, default: 60 },
      action: {
        type: String,
        enum: ["warn", "mute", "remove"],
        default: "warn",
      },
    },
    antiLink: {
      enabled: { type: Boolean, default: false },
      allowedDomains: [{ type: String }],
      action: {
        type: String,
        enum: ["delete", "warn", "remove"],
        default: "delete",
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Global bot settings schema
const globalSettingsSchema = new mongoose.Schema(
  {
    settingsId: {
      type: String,
      default: "global",
      unique: true,
    },
    botName: {
      type: String,
      default: "WhatsApp Bot",
    },
    botDescription: {
      type: String,
      default: "A powerful WhatsApp automation bot",
    },
    defaultCommandPrefix: {
      type: String,
      default: "!",
    },
    maxMessagesPerMinute: {
      type: Number,
      default: 30,
    },
    enableLogging: {
      type: Boolean,
      default: true,
    },
    logRetentionDays: {
      type: Number,
      default: 30,
    },
    defaultWelcomeMessage: {
      type: String,
      default: "Welcome to the group! 👋",
    },
    defaultFarewellMessage: {
      type: String,
      default: "Goodbye! 👋",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    webhooks: [
      {
        name: { type: String },
        url: { type: String },
        events: [{ type: String }],
        enabled: { type: Boolean, default: true },
      },
    ],
    notifications: {
      email: {
        enabled: { type: Boolean, default: false },
        address: { type: String },
      },
      slack: {
        enabled: { type: Boolean, default: false },
        webhookUrl: { type: String },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Instance methods for GroupSettings
groupSettingsSchema.methods.updateAutoMessage = async function (type, config) {
  if (!Object.values(AUTO_MESSAGE_TYPES).includes(type)) {
    throw new Error("Invalid auto-message type");
  }
  this.autoMessages[type] = { ...this.autoMessages[type], ...config };
  return this.save();
};

groupSettingsSchema.methods.toggleAutoMessage = async function (type) {
  if (!Object.values(AUTO_MESSAGE_TYPES).includes(type)) {
    throw new Error("Invalid auto-message type");
  }
  this.autoMessages[type].enabled = !this.autoMessages[type].enabled;
  return this.save();
};

groupSettingsSchema.methods.setGroupRules = async function (rules) {
  this.groupRules = rules;
  return this.save();
};

// Static methods for GroupSettings
groupSettingsSchema.statics.getOrCreate = async function (groupId, groupName) {
  let settings = await this.findOne({ groupId });
  if (!settings) {
    settings = await this.create({ groupId, groupName });
  }
  return settings;
};

groupSettingsSchema.statics.getGroupsWithAutoMessage = async function (type) {
  return this.find({
    [`autoMessages.${type}.enabled`]: true,
    isActive: true,
  }).lean();
};

// Static methods for GlobalSettings
globalSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ settingsId: "global" });
  if (!settings) {
    settings = await this.create({ settingsId: "global" });
  }
  return settings;
};

globalSettingsSchema.statics.updateSettings = async function (updates) {
  return this.findOneAndUpdate(
    { settingsId: "global" },
    { $set: updates },
    { new: true, upsert: true }
  );
};

const GroupSettings = mongoose.model("GroupSettings", groupSettingsSchema);
const GlobalSettings = mongoose.model("GlobalSettings", globalSettingsSchema);

module.exports = {
  GroupSettings,
  GlobalSettings,
};
