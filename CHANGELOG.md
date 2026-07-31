# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.5.0] - 2026-07-30

### Added
- **Audio Transcription** on the *Instance* resource: **Set / Get / Disable
  Audio Transcription**. Half of every WhatsApp conversation in Brazil is voice
  notes and an AI agent cannot listen — with this on, the transcript arrives in
  the webhook and you skip building download + speech-to-text yourself.
  **The OpenAI key is yours**: the provider cost lands on your own account and
  Wafly charges nothing for it. The key is stored encrypted and never returned.
- **57 more operations, generated from the API schema.** The node covered 40 of
  the 100 published endpoints; the rest are now reachable through new resources:
  *Newsletter / Channel* (17), *Call (Beta)* (14), *Community* (7),
  *Instance (More)* (6), *Message (More)* (7), *Chat* (3), *Group (More)* (2)
  and *Partner* (1).

### Changed
- Operations are now generated from the same schema that feeds the Wafly API
  docs, OpenAPI spec and Postman collection (`npm run gen:ops`, also run on
  `prebuild`). Hand-written operations keep precedence — they have better UX
  (validated fields, converted units); generation only fills the gaps. This is
  why the node had drifted 60 endpoints behind in the first place.

## [1.4.0] - 2026-07-30

### Added
- **Message Buffer** operations on the *Instance* resource: **Set Message
  Buffer**, **Get Message Buffer** and **Disable Message Buffer**.

  Nobody writes a paragraph on WhatsApp. People send "hi", then "you there?",
  then "how much is it?" — three webhook calls, and an AI agent answers three
  times. With the buffer enabled those arrive as a **single** call.

  The default `concat` mode keeps the payload shape unchanged (the texts are
  joined in the usual text field), so existing workflows keep working without
  edits. `batch` mode adds a `bufferedMessages` array for whoever wants the
  messages separated.

  Window and max wait are set in **seconds** in the node and converted to
  milliseconds for the API. Media, reactions and button replies are never
  grouped — and any text still waiting is delivered *before* them, so the
  conversation never arrives out of order.

## [1.3.0] - 2026-07-21

### Added
- New message operations: **Send Pix Button** (payment card with merchant name,
  amount and description), **Send Button List** (up to 3 quick-reply buttons),
  **Send OTP Button** (copy-code button), **Send Button Actions** (URL / call /
  reply / copy buttons) and **Send Carousel** (cards with images and buttons).

## [1.2.5] - 2026-07-16

### Fixed
- README logo pointed at the PNG removed in 1.2.4, breaking the image on the npm package page — now references the SVG

## [1.2.4] - 2026-07-16

### Fixed
- HTTP errors are now thrown as `NodeApiError` (was `NodeOperationError`), preserving status code and response body in the n8n UI
- `continueOnFail` output no longer echoes the raw error message, which contained the request URL with instance name and token
- Group `updateSettings` now sends `groupId` in the request body (kept `phone` for backward compatibility with the bridge API)

### Changed
- Node icon converted from PNG to SVG; credential class now declares its own `icon`
- `inputs`/`outputs` use `NodeConnectionTypes.Main` instead of the `'main'` string literal

## [1.2.3] - 2026-07-14

### Fixed
- Credential test URL used a malformed n8n expression (`=` must prefix the whole string) — the connection test always hit a literal URL and failed

## [1.2.2] - 2026-07-14

### Fixed
- Use `httpRequestWithAuthentication` with the credential's `authenticate` config instead of manually injecting the Client-Token header (n8n vetting rule no-http-request-with-manual-auth)

## [1.2.1] - 2026-07-14

### Fixed
- Replaced deprecated `this.helpers.request` with `this.helpers.httpRequest` (flagged by the n8n automated vetting)
- Stopped shipping `.d.ts`/source maps in `dist` (declaration files tripped the credentials filename convention check)

## [1.2.0] - 2026-07-14

### Changed
- All node and credential UI strings (descriptions, hints) translated to English, as required by the n8n verified community node guidelines
- README rewritten in English
- `repository` URL in package.json fixed (now points to the real public repo)

