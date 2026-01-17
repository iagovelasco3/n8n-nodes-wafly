# 🚀 Guia Rápido - n8n-nodes-wafly

Comece a usar o Wafly WhatsApp em menos de 5 minutos!

## ⚡ Instalação Rápida

### Opção 1: Via Interface do n8n

```
1. Settings → Community Nodes → Install
2. Digite: n8n-nodes-wafly
3. Clique em Install
4. Aguarde e reinicie o n8n
```

### Opção 2: Via npm

```bash
cd ~/.n8n
npm install n8n-nodes-wafly
# Reinicie o n8n
```

## 🔑 Configurar Credenciais

### 1. Obter Credenciais da Wafly

1. Acesse: https://wafly.com.br
2. Faça login
3. Vá em **Instâncias**
4. Copie: **Client-Token**, **Instance** e **Token**

### 2. Adicionar no n8n

```
1. Adicione um nó Wafly
2. Create New Credential
3. Cole suas credenciais
4. Test Connection
5. Save
```

## 📱 Seu Primeiro Workflow

### Exemplo: Enviar Mensagem

```json
{
  "nodes": [
    {
      "parameters": {
        "resource": "message",
        "operation": "sendText",
        "phone": "5511999999999",
        "message": "Olá! Primeira mensagem via n8n 🎉"
      },
      "name": "Wafly",
      "type": "n8n-nodes-wafly.wafly",
      "typeVersion": 1,
      "credentials": {
        "waflyApi": "Suas Credenciais"
      }
    }
  ]
}
```

## 🎯 Casos de Uso Rápidos

### 1️⃣ Notificação Diária

**Use quando**: Quiser enviar lembretes automáticos

```
Cron (9h diária) → Wafly (Enviar Texto)
```

### 2️⃣ Resposta Automática

**Use quando**: Receber mensagens via webhook

```
Webhook → If (filtro) → Wafly (Responder)
```

### 3️⃣ Envio em Massa

**Use quando**: Enviar para lista de contatos

```
Google Sheets → Loop → Wafly (Enviar para Cada)
```

### 4️⃣ Criar Grupo Automático

**Use quando**: Automatizar criação de grupos

```
Trigger → Wafly (Criar Grupo) → Wafly (Enviar Boas-vindas)
```

### 5️⃣ Monitoramento

**Use quando**: Monitorar status da instância

```
Cron (5 min) → Wafly (Status) → If (desconectado) → Alerta
```

## 🔥 Operações Mais Usadas

### Mensagens

```javascript
// Texto
resource: "message"
operation: "sendText"
phone: "5511999999999"
message: "Sua mensagem"

// Imagem
operation: "sendImage"
image: "https://url-da-imagem.jpg"
caption: "Legenda opcional"

// Documento
operation: "sendDocument"
document: "https://url-do-arquivo.pdf"
fileName: "documento.pdf"
```

### Grupos

```javascript
// Criar
resource: "group"
operation: "createGroup"
groupName: "Meu Grupo"
phones: "5511999999999,5511888888888"

// Listar
operation: "listGroups"
```

### Instância

```javascript
// Status
resource: "instance"
operation: "getStatus"

// QR Code
operation: "getQrCode"
```

## 🐛 Solução Rápida de Problemas

### Nó não aparece?
```bash
# Reinicie o n8n completamente
pm2 restart n8n
# ou
docker-compose restart n8n
```

### Erro de autenticação?
```
✓ Verifique se copiou todas as credenciais
✓ Sem espaços extras
✓ Base URL correta
✓ Teste no painel da Wafly primeiro
```

### Timeout ao enviar?
```
✓ Verifique status da instância
✓ Reconecte se necessário
✓ Verifique internet
```

## 📚 Próximos Passos

1. ✅ Explore os [exemplos completos](examples/workflows.json)
2. ✅ Leia o [README completo](README.md)
3. ✅ Configure [webhooks](README.md#webhooks)
4. ✅ Integre com [Google Sheets](README.md#integração)
5. ✅ Junte-se à [comunidade](https://discord.gg/wafly)

## 🆘 Precisa de Ajuda?

- 📧 Email: contato@wafly.com.br
- 💬 Discord: https://discord.gg/wafly
- 📖 Docs: https://wafly.com.br/docs
- 🐛 Issues: https://github.com/wafly/n8n-nodes-wafly/issues

## 🎉 Pronto!

Você já está pronto para automatizar o WhatsApp com n8n!

**Dica**: Comece com um workflow simples e vá evoluindo aos poucos.

---

Feito com ❤️ pela equipe [Wafly](https://wafly.com.br)
