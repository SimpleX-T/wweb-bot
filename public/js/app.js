/**
 * WhatsApp Bot Dashboard - Main Application
 */

class WhatsAppDashboard {
  constructor() {
    this.socket = null;
    this.currentChat = null;
    this.watchlist = [];
    this.allChats = [];
    this.currentTab = "watchlist";
    this.isConnected = false;

    this.init();
  }

  async init() {
    this.cacheElements();
    this.bindEvents();
    this.initSocket();
    this.initContextMenu();
    await this.checkStatus();
  }

  cacheElements() {
    // Screens
    this.authScreen = document.getElementById("auth-screen");
    this.dashboardScreen = document.getElementById("dashboard-screen");

    // Auth elements
    this.qrLoading = document.getElementById("qr-loading");
    this.qrCode = document.getElementById("qr-code");
    this.qrImage = document.getElementById("qr-image");
    this.qrAuthenticated = document.getElementById("qr-authenticated");
    this.statusIndicator = document.getElementById("status-indicator");
    this.statusText = document.getElementById("status-text");
    this.initBtn = document.getElementById("init-btn");

    // Dashboard elements
    this.userAvatar = document.getElementById("user-avatar");
    this.userInitial = document.getElementById("user-initial");
    this.userName = document.getElementById("user-name");
    this.searchInput = document.getElementById("search-input");
    this.chatList = document.getElementById("chat-list");
    this.addChatBtn = document.getElementById("add-chat-btn");

    // Chat view elements
    this.emptyState = document.getElementById("empty-state");
    this.chatContent = document.getElementById("chat-content");
    this.chatAvatar = document.getElementById("chat-avatar");
    this.chatName = document.getElementById("chat-name");
    this.chatMeta = document.getElementById("chat-meta");
    this.messagesContainer = document.getElementById("messages-container");
    this.messageInput = document.getElementById("message-input");
    this.sendBtn = document.getElementById("send-btn");
    this.attachBtn = document.getElementById("attach-btn");
    this.mediaInput = document.getElementById("media-input");

    // Emoji & Reply
    this.emojiBtn = document.getElementById("emoji-btn");
    this.emojiPickerContainer = document.getElementById(
      "emoji-picker-container"
    );
    this.replyBar = document.getElementById("reply-bar");
    this.replyAuthor = document.getElementById("reply-author");
    this.replyText = document.getElementById("reply-text");
    this.replyClose = document.getElementById("reply-close");

    // Action buttons
    this.refreshBtn = document.getElementById("refresh-btn");
    this.tagAllBtn = document.getElementById("tag-all-btn");
    this.membersBtn = document.getElementById("members-btn");
    this.groupSettingsBtn = document.getElementById("group-settings-btn");

    // Panel
    this.actionPanel = document.getElementById("action-panel");
    this.panelTitle = document.getElementById("panel-title");
    this.panelContent = document.getElementById("panel-content");
    this.closePanelBtn = document.getElementById("close-panel-btn");

    // Modal
    this.modalOverlay = document.getElementById("modal-overlay");
    this.modal = document.getElementById("modal");
    this.modalTitle = document.getElementById("modal-title");
    this.modalBody = document.getElementById("modal-body");
    this.closeModalBtn = document.getElementById("close-modal-btn");

    // Toast
    this.toastContainer = document.getElementById("toast-container");

    // State
    this.replyingTo = null;
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.switchTab(e.target.dataset.tab)
      );
    });

    // Search
    this.searchInput.addEventListener("input", (e) =>
      this.handleSearch(e.target.value)
    );

    // Add to watchlist
    this.addChatBtn.addEventListener("click", () => this.showAddChatModal());

    // Message sending
    this.sendBtn.addEventListener("click", () => this.sendMessage());
    this.messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Media attachment
    this.attachBtn.addEventListener("click", () => this.mediaInput.click());
    this.mediaInput.addEventListener("change", (e) =>
      this.handleMediaSelect(e)
    );

    // Emoji picker
    this.emojiBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleEmojiPicker();
    });

    document.addEventListener("click", (e) => {
      if (
        !this.emojiPickerContainer.contains(e.target) &&
        e.target !== this.emojiBtn
      ) {
        this.closeEmojiPicker();
      }
    });

    // Emoji picker selection
    setTimeout(() => {
      const emojiPicker =
        this.emojiPickerContainer.querySelector("emoji-picker");
      if (emojiPicker) {
        emojiPicker.addEventListener("emoji-click", (e) => {
          this.insertEmoji(e.detail.unicode);
        });
      }
    }, 1000);

    // Reply bar
    this.replyClose.addEventListener("click", () => this.cancelReply());

    // Chat actions
    this.refreshBtn.addEventListener("click", () => this.refreshCurrentChat());
    this.tagAllBtn.addEventListener("click", () => this.showTagAllModal());
    this.membersBtn.addEventListener("click", () => this.showMembersPanel());
    this.groupSettingsBtn.addEventListener("click", () =>
      this.showSettingsPanel()
    );

    // Panel close
    this.closePanelBtn.addEventListener("click", () => this.closePanel());

    // Modal close
    this.closeModalBtn.addEventListener("click", () => this.closeModal());
    this.modalOverlay.addEventListener("click", (e) => {
      if (e.target === this.modalOverlay) this.closeModal();
    });

    // Init button (for reconnect)
    this.initBtn.addEventListener("click", () => this.initializeClient());
  }

  initSocket() {
    this.socket = io({
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    // Connection events
    this.socket.on("connect", () => {
      console.log("Socket connected");
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    // Client status events
    this.socket.on("client:status", (data) => {
      this.handleStatusChange(data.status);
    });

    this.socket.on("client:qr", (data) => {
      this.showQRCode(data.qr);
    });

    this.socket.on("client:ready", (info) => {
      this.handleClientReady(info);
    });

    this.socket.on("client:disconnected", (data) => {
      this.handleDisconnected(data.reason);
    });

    // Message events
    this.socket.on("message:new", (message) => {
      this.handleNewMessage(message);
    });

    this.socket.on("watchlist:message", (data) => {
      this.handleWatchlistMessage(data);
    });

    this.socket.on("message:ack", (data) => {
      this.updateMessageAck(data);
    });

    // Group events
    this.socket.on("group:join", (data) => {
      this.toast(`New member joined ${data.chatId}`, "info");
    });

    this.socket.on("group:leave", (data) => {
      this.toast(`Member left ${data.chatId}`, "info");
    });
  }

  async checkStatus() {
    try {
      const response = await api.getStatus();
      const { status, isReady, hasQR, session } = response.data;

      this.handleStatusChange(status);

      if (isReady && session) {
        this.handleClientReady(session);
      } else if (hasQR || status === "qr_ready") {
        // Fetch and show the QR code
        await this.showQRCode(null);
      } else if (status === "initializing" && session && session.phoneNumber) {
        // Session is being restored - show "Restoring session" message
        this.updateStatus("connecting", "Restoring session...");
        this.qrLoading.querySelector("p").textContent =
          "Restoring previous session...";
        // Poll for status updates
        setTimeout(() => this.checkStatus(), 3000);
      } else if (status === "initializing") {
        // Still initializing, poll again
        setTimeout(() => this.checkStatus(), 3000);
      }
    } catch (error) {
      console.error("Failed to check status:", error);
      this.updateStatus("error", "Failed to connect");
    }
  }

  handleStatusChange(status) {
    const statusMap = {
      initializing: { text: "Initializing...", class: "connecting" },
      qr_ready: { text: "Scan QR Code", class: "connecting" },
      authenticated: { text: "Authenticated", class: "connecting" },
      ready: { text: "Connected", class: "connected" },
      disconnected: { text: "Disconnected", class: "error" },
      failed: { text: "Connection Failed", class: "error" },
    };

    const statusInfo = statusMap[status] || { text: status, class: "" };
    this.updateStatus(statusInfo.class, statusInfo.text);

    if (status === "disconnected" || status === "failed") {
      this.initBtn.classList.remove("hidden");
    }
  }

  updateStatus(statusClass, text) {
    this.statusIndicator.className = "status-indicator " + statusClass;
    this.statusText.textContent = text;
  }

  async showQRCode(qr) {
    this.qrLoading.classList.add("hidden");
    this.qrAuthenticated.classList.add("hidden");
    this.qrCode.classList.remove("hidden");

    // If it's a data URL, use directly
    if (qr && qr.startsWith("data:")) {
      this.qrImage.src = qr;
    } else {
      // Fetch the QR code as data URL from the API
      try {
        const response = await api.getQRCode();
        if (response.data && response.data.qr) {
          this.qrImage.src = response.data.qr;
        } else {
          console.error("No QR code available");
          this.qrLoading.classList.remove("hidden");
          this.qrCode.classList.add("hidden");
        }
      } catch (error) {
        console.error("Failed to fetch QR code:", error);
        this.qrLoading.classList.remove("hidden");
        this.qrCode.classList.add("hidden");
      }
    }
  }

  async handleClientReady(info) {
    this.isConnected = true;

    // Update UI
    this.qrCode.classList.add("hidden");
    this.qrLoading.classList.add("hidden");
    this.qrAuthenticated.classList.remove("hidden");
    this.initBtn.classList.add("hidden");

    // Switch to dashboard after animation
    setTimeout(() => {
      this.showDashboard(info);
    }, 1000);
  }

  handleDisconnected(reason) {
    this.isConnected = false;
    this.showAuthScreen();
    this.toast(`Disconnected: ${reason}`, "error");
  }

  showAuthScreen() {
    this.authScreen.classList.remove("hidden");
    this.dashboardScreen.classList.add("hidden");
    this.qrLoading.classList.remove("hidden");
    this.qrCode.classList.add("hidden");
    this.qrAuthenticated.classList.add("hidden");
  }

  async showDashboard(info) {
    this.authScreen.classList.add("hidden");
    this.dashboardScreen.classList.remove("hidden");

    // Update user info
    if (info) {
      this.userName.textContent = info.pushname || info.phoneNumber || "User";
      this.userInitial.textContent = (info.pushname || "U")[0].toUpperCase();
    }

    // Load watchlist
    await this.loadWatchlist();
  }

  async loadWatchlist() {
    try {
      const response = await api.getWatchlist();
      this.watchlist = response.data || [];
      this.renderChatList();
    } catch (error) {
      console.error("Failed to load watchlist:", error);
      this.toast("Failed to load watchlist", "error");
    }
  }

  async loadAllChats() {
    this.chatList.innerHTML =
      '<div class="loading" style="padding:20px;text-align:center;">Loading chats...<br><small style="color:var(--text-muted)">This may take a while</small></div>';
    try {
      const response = await api.getChats();
      this.allChats = response.data || [];
      this.renderChatList();
    } catch (error) {
      console.error("Failed to load chats:", error);
      this.chatList.innerHTML =
        '<div class="empty-list" style="color:var(--error);">Failed to load chats. Try the Watchlist tab instead.</div>';
      this.toast("Loading chats is slow. Add chats by ID instead.", "warning");
    }
  }

  async loadGroups() {
    this.chatList.innerHTML =
      '<div class="loading" style="padding:20px;text-align:center;">Loading groups...<br><small style="color:var(--text-muted)">This may take a while</small></div>';
    try {
      const response = await api.getGroups();
      this.allChats = response.data || [];
      this.renderChatList();
    } catch (error) {
      console.error("Failed to load groups:", error);
      this.chatList.innerHTML =
        '<div class="empty-list" style="color:var(--error);">Failed to load groups. Try adding by Group ID.</div>';
      this.toast(
        "Loading groups is slow. Add groups by ID instead.",
        "warning"
      );
    }
  }

  switchTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    // Load appropriate data
    switch (tab) {
      case "watchlist":
        this.loadWatchlist();
        break;
      case "all":
        this.loadAllChats();
        break;
      case "groups":
        this.loadGroups();
        break;
    }
  }

  initContextMenu() {
    // Create menu element
    this.contextMenu = document.createElement("div");
    this.contextMenu.className = "context-menu";
    this.contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="add-watchlist">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Add to Watchlist
      </div>
    `;
    document.body.appendChild(this.contextMenu);

    // Hide on click outside
    document.addEventListener("click", () => this.hideContextMenu());

    // Handle menu actions
    this.contextMenu.addEventListener("click", (e) => {
      const item = e.target.closest(".context-menu-item");
      if (item) {
        const action = item.dataset.action;
        if (action === "add-watchlist" && this.contextMenuTarget) {
          this.addToWatchlist(this.contextMenuTarget);
        }
        this.hideContextMenu();
      }
    });
  }

  showContextMenu(e, chatId) {
    e.preventDefault();
    this.contextMenuTarget = chatId;

    // Position menu
    const x = e.clientX;
    const y = e.clientY;

    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.style.display = "block";
  }

  hideContextMenu() {
    if (this.contextMenu) {
      this.contextMenu.style.display = "none";
      this.contextMenuTarget = null;
    }
  }

  renderChatList() {
    const chats =
      this.currentTab === "watchlist" ? this.watchlist : this.allChats;

    if (chats.length === 0) {
      this.chatList.innerHTML = `
        <div class="empty-list">
          <p>No chats found</p>
        </div>
      `;
      return;
    }

    this.chatList.innerHTML = chats
      .map((chat) => this.renderChatItem(chat))
      .join("");

    // Add click handlers
    this.chatList.querySelectorAll(".chat-item").forEach((item) => {
      item.addEventListener("click", () =>
        this.selectChat(item.dataset.chatId)
      );

      // Add context menu handler
      item.addEventListener("contextmenu", (e) =>
        this.showContextMenu(e, item.dataset.chatId)
      );
    });
  }

  renderChatItem(chat) {
    const id = chat.chatId || chat.id;
    const name = chat.chatName || chat.name || "Unknown";
    const initial = name[0].toUpperCase();
    const isGroup = chat.chatType === "group" || chat.isGroup;
    const unreadCount = chat.unreadCount || 0;
    const lastMessage = chat.lastMessage;
    const time = lastMessage?.timestamp
      ? this.formatTime(new Date(lastMessage.timestamp))
      : "";
    const preview = lastMessage?.content || lastMessage?.preview || "";
    const pfp = chat.profilePicUrl || "";
    console.log(pfp);

    return `
      <div class="chat-item ${
        this.currentChat?.chatId === id ? "active" : ""
      }" data-chat-id="${id}">
        <div class="chat-item-avatar">
          <img src="${pfp}" alt="${name}" class="avatar"/>
        </div>
        <div class="chat-item-content">
          <div class="chat-item-header">
            <span class="chat-item-name">${this.escapeHtml(name)}</span>
            <span class="chat-item-time ${
              unreadCount > 0 ? "unread" : ""
            }">${time}</span>
          </div>
          <div class="chat-item-preview">
            <span class="chat-item-message">${this.escapeHtml(
              this.truncate(preview, 40)
            )}</span>
            ${
              unreadCount > 0
                ? `<span class="chat-item-badge">${unreadCount}</span>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  async selectChat(chatId) {
    // Find chat in watchlist or all chats
    let chat = this.watchlist.find((c) => c.chatId === chatId);
    if (!chat) {
      chat = this.allChats.find((c) => (c.chatId || c.id) === chatId);
    }

    if (!chat) {
      this.toast("Chat not found", "error");
      return;
    }

    this.currentChat = chat;

    // Update UI
    this.emptyState.classList.add("hidden");
    this.chatContent.classList.remove("hidden");

    const name = chat.chatName || chat.name || "Unknown";
    this.chatName.textContent = name;
    this.chatAvatar.innerHTML = `<span>${name[0].toUpperCase()}</span>`;

    const isGroup = chat.chatType === "group" || chat.isGroup;
    this.chatMeta.textContent = isGroup ? "Group" : "Contact";

    // Show/hide group-specific buttons
    this.tagAllBtn.classList.toggle("hidden", !isGroup);
    this.membersBtn.classList.toggle("hidden", !isGroup);
    this.groupSettingsBtn.classList.toggle("hidden", !isGroup);

    // Update active state in list
    this.chatList.querySelectorAll(".chat-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.chatId === chatId);
    });

    // Load messages
    await this.loadMessages(chatId);

    // Focus message input for immediate typing
    this.messageInput.focus();

    // Mark as read if in watchlist
    if (this.currentTab === "watchlist") {
      try {
        await api.markAsRead(chatId);
        chat.unreadCount = 0;
        this.renderChatList();
      } catch (err) {
        // Ignore error
      }
    }

    // Subscribe to chat updates
    this.socket.emit("subscribe", { chatId });
  }

  async loadMessages(chatId) {
    this.messagesContainer.innerHTML =
      '<div class="loading">Loading messages...</div>';

    try {
      const response =
        this.currentTab === "watchlist"
          ? await api.getWatchlistMessages(chatId, { limit: 100 })
          : await api.getChatMessages(chatId, 100);

      const messages = response.data || [];
      this.renderMessages(messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
      this.messagesContainer.innerHTML =
        '<div class="error">Failed to load messages</div>';
    }
  }

  renderMessages(messages) {
    if (messages.length === 0) {
      this.messagesContainer.innerHTML =
        '<div class="empty-messages">No messages yet</div>';
      return;
    }

    // Store messages for later reference
    this.currentMessages = messages;

    let html = "";
    let lastDate = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.timestamp);
      const dateStr = msgDate.toDateString();

      // Add date separator
      if (dateStr !== lastDate) {
        html += `<div class="date-separator"><span>${this.formatDate(
          msgDate
        )}</span></div>`;
        lastDate = dateStr;
      }

      html += this.renderMessage(msg);
    });

    this.messagesContainer.innerHTML = html;
    this.scrollToBottom();

    // Add event delegation for message actions
    this.messagesContainer.addEventListener("click", (e) => {
      const actionBtn = e.target.closest(".message-action-btn");
      if (actionBtn) {
        const messageEl = actionBtn.closest(".message");
        const messageId = messageEl?.dataset.messageId;
        const action = actionBtn.dataset.action;
        if (messageId && action) {
          this.handleMessageAction(action, messageId);
        }
      }
    });
  }

  renderMessage(msg) {
    const isOutgoing = msg.fromMe;
    const time = this.formatTime(new Date(msg.timestamp));
    const author = msg.author ? this.formatPhoneNumber(msg.author) : "";
    const isGroup =
      this.currentChat?.chatType === "group" || this.currentChat?.isGroup;

    // Render quoted message if present
    let quotedHtml = "";
    if (msg.hasQuotedMsg) {
      quotedHtml = `
        <div class="quoted-message">
          <div class="quoted-message-author">${
            isOutgoing ? "You" : author || "Unknown"
          }</div>
          <div class="quoted-message-text">${this.escapeHtml(
            msg.quotedMsg?.body || "[Media]"
          )}</div>
        </div>
      `;
    }

    // Render media if present
    let mediaHtml = "";
    if (msg.hasMedia && msg.media) {
      mediaHtml = this.renderMedia(msg);
    }

    // Action menu
    const actionsHtml = `
      <div class="message-actions">
        <button class="message-action-btn" data-action="reply" title="Reply">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
          </svg>
        </button>
        <button class="message-action-btn" data-action="forward" title="Forward">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 8V4l8 8-8 8v-4H4V8z"/>
          </svg>
        </button>
        <button class="message-action-btn" data-action="react" title="React">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
          </svg>
        </button>
      </div>
    `;

    return `
      <div class="message ${
        isOutgoing ? "outgoing" : "incoming"
      }" data-message-id="${msg.id}">
        ${actionsHtml}
        ${
          !isOutgoing && isGroup && author
            ? `<div class="message-author">${author}</div>`
            : ""
        }
        ${quotedHtml}
        ${mediaHtml}
        ${
          msg.body
            ? `<div class="message-body">${this.formatMessageBody(
                msg.body
              )}</div>`
            : ""
        }
        <div class="message-footer">
          <span class="message-time">${time}</span>
          ${isOutgoing ? this.renderMessageStatus(msg.ack) : ""}
        </div>
      </div>
    `;
  }

  renderMessageStatus(ack) {
    const ackLevel = ack?.status ?? ack ?? 0;
    const isRead = ackLevel >= 3;

    return `
      <span class="message-status ${isRead ? "read" : ""}">
        <svg viewBox="0 0 16 15" fill="currentColor">
          ${
            ackLevel >= 1
              ? '<path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>'
              : ""
          }
        </svg>
      </span>
    `;
  }

  renderMedia(msg) {
    const { media } = msg;
    const messageId = msg.id;

    // Get media URL - either from media.data (base64) or fetch from API
    const getMediaUrl = () => {
      if (media.data) {
        return `data:${media.mimetype};base64,${media.data}`;
      }
      return `/api/messages/${encodeURIComponent(messageId)}/media`;
    };

    const mediaUrl = getMediaUrl();
    const mimetype = media.mimetype || "";

    if (mimetype.startsWith("image/")) {
      return `
        <div class="message-media">
          <img src="${mediaUrl}" alt="Image" class="media-image" loading="lazy" />
        </div>
      `;
    } else if (mimetype.startsWith("video/")) {
      return `
        <div class="message-media">
          <video controls class="media-video">
            <source src="${mediaUrl}" type="${mimetype}">
            Your browser does not support the video tag.
          </video>
        </div>
      `;
    } else if (mimetype.startsWith("audio/")) {
      return `
        <div class="message-media">
          <audio controls class="media-audio">
            <source src="${mediaUrl}" type="${mimetype}">
            Your browser does not support the audio tag.
          </audio>
        </div>
      `;
    } else {
      // Generic file
      return `
        <div class="message-media">
          <a href="${mediaUrl}" download class="media-file">
            <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
            <span>${media.filename || "File"}</span>
          </a>
        </div>
      `;
    }
  }

  async handleMediaSelect(e) {
    const file = e.target.files[0];
    if (!file || !this.currentChat) return;

    const chatId = this.currentChat.chatId || this.currentChat.id;

    try {
      // Show loading toast
      this.toast("Uploading media...", "info");

      // Convert file to base64
      const base64 = await this.fileToBase64(file);

      // Send media
      await api.sendMedia(chatId, {
        base64: base64.split(",")[1], // Remove data:image/jpeg;base64, prefix
        mimetype: file.type,
        filename: file.name,
      });

      this.toast("Media sent successfully", "success");

      // Clear input
      this.mediaInput.value = "";

      // Reload messages
      await this.loadMessages(chatId);
    } catch (error) {
      console.error("Failed to send media:", error);
      this.toast("Failed to send media", "error");
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Emoji Picker Methods
  toggleEmojiPicker() {
    this.emojiPickerContainer.classList.toggle("active");
  }

  closeEmojiPicker() {
    this.emojiPickerContainer.classList.remove("active");
  }

  insertEmoji(emoji) {
    const input = this.messageInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;

    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();

    this.closeEmojiPicker();
  }

  // Reply Methods
  setReplyTo(message) {
    this.replyingTo = message;
    this.replyAuthor.textContent = message.fromMe
      ? "You"
      : this.formatPhoneNumber(message.author) || "Unknown";
    this.replyText.textContent = message.body || "[Media]";
    this.replyBar.classList.add("active");
    this.messageInput.focus();
  }

  cancelReply() {
    this.replyingTo = null;
    this.replyBar.classList.remove("active");
  }

  // Message Action Handler
  async handleMessageAction(action, messageId) {
    const message = this.currentMessages?.find((m) => m.id === messageId);

    if (action === "reply") {
      if (message) this.setReplyTo(message);
    } else if (action === "forward") {
      await this.showForwardModal(messageId);
    } else if (action === "react") {
      this.showReactionPicker(messageId);
    }
  }

  // Forward Modal
  async showForwardModal(messageId) {
    this.openModal(
      "Forward Message",
      `
      <div class="form-group">
        <label class="form-label">Select Chat</label>
        <select id="forward-chat" class="form-select" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-primary);">
          <option value="">Loading chats...</option>
        </select>
      </div>
      <button class="btn btn-primary" id="confirm-forward" style="width:100%;">Forward</button>
    `
    );

    try {
      const response = await api.getChats();
      const select = document.getElementById("forward-chat");
      select.innerHTML = '<option value="">Select a chat...</option>';

      response.data.forEach((chat) => {
        const option = document.createElement("option");
        option.value = chat.id;
        option.textContent = chat.name || chat.id;
        select.appendChild(option);
      });

      document
        .getElementById("confirm-forward")
        .addEventListener("click", async () => {
          const chatId = select.value;
          if (!chatId) {
            this.toast("Please select a chat", "error");
            return;
          }

          try {
            await api.forwardMessage(messageId, chatId);
            this.toast("Message forwarded", "success");
            this.closeModal();
          } catch (error) {
            this.toast("Failed to forward message", "error");
          }
        });
    } catch (error) {
      this.toast("Failed to load chats", "error");
    }
  }

  // Reaction Picker
  showReactionPicker(messageId) {
    const messageEl = document.querySelector(
      `[data-message-id="${messageId}"]`
    );
    if (!messageEl) return;

    // Remove any existing picker
    const existingPicker = document.querySelector(".reaction-picker");
    if (existingPicker) existingPicker.remove();

    const picker = document.createElement("div");
    picker.className = "reaction-picker active";
    picker.innerHTML = `
      <button class="reaction-btn" data-emoji="👍">👍</button>
      <button class="reaction-btn" data-emoji="❤️">❤️</button>
      <button class="reaction-btn" data-emoji="😂">😂</button>
      <button class="reaction-btn" data-emoji="😮">😮</button>
      <button class="reaction-btn" data-emoji="😢">😢</button>
      <button class="reaction-btn" data-emoji="🙏">🙏</button>
    `;

    messageEl.style.position = "relative";
    messageEl.appendChild(picker);

    picker.querySelectorAll(".reaction-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const emoji = btn.dataset.emoji;
        await this.handleReact(messageId, emoji);
        picker.remove();
      });
    });

    // Close on click outside
    setTimeout(() => {
      const closeHandler = (e) => {
        if (!picker.contains(e.target)) {
          picker.remove();
          document.removeEventListener("click", closeHandler);
        }
      };
      document.addEventListener("click", closeHandler);
    }, 100);
  }

  async handleReact(messageId, emoji) {
    try {
      await api.reactToMessage(messageId, emoji);
      await this.loadMessages(this.currentChat.chatId || this.currentChat.id);
      this.toast("Reaction added", "success");
    } catch (error) {
      console.error("Failed to react:", error);
      this.toast("Failed to add reaction", "error");
    }
  }

  async sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content || !this.currentChat) return;

    const chatId = this.currentChat.chatId || this.currentChat.id;

    // Clear input immediately
    this.messageInput.value = "";

    try {
      const options = {};

      // Include quoted message if replying
      if (this.replyingTo) {
        options.quotedMessageId = this.replyingTo.id;
        this.cancelReply();
      }

      await api.sendMessage(chatId, content, options);

      // Reload messages
      await this.loadMessages(chatId);
    } catch (error) {
      console.error("Failed to send message:", error);
      this.toast("Failed to send message", "error");
    }
  }

  handleNewMessage(message) {
    // Check if it's for current chat
    const chatId = this.currentChat?.chatId || this.currentChat?.id;
    const msgChatId = message.from.includes("@g.us")
      ? message.from
      : message.fromMe
      ? message.to
      : message.from;

    if (chatId === msgChatId) {
      this.messagesContainer.insertAdjacentHTML(
        "beforeend",
        this.renderMessage(message)
      );
      this.scrollToBottom();
    }
  }

  handleWatchlistMessage(data) {
    // Update watchlist item
    const item = this.watchlist.find((c) => c.chatId === data.chatId);
    if (item) {
      item.lastMessage = {
        content: data.message.body,
        timestamp: data.message.timestamp,
        fromMe: data.message.fromMe,
      };
      if (
        !data.message.fromMe &&
        data.chatId !== (this.currentChat?.chatId || this.currentChat?.id)
      ) {
        item.unreadCount = (item.unreadCount || 0) + 1;
      }
      this.renderChatList();
    }

    // If it's current chat, add message
    if (data.chatId === (this.currentChat?.chatId || this.currentChat?.id)) {
      this.messagesContainer.insertAdjacentHTML(
        "beforeend",
        this.renderMessage(data.message)
      );
      this.scrollToBottom();
    }
  }

  updateMessageAck(data) {
    const msgEl = this.messagesContainer.querySelector(
      `[data-message-id="${data.messageId}"]`
    );
    if (msgEl) {
      const statusEl = msgEl.querySelector(".message-status");
      if (statusEl) {
        statusEl.outerHTML = this.renderMessageStatus({ status: data.ack });
      }
    }
  }

  handleSearch(query) {
    const chats =
      this.currentTab === "watchlist" ? this.watchlist : this.allChats;
    const filtered = chats.filter((chat) => {
      const name = (chat.chatName || chat.name || "").toLowerCase();
      return name.includes(query.toLowerCase());
    });

    // Temporarily replace and render
    const original =
      this.currentTab === "watchlist" ? this.watchlist : this.allChats;
    if (this.currentTab === "watchlist") {
      this.watchlist = filtered;
    } else {
      this.allChats = filtered;
    }
    this.renderChatList();

    // Restore after render
    if (this.currentTab === "watchlist") {
      this.watchlist = original;
    } else {
      this.allChats = original;
    }
  }

  async showAddChatModal() {
    this.openModal(
      "Add to Watchlist",
      `
      <p style="color: var(--text-secondary); margin-bottom: 16px;">
        Enter a phone number (with country code) or group ID to add to your watchlist.
      </p>
      <div class="form-group">
        <label class="form-label">Phone Number or Group ID</label>
        <input type="text" id="add-chat-input" class="form-input" placeholder="e.g., 2348012345678 or 234801234567-1234567890@g.us">
      </div>
      <div class="form-group">
        <label class="form-checkbox">
          <input type="checkbox" id="is-group-checkbox">
          <span>This is a group</span>
        </label>
      </div>
      <button class="btn btn-primary" id="add-chat-submit" style="width:100%;">Add to Watchlist</button>
      <hr style="margin: 20px 0; border-color: var(--border);">
      <p style="color: var(--text-secondary); margin-bottom: 12px;">Or use tabs above to browse:</p>
      <div style="display: flex; gap: 8px;">
        <button class="btn" id="browse-groups-btn" style="flex:1;">Browse Groups</button>
        <button class="btn" id="browse-all-btn" style="flex:1;">Browse All</button>
      </div>
      `
    );

    document
      .getElementById("add-chat-submit")
      .addEventListener("click", async () => {
        const input = document.getElementById("add-chat-input").value.trim();
        const isGroup = document.getElementById("is-group-checkbox").checked;

        if (!input) {
          this.toast("Please enter a phone number or group ID", "error");
          return;
        }

        let chatId = input;
        // Format phone number
        if (!input.includes("@")) {
          const cleanNumber = input.replace(/[^\d]/g, "");
          chatId = isGroup ? `${cleanNumber}@g.us` : `${cleanNumber}@c.us`;
        }

        await this.addToWatchlist(chatId);
      });

    document
      .getElementById("browse-groups-btn")
      .addEventListener("click", () => {
        this.closeModal();
        this.switchTab("groups");
      });

    document.getElementById("browse-all-btn").addEventListener("click", () => {
      this.closeModal();
      this.switchTab("all");
    });
  }

  async addToWatchlist(chatId) {
    try {
      await api.addToWatchlist(chatId);
      this.toast("Added to watchlist", "success");
      this.closeModal();
      await this.loadWatchlist();
    } catch (error) {
      this.toast("Failed to add to watchlist", "error");
    }
  }

  async showTagAllModal() {
    if (!this.currentChat) return;

    this.openModal(
      "Tag All Members",
      `
      <div class="form-group">
        <label class="form-label">Message (optional)</label>
        <textarea id="tag-message" class="form-textarea" placeholder="Enter a message to send with mentions..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-checkbox">
          <input type="checkbox" id="hide-mentions" checked>
          <span>Hide mentions (use @everyone)</span>
        </label>
      </div>
      <button class="btn btn-primary" id="confirm-tag-all" style="width:100%;">Tag All Members</button>
    `
    );

    document
      .getElementById("confirm-tag-all")
      .addEventListener("click", async () => {
        const message = document.getElementById("tag-message").value;
        const hideMentions = document.getElementById("hide-mentions").checked;
        const chatId = this.currentChat.chatId || this.currentChat.id;

        try {
          const response = await api.tagAllMembers(
            chatId,
            message,
            hideMentions
          );
          this.toast(
            `Tagged ${response.data.mentionedCount} members`,
            "success"
          );
          this.closeModal();
        } catch (error) {
          this.toast("Failed to tag members", "error");
        }
      });
  }

  async showMembersPanel() {
    if (!this.currentChat) return;

    const chatId = this.currentChat.chatId || this.currentChat.id;
    this.openPanel("Members");
    this.panelContent.innerHTML =
      '<div class="loading">Loading members...</div>';

    try {
      const response = await api.getGroupParticipants(chatId);
      const participants = response.data || [];

      this.panelContent.innerHTML = `
        <div class="participant-list">
          ${participants
            .map(
              (p) => `
            <div class="participant-item" data-id="${p.id}">
              <div class="avatar">${(p.name || "U")[0].toUpperCase()}</div>
              <div class="participant-info">
                <div class="participant-name">${this.escapeHtml(
                  p.name || p.number || "Unknown"
                )}</div>
                ${p.isAdmin ? '<div class="participant-role">Admin</div>' : ""}
              </div>
              <div class="participant-actions">
                <button class="icon-btn" title="${
                  p.isAdmin ? "Demote" : "Promote"
                }" data-action="${p.isAdmin ? "demote" : "promote"}">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </button>
                <button class="icon-btn" title="Remove" data-action="remove">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                </button>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      // Add action handlers
      this.panelContent
        .querySelectorAll(".participant-actions button")
        .forEach((btn) => {
          btn.addEventListener("click", (e) => {
            const action = btn.dataset.action;
            const participantId = btn.closest(".participant-item").dataset.id;
            this.handleParticipantAction(chatId, participantId, action);
          });
        });
    } catch (error) {
      this.panelContent.innerHTML =
        '<p class="error">Failed to load members</p>';
    }
  }

  async handleParticipantAction(chatId, participantId, action) {
    try {
      switch (action) {
        case "promote":
          await api.promoteAdmins(chatId, [participantId]);
          this.toast("Promoted to admin", "success");
          break;
        case "demote":
          await api.demoteAdmins(chatId, [participantId]);
          this.toast("Demoted from admin", "success");
          break;
        case "remove":
          await api.removeParticipants(chatId, [participantId]);
          this.toast("Removed from group", "success");
          break;
      }
      // Refresh members list
      this.showMembersPanel();
    } catch (error) {
      this.toast(`Failed to ${action}`, "error");
    }
  }

  async showSettingsPanel() {
    if (!this.currentChat) return;

    const chatId = this.currentChat.chatId || this.currentChat.id;
    this.openPanel("Group Settings");
    this.panelContent.innerHTML =
      '<div class="loading">Loading settings...</div>';

    try {
      const response = await api.getGroupSettings(chatId);
      const settings = response.data;

      this.panelContent.innerHTML = `
        <div class="settings-section">
          <h4>Auto Messages</h4>

          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" id="welcome-enabled" ${
                settings.autoMessages?.welcome?.enabled ? "checked" : ""
              }>
              <span>Welcome Message</span>
            </label>
            <textarea id="welcome-message" class="form-textarea" placeholder="Welcome message...">${
              settings.autoMessages?.welcome?.message || ""
            }</textarea>
          </div>

          <div class="form-group">
            <label class="form-checkbox">
              <input type="checkbox" id="farewell-enabled" ${
                settings.autoMessages?.farewell?.enabled ? "checked" : ""
              }>
              <span>Farewell Message</span>
            </label>
            <textarea id="farewell-message" class="form-textarea" placeholder="Farewell message...">${
              settings.autoMessages?.farewell?.message || ""
            }</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Group Rules</label>
            <textarea id="group-rules" class="form-textarea" rows="5" placeholder="1. Be respectful\n2. No spam\n3. Stay on topic...">${
              settings.groupRules || ""
            }</textarea>
            <label class="form-checkbox" style="margin-top: 8px;">
              <input type="checkbox" id="include-rules-in-welcome" ${
                settings.autoMessages?.welcome?.includeGroupRules
                  ? "checked"
                  : ""
              }>
              <span>Include rules in welcome message</span>
            </label>
          </div>

          <button class="btn btn-primary" id="save-settings" style="width:100%;">Save Settings</button>
        </div>
      `;

      document
        .getElementById("save-settings")
        .addEventListener("click", () => this.saveGroupSettings(chatId));
    } catch (error) {
      this.panelContent.innerHTML =
        '<p class="error">Failed to load settings</p>';
    }
  }

  async saveGroupSettings(chatId) {
    const welcomeEnabled = document.getElementById("welcome-enabled").checked;
    const welcomeMessage = document.getElementById("welcome-message").value;
    const farewellEnabled = document.getElementById("farewell-enabled").checked;
    const farewellMessage = document.getElementById("farewell-message").value;
    const groupRules = document.getElementById("group-rules").value;
    const includeRulesInWelcome = document.getElementById(
      "include-rules-in-welcome"
    ).checked;

    try {
      // Update welcome message
      await api.updateAutoMessage(chatId, "welcome", {
        enabled: welcomeEnabled,
        message: welcomeMessage,
        includeGroupRules: includeRulesInWelcome,
      });

      // Update farewell message
      await api.updateAutoMessage(chatId, "farewell", {
        enabled: farewellEnabled,
        message: farewellMessage,
      });

      // Update group rules
      if (groupRules.trim()) {
        await api.setGroupRules(chatId, groupRules);
      }

      this.toast("Settings saved successfully", "success");
    } catch (error) {
      console.error("Failed to save settings:", error);
      this.toast("Failed to save settings", "error");
    }
  }

  async refreshCurrentChat() {
    if (!this.currentChat) return;

    const chatId = this.currentChat.chatId || this.currentChat.id;

    try {
      await api.refreshWatchlistChat(chatId);
      await this.loadMessages(chatId);
      this.toast("Chat refreshed", "success");
    } catch (error) {
      this.toast("Failed to refresh", "error");
    }
  }

  async initializeClient() {
    try {
      this.initBtn.classList.add("hidden");
      this.qrLoading.classList.remove("hidden");
      this.qrCode.classList.add("hidden");
      this.qrAuthenticated.classList.add("hidden");
      this.updateStatus("connecting", "Initializing...");

      await api.initializeClient();
    } catch (error) {
      this.toast("Failed to initialize", "error");
      this.initBtn.classList.remove("hidden");
      this.updateStatus("error", "Initialization failed");
    }
  }

  // Panel methods
  openPanel(title) {
    this.panelTitle.textContent = title;
    this.actionPanel.classList.remove("hidden");
    document.querySelector(".dashboard").classList.add("with-panel");
  }

  closePanel() {
    this.actionPanel.classList.add("hidden");
    document.querySelector(".dashboard").classList.remove("with-panel");
  }

  // Modal methods
  openModal(title, content) {
    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = content;
    this.modalOverlay.classList.remove("hidden");
  }

  closeModal() {
    this.modalOverlay.classList.add("hidden");
  }

  // Toast notification
  toast(message, type = "info") {
    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${this.escapeHtml(message)}</span>
      <button class="toast-close">×</button>
    `;

    this.toastContainer.appendChild(toast);

    toast
      .querySelector(".toast-close")
      .addEventListener("click", () => toast.remove());

    setTimeout(() => {
      toast.style.animation = "slideInRight 0.3s ease reverse";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Utility methods
  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  formatTime(date) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatDate(date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  formatPhoneNumber(id) {
    const number = id.split("@")[0];
    return `+${number}`;
  }

  formatMessageBody(body) {
    // Escape HTML first
    let formatted = this.escapeHtml(body);

    // Bold
    formatted = formatted.replace(/\*(.+?)\*/g, "<strong>$1</strong>");
    // Italic
    formatted = formatted.replace(/_(.+?)_/g, "<em>$1</em>");
    // Strikethrough
    formatted = formatted.replace(/~(.+?)~/g, "<del>$1</del>");
    // Monospace
    formatted = formatted.replace(/```(.+?)```/g, "<code>$1</code>");

    // Line breaks
    formatted = formatted.replace(/\n/g, "<br>");

    // Links
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );

    return formatted;
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  truncate(text, length) {
    if (!text) return "";
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  }
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  window.app = new WhatsAppDashboard();
});
