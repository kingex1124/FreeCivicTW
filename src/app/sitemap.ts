import type { MetadataRoute } from 'next';
import { SiteService } from '@/Service/SiteService';
import { SeoService } from '@/Service/SeoService';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  return SeoService.getPages().map((page) => ({
    url: SiteService.absolute(page.path),
    lastModified: page.updatedAt,
  }));
}
