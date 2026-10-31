// Static checks on the published site in the repo root: every page has a title, every local link and anchor
// resolves, the PARTNERS list in partners.html has the shape its render code reads, and nothing points at the
// removed admin page.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = '.';
const errors = [];
const pages = readdirSync(root).filter((f) => f.endsWith('.html'));
const html = Object.fromEntries(pages.map((p) => [p, readFileSync(join(root, p), 'utf8')]));
const ids = Object.fromEntries(pages.map((p) => [p, new Set([...html[p].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))]));

if (!pages.includes('index.html')) errors.push('index.html is missing');

for (const page of pages) {
    const src = html[page];
    if (!/<title>[^<]+<\/title>/.test(src)) errors.push(`${page}: no <title>`);
    if (/admin\.html/.test(src)) errors.push(`${page}: links to admin.html, which is not published`);

    for (const [, ref] of src.matchAll(/\s(?:href|src)="([^"]*)"/g)) {
        // A ref built in a script template (`${…}`) is filled in at runtime, not a file on disk.
        if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(ref) || ref === '' || ref.includes('${')) continue;
        const [path, anchor] = ref.split('#');
        const target = path === '' ? page : path.split('?')[0];
        if (!existsSync(join(root, target))) {
            errors.push(`${page}: link to missing file ${ref}`);
            continue;
        }
        if (anchor && ids[target] && !ids[target].has(anchor)) errors.push(`${page}: link to missing anchor ${ref}`);
    }
}

const fields = ['naam', 'desc', 'adres', 'email', 'tel', 'website'];
let partners;
const list = /\nconst PARTNERS=(\[[\s\S]*?\n\]);/.exec(html['partners.html'] ?? '');
if (!list) errors.push('partners.html: no `const PARTNERS=[…];` list');
else
    try {
        partners = new Function(`return ${list[1]}`)();
    } catch (e) {
        errors.push(`partners.html PARTNERS: ${e.message}`);
    }
if (partners !== undefined) {
    if (!Array.isArray(partners)) errors.push('PARTNERS: not an array');
    else
        partners.forEach((p, i) => {
            for (const f of fields) if (typeof p[f] !== 'string') errors.push(`PARTNERS[${i}]: ${f} is not a string`);
            if (typeof p.naam === 'string' && !p.naam.trim()) errors.push(`PARTNERS[${i}]: naam is empty`);
            if (typeof p.website === 'string' && p.website && !/^https:\/\//.test(p.website)) errors.push(`PARTNERS[${i}]: website is not https`);
        });
}

if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
}
console.log(`check-site: ${pages.length} pages, ${partners.length} partners, all links resolve`);
