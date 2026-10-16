# Publicação do n8n-nodes-wafly

O pipeline `.github/workflows/publish.yml` publica no npm por OIDC quando uma
release GitHub é publicada. Não exige login npm nem token de publicação local.

## Preparar

1. Trabalhe em branch limpa e preserve alterações alheias.
2. Para atualizar o contrato, execute `npm run sync:api`, revise schema/openapi.json
   e schema/source.json e rode `npm run gen:ops`. Builds usam o snapshot
   comprometido e não acessam a rede nem outro repositório.
3. Atualize versão em package.json/package-lock.json, CHANGELOG e README.
4. Rode `npm ci`, `npm test`, `npm run lint`, `npm run check:generated` e
   `git diff --check`.
5. Gere o tarball com `npm pack`. Confira o manifesto e os arquivos distribuídos.
6. Execute o tarball em n8n isolado usando o fixture local:

```bash
python3 tests/runtime/run.py --image n8nio/n8n:1.120.4 --tarball n8n-nodes-wafly-1.6.0.tgz --out /tmp/wafly-n8n1
python3 tests/runtime/run.py --image n8nio/n8n:2.43.7 --tarball n8n-nodes-wafly-1.6.0.tgz --out /tmp/wafly-n8n2
```

O laboratório usa somente HTTP simulado e recursos Docker próprios, removidos
no encerramento. Não é prova de envio WhatsApp real, de todos os motores ou de
todas as versões do n8n.

## Publicar e verificar

Com autorização de publicação e CI aprovado, integre a branch revisada e crie a
release/tag correspondente à versão. Aguarde o workflow Publish to npm.
Confirme a versão em `npm view n8n-nodes-wafly version dist --json`; baixe o
pacote exato e compare os arquivos dist com o tarball validado. Só então registre
publicação concluída. Publicar não altera instalações dos clientes.

Se a publicação falhar, investigue o resultado antes de repetir. Não despublique
ou sobrescreva uma versão existente. Um defeito após release exige uma versão
corretiva, e a instalação anterior pode ser fixada explicitamente por quem
administra aquele n8n.
