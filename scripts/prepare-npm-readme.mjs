import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// README on GitHub identifies repository clicks. Published npm packages get
// their own source tags in the ephemeral CI checkout, without a new release now.
export function retagReadme(markdown, source, medium) {
  return markdown.replace(/https:\/\/(?:www\.)?wafly\.(?:com\.br|io)\/[^\s<>)\]]*/g, value => {
    const url = new URL(value);
    if (!url.searchParams.has('utm_source')) return value;
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', medium);
    return url.href;
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (!process.argv.includes('--write') || process.env.GITHUB_ACTIONS !== 'true') {
    throw new Error('README preparation writes only in the existing release CI with --write');
  }
  const before = fs.readFileSync('README.md', 'utf8');
  fs.writeFileSync('README.md', retagReadme(before, 'npm', 'community_node'));
  console.log('Prepared npm README source tags; runtime files and version unchanged');
}
