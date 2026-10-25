# Publishing n8n-nodes-wafly

The `.github/workflows/publish.yml` pipeline publishes to npm through OIDC (npm
provenance) when a GitHub release is published. It requires neither a local npm
login nor a publish token. n8n verified community nodes must be published this
way; the n8n Creator Portal detects the new version on npm and reviews it
automatically.

## Prepare

1. Work on a clean branch and preserve other people's changes.
2. To update the API contract, run `npm run sync:api`, review schema/openapi.json
   and schema/source.json and run `npm run gen:ops`. Builds use the committed
   snapshot and never access the network or another repository.
3. Bump the version in package.json/package-lock.json, CHANGELOG and README.
4. Run `npm ci`, `npm test`, `npm run lint` (`n8n-node lint`),
   `npm run check:generated` and `git diff --check`.
5. Build the tarball with `npm pack`. Check the manifest and the distributed files.
6. Run the tarball in an isolated n8n using the local fixture:

```bash
python3 tests/runtime/run.py --image n8nio/n8n:1.120.4 --tarball n8n-nodes-wafly-1.6.1.tgz --out /tmp/wafly-n8n1
python3 tests/runtime/run.py --image n8nio/n8n:2.43.7 --tarball n8n-nodes-wafly-1.6.1.tgz --out /tmp/wafly-n8n2
```

The lab uses only simulated HTTP and its own Docker resources, removed on exit.
It is not proof of real WhatsApp delivery, of every engine or of every n8n
version.

## Publish and verify

With publishing authorization and a green CI, merge the reviewed branch and
create the release/tag matching the version. Wait for the Publish to npm
workflow. Confirm the version with `npm view n8n-nodes-wafly version dist --json`;
download the exact package and compare the dist files with the validated
tarball. Only then record the publication as complete. Publishing does not
change customers' installations.

If publishing fails, investigate the result before retrying. Do not unpublish or
overwrite an existing version. A defect after a release requires a corrective
version, and whoever administers a given n8n can pin the previous installation
explicitly.
