import type { MetadataRoute } from 'next';
import { SiteService } from '@/Service/SiteService';
import { LearningService } from '@/Service/LearningService';
import { MediaLiteracyService } from '@/Service/MediaLiteracyService';
import { JusticeService } from '@/Service/JusticeService';
import { CivicService } from '@/Service/CivicService';
import { OversightService } from '@/Service/OversightService';
import { PublicResourceService } from '@/Service/PublicResourceService';
import { SupplementService } from '@/Service/SupplementService';
import { LegislationService } from '@/Service/LegislationService';
export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    '/',
    '/learn/',
    '/government/',
    '/justice/',
    '/oversight/',
    '/resources/',
    '/more/',
    '/my-ballots/',
    '/media-literacy/',
    '/about/',
    '/sources/',
    '/privacy/',
  ];
  return [
    ...pages.map((path) => ({
      url: SiteService.absolute(path),
      lastModified:
        path === '/more/'
          ? SupplementService.get().checkedAt
          : path === '/resources/'
            ? PublicResourceService.get().checkedAt
            : path === '/justice/'
              ? JusticeService.get().checkedAt
              : path === '/oversight/'
                ? OversightService.get().checkedAt
                : path === '/government/'
                  ? [CivicService.get().checkedAt, LegislationService.get().checkedAt]
                      .sort()
                      .at(-1)!
                  : SiteService.get().updatedAt,
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
