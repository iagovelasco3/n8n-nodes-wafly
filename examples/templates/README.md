# Templates prontos da Wafly para n8n

Todos os templates desta galeria usam o community node `n8n-nodes-wafly` e, por isso, precisam de um n8n self-hosted.

## Destaque PT-BR: qualificação de leads

[Baixe o workflow 08](08-qualify-whatsapp-leads-and-hand-off.json), importe o JSON no n8n e siga as notas **Instalação e teste** dentro do próprio canvas. O template recebe contatos do WhatsApp, classifica a intenção com IA, responde o lead e avisa uma pessoa somente quando o lead está quente.

[Criar conta Wafly — 3 dias sem cartão](https://wafly.com.br/signup?utm_source=github&utm_medium=template_index&utm_campaign=qualificacao_leads_whatsapp&utm_content=template_08_cta&template_id=n8n-08-qualificar-leads)

Identificador de atribuição: `n8n-08-qualificar-leads`.

## Índice

| Workflow | Idioma | Uso principal |
|---|---|---|
| [04 — Responder uma vez com agente de IA](04-whatsapp-ai-agent-replies-once.json) | EN | Agrupar mensagens em sequência antes de responder |
| [05 — Moderar grupo](05-moderate-whatsapp-group.json) | EN | Aprovar entradas, permitir domínios e remover spam |
| [06 — Enviar OTP com fallback para SMS](06-send-otp-over-whatsapp.json) | EN | Verificar o número e entregar código de uso único |
| [07 — Alertar desconexão](07-alert-when-whatsapp-number-disconnects.json) | EN | Monitorar o número e alertar somente em mudança de estado |
| [08 — Qualificar leads e fazer handoff](08-qualify-whatsapp-leads-and-hand-off.json) | PT-BR | Responder contatos e encaminhar leads quentes ao comercial |

Os arquivos `01`, `02` e `03` são as versões anteriores em português dos casos `04`, `05` e `06`.
