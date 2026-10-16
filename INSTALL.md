# Instalação do n8n-nodes-wafly 1.6.0

Use este pacote em n8n self-hosted. No n8n Cloud, integre por HTTP Request e
Webhook: https://wafly.com.br/tutoriais/whatsapp-api-n8n/

## Pela interface

1. Entre como Owner/Admin e abra Settings → Community Nodes.
2. Clique em Install a community node, informe `n8n-nodes-wafly` e confirme.
3. Ao adicionar um node ao workflow, procure por Wafly WhatsApp.

Para atualizar, use a opção de atualização do pacote nessa mesma tela. Exporte
seus workflows antes e teste os fluxos importantes após atualizar. Publicar no
npm não atualiza automaticamente os n8n dos clientes.

## Instalação manual e Docker

No usuário que executa o n8n:

```bash
mkdir -p ~/.n8n/nodes
cd ~/.n8n/nodes
npm install n8n-nodes-wafly@1.6.0
```

Em Docker, entre no container com `docker exec -it NOME_DO_CONTAINER sh` e use
`/home/node/.n8n/nodes`. Esse diretório deve estar em volume persistente.
Após instalação manual, reinicie o processo do n8n numa janela adequada. Em
queue mode, mantenha o mesmo pacote em todos os workers.

Fonte: https://docs.n8n.io/integrations/community-nodes/installation/manual-install/

## Credenciais

Crie uma credencial Wafly API e copie do painel:

- Client Token: Client-Token da conta.
- Instance: código público/ID da instância; não é o nome de exibição.
- Token: token dessa mesma instância.
- Base URL: `https://wafly.com.br/api-bridge-whats`.
- Management Base URL: deixe vazio na configuração padrão. Para um serviço
  próprio, informe a URL de gerenciamento explicitamente.

Salve e teste. O teste consulta o status da instância, sem enviar mensagens.
Para gerenciar a conta sem uma instância existente, deixe Instance e Token
vazios: o teste usa uma listagem somente leitura. Envio e conexão continuam
exigindo Instance e Token.

## Primeira validação

Use Manual Trigger → Wafly, Message → Send Text. Informe um número próprio ou
que autorizou o teste, com DDI e DDD. Execute e confirme o recebimento no aparelho.
Para receber, crie um Webhook POST, ative/publique o workflow e configure sua
Production URL na Wafly. Examine o evento real antes de mapear campos; filtre
mensagens próprias e deduplique IDs para evitar loops.

Nunca compartilhe tokens, exports ou prints com credenciais. Se ocorrer erro,
confira método, credenciais, estado da instância e a resposta da API. Não repita
automaticamente criação, cancelamento ou publicação de Status após resultado
incerto.

Documentação: https://wafly.com.br/api-docs
Templates: https://wafly.com.br/templates/
Código e issues: https://github.com/iagovelasco3/n8n-nodes-wafly
