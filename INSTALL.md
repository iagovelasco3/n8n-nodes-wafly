# Guia de Instalação - n8n-nodes-wafly

Este guia detalhado explica como instalar e configurar o nó Wafly WhatsApp no n8n.

## 📋 Pré-requisitos

Antes de começar, você precisa:

1. ✅ Uma instância do n8n rodando (local, Docker ou cloud)
2. ✅ Uma conta na Wafly ([cadastre-se aqui](https://wafly.com.br))
3. ✅ Uma instância WhatsApp criada no painel da Wafly
4. ✅ As credenciais: Client-Token, Instance e Token

## 🚀 Métodos de Instalação

### Método 1: Instalação via Interface do n8n (Recomendado)

Este é o método mais simples e recomendado para a maioria dos usuários.

1. **Acesse seu n8n**
   - Abra seu navegador e acesse sua instância n8n
   - Faça login com suas credenciais

2. **Navegue até Community Nodes**
   - Clique no menu **Settings** (Configurações) no canto inferior esquerdo
   - Selecione **Community Nodes**

3. **Instale o pacote**
   - Clique no botão **Install a community node**
   - Digite: `n8n-nodes-wafly`
   - Clique em **Install**
   - Aguarde a instalação (pode levar alguns minutos)

4. **Reinicie o n8n**
   - Após a instalação, reinicie seu n8n
   - No Docker: `docker-compose restart n8n`
   - Em instalações locais: reinicie o processo do n8n

5. **Verifique a instalação**
   - Crie um novo workflow
   - Adicione um novo nó e busque por "Wafly"
   - Você deve ver o nó **Wafly WhatsApp** disponível

### Método 2: Instalação via npm (Instalação Local)

Para instalações locais do n8n:

```bash
# Navegue até o diretório do n8n
cd ~/.n8n

# Instale o pacote
npm install n8n-nodes-wafly

# Reinicie o n8n
# Se estiver rodando com pm2:
pm2 restart n8n

# Se estiver rodando manualmente:
# Pare o processo e inicie novamente
n8n
```

### Método 3: Instalação com Docker

Se você usa Docker, há duas formas:

#### Opção A: Via Variável de Ambiente

Adicione a variável de ambiente ao seu `docker-compose.yml`:

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
    restart: unless-stopped
```

Depois execute:

```bash
docker-compose down
docker-compose up -d
```

#### Opção B: Instalação Manual no Container

```bash
# Entre no container
docker exec -it n8n_container_name /bin/sh

# Instale o pacote
npm install -g n8n-nodes-wafly

# Saia do container
exit

# Reinicie o container
docker restart n8n_container_name
```

### Método 4: Instalação para Desenvolvimento

Para desenvolvedores que querem modificar o código:

```bash
# Clone o repositório
git clone https://github.com/wafly/n8n-nodes-wafly.git
cd n8n-nodes-wafly

# Instale as dependências
npm install

# Compile o código
npm run build

# Link o pacote globalmente
npm link

# No diretório do n8n, linke o pacote
cd ~/.n8n
npm link n8n-nodes-wafly

# Reinicie o n8n
```

## 🔑 Configuração de Credenciais

Após instalar o nó, você precisa configurar suas credenciais da Wafly.

### Passo 1: Obter Credenciais da Wafly

1. Acesse [https://wafly.com.br](https://wafly.com.br)
2. Faça login na sua conta
3. No menu lateral, clique em **Instâncias**
4. Selecione ou crie uma nova instância
5. Copie as seguintes informações:
   - **Client-Token**: Token único do seu cliente
   - **Instance**: Nome da instância (ex: `minha-empresa`)
   - **Token**: Token específico da instância

### Passo 2: Criar Credencial no n8n

1. No n8n, crie um novo workflow ou abra um existente
2. Adicione um nó **Wafly WhatsApp**
3. Clique no campo de credenciais
4. Selecione **Create New Credential**
5. Preencha os campos:

   ```
   Nome: Wafly Production
   Client Token: seu-client-token-aqui
   Instance: sua-instance-aqui
   Token: seu-token-aqui
   Base URL: https://wafly.com.br/api-bridge-whats
   ```

6. Clique em **Test Connection** para verificar
7. Se o teste passar, clique em **Save**

### Passo 3: Conectar sua Instância WhatsApp

Antes de enviar mensagens, você precisa conectar sua instância ao WhatsApp:

1. **Obter QR Code**
   - Use a operação `Instance > Get QR Code`
   - Escaneie o QR Code com seu WhatsApp
   - Ou use o painel da Wafly para conectar

2. **Verificar Status**
   - Use a operação `Instance > Get Status`
   - Certifique-se de que `connected: true`

## ✅ Verificando a Instalação

Execute este workflow de teste:

```json
{
  "name": "Teste Wafly WhatsApp",
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
        "waflyApi": "Wafly Production"
      }
    }
  ]
}
```

Se retornar o status da conexão, está tudo funcionando!

## 🐛 Problemas Comuns e Soluções

### Problema: Nó não aparece na lista

**Solução:**
1. Verifique se o pacote foi instalado: `npm list n8n-nodes-wafly`
2. Reinicie completamente o n8n
3. Limpe o cache do navegador (Ctrl+F5)
4. Verifique os logs do n8n para erros

### Problema: Erro de autenticação

**Solução:**
1. Verifique se copiou corretamente todas as credenciais
2. Certifique-se de que não há espaços extras
3. Verifique se a Base URL está correta
4. Teste as credenciais no painel da Wafly

### Problema: Timeout ao enviar mensagem

**Solução:**
1. Verifique se a instância está conectada
2. Use `Instance > Get Status` para verificar
3. Reconecte a instância se necessário
4. Verifique sua conexão com a internet

### Problema: Erro ao instalar via Docker

**Solução:**
1. Certifique-se de que o container tem acesso à internet
2. Aumente o timeout do npm:
   ```bash
   docker exec n8n npm config set fetch-timeout 600000
   ```
3. Tente instalar manualmente dentro do container

## 🔄 Atualização

Para atualizar para a versão mais recente:

### Via Interface do n8n:
1. Vá em **Settings > Community Nodes**
2. Encontre **n8n-nodes-wafly**
3. Clique em **Update**

### Via npm:
```bash
npm update n8n-nodes-wafly
```

### Via Docker:
```bash
docker exec n8n npm update n8n-nodes-wafly
docker restart n8n
```

## 📞 Suporte

Se você ainda tiver problemas:

- 📧 Email: contato@wafly.com.br
- 💬 Discord: [Comunidade Wafly](https://discord.gg/wafly)
- 🐛 GitHub Issues: [Reportar Problema](https://github.com/wafly/n8n-nodes-wafly/issues)
- 📚 Documentação: [wafly.com.br/docs](https://wafly.com.br/docs)

## 🎉 Próximos Passos

Agora que você instalou o nó Wafly WhatsApp:

1. ✅ Explore os exemplos no README.md
2. ✅ Crie seu primeiro workflow de automação
3. ✅ Configure webhooks para receber mensagens
4. ✅ Integre com outros nós do n8n (Google Sheets, Airtable, etc.)

---

Feito com ❤️ pela equipe [Wafly](https://wafly.com.br)
