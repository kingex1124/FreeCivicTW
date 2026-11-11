import type { Metadata } from 'next';
import type { SeoInput } from '@/Model/SeoModel';
import { SiteService } from './SiteService';
export const SeoService = {
  metadata(input: SeoInput): Metadata {
    const url = SiteService.absolute(input.path);
    return {
      title: input.title,
      description: input.description,
      alternates: { canonical: url },
      robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
      openGraph: {
        type: input.type ?? 'website',
        title: input.title,
        description: input.description,
        url,
        siteName: 'FreeCivicTW',
        locale: 'zh_TW',
        images: [
          {
            url: SiteService.absolute('/Images/Site/og-default.png'),
            width: 1200,
            height: 630,
            alt: 'FreeCivicTW 公民自由課',
          },
        ],
        ...(input.updatedAt ? { modifiedTime: input.updatedAt } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title: input.title,
        description: input.description,
        images: [SiteService.absolute('/Images/Site/og-default.png')],
      },
    };
  },
  json(value: Record<string, unknown>) {
    return JSON.stringify(value).replaceAll('<', '\\u003c');
  },
};
