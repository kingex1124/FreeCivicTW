import { PageIntro } from '@/View/SiteView';
import { OversightView } from '@/View/OversightView';
import { OversightService } from '@/Service/OversightService';
import { SeoService } from '@/Service/SeoService';
import { SiteService } from '@/Service/SiteService';
import { SourceService } from '@/Service/SourceService';

const data = OversightService.get();
export const metadata = SeoService.metadata({
  title: data.title,
  description: data.description,
  path: '/oversight/',
  updatedAt: data.checkedAt,
});

export default function OversightPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: SeoService.json({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: data.title,
            description: data.description,
            url: SiteService.absolute('/oversight/'),
            inLanguage: 'zh-TW',
            dateModified: data.checkedAt,
            isAccessibleForFree: true,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: data.organizations.length,
              itemListOrder: 'https://schema.org/ItemListUnordered',
              itemListElement: data.organizations.map((organization, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                  '@type': 'Organization',
                  name: organization.name,
                  alternateName: organization.shortName,
                  url: organization.officialUrl,
                  description: organization.summary,
                },
              })),
            },
            citation: SourceService.resolve(OversightService.sourceIds(data)).map(
              (source) => source.url,
            ),
            publisher: { '@type': 'Organization', name: 'FreeCivicTW 公民自由課' },
          }),
        }}
      />
      <PageIntro
        eyebrow="民間監督 / CITIZENS KEEP WATCH"
        title="選後，也有人持續看著權力。"
        description={data.description}
      />
      <OversightView data={data} />
    </>
  );
}
