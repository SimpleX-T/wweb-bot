# Emoji Picker & Message Actions Implementation Guide

## Changes needed in app.js:

### 1. Add to bindEvents() method (after line ~110):

```javascript
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

const emojiPicker = this.emojiPickerContainer.querySelector("emoji-picker");
if (emojiPicker) {
  emojiPicker.addEventListener("emoji-click", (e) => {
    this.insertEmoji(e.detail.unicode);
  });
}

// Reply bar
this.replyClose.addEventListener("click", () => this.cancelReply());
```

### 2. Update renderMessage() to include quoted message and action menu:

Replace the renderMessage method with this enhanced version that includes:

- Quoted message display (if hasQuotedMsg)
- Message action menu (reply/forward/react buttons)

### 3. Add these new methods after renderMessageStatus():

```javascript
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

setReplyTo(message) {
  this.replyingTo = message;
  this.replyAuthor.textContent = message.fromMe ? "You" : (message.author || "Unknown");
  this.replyText.textContent = message.body || "[Media]";
  this.replyBar.classList.add("active");
  this.messageInput.focus();
}

cancelReply() {
  this.replyingTo = null;
  this.replyBar.classList.remove("active");
}

async handleMessageAction(action, messageId) {
  const message = this.currentMessages?.find(m => m.id === messageId);

  if (action === 'reply') {
    if (message) this.setReplyTo(message);
  } else if (action === 'forward') {
    await this.showForwardModal(messageId);
  } else if (action === 'react') {
    this.showReactionPicker(messageId);
  }
}

showReactionPicker(messageId) {
  const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageEl) return;

  const picker = document.createElement('div');
  picker.className = 'reaction-picker active';
  picker.innerHTML = `
    <button class="reaction-btn" data-emoji="👍">👍</button>
    <button class="reaction-btn" data-emoji="❤️">❤️</button>
    <button class="reaction-btn" data-emoji="😂">😂</button>
    <button class="reaction-btn" data-emoji="😮">😮</button>
    <button class="reaction-btn" data-emoji="😢">😢</button>
    <button class="reaction-btn" data-emoji="🙏">🙏</button>
  `;

  messageEl.style.position = 'relative';
  messageEl.appendChild(picker);

  picker.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const emoji = btn.dataset.emoji;
      await this.handleReact(messageId, emoji);
      picker.remove();
    });
  });

  setTimeout(() => {
    document.addEventListener('click', function removePicker(e) {
      if (!picker.contains(e.target)) {
        picker.remove();
        document.removeEventListener('click', removePicker);
      }
    });
  }, 100);
}

async handleReact(messageId, emoji) {
  try {
    await api.reactToMessage(messageId, emoji);
    await this.loadMessages(this.currentChat.chatId || this.currentChat.id);
  } catch (error) {
    this.toast("Failed to add reaction", "error");
  }
}
```

### 4. Update sendMessage() to include reply:

```javascript
async sendMessage() {
  const content = this.messageInput.value.trim();
  if (!content || !this.currentChat) return;

  const chatId = this.currentChat.chatId || this.currentChat.id;
  this.messageInput.value = "";

  try {
    const options = {};
    if (this.replyingTo) {
      options.quotedMessageId = this.replyingTo.id;
      this.cancelReply();
    }

    await api.sendMessage(chatId, content, options);
    await this.loadMessages(chatId);
  } catch (error) {
    this.toast("Failed to send message", "error");
  }
}
```

## Files Created:

1. ✅ /public/css/message-actions.css - Styles for all new features
2. ✅ /public/js/emoji-reply-helpers.js - Helper functions reference
3. ✅ Updated /public/index.html - Added emoji picker and reply bar HTML

## Next Steps:

Run the implementation by manually integrating the code snippets above into app.js.
