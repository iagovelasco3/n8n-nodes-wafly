# n8n-nodes-wafly

[![NPM Version](https://img.shields.io/npm/v/n8n-nodes-wafly.svg)](https://www.npmjs.com/package/n8n-nodes-wafly)
[![Downloads](https://img.shields.io/npm/dm/n8n-nodes-wafly.svg)](https://www.npmjs.com/package/n8n-nodes-wafly)

Este é um nó customizado do n8n para integração com a **Wafly WhatsApp Bridge API**. Ele permite que você envie mensagens, gerencie grupos, configure webhooks e muito mais através do WhatsApp diretamente nos seus workflows do n8n.

## 🚀 Funcionalidades

### 📱 Instância
- Obter QR Code para conexão
- Verificar status da conexão
- Conectar/Desconectar instância
- Reiniciar instância
- Obter informações do dispositivo
- Verificar se números existem no WhatsApp

### 💬 Mensagens
- Enviar texto
- Enviar imagem
- Enviar vídeo
- Enviar áudio
- Enviar documento
- Enviar localização
- Enviar contato
- Criar enquetes
- Enviar links com prévia
- Deletar mensagens

### 👥 Grupos
- Criar grupos
- Listar grupos
- Obter metadados do grupo
- Adicionar/Remover participantes
- Promover/Remover administradores
- Sair do grupo
- Atualizar nome e descrição

### 🔔 Webhooks
- Configurar webhook
- Obter configuração
- Remover webhook

## 📦 Instalação

### Instalação via Interface do n8n

1. Acesse seu n8n
2. Vá em **Settings** > **Community Nodes**
3. Clique em **Install a community node**
4. Digite: `n8n-nodes-wafly`
5. Clique em **Install**

### Instalação Manual

Se você está usando uma instalação local do n8n, pode instalar o pacote via npm:

```bash
npm install n8n-nodes-wafly
```

Para instalação global:

```bash
npm install -g n8n-nodes-wafly
```

Se você instalou o n8n via Docker, adicione ao seu `docker-compose.yml`:

```yaml
version: '3'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_COMMUNITY_PACKAGES=n8n-nodes-wafly
    volumes:
      - ~/.n8n:/home/node/.n8n
```

## 🔑 Configuração de Credenciais

Antes de usar o nó, você precisa configurar suas credenciais da Wafly:

1. Crie uma nova credencial do tipo **Wafly API**
2. Preencha os seguintes campos:
   - **Client Token**: Token fornecido pela Wafly
   - **Instance**: Nome da sua instância WhatsApp
   - **Token**: Token da instância
   - **Base URL**: `https://wafly.com.br/api-bridge-whats` (padrão)

### Como obter suas credenciais:

1. Acesse o painel da Wafly em [https://wafly.com.br](https://wafly.com.br)
2. Faça login na sua conta
3. Vá em **Instâncias** e crie ou selecione uma instância
4. Copie o **Client-Token**, **Instance** e **Token**

## 💡 Exemplos de Uso

### Exemplo 1: Enviar Mensagem de Texto

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "message",
        "operation": "sendText",
        "phone": "5511999999999",
        "message": "Olá! Esta é uma mensagem enviada via n8n"
      },
      "name": "Wafly",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "waflyApi": "Wafly API"
      }
    }
  ]
}
```

### Exemplo 2: Criar Grupo e Adicionar Participantes

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "group",
        "operation": "createGroup",
        "groupName": "Meu Grupo Automático",
        "phones": "5511999999999,5511888888888"
      },
      "name": "Criar Grupo",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "waflyApi": "Wafly API"
      }
    }
  ]
}
```

### Exemplo 3: Verificar Status da Instância

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "instance",
        "operation": "getStatus"
      },
      "name": "Verificar Status",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [250, 300],
      "credentials": {
        "waflyApi": "Wafly API"
      }
    }
  ]
}
```

### Exemplo 4: Workflow Completo - Enviar Mensagem Diária

Este workflow envia uma mensagem automática todos os dias às 9h:

```json
{
  "name": "Mensagem Diária WhatsApp",
  "nodes": [
    {
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 9 * * *"
            }
          ]
        }
      },
      "name": "Cron - 9h Todo Dia",
      "type": "n8n-nodes-base.cron",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "parameters": {
        "resource": "message",
        "operation": "sendText",
        "phone": "5511999999999",
        "message": "Bom dia! Lembrete automático das 9h."
      },
      "name": "Enviar Mensagem",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "waflyApi": "Wafly API"
      }
    }
  ],
  "connections": {
    "Cron - 9h Todo Dia": {
      "main": [
        [
          {
            "node": "Enviar Mensagem",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## 📚 Documentação da API

Para mais informações sobre os endpoints disponíveis e seus parâmetros, consulte a documentação completa da API:

- [Documentação da API Wafly](https://wafly.com.br/documentacao)
- Base URL: `https://wafly.com.br/api-bridge-whats`

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js v16 ou superior
- npm v7 ou superior
- n8n instalado localmente (para testes)

### Setup Local

```bash
# Clone o repositório
git clone https://github.com/wafly/n8n-nodes-wafly.git
cd n8n-nodes-wafly

# Instale as dependências
npm install

# Compile o código TypeScript
npm run build

# Link o pacote localmente
npm link

# No diretório do n8n, linke o pacote
cd ~/.n8n
npm link n8n-nodes-wafly
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
npm run lintfix  # Para corrigir automaticamente
```

### Publicação

```bash
# Faça login no npm
npm login

# Aumente a versão
npm version patch  # ou minor, ou major

# Publique
npm publish
```

## 🔐 Segurança

- Nunca compartilhe suas credenciais (Client-Token, Instance, Token)
- Use variáveis de ambiente para armazenar credenciais sensíveis
- Mantenha seu n8n atualizado
- Use HTTPS sempre que possível

## 🐛 Reportar Problemas

Encontrou um bug ou tem uma sugestão? Abra uma issue no GitHub:

[https://github.com/wafly/n8n-nodes-wafly/issues](https://github.com/wafly/n8n-nodes-wafly/issues)

## 📝 Changelog

### v1.0.0 (2026-01-17)

- 🎉 Lançamento inicial
- ✅ Suporte para operações de instância
- ✅ Suporte para envio de mensagens (texto, imagem, vídeo, áudio, etc.)
- ✅ Gerenciamento de grupos
- ✅ Configuração de webhooks
- ✅ Autenticação com Client-Token

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 💬 Suporte

- **Email**: contato@wafly.com.br
- **Website**: [https://wafly.com.br](https://wafly.com.br)
- **Discord**: [Comunidade Wafly](https://discord.gg/wafly)

## 🙏 Agradecimentos

- Equipe do [n8n](https://n8n.io) pela incrível plataforma
- Comunidade de desenvolvedores que contribuíram

---

Feito com ❤️ pela equipe [Wafly](https://wafly.com.br)
