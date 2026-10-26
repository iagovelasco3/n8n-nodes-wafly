# First Wafly text request with native n8n nodes

This beginner exercise uses Manual Trigger, Edit Fields, Code and HTTP Request. It does not require a community package or an AI account. Download the [unconfigured JSON](09-native-http-first-message.en.json) and import it from your n8n editor's workflow menu → Import → From file.

## Configure in your private project

1. Create your own Wafly account and connect an instance you control. Follow the [public setup guide](https://wafly.com.br/tutoriais/enviar-mensagem-whatsapp-api/).
2. In **Configure your own instance**, replace `instance` and `instanceToken`. In `phone`, enter the country code and digits only. Write a short test `message`.
3. Use your own number or an explicitly authorized recipient. Change the Boolean `authorizedRecipient` to `true` only after checking this. The flag records your confirmation; it does not independently establish consent.
4. Open **Send one text - enable after setup**. Choose Generic Credential Type → Header Auth. Create a credential whose header name is `Client-Token` and whose value is your private Wafly client token. Select it in this node.
5. Review the POST URL and JSON body, then enable HTTP Request only when ready. Run the manual trigger once. The workflow is inactive and the HTTP node disabled by default; it has no list, loop, schedule or automatic retry.

The instance token is also part of the existing API URL contract. Keep configured workflows private, restrict project access, and remove tokens before sharing an export or screenshot. Do not publish credentials in an issue or template submission.

## Read the result correctly

HTTP 2xx/`messageId` indicates API acceptance, not WhatsApp delivery or a human reading the message. Check the authorized device or exact delivery receipt for the same message. A timeout may occur after acceptance; reconcile before another attempt. This exercise does not automatically respond to inbound messages, run AI or provide a production webhook queue.

The validation node rejects placeholders, multiple items, a malformed number, missing authorization and empty/oversized messages. HTTP Request uses a 15-second timeout with redirects and automatic retries disabled.

## Validation and limits

Imported and executed with n8n 2.43.7 in an isolated local container with no external network: 14 guard cases and four native scenarios (default guard, configured-but-disabled HTTP, one exact mocked POST and 503 without retry). No production credentials, WhatsApp message or hostedCloud account was used. A separate local editor captured the real import/configuration/guard screens for the beginner walkthrough. Core-node compatibility is not a claim of a live hostedCloud end-to-end test.

Wafly is a paid, managed, **non-official WhatsApp API**, maintained by the Wafly team; restriction risks remain. It is not Meta's Cloud API. Standard Brazil price is R$59.90 per number/month, with a three-day trial without a card. n8n hosting and AI costs are separate. [Integration guide and current terms](https://wafly.com.br/tutoriais/whatsapp-api-n8n/).

The n8n catalog submission 21603 was not published: reviewer feedback said the starter was too basic and suggested a beginner YouTube walkthrough. That video is being prepared separately. This file is a public source example, **not an approved n8n catalog template**. No new catalog submission or package release is made by publishing this example.

The existing UTM in the workflow identifies this starter asset. It does not certify that someone discovered it in the n8n catalog or establish an individual platform click.
