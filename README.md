<p align="center">
  <img src="https://raw.githubusercontent.com/iagovelasco3/n8n-nodes-wafly/main/nodes/Wafly/wafly.svg" alt="Wafly" width="120" />
</p>

<h1 align="center">n8n-nodes-wafly</h1>

[![NPM Version](https://img.shields.io/npm/v/n8n-nodes-wafly.svg)](https://www.npmjs.com/package/n8n-nodes-wafly)
[![Downloads](https://img.shields.io/npm/dm/n8n-nodes-wafly.svg)](https://www.npmjs.com/package/n8n-nodes-wafly)

This is an n8n community node for the **Wafly WhatsApp Bridge API**. It lets you send WhatsApp messages, manage groups and configure webhooks directly from your n8n workflows.

[Wafly](https://wafly.io/?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=readme_intro) is a managed WhatsApp API platform: cloud-hosted instances connected via QR Code or pairing code, REST API, real-time webhooks, message buffering for AI agents, audio transcription, and unlimited messages.

- 🇧🇷 **Brazil:** **[Try 3 days free, no card](https://wafly.com.br/signup?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=readme_top_cta_br)** — **BRL 59.90/month** per number (or **BRL 39.90/month** above 10 numbers on a Partner account). See the [ready-made n8n templates](https://wafly.com.br/templates/?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=readme_templates_br), [Wafly vs Evolution API on a VPS](https://wafly.com.br/comparativos/evolution-api-gerenciada/?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=readme_evolution_br) and [Z-API alternative](https://wafly.com.br/comparativos/alternativa-z-api/?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=readme_zapi_br).
- 🌍 **International:** **[Start a free 3-day trial](https://wafly.io/signup?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=readme_top_cta)** — **$20/month** per connected WhatsApp number, no credit card required.

## Building an app with AI?

Use the [Wafly REST starter for existing apps](examples/builders-rest/README.md): TypeScript, a Supabase Edge adapter, a prompt for Lovable and local tests. It starts in preview mode, keeps secrets on the backend and distinguishes API acceptance from delivery. The interface lab is simulated; no live WhatsApp delivery or universal platform compatibility is claimed.

## 🧩 Ready-made workflow templates

Five workflows you can import and run, instead of starting from a blank canvas. The lead-qualification flagship is in Brazilian Portuguese and includes an end-to-end test payload:

| Template | Language | What it does |
|---|---|---|
| [01 — AI assistant with buffer](examples/templates/01-atendente-ia-whatsapp.json) | pt-BR | Portuguese version of 04: groups split messages and replies once with an AI agent |
| [02 — Group moderation](examples/templates/02-moderacao-grupo-whatsapp.json) | pt-BR | Portuguese version of 05: approves join requests, welcomes members and removes link spam |
| [03 — OTP on WhatsApp with SMS fallback](examples/templates/03-otp-whatsapp-fallback-sms.json) | pt-BR | Portuguese version of 06: validates the number and falls back to SMS when unavailable |
| [04 — AI agent replies once](examples/templates/04-whatsapp-ai-agent-replies-once.json) | EN | Buffers messages that arrive in a burst so your agent answers once instead of three times |
| [05 — Moderate a group](examples/templates/05-moderate-whatsapp-group.json) | EN | Approves join requests, welcomes members and removes link spam |
| [06 — Send OTP with SMS fallback](examples/templates/06-send-otp-over-whatsapp.json) | EN | Validates the number first, falls back to SMS when WhatsApp is unreachable |
| [07 — Alert on disconnect](examples/templates/07-alert-when-whatsapp-number-disconnects.json) | EN | Checks the connection on a schedule and alerts when the number drops |
| [08 — Qualify WhatsApp leads with AI (pt-BR)](examples/templates/08-qualify-whatsapp-leads-and-hand-off.json) | pt-BR | Same flow as the English template, with Portuguese node names and messages |
| [08 — Qualify WhatsApp leads with AI (English)](examples/templates/08-qualify-whatsapp-leads-and-hand-off.en.json) | EN | Filters inbound messages, qualifies contacts and hands hot leads to a person |

You can also copy any workflow with one click (including two HTTP Request examples for **n8n Cloud**) at **[wafly.com.br/templates](https://wafly.com.br/templates/?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=readme_template_gallery)**.

Import the JSON, review the workflow and configure your own credentials before activating.
The community-node templates above target self-hosted n8n. The verified Wafly node is
also available on n8n Cloud, but each template still needs its own compatibility check;
catalog availability alone does not validate every imported workflow.

See the [template index and setup notes](examples/templates/README.md). To run the Portuguese template, [start a free 3-day Wafly trial](https://wafly.com.br/signup?utm_source=github&utm_medium=repository&utm_campaign=qualificacao_leads_whatsapp&utm_content=readme_template_08&template_id=n8n-08-qualificar-leads).
For the English workflow, [try Wafly on wafly.io](https://wafly.io/signup?utm_source=github&utm_medium=repository&utm_campaign=lead_qualification&utm_content=readme_template_08_en&template_id=n8n-08-qualificar-leads).

For a step-by-step Brazilian Portuguese walkthrough, see
[qualifying WhatsApp leads with AI and n8n](https://wafly.com.br/solucoes/qualificar-leads-whatsapp-ia-n8n/?utm_source=github&utm_medium=community_node&utm_campaign=n8n_flagship_202609&utm_content=readme_qualificar_leads).
It covers import, credentials, the incoming-message webhook and human handoff.
This workflow requires self-hosted n8n; Wafly Flex connects by QR Code and is
not Meta's Official WhatsApp API.

## 🚀 Features

### REST backend example — no n8n required

Building your own system, SaaS or AI agent? The independent
[Node.js REST + webhooks example](examples/backend-rest/README.md)
keeps credentials server-side and demonstrates a test-only text sender plus
a persistent, deduplicating receiver. It has no external dependencies and
does not require n8n. Local tests are included; real WhatsApp delivery is a
separate validation step. Wafly Flex is not Meta's Official WhatsApp API.

### 📱 Instance
- Get the QR Code to connect
- Check the connection status
- Connect / disconnect the instance
- Restart the instance
- Get device information
- Check whether phone numbers exist on WhatsApp
- **Message Buffer** — group split messages so an AI agent answers once, not once per message
- **Audio Transcription** — received voice notes arrive transcribed in the webhook, using your own OpenAI key

### 📡 Newsletter / Channel, Community, Chat, Call
- Full coverage of the published API: newsletters and channels, communities,
  chat management and the calls beta. See **Operation** under each resource.

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
- Set the received-message webhook URL
- Read the stored received-message webhook URL
- Clear the received-message webhook URL

Use an n8n **Webhook** node with method **POST**, activate the workflow, and copy
its **Production URL** into **Webhook → Set Webhook**. The Wafly node uses
`PUT /update-webhook-received` with `{ "value": "YOUR_URL" }`. A successful
update returns HTTP 204, shown as one empty JSON item in n8n. **Get Webhook** reads
the stored URL as `webhookUrl` and `value`; **Delete Webhook** clears that callback.
These operations do not change connected, disconnected or delivery callbacks.

Incoming events are available under `$json.body` in the native Webhook node.
A received video keeps `body.type = "ReceivedCallback"`; its downloadable URL
is `body.video.videoUrl`. Receiving this event does not require a separate Wafly
trigger node.

### Connecting a number

Use **Instance → Get QR Code** or **Instance (More) → Get QR Code Image** when
the customer is ready to connect. Read the response's `value`; the image operation
returns base64 PNG (add `data:image/png;base64,` only if it has no data prefix).
QR codes expire: request a fresh one when reopening the pairing screen and keep
checking **Get Status** until `connected` is `true`.

For phone pairing, choose **Instance (More) → Get Pairing Code (GET)** or **(POST)**
and fill **Phone** with country code, such as `5511999999999`. Both send the number
as `?phone=...` and return `code`/`message`. The old POST operation identifier is
preserved, including support for saved JSON bodies containing `phone`.

## 📦 Installation

### Install from the n8n UI

1. Open your n8n instance
2. Go to **Settings** > **Community Nodes**
3. Click **Install a community node**
4. Enter: `n8n-nodes-wafly`
5. Click **Install**

### Manual installation (self-hosted, including Docker)

Install in the n8n user's persistent community-node directory:

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install n8n-nodes-wafly@1.6.1
```

For Docker, run those commands inside the container as the n8n user, under
`/home/node/.n8n/nodes`, and persist `/home/node/.n8n` in a volume. Restart the
n8n process after a manual installation when it is safe for your workflows.
In queue mode, install the same version on every worker that executes the node.
See the [n8n installation guide](https://docs.n8n.io/integrations/community-nodes/installation/manual-install/).

### n8n Cloud: install from the canvas

The official n8n verified-node registry lists **n8n-nodes-wafly 1.6.1** as published
(checked October 30, 2026). Its actions include **Message → Send Text** and
**Webhook → Set Webhook**. This identifies the published package, not a completed
WhatsApp round trip in your Cloud account.

1. As the n8n instance owner or admin, open the canvas and select **+** (or press **n**).
2. Search for **Wafly WhatsApp** under **More from the community**, open its details
   and select **Install**. Check the installed version and supported actions.
3. Create the **Wafly API** credential described below. For incoming messages, use
   n8n's native **Webhook** node (POST); **Set Webhook** configures the callback URL
   on Wafly and is not an incoming-message trigger.
4. Publish or activate your receiving workflow as required by your n8n version,
   then configure its **Production URL**. Test your own authorized recipient before
   enabling automatic replies; an API response or message ID alone is not delivery.

If the verified node is hidden, ask your instance admin to check the **Verified
community nodes** setting in the n8n Cloud console. Do not restart a shared instance
without planning for its running workflows. See the
[official n8n installation instructions](https://docs.n8n.io/integrations/community-nodes/installation-and-management/install-verified-community-nodes/).

You can also use native **HTTP Request + Webhook** nodes in Cloud or self-hosted n8n.
The [Wafly guide and safe HTTP starter](https://wafly.com.br/tutoriais/whatsapp-api-n8n/)
remain available without installing the community node. Advanced operations depend
on the selected connection; consult the
[API contract and capability guide](https://wafly.com.br/downloads/wafly-api-contracts-20261030.md).

## 🔑 Credentials

Before using the node, create a credential of type **Wafly API** with the following fields:

- **Client Token**: Client-Token provided by Wafly
- **Instance**: Public code/ID of your WhatsApp instance, not its display name
- **Token**: Token of that same instance
- **Base URL**: `https://wafly.com.br/api-bridge-whats` (default; the same base URL serves accounts created on wafly.io, so keep it unchanged for international accounts)

- **Management Base URL**: Optional override for `/api-managment`. Normally derived from Base URL on the same host; set it explicitly for a custom management service.

Existing credentials keep working without editing them. For account management
only, you may omit Instance and Token: the credential test then uses a read-only
instance list. Messaging and session operations still require both fields.

### How to get your credentials

1. [Create your Wafly account](https://wafly.io/signup?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=credentials_setup) or log in to the dashboard
2. Complete the free 3-day trial setup
3. Go to **Instances** and create or select an instance
4. Copy the **Client-Token**, **Instance** and **Token**

## What's new in 1.6.1

- Passes `n8n-node lint` (the ruleset n8n's verification scanner applies) with zero errors; the project now uses `@n8n/node-cli` for linting.
- Requests go through n8n's authenticated HTTP helper; the Client-Token header is injected from the credential's `authenticate` block, so request options never carry the secret.
- Generated JSON body fields describe the expected fields in the parameter hint; optional query/header fields no longer declare `required: false`.
- No operation, parameter name or default changed; existing workflows keep working.

## What's new in 1.6.0

- The 104 existing operation IDs and their defaults are preserved; no workflow conversion is required.
- Fifteen additional actions cover WhatsApp Status, external instance management, queue clearing and the three other webhook callbacks.
- **Delete Message** sends query parameters; **Delete for Everyone** defaults to false. Newsletter deletion sends its required JSON body.
- Call recordings return an MP3 in `binary.data`. List responses return one valid n8n item per result, linked to the corresponding input. Object responses keep their existing JSON payload.
- **Also Send Transcript as Text** defaults to false, preserving existing transcription workflows.

### WhatsApp Status

Use **WhatsApp Status → Get Status Publication Capabilities** before publishing.
**Publish Image or Video Status** accepts the JSON fields documented in the API:
`requestId`, `type`, `content` (raw base64), and an explicit audience mode with its
corresponding fields. Keep the same requestId and payload for the same attempt.
Use **Get Status Publication Receipt** after an uncertain result; `unknown` is
not a reason to generate a new ID and automatically publish again. Availability
and media/audience limits are determined by the connected service.

### Account / instance management

The **Partner** resource uses `/api-managment`, with the same Client Token.
**Create Instance or Preview** defaults to an empty JSON object: a `created:false`
preview is not a provisioned instance and its example credentials do not work.
Card creation requires explicit `acceptAutomaticBilling:true` and eligibility.
Extra Pix creation uses `creationPolicy: "extra_instance_72h_v1"` and the
**Idempotency Key** field. Keep the same valid key and body for one logical
creation. The node does not add billing consent, generate keys, or retry calls.

Before **Cancel Instance**, use **Get Cancellation Preview**. Stop on
`billing_review_required` or an uncertain result. `scheduled:true` preserves
access until the API's effective date. Disconnecting WhatsApp does not cancel
billing. Refer to the [current API contract](https://wafly.com.br/api-docs).

### Additional webhooks

**Webhook (More)** sets delivery, connected and disconnected callbacks separately
using `{ "value": "https://your-production-webhook" }`. The original **Webhook**
operations still manage only the received-message callback. Use an explicit empty
value only when you intend to remove the corresponding callback.

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

### Example 4: Let your AI agent understand voice notes

Half of every WhatsApp conversation in Brazil is a voice note, and an LLM cannot
listen. **Set Audio Transcription** makes the transcript arrive in the webhook,
so you skip building download + speech-to-text.

**The OpenAI key is yours** — the cost lands on your own OpenAI account and Wafly
charges nothing for it. It is stored encrypted and never returned by the API.

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "instance",
        "operation": "setTranscription",
        "transcriptionApiKey": "sk-proj-...",
        "transcriptionMirrorToText": true,
        "transcriptionMaxAudioSeconds": 300,
        "transcriptionMonthlyCap": 500
      },
      "name": "Transcribe Voice Notes",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": { "waflyApi": "Wafly API" }
    }
  ]
}
```

Run it **once per instance**. After that, the audio webhook carries:

```json
{
  "audio": { "audioUrl": "https://...", "seconds": 4 },
  "transcription": { "status": "ok", "text": "oi, queria saber o preço", "latency_ms": 1180 }
}
```

If the provider refuses (wrong key, quota) or the monthly cap is reached, **the
message still arrives** — only with `transcription.status = "error"` and the
reason. Nothing is lost.

Leave the key field empty on later calls to keep the stored key and change only
the limits.

### Example 4: Stop your AI agent from answering three times

Nobody writes a paragraph on WhatsApp. People send `hi`, then `you there?`, then
`how much is it?` — three separate webhooks, so an AI agent replies three times,
and the first two replies were written without knowing what the person was still
about to type.

**Set Message Buffer** groups those into a single webhook call:

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "instance",
        "operation": "setMessageBuffer",
        "bufferWindowSeconds": 8,
        "bufferMaxWaitSeconds": 30,
        "bufferMaxMessages": 10,
        "bufferMode": "concat",
        "bufferIncludeGroups": false
      },
      "name": "Group Split Messages",
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

Run it **once per instance** — it is a setting, not a per-message step.

**What your webhook receives after that.** Before:

```
POST /your-webhook   { "text": { "message": "hi" } }
POST /your-webhook   { "text": { "message": "you there?" } }
POST /your-webhook   { "text": { "message": "how much is it?" } }
```

After:

```json
{
  "phone": "5511999999999",
  "text": { "message": "hi\nyou there?\nhow much is it?" },
  "buffered": { "count": 3, "messageIds": ["...", "...", "..."], "waitedMs": 8012 }
}
```

The payload keeps the exact same shape, so **an existing workflow keeps working
without edits** — your AI Agent node just receives the whole thought at once.
When a single message arrives, the payload is identical to before, without the
extra `buffered` field.

| Field | Default | What it does |
|---|---|---|
| Window (seconds) | 8 | Silence window. Restarts on every new message, so delivery happens when the person stops typing. Max 20. |
| Max Wait (seconds) | 30 | Hard ceiling from the first message, so someone typing non-stop cannot postpone delivery forever. Max 30. |
| Max Messages | 10 | Deliver immediately once this many pile up. Max 50. |
| Mode | concat | `concat` keeps the usual payload shape. `batch` adds a `bufferedMessages` array and changes it. |
| Include Groups | false | Grouping in group chats is **per participant** — different people never get merged. |

> Media, reactions and button replies are never grouped. If text is still waiting
> in the window when an audio arrives, the pending text is delivered **first**, so
> the conversation never reaches your agent out of order.

Use **Get Message Buffer** to read the current setting and **Disable Message
Buffer** to go back to one webhook call per message.

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

- [Wafly API documentation](https://wafly.io/api-docs?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=api_documentation)
- Base URL: `https://wafly.com.br/api-bridge-whats` (one base URL for wafly.com.br and wafly.io accounts)

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
- **Website**: [wafly.io](https://wafly.io/?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=support)
- **WhatsApp community**: [Join the group](https://chat.whatsapp.com/BWS3Sv7TM738uIafAueH2J)
- **Discord community**: [Join the Discord](https://discord.gg/ME2yyKZUFp)

## 🙏 Acknowledgements

- The [n8n](https://n8n.io) team for the amazing platform
- The developer community for their contributions

---

Made with ❤️ by the [Wafly](https://wafly.io/?utm_source=npm&utm_medium=community_node&utm_campaign=n8n_integration&utm_content=footer) team
