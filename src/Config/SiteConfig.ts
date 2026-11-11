const configuredOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN;
if (process.env.NODE_ENV === 'production' && !configuredOrigin) {
  throw new Error(
    '正式建置需設定 NEXT_PUBLIC_SITE_ORIGIN。本機靜態預覽請用 npm run build:preview。',
  );
}
const origin = configuredOrigin ?? 'http://localhost:3000';
const parsed = new URL(origin);
if (
  !['http:', 'https:'].includes(parsed.protocol) ||
  parsed.pathname !== '/' ||
  parsed.search ||
  parsed.hash ||
  parsed.username ||
  parsed.password
) {
  throw new Error('NEXT_PUBLIC_SITE_ORIGIN 必須為有效的網域來源，不可包含路徑、帳密或 query。');
}
export const SiteConfig = {
  origin: parsed.origin,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '',
  analyticsEnabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
};
