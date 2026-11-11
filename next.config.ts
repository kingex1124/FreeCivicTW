import type { NextConfig } from 'next';
import { getDevelopmentOrigins } from './src/Config/DevelopmentConfig';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
if (basePath && !/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(basePath)) {
  throw new Error('NEXT_PUBLIC_BASE_PATH 必須為空字串或不含結尾斜線的路徑。');
}
const config: NextConfig = {
  allowedDevOrigins: getDevelopmentOrigins(),
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  poweredByHeader: false,
};
export default config;
