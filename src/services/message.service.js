/**
 * Message Service
 * Message sending, receiving, and management operations
 */

const { getClient, isClientReady } = require("../config/whatsapp");
const { MessageMedia, Location, Poll } = require("whatsapp-web.js");
const { Message } = require("../models");
const { ERROR_MESSAGES } = require("../config/constants");
const { formatMessage } = require("../utils/formatters");
const {
  normalizePhoneNumber,
  normalizeGroupId,
  isGroupId,
} = require("../utils/helpers");
const logger = require("../utils/logger");

class MessageService {
  async sendMessage(chatId, content, options = {}) {
    this.ensureReady();
    const client = getClient();
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);
    const messageOptions = {};

    if (options.mentions?.length > 0) {
      const mentionContacts = await Promise.all(
        options.mentions.map((id) =>
          client.getContactById(normalizePhoneNumber(id))
        )
      );
      messageOptions.mentions = mentionContacts.filter(Boolean);
    }

    if (options.quotedMessageId)
      messageOptions.quotedMessageId = options.quotedMessageId;
    if (options.linkPreview !== undefined)
      messageOptions.linkPreview = options.linkPreview;

    const sentMessage = await client.sendMessage(
      normalizedId,
      content,
      messageOptions
    );
    logger.info(`Sent message to ${normalizedId}`);
    return formatMessage(sentMessage);
  }

  async sendMedia(chatId, mediaData, options = {}) {
    this.ensureReady();
    const client = getClient();
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);

    let media;
    if (mediaData.url) {
      media = await MessageMedia.fromUrl(mediaData.url, { unsafeMime: true });
    } else if (mediaData.path) {
      media = MessageMedia.fromFilePath(mediaData.path);
    } else if (mediaData.base64) {
      media = new MessageMedia(
        mediaData.mimetype,
        mediaData.base64,
        mediaData.filename
      );
    } else {
      throw new Error("Invalid media data. Provide url, path, or base64.");
    }

    const messageOptions = { caption: options.caption || "" };
    if (options.sendAsSticker) {
      messageOptions.sendMediaAsSticker = true;
      if (options.stickerAuthor)
        messageOptions.stickerAuthor = options.stickerAuthor;
      if (options.stickerName) messageOptions.stickerName = options.stickerName;
    }
    if (options.sendAsDocument) messageOptions.sendMediaAsDocument = true;
    if (options.viewOnce) messageOptions.isViewOnce = true;

    const sentMessage = await client.sendMessage(
      normalizedId,
      media,
      messageOptions
    );
    logger.info(`Sent media to ${normalizedId}`);
    return formatMessage(sentMessage);
  }

  async sendLocation(chatId, latitude, longitude, options = {}) {
    this.ensureReady();
    const client = getClient();
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);
    const location = new Location(latitude, longitude, {
      name: options.name,
      address: options.address,
    });
    const sentMessage = await client.sendMessage(normalizedId, location);
    logger.info(`Sent location to ${normalizedId}`);
    return formatMessage(sentMessage);
  }

  async sendContact(chatId, contactIds) {
    this.ensureReady();
    const client = getClient();
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);
    const ids = Array.isArray(contactIds) ? contactIds : [contactIds];
    const contacts = await Promise.all(
      ids.map((id) => client.getContactById(normalizePhoneNumber(id)))
    );
    const validContacts = contacts.filter(Boolean);
    if (validContacts.length === 0) throw new Error("No valid contacts found");
    const sentMessage =
      validContacts.length === 1
        ? await client.sendMessage(normalizedId, validContacts[0])
        : await client.sendMessage(normalizedId, validContacts);
    return formatMessage(sentMessage);
  }

  async sendPoll(chatId, question, options, pollOptions = {}) {
    this.ensureReady();
    const client = getClient();
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);
    const poll = new Poll(question, options, {
      allowMultipleAnswers: pollOptions.allowMultipleAnswers ?? false,
    });
    const sentMessage = await client.sendMessage(normalizedId, poll);
    return formatMessage(sentMessage);
  }

  async replyToMessage(messageId, content, options = {}) {
    this.ensureReady();
    const client = getClient();
    const message = await client.getMessageById(messageId);
    if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    const reply = await message.reply(content, options.chatId, options);
    return formatMessage(reply);
  }

  async forwardMessage(messageId, chatId) {
    this.ensureReady();
    const client = getClient();
    const message = await client.getMessageById(messageId);
    if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);
    const forwardedMessage = await message.forward(normalizedId);
    return formatMessage(forwardedMessage);
  }

  async reactToMessage(messageId, emoji) {
    this.ensureReady();
    const client = getClient();
    const message = await client.getMessageById(messageId);
    if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    await message.react(emoji);
    return true;
  }

  async editMessage(messageId, newContent) {
    this.ensureReady();
    const client = getClient();
    const message = await client.getMessageById(messageId);
    if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    if (!message.fromMe) throw new Error("Can only edit messages sent by you");
    const editedMessage = await message.edit(newContent);
    await Message.findOneAndUpdate(
      { messageId },
      { body: newContent, isEdited: true }
    );
    return formatMessage(editedMessage);
  }

  async deleteMessage(messageId, everyone = false) {
    this.ensureReady();
    const client = getClient();
    const message = await client.getMessageById(messageId);
    if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    await message.delete(everyone);
    if (everyone)
      await Message.findOneAndUpdate({ messageId }, { isDeleted: true });
    return true;
  }

  async starMessage(messageId) {
    this.ensureReady();
    const client = getClient();
    const message = await client.getMessageById(messageId);
    if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    await message.star();
    return true;
  }

  async getChatMessages(chatId, options = {}) {
    this.ensureReady();
    const client = getClient();
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);
    const chat = await client.getChatById(normalizedId);
    if (!chat) throw new Error(ERROR_MESSAGES.CHAT_NOT_FOUND);
    const messages = await chat.fetchMessages({ limit: options.limit || 100 });
    return messages.map(formatMessage);
  }

  async downloadMedia(messageId) {
    this.ensureReady();
    const client = getClient();
    const message = await client.getMessageById(messageId);
    if (!message) throw new Error(ERROR_MESSAGES.MESSAGE_NOT_FOUND);
    if (!message.hasMedia) throw new Error("Message does not have media");
    const media = await message.downloadMedia();
    return {
      mimetype: media.mimetype,
      data: media.data,
      filename: media.filename,
    };
  }

  async logMessage(message) {
    return Message.logMessage(message);
  }

  async getLoggedMessages(chatId, options = {}) {
    const normalizedId = isGroupId(chatId)
      ? normalizeGroupId(chatId)
      : normalizePhoneNumber(chatId);
    return Message.getChatMessages(normalizedId, options);
  }

  ensureReady() {
    if (!isClientReady()) throw new Error(ERROR_MESSAGES.CLIENT_NOT_READY);
  }
}

module.exports = new MessageService();
