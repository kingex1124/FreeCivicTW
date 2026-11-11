import type { MetadataRoute } from 'next';
import { SiteService } from '@/Service/SiteService';
import { LearningService } from '@/Service/LearningService';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    '/',
    '/learn/',
    '/government/',
    '/my-ballots/',
    '/media-literacy/',
    '/about/',
    '/sources/',
    '/privacy/',
  ];
  return [
    ...pages.map((path) => ({
      url: SiteService.absolute(path),
      lastModified: SiteService.get().updatedAt,
    })),
    ...LearningService.getArticles().map((a) => ({
      url: SiteService.absolute(`/learn/${a.slug}/`),
      lastModified: a.updatedAt,
    })),
    ...MediaLiteracyService.getScenarios().map((s) => ({
      url: SiteService.absolute(`/media-literacy/${s.slug}/`),
      lastModified: MediaLiteracyService.get().updatedAt,
    })),
  ];
}
