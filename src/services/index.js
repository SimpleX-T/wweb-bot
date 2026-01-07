/**
 * Services Index
 * Central export for all services
 */

const whatsappService = require("./whatsapp.service");
const groupService = require("./group.service");
const messageService = require("./message.service");
const watchlistService = require("./watchlist.service");
const contactService = require("./contact.service");

module.exports = {
  whatsappService,
  groupService,
  messageService,
  watchlistService,
  contactService,
};
