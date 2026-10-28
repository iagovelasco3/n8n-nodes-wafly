# WhatsApp no app que você já construiu

Kit REST Wafly para o primeiro fluxo em um app com backend. Inclui código TypeScript, adaptador Supabase Edge Function, exemplo de chamada autenticada e um prompt para adaptar o projeto no Lovable. Não exige n8n nem outro CRM.

**[Criar minha conta Wafly e testar por 3 dias, sem cartão](https://wafly.com.br/signup?utm_source=github&utm_medium=repository&utm_campaign=wafly_builder_starter_20261028&utm_content=readme_start)** · [Guia e demonstração](https://wafly.com.br/parceiros/api-whatsapp-para-saas/#kit-builder)

Oferta padrão Flex: depois do teste, R$59,90 por número/mês. É uma API não oficial da Meta, conectada por QR Code, com risco de restrição do número. Regras de contas parceiras, extras e criação externa por API são próprias; este exemplo não cria instância, não contrata nem altera cobrança. Backend, plataforma e modelo de IA podem ter custos separados.

## O que vem pronto e o que foi validado

- `core.ts` e `supabase/functions/_shared/core.ts`: handler reutilizável, sem efeito ao importar.
- `supabase/functions/wafly-send-text/index.ts`: adaptador Deno/Supabase, envio desligado por padrão.
- `frontend-example.ts`: chamada manual com o cliente Supabase já autenticado do seu app.
- `supabase/migrations/…sql`: reserva persistente, com RLS e uma única tentativa por dono.
- `core.test.ts`: testes em Deno com rede externa negada. Auth, banco e API são simulados nesses testes.
- `prompt.txt`: instrução para adaptar o app existente; valores de credenciais ficam fora do chat.

O laboratório de interface foi exercitado no Lovable, com respostas simuladas. O backend é validado separadamente em Deno e PostgreSQL isolados. **Não houve envio WhatsApp real, deploy em um projeto Supabase/Lovable de cliente ou homologação de todos os recursos dessas plataformas.** Não é conector nativo, parceria com Lovable/Supabase/Meta ou serviço pronto de notificações multi-tenant.

## 1. Confira o fluxo sem credenciais

Com Deno instalado a partir da fonte oficial, na pasta do kit:

```sh
deno test --no-prompt --deny-net core.test.ts
deno check core.ts frontend-example.ts supabase/functions/wafly-send-text/index.ts
```

Nenhum teste dispara mensagem ou acessa Wafly, Google ou dados de cliente. Os nomes e números de teste são sintéticos. Não use uma sessão de cliente para validar este kit.

## 2. Adapte o seu app

Copie o conteúdo de `prompt.txt` para a IA que trabalha **no seu projeto existente**. Não crie outro produto só para testar WhatsApp.

- App com Supabase: use as pastas `supabase/`, mantendo autenticação, banco e políticas existentes. Revise o SQL no seu projeto de teste antes de executá-lo. A migração falha se a tabela já existir; não a apague para forçar uma repetição.
- App Lovable novo sem Supabase: peça uma server function adequada à stack e conecte a autenticação e a reserva persistente já existentes. O adaptador Supabase não é uma receita pronta para essa outra stack. Não desative autenticação para fazê-lo funcionar.
- Bolt, Replit ou backend próprio: aproveite o contrato REST e as regras; o adaptador precisa de validação nessa plataforma. Um nome de ferramenta não comprova compatibilidade.

O Lovable já possui WhatsApp Business pela Meta. Compare essa opção quando seu requisito for o canal oficial. Este kit integra a oferta Flex da Wafly pelo backend.

## 3. Configure somente no servidor

Comece com `WAFLY_DISPATCH_ENABLED=false`. Use `.env.example` apenas como lista de **nomes**; não publique `.env` nem passe valores no prompt.

| Segredo/configuração | Uso |
| --- | --- |
| `APP_ORIGIN` | Origem HTTPS exata do app, sem barra final. Nada de `*`. |
| `WAFLY_OWNER_USER_ID` | UUID da sua própria conta autenticada no projeto Supabase. |
| `WAFLY_DISPATCH_ENABLED` | `false` para a prévia; só o dono pode habilitar depois da revisão. |
| `WAFLY_CLIENT_TOKEN` | Client-Token da sua conta Wafly, só no backend. |
| `WAFLY_INSTANCE_ID` / `WAFLY_INSTANCE_TOKEN` | Sua instância já criada no painel Wafly. |
| `WAFLY_TEST_PHONE` | Um número seu, autorizado, com DDI e DDD, apenas dígitos. |

O adaptador usa `SUPABASE_URL` e as chaves existentes do ambiente **servidor**: mapas JSON `SUPABASE_PUBLISHABLE_KEYS` / `SUPABASE_SECRET_KEYS` (chave `default`), ou variáveis singulares `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` no ambiente local. As variáveis legadas `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` são fallback; o kit não cria nem rotaciona chaves. Chaves `sb_secret_` vão somente no header `apikey`, não como JWT. A chave secreta/service-role é privilegiada: nunca coloque em variável `VITE_`, `NEXT_PUBLIC_`, navegador, chat, Git ou log. Revise o acesso antes de instalar código em um projeto real. O cliente do frontend continua usando somente a configuração pública e a sessão que o seu app já possui.

## 4. Faça a prévia pelo app autenticado

Leia `frontend-example.ts`. Preserve o objeto da ação entre renders; invoque apenas depois de uma ação explícita. Não execute no carregamento da página, em efeito de componente ou evento repetido.

O handler confere a sessão no Auth do mesmo projeto e autoriza apenas `WAFLY_OWNER_USER_ID`. A tela envia só `{message}`. Número, instância e tokens vêm do servidor. Assim, a tela não escolhe uma instância de outra conta nem vira um proxy público de envio.

Com envio desligado, a resposta é `state: preview`: **nenhuma mensagem enviada**, sem reserva no banco e sem chamada à Wafly.

## 5. Primeiro envio real: uma decisão do dono

Este kit não habilita envio automaticamente. Depois de revisar autenticação, Secrets e a tabela no seu próprio projeto, confira a instância e o número autorizado. Somente então o dono pode optar por definir `WAFLY_DISPATCH_ENABLED=true` e iniciar sua única tentativa manual.

Antes da chamada, o backend reserva uma linha cuja chave é o dono. Concorrência, nova aba, nova função Edge ou recarga encontram a mesma reserva. Se a reserva falhar ou ficar incerta, não há envio. Se a chamada à Wafly ficar incerta, a reserva continua bloqueando novas tentativas. **Não apague a linha para repetir um resultado incerto.** Concilie a mesma solicitação antes de decidir qualquer outra ação.

| Estado | O que se pode afirmar |
| --- | --- |
| `preview` | Simulação; nenhuma mensagem enviada. |
| `accepted` + `messageId` | Solicitação aceita pela API. Entrega e leitura não consultadas. |
| `duplicate_blocked` | API informou bloqueio de duplicação; não é um envio novo. |
| `rejected` | Resposta de rejeição; não há retentativa automática. |
| `uncertain` / `reconciliation_required` | Falta prova conclusiva; conferir o registro e o recibo exato antes de outra tentativa. |

O exemplo guarda apenas o dono, o estado e o ID da solicitação. Não guarda texto, destinatário, credenciais ou histórico de conversa. A reserva é de **primeiro teste**, não uma fila de produção. Para automatizar agendamentos/pedidos ou atender vários clientes, projete vínculo de instância por cliente, chave persistente por evento de negócio, autorização, limites e conciliação. Não transforme a mesma instância de teste em número compartilhado por todos os clientes.

## Próximo passo

Primeiro comprove o fluxo no seu próprio número. Depois avalie qual evento real do seu sistema merece uma confirmação — agendamento, pedido ou aviso solicitado — e implemente os controles desse caso. Este kit não instala webhook, não solicita QR, não reconecta sessões, não contata sua base e não cria cobrança.

[Começar meu teste na Wafly](https://wafly.com.br/signup?utm_source=github&utm_medium=repository&utm_campaign=wafly_builder_starter_20261028&utm_content=readme_end) · [Contrato de envio e exemplos](https://wafly.com.br/tutoriais/enviar-mensagem-whatsapp-api/) · [Documentação](https://wafly.com.br/api-docs)

Referências de plataforma consultadas em28Oct2026: [APIs no Lovable](https://docs.lovable.dev/integrations/any-api), [WhatsApp Business no Lovable](https://docs.lovable.dev/integrations/whatsapp), [Supabase Edge Functions](https://supabase.com/docs/guides/functions), [Secrets](https://supabase.com/docs/guides/functions/secrets). Recursos das plataformas podem mudar; valide na stack do seu projeto.
