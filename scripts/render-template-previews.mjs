import fs from 'node:fs';
import path from 'node:path';

const templates = [
  '05-moderate-whatsapp-group.json',
  '06-send-otp-over-whatsapp.json',
  '07-alert-when-whatsapp-number-disconnects.json',
  '08-qualify-whatsapp-leads-and-hand-off.json',
];

const esc = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const short = (name) => name.length > 27 ? `${name.slice(0, 25)}…` : name;
const color = (type) => {
  if (type.includes('wafly')) return '#2f7a52';
  if (type.includes('webhook')) return '#7c3aed';
  if (type.includes('langchain')) return '#2563eb';
  if (type.includes('if') || type.includes('switch')) return '#d97706';
  if (type.includes('code')) return '#475569';
  return '#64748b';
};

for (const filename of templates) {
  const source = path.join('examples', 'templates', filename);
  const workflow = JSON.parse(fs.readFileSync(source, 'utf8'));
  const nodes = workflow.nodes.filter((node) => !node.type.includes('stickyNote'));
  const byName = new Map(nodes.map((node) => [node.name, node]));
  const xs = nodes.map((node) => node.position[0]);
  const ys = nodes.map((node) => node.position[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scaleX = (value) => 80 + ((value - minX) / Math.max(1, maxX - minX)) * 1000;
  const scaleY = (value) => 150 + ((value - minY) / Math.max(1, maxY - minY)) * 350;

  const edges = [];
  for (const [from, groups] of Object.entries(workflow.connections || {})) {
    const start = byName.get(from);
    if (!start) continue;
    for (const [kind, channels] of Object.entries(groups)) {
      for (const channel of channels || []) {
        for (const edge of channel || []) {
          const end = byName.get(edge.node);
          if (!end) continue;
          const x1 = scaleX(start.position[0]) + 66;
          const y1 = scaleY(start.position[1]);
          const x2 = scaleX(end.position[0]) - 66;
          const y2 = scaleY(end.position[1]);
          const mid = (x1 + x2) / 2;
          const dash = kind === 'main' ? '' : ' stroke-dasharray="6 6"';
          edges.push(`<path${dash} d="M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}"/>`);
        }
      }
    }
  }

  const cards = nodes.map((node) => {
    const x = scaleX(node.position[0]) - 66;
    const y = scaleY(node.position[1]) - 30;
    const fill = color(node.type);
    return `<g transform="translate(${x} ${y})">
      <rect width="132" height="60" rx="12" fill="#fff" stroke="#d7ddd9"/>
      <rect width="8" height="60" rx="4" fill="${fill}"/>
      <circle cx="27" cy="22" r="9" fill="${fill}" opacity=".16"/>
      <circle cx="27" cy="22" r="4" fill="${fill}"/>
      <text x="18" y="46" font-size="10.5" font-weight="650" fill="#26312b">${esc(short(node.name))}</text>
    </g>`;
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f9fbf9"/><stop offset="1" stop-color="#edf7f1"/></linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#163c28" flood-opacity=".12"/></filter>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1060" cy="70" r="170" fill="#2f7a52" opacity=".07"/>
  <text x="60" y="58" font-family="Arial, sans-serif" font-size="18" font-weight="800" fill="#2f7a52">WAFLY × n8n</text>
  <text x="60" y="96" font-family="Arial, sans-serif" font-size="27" font-weight="750" fill="#17211b">${esc(workflow.name)}</text>
  <g fill="none" stroke="#99aaa0" stroke-width="2.5" stroke-linecap="round">${edges.join('')}</g>
  <g filter="url(#shadow)" font-family="Arial, sans-serif">${cards.join('')}</g>
  <rect x="60" y="568" width="250" height="34" rx="17" fill="#e2f2e8"/>
  <text x="77" y="590" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#2f7a52">FREE TEMPLATE · SELF-HOSTED n8n</text>
  <text x="1135" y="591" text-anchor="end" font-family="Arial, sans-serif" font-size="13" fill="#627067">wafly.io</text>
</svg>`;

  const target = path.join('assets', 'template-previews', filename.replace('.json', '.svg'));
  fs.writeFileSync(target, svg);
  console.log(target);
}
