# Ready-made Wafly templates for n8n

Every template in this gallery uses the `n8n-nodes-wafly` community node and therefore needs a self-hosted n8n.

## Featured: lead qualification

[Download workflow 08](08-qualify-whatsapp-leads-and-hand-off.en.json), import the JSON into n8n and follow the **Setup and test** notes inside the canvas. The template receives WhatsApp contacts, classifies the intent with AI, replies to the lead and alerts a person only when the lead is hot. A version with Portuguese node names and messages is available as [08-qualify-whatsapp-leads-and-hand-off.json](08-qualify-whatsapp-leads-and-hand-off.json).

[Create a Wafly account — 3-day trial, no card](https://wafly.com.br/signup?utm_source=github&utm_medium=template_index&utm_campaign=qualificacao_leads_whatsapp&utm_content=template_08_cta&template_id=n8n-08-qualificar-leads)

Attribution identifier: `n8n-08-qualificar-leads`.

## Index

| Workflow | Language | Main use |
|---|---|---|
| [04 — Reply once with an AI agent](04-whatsapp-ai-agent-replies-once.json) | EN | Group messages that arrive in a burst before replying |
| [05 — Moderate a group](05-moderate-whatsapp-group.json) | EN | Approve join requests, allow domains and remove spam |
| [06 — Send OTP with SMS fallback](06-send-otp-over-whatsapp.json) | EN | Validate the number and deliver a one-time code |
| [07 — Alert on disconnection](07-alert-when-whatsapp-number-disconnects.json) | EN | Monitor the number and alert only on a state change |
| [08 — Qualify leads and hand off](08-qualify-whatsapp-leads-and-hand-off.en.json) | EN | Reply to contacts and alert a person only for hot leads |
| [08 — Qualify leads and hand off (pt-BR)](08-qualify-whatsapp-leads-and-hand-off.json) | pt-BR | Same flow with Portuguese node names and messages |

Files `01`, `02` and `03` are the earlier Portuguese versions of use cases `04`, `05` and `06`.
