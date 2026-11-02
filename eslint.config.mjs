import { config } from '@n8n/node-cli/eslint';

// Standalone app examples are not part of the published n8n community node.
// Keep all verified-node rules active for the package's nodes and credentials.
export default [{ ignores: ['examples/**'] }, ...config];
