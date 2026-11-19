import type { Metadata } from 'next';
import type { BreadcrumbItem, SeoInput, SeoPage } from '@/Model/SeoModel';
import { SeoRepository } from '@/Repository/SeoRepository';
import { SiteService } from './SiteService';
import { LearningService } from './LearningService';
import { MediaLiteracyService } from './MediaLiteracyService';
import { CivicService } from './CivicService';
import { JusticeService } from './JusticeService';
import { LegislationService } from './LegislationService';
import { ParticipationService } from './ParticipationService';
import { OversightService } from './OversightService';
import { PublicResourceService } from './PublicResourceService';
import { SupplementService } from './SupplementService';
import { ElectionService } from './ElectionService';
import { IslandService } from './IslandService';
import { SourceService } from './SourceService';
import { getAgencyDirectory } from './AgencyService';

const publisherName = 'FreeCivicTW 公民自由課';
const latest = (...dates: string[]) => dates.sort().at(-1)!;
let pages: SeoPage[] | undefined;

function getPages(): SeoPage[] {
  if (pages) return pages;
  const site = SiteService.get();
  const media = MediaLiteracyService.get();
  const articles = LearningService.getArticles();
  const dates: Record<string, string> = {
    '/learn/': latest(...articles.map((article) => article.updatedAt)),
    '/government/': latest(
      CivicService.get().checkedAt,
      getAgencyDirectory().checkedAt,
      LegislationService.get().checkedAt,
      ParticipationService.get().checkedAt,
    ),
    '/justice/': JusticeService.get().checkedAt,
    '/civic-island/': latest(
      IslandService.get().checkedAt,
      CivicService.get().checkedAt,
      getAgencyDirectory().checkedAt,
      JusticeService.get().checkedAt,
    ),
    '/oversight/': OversightService.get().checkedAt,
    '/resources/': PublicResourceService.get().checkedAt,
    '/more/': latest(SupplementService.get().checkedAt, ElectionService.getRules().checkedAt),
    '/my-ballots/': latest(ElectionService.getRules().checkedAt, CivicService.get().checkedAt),
    '/media-literacy/': media.updatedAt,
    '/sources/': latest(
      ...SourceService.get().sources.map((source) => source.checkedAt),
      ...SourceService.get().corrections.map((correction) => correction.date),
    ),
    '/privacy/': '2026-11-13',
  };
  pages = [
    ...SeoRepository.get().pages.map((page) => ({
      ...page,
      updatedAt: dates[page.path] ?? site.updatedAt,
    })),
    ...articles.map((article): SeoPage => ({
      path: `/learn/${article.slug}/`,
      label: article.title,
      title: article.title,
      description: article.summary,
      schemaType: 'Article',
      updatedAt: article.updatedAt,
    })),
    ...media.scenarios.map((scenario): SeoPage => ({
      path: `/media-literacy/${scenario.slug}/`,
      label: scenario.title,
      title: `${scenario.title}｜媒體識讀練習`,
      // Fictional claims must not read like assertions about real events in search results.
      description: `虛構教學情境，非真實事件。練習${scenario.skill}：${scenario.claimToCheck} 提供線索、可修改的答案與完整解析。`,
      schemaType: 'LearningResource',
      updatedAt: media.updatedAt,
    })),
  ];
  return pages;
}

