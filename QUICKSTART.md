# Your first Wafly test in n8n

Use a separate WhatsApp number you own, plus another number you own or that
explicitly authorized the test. Keep production workflows unchanged while testing.

1. **Create and connect your Wafly instance.** [Start the Brazilian 3-day trial](https://wafly.com.br/signup?utm_source=github&utm_medium=repository&utm_campaign=n8n_first_test_20261104&utm_content=quickstart_signup_br) or use the [international trial](https://wafly.io/signup?utm_source=github&utm_medium=repository&utm_campaign=n8n_first_test_20261104&utm_content=quickstart_signup_global), with no credit card. Create a trial instance in the Wafly panel and connect your test number using the pairing code on mobile or a QR code on a computer. Confirm the connection before sending from n8n.
2. **Install the node for your environment.** On n8n Cloud, sign in as an Owner/Admin, open the canvas node panel and search for **Wafly WhatsApp**. The official n8n catalog lists `n8n-nodes-wafly` **1.6.2** as published, checked on 2026-11-04. On self-hosted n8n, use Settings → Community Nodes → Install with `n8n-nodes-wafly`. [Installation details](INSTALL.md). HTTP Request + Webhook remains an alternative in either environment.
3. **Configure the credential.** Copy the **Client Token**, public **Instance code/ID** and **Token** of that same instance from the Wafly panel into an n8n Wafly API credential. Instance is the public code, not its name. Keep Base URL as `https://wafly.com.br/api-bridge-whats`. Saving/testing the credential checks status; it does not connect a number or send a message.
4. **Send and check the phone.** Build Manual Trigger → Wafly, Message → Send Text. Enter the second authorized test number with country/area codes and a short test message. Execute once and check that the message reached the phone. HTTP success or a messageId alone is not delivery confirmation.
5. **Reply and check your webhook.** Create a **POST Webhook**, save/publish the workflow and configure its **Production URL** through Wafly, Webhook → Set Webhook. Reply from your second test number and inspect the actual n8n execution; the event usually arrives in `$json.body`. Filter your own messages and deduplicate message IDs before adding automatic replies. The Test URL works only while its test listener is active.

The verified package being available does not prove execution in your Cloud
account or certify complete templates. Wafly Flex is a nonofficial WhatsApp
connection with a risk of number restrictions; n8n, AI and implementation are separate.
Never share tokens, credentials, configured exports or QR codes.

[Portuguese first-test guide](https://wafly.com.br/comparativos/whatsapp-api-para-n8n/?utm_source=github&utm_medium=repository&utm_campaign=n8n_first_test_20261104&utm_content=quickstart_guide_br#primeiro-teste-n8n) · [API](https://wafly.com.br/api-docs) · [Templates](https://wafly.com.br/templates/)

Official n8n references: [verified-node installation](https://docs.n8n.io/integrations/community-nodes/installation/verified-install/) and [Webhook test/production behavior](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/workflow-development/).
