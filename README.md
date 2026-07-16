<p align="center">
  <img src="https://raw.githubusercontent.com/iagovelasco3/n8n-nodes-wafly/main/nodes/Wafly/wafly.svg" alt="Wafly" width="120" />
</p>

<h1 align="center">n8n-nodes-wafly</h1>

[![NPM Version](https://img.shields.io/npm/v/n8n-nodes-wafly.svg)](https://www.npmjs.com/package/n8n-nodes-wafly)
[![Downloads](https://img.shields.io/npm/dm/n8n-nodes-wafly.svg)](https://www.npmjs.com/package/n8n-nodes-wafly)

This is an n8n community node for the **Wafly WhatsApp Bridge API**. It lets you send WhatsApp messages, manage groups and configure webhooks directly from your n8n workflows.

[Wafly](https://wafly.com.br) is a managed WhatsApp API platform: cloud-hosted instances connected via QR Code, REST API, real-time webhooks and unlimited messages.

## 🚀 Features

### 📱 Instance
- Get the QR Code to connect
- Check the connection status
- Connect / disconnect the instance
- Restart the instance
- Get device information
- Check whether phone numbers exist on WhatsApp

### 💬 Messages
- Send text
- Send image
- Send video
- Send audio
- Send document
- Send location
- Send contact card
- Send polls
- Send links with preview
- Delete messages

### 👥 Groups
- Create groups
- List groups (with optional pagination)
- Get group metadata
- Add / remove participants
- Approve / reject pending participants
- Promote / demote admins
- Leave a group
- Update name, description and photo
- Get and reset the invite link
- Update group settings

### 🔔 Webhooks
- Set the webhook URL
- Get the webhook configuration
- Delete the webhook

## 📦 Installation

### Install from the n8n UI

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter: `n8n-nodes-wafly`
5. Click **Install**

### Manual installation

If you run n8n locally, you can install the package via npm:

```bash
npm install n8n-nodes-wafly
```

If you run n8n via Docker, add it to your `docker-compose.yml`:

```yaml
version: '3'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_COMMUNITY_PACKAGES=n8n-nodes-wafly
    volumes:
      - ~/.n8n:/home/node/.n8n
```

## 🔑 Credentials

Before using the node, create a credential of type **Wafly API** with the following fields:

- **Client Token**: Client-Token provided by Wafly
- **Instance**: Name of your WhatsApp instance
- **Token**: Token of the instance
- **Base URL**: `https://wafly.com.br/api-bridge-whats` (default)

### How to get your credentials

1. Open the Wafly dashboard at [https://wafly.com.br](https://wafly.com.br)
2. Log in to your account
3. Go to **Instances** and create or select an instance
4. Copy the **Client-Token**, **Instance** and **Token**

## 💡 Usage examples

### Example 1: Send a text message

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "message",
        "operation": "sendText",
        "phone": "5511999999999",
        "message": "Hello! This message was sent via n8n"
      },
      "name": "Wafly",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "waflyApi": "Wafly API"
      }
    }
  ]
}
```

### Example 2: Create a group and add participants

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "group",
        "operation": "createGroup",
        "groupName": "My Automated Group",
        "phones": "5511999999999,5511888888888"
      },
      "name": "Create Group",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "waflyApi": "Wafly API"
      }
    }
  ]
}
```

### Example 3: Check the instance status

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "instance",
        "operation": "getStatus"
      },
      "name": "Check Status",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "waflyApi": "Wafly API"
      }
    }
  ]
}
```

### Example 4: Full workflow — daily message

This workflow sends an automatic message every day at 9am:

```json
{
  "name": "Daily WhatsApp Message",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 * * *"
            }
          ]
        }
      },
      "name": "Cron - 9am Every Day",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "sendText",
        "phone": "5511999999999",
        "message": "Good morning! Automatic 9am reminder."
      },
      "name": "Send Message",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "waflyApi": "Wafly API"
      }
    }
  ],
  "connections": {
    "Cron - 9am Every Day": {
      "main": [
        [
          {
            "node": "Send Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 📚 API documentation

For more information about the available endpoints and their parameters, see the full API documentation:

- [Wafly API documentation](https://wafly.com.br/documentation)
- Base URL: `https://wafly.com.br/api-bridge-whats`

## 🛠️ Development

### Prerequisites

- Node.js v18 or later
- npm v9 or later
- A local n8n installation (for testing)

### Local setup

```bash
# Clone the repository
git clone https://github.com/iagovelasco3/n8n-nodes-wafly.git
cd n8n-nodes-wafly

# Install dependencies
npm install

# Compile the TypeScript code
npm run build

# Link the package locally
npm link

# In the n8n directory, link the package
cd ~/.n8n
npm link n8n-nodes-wafly
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
npm run lintfix  # auto-fix
```

## 🔐 Security

- Never share your credentials (Client-Token, Instance, Token)
- Use environment variables to store sensitive credentials
- Keep your n8n installation up to date
- Always use HTTPS

## 🐛 Reporting issues

Found a bug or have a suggestion? Open an issue on GitHub:

[https://github.com/iagovelasco3/n8n-nodes-wafly/issues](https://github.com/iagovelasco3/n8n-nodes-wafly/issues)

## 📄 License

MIT License — see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/MyFeature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/MyFeature`)
5. Open a Pull Request

## 💬 Support

- **Email**: contato@wafly.com.br
- **Website**: [https://wafly.com.br](https://wafly.com.br)
- **WhatsApp community**: [Join the group](https://chat.whatsapp.com/BWS3Sv7TM738uIafAueH2J)
- **Discord community**: [Join the Discord](https://discord.gg/ME2yyKZUFp)

## 🙏 Acknowledgements

- The [n8n](https://n8n.io) team for the amazing platform
- The developer community for their contributions

---

Made with ❤️ by the [Wafly](https://wafly.com.br) team
