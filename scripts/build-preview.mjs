import { spawnSync } from 'node:child_process';
const env = {
  ...process.env,
  NEXT_PUBLIC_SITE_ORIGIN: 'http://localhost:4173',
  NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  NEXT_PUBLIC_ANALYTICS_ENABLED: 'false',
};
if (!process.env.npm_execpath) throw new Error('請透過 npm run build:preview 執行。');
const build = spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'build'], {
  env,
  stdio: 'inherit',
});
process.exit(build.status ?? 1);
