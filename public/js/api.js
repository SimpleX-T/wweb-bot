/**
 * API Client
 * Handles all HTTP requests to the backend
 */

const API_BASE = "/api";

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === "object") {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || "Request failed");
        error.response = {
          status: response.status,
          data: data,
        };
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async initializeClient() {
    return this.request("/auth/initialize", { method: "POST" });
  }

  async getQRCode() {
    return this.request("/auth/qr");
  }

  async getStatus() {
    return this.request("/auth/status");
  }

  async getClientInfo() {
    return this.request("/auth/info");
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" });
  }

  // Chat endpoints
  async getChats() {
    return this.request("/chats");
  }

  async getChatById(chatId) {
    return this.request(`/chats/${encodeURIComponent(chatId)}`);
  }

  async getChatMessages(chatId, limit = 50) {
    return this.request(
      `/chats/${encodeURIComponent(chatId)}/messages?limit=${limit}`
    );
  }

  async sendMessage(chatId, content, options = {}) {
    return this.request(`/chats/${encodeURIComponent(chatId)}/messages`, {
      method: "POST",
      body: { content, ...options },
    });
  }

  async sendMedia(chatId, mediaData) {
    return this.request(`/chats/${encodeURIComponent(chatId)}/media`, {
      method: "POST",
      body: mediaData,
    });
  }

  async archiveChat(chatId) {
    return this.request(`/chats/${encodeURIComponent(chatId)}/archive`, {
      method: "POST",
    });
  }

  async muteChat(chatId, duration) {
    return this.request(`/chats/${encodeURIComponent(chatId)}/mute`, {
      method: "POST",
      body: { duration },
    });
  }

  async markAsRead(chatId) {
    return this.request(`/chats/${encodeURIComponent(chatId)}/read`, {
      method: "POST",
    });
  }

  // Group endpoints
  async getGroups() {
    return this.request("/groups");
  }

  async getGroupById(groupId) {
    return this.request(`/groups/${encodeURIComponent(groupId)}`);
  }

  async getGroupParticipants(groupId) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/participants`);
  }

  async tagAllMembers(groupId, message = "", hideMentions = false) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/tag-all`, {
      method: "POST",
      body: { message, hideMentions },
    });
  }

  async addParticipants(groupId, participants) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/members/add`, {
      method: "POST",
      body: { participants },
    });
  }

  async removeParticipants(groupId, participants) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/members`, {
      method: "DELETE",
      body: { participants },
    });
  }

  async promoteAdmins(groupId, participants) {
    return this.request(
      `/groups/${encodeURIComponent(groupId)}/admins/promote`,
      {
        method: "PUT",
        body: { participants },
      }
    );
  }

  async demoteAdmins(groupId, participants) {
    return this.request(
      `/groups/${encodeURIComponent(groupId)}/admins/demote`,
      {
        method: "PUT",
        body: { participants },
      }
    );
  }

  async updateGroupSubject(groupId, subject) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/subject`, {
      method: "PUT",
      body: { subject },
    });
  }

  async updateGroupDescription(groupId, description) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/description`, {
      method: "PUT",
      body: { description },
    });
  }

  async getGroupSettings(groupId) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/auto-message`);
  }

  async updateAutoMessage(groupId, type, config) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/auto-message`, {
      method: "PUT",
      body: { type, ...config },
    });
  }

  async toggleAutoMessage(groupId, type) {
    return this.request(
      `/groups/${encodeURIComponent(groupId)}/auto-message/${type}/toggle`,
      {
        method: "POST",
      }
    );
  }

  async setGroupRules(groupId, rules) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/rules`, {
      method: "PUT",
      body: { rules },
    });
  }

  async getInviteLink(groupId) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/invite`);
  }

  async leaveGroup(groupId) {
    return this.request(`/groups/${encodeURIComponent(groupId)}/leave`, {
      method: "POST",
    });
  }

  // Watchlist endpoints
  async getWatchlist() {
    return this.request("/watchlist");
  }

  async addToWatchlist(chatId) {
    return this.request("/watchlist", {
      method: "POST",
      body: { chatId },
    });
  }

  async removeFromWatchlist(chatId) {
    return this.request(`/watchlist/${encodeURIComponent(chatId)}`, {
      method: "DELETE",
    });
  }

  async getWatchlistMessages(chatId, options = {}) {
    const params = new URLSearchParams();
    if (options.limit) params.set("limit", options.limit);
    if (options.before) params.set("before", options.before);
    return this.request(
      `/watchlist/${encodeURIComponent(chatId)}/messages?${params}`
    );
  }

  async toggleWatchlistPin(chatId) {
    return this.request(`/watchlist/${encodeURIComponent(chatId)}/pin`, {
      method: "POST",
    });
  }

  async toggleWatchlistNotifications(chatId) {
    return this.request(
      `/watchlist/${encodeURIComponent(chatId)}/notifications`,
      { method: "POST" }
    );
  }

  async getAvailableChats() {
    return this.request("/watchlist/available");
  }

  async refreshWatchlistChat(chatId) {
    return this.request(`/watchlist/${encodeURIComponent(chatId)}/refresh`, {
      method: "POST",
    });
  }

  // Message endpoints
  async reactToMessage(messageId, emoji) {
    return this.request(`/messages/${encodeURIComponent(messageId)}/react`, {
      method: "POST",
      body: { emoji },
    });
  }

  async deleteMessage(messageId, everyone = false) {
    return this.request(
      `/messages/${encodeURIComponent(messageId)}?everyone=${everyone}`,
      {
        method: "DELETE",
      }
    );
  }

  async forwardMessage(messageId, chatId) {
    return this.request(`/messages/${encodeURIComponent(messageId)}/forward`, {
      method: "POST",
      body: { chatId },
    });
  }

  // Contact endpoints
  async getContacts() {
    return this.request("/contacts");
  }

  async searchContacts(query) {
    return this.request(`/contacts/search?query=${encodeURIComponent(query)}`);
  }

  async checkNumber(phoneNumber) {
    return this.request("/contacts/check", {
      method: "POST",
      body: { phoneNumber },
    });
  }

  async blockContact(contactId) {
    return this.request(`/contacts/${encodeURIComponent(contactId)}/block`, {
      method: "POST",
    });
  }

  async unblockContact(contactId) {
    return this.request(`/contacts/${encodeURIComponent(contactId)}/unblock`, {
      method: "POST",
    });
  }
}

// Export singleton instance
window.api = new ApiClient();