### Removed
- Unused `n8n-core` runtime dependency (verified nodes must have zero runtime dependencies)
- Dead `Community`, `Newsletter` and `Chat` resource options that had no implemented operations

### Added
- GitHub Actions workflow to publish to npm with provenance (`.github/workflows/publish.yml`)

## [1.1.0] - 2026-06-11

### Adicionado

#### Recursos de Grupos
- Atualizar foto do grupo
- Aprovar participante pendente
- Rejeitar participante pendente
- Obter link de convite do grupo
- Redefinir link de convite do grupo
- Atualizar configurações do grupo (admin only message, settings, approval, add member)
- Paginação opcional ao listar grupos (`page`, `pageSize`)

## [1.0.0] - 2026-01-17

### 🎉 Lançamento Inicial

Primeira versão pública do n8n-nodes-wafly!

### ✨ Adicionado

#### Recursos de Instância
- Obter QR Code (imagem e base64)
- Verificar status da conexão
- Conectar/Desconectar instância
- Reiniciar instância
- Obter informações do dispositivo
- Verificar se números existem no WhatsApp (batch)

#### Recursos de Mensagens
- Enviar mensagem de texto
- Enviar imagem com legenda
- Enviar vídeo com legenda
- Enviar áudio
- Enviar documento (PDF, DOC, etc.)
- Enviar localização GPS
- Enviar contato (vCard)
- Criar enquetes (polls)
- Enviar links com prévia
- Deletar mensagens

#### Recursos de Grupos
- Criar grupos
- Listar todos os grupos
- Obter metadados do grupo
- Adicionar participantes
- Remover participantes
- Promover a administrador
- Remover administrador
- Sair do grupo
- Atualizar nome do grupo
- Atualizar descrição do grupo

#### Recursos de Webhooks
- Configurar webhook para eventos
- Obter configuração do webhook
- Remover webhook

#### Credenciais
- Autenticação com Client-Token, Instance e Token
- Teste de conexão automático
- Base URL configurável

### 📚 Documentação
- README completo com exemplos
- Guia de instalação detalhado (INSTALL.md)
- Guia de publicação (PUBLISHING.md)
- 7 exemplos de workflows prontos
- Documentação inline em todos os campos

### 🔧 Configuração
- TypeScript configurado
- ESLint para qualidade de código
- Prettier para formatação
- Gulp para build de assets
- Estrutura seguindo padrões do n8n

---

## [Unreleased]

### 🚀 Planejado para Próximas Versões

- [ ] Suporte para Comunidades (Communities)
- [ ] Suporte para Newsletters/Canais
- [ ] Operações de Chat (marcar como lido, arquivar)
- [ ] Envio de mensagens com templates
- [ ] Suporte para mensagens de voz (PTT)
- [ ] Upload de mídia via buffer/base64
- [ ] Webhook trigger node
- [ ] Testes automatizados
- [ ] Exemplos de integração com CRMs populares

### 💡 Ideias para o Futuro

- Modo de teste (sandbox)
- Dashboard de métricas
- Rate limiting configurável
- Retry automático em falhas
- Logs detalhados de debug
- Suporte para múltiplas instâncias no mesmo workflow

---

## Notas de Versão

### Compatibilidade

- **n8n**: Versão 1.0.0 ou superior
- **Node.js**: Versão 16 ou superior
- **API Wafly**: Todas as versões atuais

### Breaking Changes

Nenhuma - primeira versão.

### Migrações

Não aplicável - primeira versão.

---

## Como Contribuir

Veja nosso [guia de contribuição](CONTRIBUTING.md) para detalhes sobre como reportar bugs, sugerir funcionalidades e enviar pull requests.

---

[1.0.0]: https://github.com/wafly/n8n-nodes-wafly/releases/tag/v1.0.0
[Unreleased]: https://github.com/wafly/n8n-nodes-wafly/compare/v1.0.0...HEAD
