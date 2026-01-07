# WhatsApp Bot Management System

A production-ready WhatsApp bot management system built with `whatsapp-web.js` featuring a modern, minimalist dashboard interface for managing WhatsApp groups, communities, and conversations.

![Dashboard Preview](https://via.placeholder.com/800x400?text=WhatsApp+Bot+Dashboard)

## 🚀 Features

### Group & Community Management

- **Tag All Members**: Mention all participants with `@everyone` functionality
- **Auto-Welcome Messages**: Customizable welcome messages for new members
- **Member Management**: Add/remove participants, promote/demote admins
- **Group Settings**: Configure group restrictions and settings
- **Membership Approval**: Handle membership requests for restricted groups

### Chat Watchlist System

- **Custom Dashboard View**: Mini WhatsApp interface for selected chats
- **Real-time Monitoring**: View messages as they arrive via WebSocket
- **Quick Actions**: Perform group actions directly from dashboard
- **Message History**: Browse and search conversation history

### Message Handling

- **Rich Messages**: Text, media, location, contacts, polls
- **Message Operations**: Reply, forward, react, edit, delete, star
- **Media Support**: Images, videos, audio, documents, stickers
- **View-once Support**: Send photos/videos as view-once

### Real-time Updates

- **WebSocket Integration**: Live updates for messages and events
- **Group Events**: Member joins/leaves, admin changes
- **Message Acknowledgements**: Sent, delivered, read status

## 📋 Prerequisites

- **Node.js**: v18 or higher
- **MongoDB**: v5.0 or higher
- **Chrome/Chromium**: For Puppeteer (whatsapp-web.js dependency)

## 🛠️ Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd whatsapp-bot
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB**

```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your existing MongoDB instance
```

5. **Start the server**

```bash
# Development mode
npm run dev

# Production mode
npm start
```

6. **Access the dashboard**
   Open `http://localhost:3000` in your browser and scan the QR code with WhatsApp.

## ⚙️ Configuration

### Environment Variables

| Variable      | Description               | Default                                  |
| ------------- | ------------------------- | ---------------------------------------- |
| `PORT`        | Server port               | `3000`                                   |
| `HOST`        | Server host               | `0.0.0.0`                                |
| `NODE_ENV`    | Environment               | `development`                            |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/whatsapp-bot` |
| `CORS_ORIGIN` | CORS allowed origins      | `*`                                      |
| `LOG_LEVEL`   | Logging level             | `info`                                   |

## 📡 API Endpoints

### Authentication

| Method | Endpoint               | Description             |
| ------ | ---------------------- | ----------------------- |
| POST   | `/api/auth/initialize` | Start WhatsApp client   |
| GET    | `/api/auth/qr`         | Get current QR code     |
| GET    | `/api/auth/status`     | Check connection status |
| GET    | `/api/auth/info`       | Get client info         |
| POST   | `/api/auth/logout`     | Disconnect session      |

### Groups

| Method | Endpoint                         | Description               |
| ------ | -------------------------------- | ------------------------- |
| GET    | `/api/groups`                    | List all groups           |
| GET    | `/api/groups/:id`                | Get group details         |
| GET    | `/api/groups/:id/participants`   | Get group members         |
| POST   | `/api/groups/:id/tag-all`        | Tag all members           |
| POST   | `/api/groups/:id/members/add`    | Add participants          |
| DELETE | `/api/groups/:id/members`        | Remove participants       |
| PUT    | `/api/groups/:id/admins/promote` | Promote to admin          |
| PUT    | `/api/groups/:id/admins/demote`  | Demote from admin         |
| PUT    | `/api/groups/:id/subject`        | Update group name         |
| PUT    | `/api/groups/:id/description`    | Update description        |
| GET    | `/api/groups/:id/auto-message`   | Get auto-message settings |
| PUT    | `/api/groups/:id/auto-message`   | Update auto-message       |

### Chats

| Method | Endpoint                  | Description       |
| ------ | ------------------------- | ----------------- |
| GET    | `/api/chats`              | List all chats    |
| GET    | `/api/chats/:id`          | Get chat details  |
| GET    | `/api/chats/:id/messages` | Get chat messages |
| POST   | `/api/chats/:id/messages` | Send text message |
| POST   | `/api/chats/:id/media`    | Send media        |
| POST   | `/api/chats/:id/location` | Send location     |
| POST   | `/api/chats/:id/poll`     | Create poll       |

### Watchlist

| Method | Endpoint                          | Description           |
| ------ | --------------------------------- | --------------------- |
| GET    | `/api/watchlist`                  | Get watchlist         |
| POST   | `/api/watchlist`                  | Add chat to watchlist |
| DELETE | `/api/watchlist/:chatId`          | Remove from watchlist |
| GET    | `/api/watchlist/:chatId/messages` | Get chat messages     |

### Messages

| Method | Endpoint                    | Description      |
| ------ | --------------------------- | ---------------- |
| POST   | `/api/messages/send`        | Send message     |
| POST   | `/api/messages/:id/react`   | React to message |
| DELETE | `/api/messages/:id`         | Delete message   |
| POST   | `/api/messages/:id/forward` | Forward message  |

### Contacts

| Method | Endpoint                  | Description                 |
| ------ | ------------------------- | --------------------------- |
| GET    | `/api/contacts`           | List contacts               |
| POST   | `/api/contacts/check`     | Check WhatsApp registration |
| POST   | `/api/contacts/:id/block` | Block contact               |

## 🔌 WebSocket Events

### Incoming Events

| Event                 | Description                      |
| --------------------- | -------------------------------- |
| `client:status`       | Client connection status changed |
| `client:qr`           | New QR code generated            |
| `client:ready`        | Client is ready                  |
| `client:disconnected` | Client disconnected              |
| `message:new`         | New message received             |
| `message:ack`         | Message acknowledgement          |
| `group:join`          | Member joined group              |
| `group:leave`         | Member left group                |
| `watchlist:message`   | Message in watched chat          |

### Outgoing Events

| Event         | Description               |
| ------------- | ------------------------- |
| `subscribe`   | Subscribe to chat updates |
| `unsubscribe` | Unsubscribe from chat     |

## 📁 Project Structure

```
whatsapp-bot/
├── src/
│   ├── config/
│   │   ├── constants.js      # Enums and constants
│   │   ├── database.js       # MongoDB configuration
│   │   └── whatsapp.js       # WhatsApp client config
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── group.controller.js
│   │   ├── chat.controller.js
│   │   ├── watchlist.controller.js
│   │   ├── message.controller.js
│   │   └── contact.controller.js
│   ├── services/
│   │   ├── whatsapp.service.js
│   │   ├── group.service.js
│   │   ├── message.service.js
│   │   ├── watchlist.service.js
│   │   └── contact.service.js
│   ├── models/
│   │   ├── session.model.js
│   │   ├── watchlist.model.js
│   │   ├── message.model.js
│   │   └── settings.model.js
│   ├── middlewares/
│   │   ├── error.middleware.js
│   │   └── validator.middleware.js
│   ├── events/
│   │   └── handlers.js       # WhatsApp event handlers
│   ├── utils/
│   │   ├── logger.js
│   │   ├── helpers.js
│   │   └── formatters.js
│   ├── routes/
│   │   └── index.js          # API routes
│   └── app.js                # Express app setup
├── public/
│   ├── index.html            # Dashboard HTML
│   ├── css/
│   │   └── styles.css        # Dashboard styles
│   └── js/
│       ├── api.js            # API client
│       └── app.js            # Dashboard app
├── server.js                 # Entry point
├── package.json
├── .env.example
└── README.md
```

## 🎨 Dashboard Features

### Authentication Screen

- QR code display with auto-refresh
- Connection status indicator
- Animated loading states

### Main Dashboard

- Split-screen layout similar to WhatsApp Web
- Searchable chat list
- Tabbed navigation (Watchlist, All Chats, Groups)
- Real-time message updates

### Chat View

- Message bubbles with formatting
- Message status indicators
- Quick actions (tag all, members, settings)
- Message input with emoji support

### Action Panels

- Member management
- Auto-message configuration
- Group settings editor

## 🔧 Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building for Production

1. Set `NODE_ENV=production` in `.env`
2. Ensure MongoDB is accessible
3. Run `npm start`

## ⚠️ Disclaimer

This project uses `whatsapp-web.js` which operates via the WhatsApp Web browser. WhatsApp does not officially support bots or unofficial clients, so use this at your own risk. The developers are not responsible for any account restrictions or bans.

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📚 Resources

- [whatsapp-web.js Documentation](https://docs.wwebjs.dev)
- [whatsapp-web.js Guide](https://guide.wwebjs.dev)
- [Socket.IO Documentation](https://socket.io/docs)
- [Express.js Documentation](https://expressjs.com)
- [Mongoose Documentation](https://mongoosejs.com/docs)
