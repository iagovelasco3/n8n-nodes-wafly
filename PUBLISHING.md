# Guia de Publicação - n8n-nodes-wafly

Este guia explica como publicar o pacote `n8n-nodes-wafly` no npm para que seus clientes possam instalá-lo facilmente.

## 📋 Pré-requisitos

Antes de publicar, certifique-se de ter:

1. ✅ Conta no npm (crie em [npmjs.com](https://www.npmjs.com/signup))
2. ✅ Node.js v16 ou superior instalado
3. ✅ npm v7 ou superior instalado
4. ✅ Git configurado
5. ✅ Repositório GitHub criado

## 🚀 Passo a Passo para Publicação

### 1. Preparar o Pacote

```bash
# Clone ou navegue até o diretório do projeto
cd n8n-nodes-wafly

# Instale as dependências
npm install

# Execute o linter
npm run lint

# Corrija erros automaticamente
npm run lintfix

# Formate o código
npm run format

# Compile o projeto
npm run build

# Verifique se a pasta dist foi criada
ls -la dist/
```

### 2. Configurar Informações do Pacote

Edite o `package.json` e atualize:

```json
{
  "name": "n8n-nodes-wafly",
  "version": "1.0.0",
  "description": "n8n node for Wafly WhatsApp Bridge API",
  "author": {
    "name": "Seu Nome ou Empresa",
    "email": "contato@wafly.com.br"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/seu-usuario/n8n-nodes-wafly.git"
  },
  "homepage": "https://wafly.com.br",
  "keywords": [
    "n8n-community-node-package",
    "n8n",
    "wafly",
    "whatsapp",
    "whatsapp-api",
    "messaging",
    "automation"
  ]
}
```

### 3. Criar Repositório no GitHub

```bash
# Inicialize o git (se ainda não foi feito)
git init

# Adicione todos os arquivos
git add .

# Faça o commit inicial
git commit -m "Initial commit: n8n-nodes-wafly v1.0.0"

# Adicione o repositório remoto
git remote add origin https://github.com/seu-usuario/n8n-nodes-wafly.git

# Faça o push
git push -u origin main
```

### 4. Login no npm

```bash
# Faça login no npm
npm login

# Você será solicitado a fornecer:
# - Username
# - Password
# - Email
# - One-time password (se 2FA estiver habilitado)
```

### 5. Publicar no npm

```bash
# Verifique o que será publicado
npm pack --dry-run

# Publique o pacote
npm publish

# Se for a primeira publicação e quiser torná-lo público:
npm publish --access public
```

### 6. Verificar Publicação

```bash
# Veja informações do pacote publicado
npm info n8n-nodes-wafly

# Acesse a página do npm
# https://www.npmjs.com/package/n8n-nodes-wafly
```

## 🔄 Atualizações Futuras

### Atualizar Versão Patch (1.0.0 → 1.0.1)

Para correções de bugs:

```bash
# Aumente a versão patch
npm version patch

# Faça o commit
git push && git push --tags

# Publique
npm publish
```

### Atualizar Versão Minor (1.0.0 → 1.1.0)

Para novas funcionalidades compatíveis:

```bash
# Aumente a versão minor
npm version minor

# Faça o commit
git push && git push --tags

# Publique
npm publish
```

### Atualizar Versão Major (1.0.0 → 2.0.0)

Para mudanças que quebram compatibilidade:

```bash
# Aumente a versão major
npm version major

# Faça o commit
git push && git push --tags

# Publique
npm publish
```

## 📝 Checklist Antes de Publicar

- [ ] Todos os testes passam
- [ ] Código está formatado (npm run format)
- [ ] Sem erros de lint (npm run lint)
- [ ] Build está funcionando (npm run build)
- [ ] README.md está atualizado
- [ ] CHANGELOG.md está atualizado
- [ ] Versão foi incrementada no package.json
- [ ] Git tags foram criadas
- [ ] Repositório GitHub está atualizado

## 🏷️ Tags e Releases no GitHub

### Criar Release no GitHub

1. Vá para o repositório no GitHub
2. Clique em **Releases** > **Create a new release**
3. Preencha:
   - **Tag**: v1.0.0 (deve corresponder ao package.json)
   - **Title**: Release v1.0.0 - Initial Release
   - **Description**: Lista das funcionalidades e mudanças

Exemplo de descrição:

```markdown
## 🎉 Initial Release - v1.0.0

### ✨ Funcionalidades

- ✅ Operações de Instância (status, QR code, conectar/desconectar)
- ✅ Envio de Mensagens (texto, imagem, vídeo, áudio, documento, etc.)
- ✅ Gerenciamento de Grupos (criar, adicionar/remover participantes, etc.)
- ✅ Configuração de Webhooks
- ✅ Autenticação com Client-Token

### 📚 Documentação

- README completo com exemplos
- Guia de instalação detalhado
- Exemplos de workflows

### 🔗 Links

- [npm Package](https://www.npmjs.com/package/n8n-nodes-wafly)
- [Documentação da API](https://wafly.com.br/docs)
```

## 🔒 Segurança ao Publicar

### Usar .npmignore

Crie um arquivo `.npmignore` para excluir arquivos desnecessários:

```
# Arquivos de desenvolvimento
src/
*.ts
!*.d.ts
tsconfig.json
.eslintrc.js
.prettierrc.js

# Testes
__tests__/
*.test.ts
*.spec.ts

# Git
.git/
.gitignore

# Documentação de desenvolvimento
PUBLISHING.md
*.todo

# Outros
.vscode/
.idea/
*.log
.DS_Store
```

### Verificar Conteúdo do Pacote

```bash
# Veja o que será incluído no pacote
npm pack --dry-run

# Ou crie um arquivo tar.gz para inspeção
npm pack
tar -xzf n8n-nodes-wafly-1.0.0.tgz
cd package/
ls -la
```

## 📊 Monitoramento Pós-Publicação

### 1. Verificar Downloads

- Acesse: https://npm-stat.com/charts.html?package=n8n-nodes-wafly
- Monitore o crescimento de downloads

### 2. Acompanhar Issues

- Monitore issues no GitHub
- Responda dúvidas e problemas rapidamente

### 3. Coletar Feedback

- Crie discussões no GitHub
- Peça feedback dos usuários
- Implemente melhorias baseadas no uso real

## 🐛 Despublicar (Use com Cuidado!)

Se você precisar despublicar uma versão:

```bash
# Despublicar versão específica
npm unpublish n8n-nodes-wafly@1.0.0

# Despublicar todas as versões (CUIDADO!)
npm unpublish n8n-nodes-wafly --force
```

⚠️ **ATENÇÃO**: 
- Você só pode despublicar dentro de 72 horas
- Despublicar pode quebrar projetos que dependem do seu pacote
- Use apenas em casos extremos (segurança, bugs críticos)

## 📢 Divulgação

Após publicar, divulgue seu pacote:

1. **Comunidade n8n**
   - Poste no [Fórum n8n](https://community.n8n.io)
   - Compartilhe no Discord do n8n

2. **Redes Sociais**
   - Twitter/X com hashtags #n8n #automation
   - LinkedIn para audiência profissional

3. **Blog Post**
   - Escreva um artigo sobre o pacote
   - Inclua exemplos de uso e casos práticos

4. **YouTube**
   - Crie um vídeo tutorial
   - Mostre casos de uso reais

## 🎯 Melhores Práticas

1. **Versionamento Semântico**: Siga [semver.org](https://semver.org)
2. **Changelog**: Mantenha um CHANGELOG.md atualizado
3. **Testes**: Adicione testes automatizados antes de publicar
4. **CI/CD**: Configure GitHub Actions para builds automáticos
5. **Badges**: Adicione badges ao README (versão, downloads, licença)
6. **Exemplos**: Forneça workflows de exemplo

## 🔗 Links Úteis

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [n8n Community Nodes](https://docs.n8n.io/integrations/creating-nodes/build/reference/community-node/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)

---

Feito com ❤️ pela equipe [Wafly](https://wafly.com.br)