export const SeoService = {
  getPages,
  getPage(path: string) {
    const page = getPages().find((item) => item.path === path);
    if (!page) throw new Error(`缺少 SEO 頁面設定：${path}`);
    return page;
  },
  breadcrumbs(path: string): BreadcrumbItem[] {
    const page = SeoService.getPage(path);
    if (path === '/') return [{ name: '首頁', path: '/' }];
    const parent =
      path.startsWith('/learn/') && path !== '/learn/'
        ? '/learn/'
        : path.startsWith('/media-literacy/') && path !== '/media-literacy/'
          ? '/media-literacy/'
          : undefined;
    return [
      { name: '首頁', path: '/' },
      ...(parent ? [{ name: SeoService.getPage(parent).label, path: parent }] : []),
      { name: page.label, path },
    ];
  },
  metadataFor(path: string): Metadata {
    const page = SeoService.getPage(path);
    return SeoService.metadata({
      ...page,
      type: page.schemaType === 'Article' ? 'article' : 'website',
    });
  },
  metadata(input: SeoInput): Metadata {
    const url = SiteService.absolute(input.path);
    const title = input.path === '/' ? input.title : `${input.title}｜公民自由課 FreeCivicTW`;
    return {
      title: input.path === '/' ? { absolute: input.title } : input.title,
      description: input.description,
      alternates: { canonical: url },
      applicationName: publisherName,
      category: '公民教育',
      authors: [{ name: publisherName, url: SiteService.absolute('/about/') }],
      creator: publisherName,
      publisher: publisherName,
      robots: input.noIndex
        ? { index: false, follow: false }
        : {
            index: true,
            follow: true,
            googleBot: {
              index: true,
              follow: true,
              'max-image-preview': 'large',
              'max-snippet': -1,
              'max-video-preview': -1,
            },
          },
      openGraph: {
        type: input.type ?? 'website',
        title,
        description: input.description,
        url,
        siteName: publisherName,
        locale: 'zh_TW',
        images: [
          {
            url: SiteService.absolute('/Images/Site/og-default.png'),
            width: 1200,
            height: 630,
            alt: 'FreeCivicTW 公民自由課',
          },
        ],
        ...(input.type === 'article' && input.updatedAt
          ? { modifiedTime: input.updatedAt, authors: [SiteService.absolute('/about/')] }
          : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description: input.description,
        images: [{ url: SiteService.absolute('/Images/Site/og-default.png'), alt: publisherName }],
      },
    };
  },
  structuredData(path: string, details: Record<string, unknown> = {}): Record<string, unknown> {
    const page = SeoService.getPage(path);
    const site = SiteService.get();
    const url = SiteService.absolute(path);
    const home = SiteService.absolute('/');
    const publisher = {
      '@type': 'Organization',
      '@id': `${home}#publisher`,
      name: publisherName,
      alternateName: '公民自由課',
      url: SiteService.absolute('/about/'),
      description: site.mission,
      logo: { '@type': 'ImageObject', url: SiteService.absolute('/Images/Site/favicon.svg') },
      email: site.contact.email,
      publishingPrinciples: SiteService.absolute('/about/#editorial-policy'),
      correctionsPolicy: SiteService.absolute('/sources/#corrections'),
    };
    const website = {
      '@type': 'WebSite',
      '@id': `${home}#website`,
      name: publisherName,
      alternateName: 'FreeCivicTW',
      url: home,
      inLanguage: 'zh-Hant-TW',
      publisher: { '@id': publisher['@id'] },
    };
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: SeoService.breadcrumbs(path).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: SiteService.absolute(item.path),
      })),
    };
    const isResource = page.schemaType === 'Article' || page.schemaType === 'LearningResource';
    return {
      ...details,
      '@context': 'https://schema.org',
      '@type': page.schemaType,
      '@id': `${url}${path === '/' ? '#website' : isResource ? '#resource' : '#webpage'}`,
      url,
      name: path === '/' ? publisherName : (details.name ?? page.title),
      description: details.description ?? page.description,
      inLanguage: 'zh-Hant-TW',
      dateModified: page.updatedAt,
      isAccessibleForFree: true,
      publisher,
      ...(path === '/'
        ? {
            alternateName: 'FreeCivicTW',
            mainEntity: { '@type': 'WebPage', '@id': `${url}#webpage`, url },
          }
        : { isPartOf: website }),
      ...(isResource
        ? {
            author: {
              '@type': 'Organization',
              '@id': publisher['@id'],
              name: publisherName,
              url: publisher.url,
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${url}#webpage`,
              url,
              name: page.title,
              breadcrumb,
              isPartOf: { '@id': website['@id'] },
            },
          }
        : path !== '/'
          ? { breadcrumb }
          : {}),
    };
  },
  discoveryText() {
    const site = SiteService.get();
    const catalog = getPages();
    const lines = [
      `# ${publisherName}`,
      '',
      `> ${site.description}`,
      '',
      '台灣公民教育專案，並非政府機關。內容以繁體中文提供，免費閱讀。',
      '法規、選舉與司法說明均有適用條件，請一併閱讀頁面來源及查核日期；日期不代表法規當日修正。',
      '媒體識讀的素材與情境均為虛構教學，不是真實事件或真實新聞查核。',
      '',
      '## 主題入口',
      ...catalog
        .filter((page) => SeoService.breadcrumbs(page.path).length <= 2)
        .map(
          (page) => `- [${page.label}](${SiteService.absolute(page.path)}): ${page.description}`,
        ),
      '',
      '## 公民入門筆記',
      ...catalog
        .filter((page) => page.schemaType === 'Article')
        .map(
          (page) => `- [${page.title}](${SiteService.absolute(page.path)}): ${page.description}`,
        ),
      '',
      '## 媒體識讀虛構練習',
      ...catalog
        .filter(
          (page) => page.path.startsWith('/media-literacy/') && page.path !== '/media-literacy/',
        )
        .map(
          (page) => `- [${page.title}](${SiteService.absolute(page.path)}): ${page.description}`,
        ),
      '',
    ];
    return lines.join('\n');
  },
  json(value: Record<string, unknown>) {
    return JSON.stringify(value).replaceAll('<', '\\u003c');
  },
};
