/**
 * Contact Service
 * Contact management operations
 */

const { getClient, isClientReady } = require("../config/whatsapp");
const { ERROR_MESSAGES } = require("../config/constants");
const { formatContact } = require("../utils/formatters");
const { normalizePhoneNumber } = require("../utils/helpers");
const logger = require("../utils/logger");

class ContactService {
  /**
   * Get all contacts
   */
  async getAllContacts() {
    this.ensureReady();
    const client = getClient();

    const contacts = await client.getContacts();
    return contacts.map(formatContact);
  }

  /**
   * Get contact by ID
   */
  async getContactById(contactId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizePhoneNumber(contactId);
    const contact = await client.getContactById(normalizedId);

    if (!contact) {
      throw new Error(ERROR_MESSAGES.CONTACT_NOT_FOUND);
    }

    const formatted = formatContact(contact);

    // Get profile picture
    try {
      formatted.profilePicUrl = await client.getProfilePicUrl(normalizedId);
    } catch (err) {
      formatted.profilePicUrl = null;
    }

    return formatted;
  }

  /**
   * Check if a number is registered on WhatsApp
   */
  async checkNumber(phoneNumber) {
    this.ensureReady();
    const client = getClient();

    const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
    const numberId = await client.getNumberId(cleanNumber);

    return {
      phoneNumber: cleanNumber,
      registered: numberId !== null,
      whatsappId: numberId?._serialized || null,
    };
  }

  /**
   * Check multiple numbers
   */
  async checkMultipleNumbers(phoneNumbers) {
    const results = await Promise.all(
      phoneNumbers.map((number) => this.checkNumber(number))
    );

    return results;
  }

  /**
   * Get contact profile picture
   */
  async getProfilePicture(contactId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizePhoneNumber(contactId);

    try {
      const url = await client.getProfilePicUrl(normalizedId);
      return { contactId: normalizedId, url };
    } catch (err) {
      return { contactId: normalizedId, url: null };
    }
  }

  /**
   * Get common groups with a contact
   */
  async getCommonGroups(contactId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizePhoneNumber(contactId);
    const groups = await client.getCommonGroups(normalizedId);

    return groups.map((group) => ({
      id: group.id._serialized,
      name: group.name,
    }));
  }

  /**
   * Block a contact
   */
  async blockContact(contactId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizePhoneNumber(contactId);
    const contact = await client.getContactById(normalizedId);

    if (!contact) {
      throw new Error(ERROR_MESSAGES.CONTACT_NOT_FOUND);
    }

    await contact.block();
    logger.info(`Blocked contact ${normalizedId}`);

    return true;
  }

  /**
   * Unblock a contact
   */
  async unblockContact(contactId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizePhoneNumber(contactId);
    const contact = await client.getContactById(normalizedId);

    if (!contact) {
      throw new Error(ERROR_MESSAGES.CONTACT_NOT_FOUND);
    }

    await contact.unblock();
    logger.info(`Unblocked contact ${normalizedId}`);

    return true;
  }

  /**
   * Get blocked contacts
   */
  async getBlockedContacts() {
    this.ensureReady();
    const client = getClient();

    const contacts = await client.getBlockedContacts();
    return contacts.map(formatContact);
  }

  /**
   * Get about/status of a contact
   */
  async getAbout(contactId) {
    this.ensureReady();
    const client = getClient();

    const normalizedId = normalizePhoneNumber(contactId);
    const contact = await client.getContactById(normalizedId);

    if (!contact) {
      throw new Error(ERROR_MESSAGES.CONTACT_NOT_FOUND);
    }

    return {
      contactId: normalizedId,
      about: contact.about || null,
    };
  }

  /**
   * Search contacts by name or number
   */
  async searchContacts(query) {
    this.ensureReady();
    const client = getClient();

    const contacts = await client.getContacts();
    const lowerQuery = query.toLowerCase();

    const filtered = contacts.filter((contact) => {
      const name = (contact.name || "").toLowerCase();
      const pushname = (contact.pushname || "").toLowerCase();
      const number = contact.number || "";

      return (
        name.includes(lowerQuery) ||
        pushname.includes(lowerQuery) ||
        number.includes(query)
      );
    });

    return filtered.map(formatContact);
  }

  ensureReady() {
    if (!isClientReady()) {
      throw new Error(ERROR_MESSAGES.CLIENT_NOT_READY);
    }
  }
}

module.exports = new ContactService();
