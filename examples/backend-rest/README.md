# WhatsApp in your backend: REST + webhooks, without n8n

A standalone Node.js 22+ example for people building **systems, SaaS products or AI agents**. Wafly bridges WhatsApp; your backend keeps the rules, the database and, if any, the AI model. Lovable can build the interface, but **tokens and API calls stay on the server**, never in the browser.

It is neither a ready-made agent nor a production implementation. It runs without installing dependencies and without the n8n node from this repository.

## What you will test

- Send a text only to the configured number of your own.
- Receive an individual text, persist it before acknowledging the webhook and ignore duplicates.
- Ignore groups, messages sent by you, edits and other callback types.
- Separate API acceptance from delivery/read: HTTP 2xx **does not prove delivery**.

The automated test is fully local, with a simulated send response and real HTTP on localhost for receiving. It **does not prove end-to-end WhatsApp delivery**. A real test requires your own Flex account/instance, an authorized recipient number and a webhook reachable over HTTPS.

## 1. Run the tests without credentials

From the repository root:

```sh
node --test examples/backend-rest/wafly.test.mjs
```

## 2. Configure your private environment

Copy `.env.example` to `.env` inside this folder and fill it with the data **of your own instance**. The file is ignored by Git. Generate a unique secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

`Client-Token` is the Wafly client token; `WAFLY_INSTANCE_TOKEN` belongs to the instance. They are not AI or Supabase credentials. Do not put any of them in the frontend, in screenshots, logs or commits. The current REST contract includes the instance token in the path: avoid logging full URLs.

## 3. Send a test text

Run **inside this folder**, only to your own/authorized recipient:

```sh
node --env-file=.env wafly.mjs send --confirm "Own test of the Wafly REST integration."
```

The command makes a single `POST /instances/{instance}/token/{token}/send-text` call, with the `Client-Token` header and a `{phone,message}` body. There is no automatic retry: a timeout can happen after acceptance. Check the result on the instance and on the recipient before trying again.

## 4. Receive webhooks

```sh
node --env-file=.env wafly.mjs receive
```

The receiver listens only on `127.0.0.1:3000`. Health: `GET /health`. Callback: `POST /webhooks/wafly/YOUR_SECRET`, JSON up to 64 KiB.

To test real reception, publish **your receiver** behind HTTPS and configure that destination on **your own instance**, keeping the previous webhook for rollback. This example does not change Wafly settings automatically. Do not overwrite the callback of a customer's instance.

Illustrative payload, not a real reception:

```json
{
  "type": "ReceivedCallback",
  "instanceId": "YOUR_INSTANCE",
  "messageId": "UNIQUE_ID",
  "phone": "YOUR_NUMBER_WITH_COUNTRY_CODE",
  "fromMe": false,
  "isGroup": false,
  "text": { "message": "Hello" }
}
```

After validating the instance and the type, the receiver writes to `data/inbox.ndjson` with restricted permissions. Duplicates of `(instanceId,messageId)` are ignored, including after a restart. It **does not reply to the contact**, does not call AI and does not trigger charges. The file contains personal data: do not publish it, apply proper retention and restrict access.

## Where do Supabase, Lovable and AI fit?

1. The interface calls **your authenticated backend**, not the API with exposed tokens.
2. The backend uses REST to send and receives callbacks.
3. You can replace the local journal with a transaction in your database, with a unique index for deduplication.
4. Then apply your product logic: notifications, scheduling, support, approval, lookup or an AI agent. Model cost and security stay under your control.

These are architecture possibilities, not ready connectors nor a promise of validated compatibility with those platforms.

## Limits and security before production

- The secret in the path is a shared barrier, **not a cryptographic signature from the provider**. There is no proven origin authentication. Do not publish that endpoint without HTTPS, edge protection and an assessment of your threat model; disable or redact URL and body logs.
- Local deduplication is for **one process**, with in-memory history. To scale, use a durable database, a unique index and a retention policy. Do not run several workers over the same journal.
- There is no send queue, media, delivery/read status, consent control, rate limit, metrics or payment integration. Those are separate parts of a real product.
- Do not use it for messaging without consent. Flex is an **unofficial** integration with inherent risks; this example does not use Meta's Cloud API.

## Next step

[Learn about the Wafly API and try it for 3 days, no card](https://wafly.com.br/comparativos/quanto-custa-api-whatsapp/?utm_source=github&utm_medium=repository&utm_campaign=wafly_api_sistemas_202610&utm_content=backend_rest). Flex: BRL 59.90 per number/month in Brazil. Check current conditions on the website. This example does not change prices, trial or your account.
