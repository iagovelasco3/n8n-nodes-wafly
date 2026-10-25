# Installing n8n-nodes-wafly 1.6.1

Use this package on self-hosted n8n. n8n Cloud offers the verified version of the
node from the nodes panel; for anything it does not cover yet, integrate through
HTTP Request and Webhook nodes: https://wafly.com.br/tutoriais/whatsapp-api-n8n/

## From the UI

1. Sign in as Owner/Admin and open Settings → Community Nodes.
2. Click Install a community node, enter `n8n-nodes-wafly` and confirm.
3. When adding a node to a workflow, search for Wafly WhatsApp.

To update, use the package update option on that same screen. Export your
workflows first and test the important flows after updating. Publishing to npm
does not update your customers' n8n instances automatically.

## Manual installation and Docker

As the user that runs n8n:

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install n8n-nodes-wafly@1.6.1
```

With Docker, enter the container with `docker exec -it CONTAINER_NAME sh` and use
`/home/node/.n8n/nodes`. That directory must live on a persistent volume.
After a manual installation, restart the n8n process in a suitable maintenance
window. In queue mode, keep the same package version on every worker.

Source: https://docs.n8n.io/integrations/community-nodes/installation/manual-install/

## Credentials

Create a Wafly API credential and copy the values from the Wafly panel:

- Client Token: the account's Client-Token.
- Instance: the public instance code/ID, not its display name.
- Token: the token of that same instance.
- Base URL: `https://wafly.com.br/api-bridge-whats`.
- Management Base URL: leave empty in the default setup. For a custom service,
  enter the management URL explicitly.

Save and test. The test reads the instance status without sending messages.
To manage the account without an existing instance, leave Instance and Token
empty: the test then uses a read-only listing. Sending and connecting still
require Instance and Token.

## First validation

Use Manual Trigger → Wafly, Message → Send Text. Enter your own number, or one
that authorized the test, with country and area codes. Run it and confirm the
message arrived on the phone.
To receive messages, create a POST Webhook, activate/publish the workflow and
configure its Production URL in Wafly. Inspect the real event before mapping
fields; filter out your own messages and deduplicate IDs to avoid loops.

Never share tokens, exports or screenshots that contain credentials. If an error
occurs, check the method, the credentials, the instance state and the API
response. Do not automatically repeat instance creation, cancellation or Status
publication after an uncertain result.

Documentation: https://wafly.com.br/api-docs
Templates: https://wafly.com.br/templates/
Code and issues: https://github.com/iagovelasco3/n8n-nodes-wafly
