/**
 * Controllers Index
 */

const authController = require("./auth.controller");
const groupController = require("./group.controller");
const chatController = require("./chat.controller");
const watchlistController = require("./watchlist.controller");
const messageController = require("./message.controller");
const contactController = require("./contact.controller");

module.exports = {
  authController,
  groupController,
  chatController,
  watchlistController,
  messageController,
  contactController,
};
