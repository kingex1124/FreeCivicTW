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
