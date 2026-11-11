import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const generated = path.resolve(root, 'public', 'Images');
if (generated !== path.join(root, 'public', 'Images'))
  throw new Error('Invalid generated asset directory');
await mkdir(path.dirname(generated), { recursive: true });
await rm(generated, { recursive: true, force: true });
await mkdir(generated, { recursive: true });
const entries = await readdir(path.join(root, 'Images'));
if (entries.length) await cp(path.join(root, 'Images'), generated, { recursive: true });

// Keep Search Console verification files byte-for-byte intact in the static export.
const verificationFiles = (await readdir(root)).filter((name) =>
  /^google[0-9a-f]+\.html$/.test(name),
);
for (const name of verificationFiles) {
  await cp(path.join(root, name), path.join(root, 'public', name));
}
