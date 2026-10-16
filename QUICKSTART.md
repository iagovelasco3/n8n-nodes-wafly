# Começando com Wafly no n8n

1. No n8n self-hosted, abra Settings → Community Nodes → Install a community node.
2. Instale `n8n-nodes-wafly` e adicione um node Wafly ao workflow.
3. Crie uma credencial Wafly API com Client Token, o código/ID da instância e
   seu Token, copiados do painel. Instance é o código público, não o nome.
4. Mantenha Base URL como `https://wafly.com.br/api-bridge-whats`. Salve e teste.
5. Monte Manual Trigger → Wafly, Message → Send Text, com um número próprio ou
   autorizado e uma mensagem de teste. Confirme o recebimento no aparelho.

Para receber mensagens, use Webhook POST com Production URL ativa e configure
Webhook → Set Webhook. O evento chega normalmente em `$json.body`; examine o
payload antes de mapear e filtre mensagens próprias para evitar loops.

No n8n Cloud, use HTTP Request e Webhook em vez de instalar o pacote.

Guia completo: https://wafly.com.br/tutoriais/whatsapp-api-n8n/
Instalação manual, Docker e atualização: [INSTALL.md](INSTALL.md)
API: https://wafly.com.br/api-docs
Templates: https://wafly.com.br/templates/
