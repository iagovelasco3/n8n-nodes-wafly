# WhatsApp no seu app: envio seguro e consulta de status — v2

Kit REST/TypeScript com adaptador Supabase para **um primeiro teste manual, de dono único**.
O servidor persiste a chave original e permite recuperar um timeout sem criar outra intenção.
O GET consulta o resultado; não envia mensagem, não reconecta sessão e não exige polling.

**[Criar conta e acessar o kit](https://wafly.com.br/signup?kit=builder)** ·
[Guia](https://wafly.com.br/parceiros/api-whatsapp-para-saas/#kit-builder) ·
[Contrato mínimo da API](https://wafly.com.br/downloads/wafly-builder-openapi-20261029-v2.json)

## 1. Comece pela prévia

- `core.ts`: handler reutilizável sem efeito ao importar, testável com `fetch` injetado.
- `supabase/functions/wafly-text-v2/index.ts`: adaptador Deno; envio desligado por padrão.
- `frontend-example.ts`: quatro ações explícitas com o cliente Supabase já autenticado.
- `supabase/migrations/`: reserva persistente compartilhada com v1, RLS e campos imutáveis.
- `core.test.ts`: testes locais sem acesso à rede. `prompt.txt`: adaptação ao app existente.

Com Deno instalado pela fonte oficial:

```sh
deno test --no-prompt --deny-net core.test.ts
deno check core.ts frontend-example.ts supabase/functions/wafly-text-v2/index.ts
```

Não crie outro app/CRM. Para Lovable com Supabase, adapte a função e a autenticação existentes.
Para server functions de outra stack, adapte o contrato, autenticação e reserva nativos;
este adaptador não é universal. Não desative JWT, RLS ou autenticação para fazê-lo funcionar.
`supabase/config.toml` conserva `verify_jwt=true` e o handler consulta a sessão fresca no Auth.

## 2. Configure somente no servidor

Use `.env.example` como lista de nomes, nunca publique os valores. Configure:

| Nome | Valor privado/configuração |
| --- | --- |
| `APP_ORIGIN` | Origem HTTPS exata do seu app, sem barra final ou `*`. |
| `WAFLY_OWNER_USER_ID` | UUID do dono autenticado no seu projeto Supabase. |
| `WAFLY_DISPATCH_ENABLED` | `false` inicialmente. Somente o dono opta por habilitar o envio. |
| `WAFLY_CLIENT_TOKEN` | Token da conta Wafly, apenas no servidor. |
| `WAFLY_INSTANCE_ID` / `WAFLY_INSTANCE_TOKEN` | Instância própria já criada/conectada pelo dono. |
| `WAFLY_TEST_PHONE` | Um único número próprio/autorizado, com DDI/DDD e somente dígitos. |

O adaptador lê os mapas existentes `SUPABASE_PUBLISHABLE_KEYS`/`SUPABASE_SECRET_KEYS`
(chave `default`), as variantes singulares ou o fallback legado
`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`. Não cria nem rotaciona credenciais.
`sb_secret_` vai só em `apikey`, nunca como JWT. A chave secreta/service-role nunca vai
ao browser, Git, prompt, variável `VITE_`/`NEXT_PUBLIC_`, log ou screenshot.
O token da instância integra a URL privada da API; não registre URLs/erros brutos.

## 3. Revise as migrações no seu projeto de teste

Projeto novo: aplique a migração original de 28/10 e depois a aditiva de 29/10, uma vez,
pelo gerenciador de migrações. Projeto com v1: mantenha a tabela e os registros existentes;
aplique **somente a migração ainda não aplicada**, após revisar o schema e o backup.
Ela falha se reaplicada; não apague a tabela para forçar a execução.

Os dois kits usam `wafly_builder_first_attempts`: a chave primária permite uma intenção
por dono, mesmo com vários processos/abas. V1 com tentativa anterior continua bloqueada
para novos envios. Registros antigos não têm chave de API: v2 informa
`legacy_attempt_requires_manual_reconciliation`; não inventa recibo nem repete o envio.
Instalações v1 continuam usando sua função/arquivo original. Baixar v2 não atualiza clientes.

A tabela guarda hashes, chave, data original, ID e expiração; não guarda mensagem,
telefone, contato ou token. Browser/anon/authenticated não têm acesso. Service-role tem
select/insert/update, sem delete. Chave, dono, corpo/vínculo e data original são imutáveis;
ID e expiração conhecidos não podem ser substituídos. Não apague uma reserva para reenviar.

## 4. Quatro ações, sempre manuais

No app já autenticado, mantenha o objeto retornado por `manualWaflyAction(client, message)`
entre renders. Não invoque em mount, efeito, timer ou evento repetido.

1. `preview()`: prévia autenticada, sem reservar ou chamar Wafly.
2. `sendAuthorized()`: primeira intenção, depois da revisão e autorização do destinatário.
   Com envio desligado retorna `preview`; habilitado, reserva uma chave antes do POST.
3. `status()`: GET, consulta o ID persistido para esse dono/instância, sem enviar.
4. `recoverAuthorized()`: recuperação explícita com o **mesmo texto original**. Se já há ID,
   faz GET. Sem ID, reutiliza a mesma chave/corpo dentro da janela, nunca cria outra chave.

O browser envia apenas `action`, `message` e confirmação de destinatário; não escolhe
instância, telefone, chave, data ou ID. O backend confere a sessão fresca e o UUID do dono.
Textos com espaços diferentes são corpos diferentes. Token de instância renovado pode
usar a chave original; mudar o Client-Token/instância bloqueia o vínculo para conciliação.
Não troque de proprietário para tentar recuperar uma operação antiga.

O resultado inclui `messageId`, `state`, `delivery`, `expiresAt` e `automaticRetry=false`.
Guarde o ID/expiração no seu sistema e mostre `record=reconciliation_required` quando existir.
Erro do SDK, HTTP2xx ou ausência de resposta não provam entrega. Não crie automaticamente
outra ação ao receber erro. O GET continua disponível com envio desligado. O kit não agenda retries; alguns transportes
podem repetir uma requisição após queda de conexão, por isso a chave original deve ser
preservada em toda chamada. O staging também verificou esse caso com um único efeito.

## 5. Timeout e expiração

- Sem resposta/ID: não repita `sendAuthorized()`. Use recuperação explícita do mesmo texto;
  o banco mantém a chave mesmo após recriar a função ou recarregar a página.
- Já tem ID: prefira `status()`. Se a gravação do ID falhou, a resposta preserva o ID e avisa;
  a recuperação com a chave original pode recuperar a gravação dentro da janela.
- API retém a chave por **24h desde a primeira chamada**. O kit limita POST a **23h desde
  a reserva no banco**, como margem conservadora. Não renove data/chave para recuperar.
- Depois da janela/expiração, concilie o resultado antes de uma nova intenção. Um recibo
  expirado pode ser removido; reutilizar a chave em POST pode duplicar o envio. O kit bloqueia.
- A reserva permanece, sem limpeza automática. Este starter não é uma fila de notificações
  multi-tenant: novos eventos de negócio exigem um desenho próprio de autorização e retenção.

| Resultado | Ação/interpretação |
| --- | --- |
| PROCESSING / QUEUED | Processamento/fila; consulte depois, manualmente. |
| ACCEPTED | Aceite nativo; entrega não observada. |
| DELIVERED + `delivery=confirmed` | Callback correlacionado de entrega; não é leitura. |
| FAILED | Falha nativa registrada; não reenviar automaticamente. |
| UNKNOWN / timeout | Preserve a operação; consulte ou recupere explicitamente dentro da janela. |
| 409 | Operação existente, corpo/configuração diferentes ou tentativa v1: leia `error` e concilie. |
| 404 / 410 | Recibo/instância não encontrados para o dono ou expiração; não autoriza novo envio. |
| 503 / `record=reconciliation_required` | Resultado/registro incerto; preserve chave e ID. |

Sem callback, entrega fica `not_observed`. Nunca apresente fila/aceite como entrega/lido.

## Validação e limites

O handler, PostgreSQL/PostgREST e classes atuais da API foram exercitados em staging local
isolado com dados sintéticos, incluindo timeout após aceite, concorrência, recuperação,
consulta, v1 e autorização. Efeitos externos de WhatsApp foram substituídos por contador;
o caso de entrega usa resposta sintética. Não houve WhatsApp real nem deploy em projeto
Supabase/Lovable de cliente. Não é conector nativo, parceria ou sistema multi-tenant pronto.

Oferta padrão Flex: 3 dias sem cartão; depois R$59,90 por número/mês. API não oficial da Meta,
sujeita a restrição do número. Contas parceiras/extras/API externa têm condições próprias.
Lovable também oferece WhatsApp Business pela Meta; compare se precisa do canal oficial.
Este kit não cria instância, sessão, webhook, cobrança, cron, worker ou nova máquina Wafly.
Backend, Supabase e IA do seu projeto têm custos/condições próprios. Uma consulta manual
usa a API existente; não existe polling contínuo nem promessa de consumo nulo por chamada.
