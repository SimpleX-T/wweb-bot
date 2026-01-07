/**
 * Models Index
 * Central export for all database models
 */

const Session = require("./session.model");
const Watchlist = require("./watchlist.model");
const Message = require("./message.model");
const { GroupSettings, GlobalSettings } = require("./settings.model");

module.exports = {
  Session,
  Watchlist,
  Message,
  GroupSettings,
  GlobalSettings,
};
