# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
