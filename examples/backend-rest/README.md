# WhatsApp no seu backend: REST + webhooks, sem n8n

Um exemplo independente em Node.js 22+ para quem cria **sistemas, SaaS ou agentes de IA**. A Wafly faz a ponte com WhatsApp; seu backend mantém regras, banco e, se houver, modelo de IA. Lovable pode construir a interface, mas **tokens e chamadas da API ficam no servidor**, nunca no navegador.

Não é um agente pronto nem uma implementação de produção. Funciona sem instalar dependências e sem usar o node n8n deste repositório.

## O que você vai testar

- Enviar um texto somente ao número próprio configurado.
- Receber texto individual, persistir antes de confirmar o webhook e ignorar duplicatas.
- Ignorar grupos, mensagens enviadas por você, edições e outros tipos de callback.
- Separar aceite da API de entrega/leitura: HTTP 2xx **não comprova entrega**.

O teste automatizado é totalmente local, com resposta simulada de envio e HTTP real em localhost para recebimento. Ele **não comprova entrega WhatsApp de ponta a ponta**. Um teste real exige conta/instância Flex própria, número destinatário autorizado e webhook acessível por HTTPS.

## 1. Rodar os testes sem credenciais

Na raiz do repositório:

```sh
node --test examples/backend-rest/wafly.test.mjs
```

## 2. Configurar seu ambiente privado

Copie `.env.example` para `.env` dentro desta pasta e preencha com os dados **da sua própria instância**. O arquivo é ignorado pelo Git. Gere um segredo exclusivo:

```sh
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

`Client-Token` é o token do cliente Wafly; `WAFLY_INSTANCE_TOKEN` pertence à instância. Não são credenciais de IA ou Supabase. Não coloque nenhum deles no frontend, em screenshots, logs ou commits. O contrato REST atual inclui o token da instância no caminho: evite logs completos de URLs.

## 3. Enviar um texto de teste

Execute **dentro desta pasta**, somente com destinatário próprio/autorizado:

```sh
node --env-file=.env wafly.mjs send --confirm "Teste próprio da integração REST Wafly."
```

O comando faz uma única chamada `POST /instances/{instance}/token/{token}/send-text`, com header `Client-Token` e corpo `{phone,message}`. Não há retry automático: um timeout pode ocorrer depois do aceite. Confira o resultado na instância e no destinatário antes de tentar novamente.

## 4. Receber webhooks

```sh
node --env-file=.env wafly.mjs receive
```

O receiver escuta somente em `127.0.0.1:3000`. Saúde: `GET /health`. Callback: `POST /webhooks/wafly/SEU_SEGREDO`, JSON de até 64 KiB.

Para testar recebimento real, publique **seu receiver** atrás de HTTPS e configure esse destino na **sua instância própria**, preservando o webhook anterior para rollback. Este exemplo não muda configurações da Wafly automaticamente. Não sobrescreva o callback de uma instância de cliente.

Payload ilustrativo, não um recebimento real:

```json
{
  "type": "ReceivedCallback",
  "instanceId": "SUA_INSTANCIA",
  "messageId": "ID_UNICO",
  "phone": "SEU_NUMERO_COM_DDI",
  "fromMe": false,
  "isGroup": false,
  "text": { "message": "Olá" }
}
```

Após validar a instância e o tipo, o receiver grava em `data/inbox.ndjson` com permissões restritas. Duplicatas de `(instanceId,messageId)` são ignoradas, inclusive após reiniciar. Ele **não responde ao contato**, não chama IA nem dispara cobranças. O arquivo contém dados pessoais: não publique, faça retenção adequada e restrinja acesso.

## Onde entram Supabase, Lovable e IA?

1. A interface chama **seu backend autenticado**, não a API com tokens expostos.
2. O backend usa REST para envio e recebe callbacks.
3. Você pode substituir o journal local por transação no seu banco, com índice único para deduplicação.
4. Depois, aplique a lógica do seu produto: notificações, agendamento, suporte, aprovação, consulta ou um agente de IA. O custo e a segurança do modelo continuam sob seu controle.

São possibilidades de arquitetura, não conectores prontos nem promessa de compatibilidade validada com essas plataformas.

## Limites e segurança antes de produção

- O segredo no caminho é uma barreira compartilhada, **não uma assinatura criptográfica do provedor**. Não há autenticação de origem comprovada. Não publique esse endpoint sem HTTPS, proteção de borda e avaliação do seu modelo de ameaça; desative/redija logs de URLs e corpos.
- A deduplicação local é para **um processo**, com histórico em memória. Para escalar, use banco durável, índice único e política de retenção. Não rode vários workers sobre o mesmo journal.
- Não há fila de envio, mídia, status de entrega/leitura, controle de consentimento, rate limit, métricas ou integração de pagamento. São partes separadas de um produto real.
- Não use para disparos sem consentimento. A modalidade Flex é **não oficial**, com riscos inerentes; este exemplo não usa a Cloud API da Meta.

## Próximo passo

[Conheça a API Wafly e teste por 3 dias, sem cartão](https://wafly.com.br/comparativos/quanto-custa-api-whatsapp/?utm_source=github&utm_medium=repository&utm_campaign=wafly_api_sistemas_202610&utm_content=backend_rest). Flex: R$59,90 por número/mês. Consulte condições atuais no site. Este exemplo não muda preços, trial ou sua conta.
