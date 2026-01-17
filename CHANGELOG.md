# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

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
