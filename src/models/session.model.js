/**
 * Session Model
 * Stores WhatsApp session metadata (complementary to wwebjs-mongo session storage)
 */

const mongoose = require("mongoose");
const { CLIENT_STATUS } = require("../config/constants");

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      default: "default",
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    pushname: {
      type: String,
      default: null,
    },
    platform: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(CLIENT_STATUS),
      default: CLIENT_STATUS.DISCONNECTED,
    },
    authenticated: {
      type: Boolean,
      default: false,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    lastQRGenerated: {
      type: Date,
      default: null,
    },
    connectionsCount: {
      type: Number,
      default: 0,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Update lastActive on save
sessionSchema.pre("save", function (next) {
  this.lastActive = new Date();
  next();
});

// Instance methods
sessionSchema.methods.markAsActive = async function () {
  this.lastActive = new Date();
  return this.save();
};

sessionSchema.methods.updateStatus = async function (status) {
  this.status = status;
  if (status === CLIENT_STATUS.READY) {
    this.authenticated = true;
    this.connectionsCount += 1;
  } else if (status === CLIENT_STATUS.DISCONNECTED) {
    this.authenticated = false;
  }
  return this.save();
};

// Static methods
sessionSchema.statics.getOrCreate = async function (sessionId = "default") {
  let session = await this.findOne({ sessionId });
  if (!session) {
    session = await this.create({ sessionId });
  }
  return session;
};

sessionSchema.statics.updateClientInfo = async function (sessionId, info) {
  return this.findOneAndUpdate(
    { sessionId },
    {
      phoneNumber: info.wid?.user || info.phoneNumber,
      pushname: info.pushname,
      platform: info.platform,
      authenticated: true,
      status: CLIENT_STATUS.READY,
      lastActive: new Date(),
    },
    { upsert: true, new: true }
  );
};

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
