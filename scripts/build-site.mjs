import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve, basename } from 'node:path';

// Publish public assets only, never the source checkout or local environment files.
const root = resolve(import.meta.dirname, '..');
const output = resolve(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const excluded = new Set(['api', 'tests', 'node_modules', 'README.md']);
for (const path of ['index.html', 'assets', 'bidpoints', 'css', 'js', 'apgovelections', 'rides', 'pujarinet', 'writings']) {
  await cp(resolve(root, path), resolve(output, path), {
    recursive: true,
    filter: source => !basename(source).startsWith('.') && !excluded.has(basename(source)),
  });
}
// Preserve the downloadable election classroom materials, alongside the compiled app.
await mkdir(resolve(output, 'kwatnoskiapgov'), { recursive: true });
for (const file of await readdir(resolve(root, 'kwatnoskiapgov'))) {
  if (/\.(pdf|docx|pptx|xlsx)$/i.test(file)) {
    await cp(resolve(root, 'kwatnoskiapgov', file), resolve(output, 'kwatnoskiapgov', file));
  }
}
await cp(resolve(root, 'savetheworld/dist'), resolve(output, 'savetheworld'), { recursive: true });
await cp(resolve(root, 'officehours/ux-studio-screen-main/out'), resolve(output, 'officehours'), { recursive: true });
console.log('Built portfolio and all public sub-sites in dist/');
