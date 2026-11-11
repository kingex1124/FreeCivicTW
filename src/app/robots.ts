import type { MetadataRoute } from 'next';
import { SiteService } from '@/Service/SiteService';
export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: SiteService.absolute('/sitemap.xml') };
}
