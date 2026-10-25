# Getting started with Wafly in n8n

1. On self-hosted n8n, open Settings → Community Nodes → Install a community node.
2. Install `n8n-nodes-wafly` and add a Wafly node to a workflow.
3. Create a Wafly API credential with the Client Token, the instance code/ID and
   its Token, copied from the Wafly panel. Instance is the public code, not the name.
4. Keep Base URL as `https://wafly.com.br/api-bridge-whats`. Save and test.
5. Build Manual Trigger → Wafly, Message → Send Text with your own or an
   authorized number and a test message. Confirm it arrived on the phone.

To receive messages, use a POST Webhook with an active Production URL and
configure Webhook → Set Webhook. The event usually arrives in `$json.body`;
inspect the payload before mapping it and filter out your own messages to avoid
loops.

On n8n Cloud, install the verified Wafly node from the nodes panel, or use HTTP Request and Webhook nodes.

Full guide: https://wafly.com.br/tutoriais/whatsapp-api-n8n/
Manual installation, Docker and updates: [INSTALL.md](INSTALL.md)
API: https://wafly.com.br/api-docs
Templates: https://wafly.com.br/templates/
