import { PageIntro } from '@/View/SiteView';
import { PublicResourcesView } from '@/View/PublicResourcesView';
import { PublicResourceService } from '@/Service/PublicResourceService';
import { SeoService } from '@/Service/SeoService';
import { SiteService } from '@/Service/SiteService';

const data = PublicResourceService.get();
export const metadata = SeoService.metadata({
  title: data.title,
  description: data.description,
  path: '/resources/',
  updatedAt: data.checkedAt,
});
export default function ResourcesPage() {
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
            url: SiteService.absolute('/resources/'),
            inLanguage: 'zh-TW',
            dateModified: data.checkedAt,
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: data.entries.length,
              itemListElement: data.entries.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: item.title,
                url: item.url,
                description: item.summary,
              })),
            },
          }),
        }}
      />
      <PageIntro
        eyebrow="便民查詢 / FIND THE SOURCE"
        title="生活裡的疑問，從資料來源開始查。"
        description={data.description}
      />
      <PublicResourcesView data={data} regions={PublicResourceService.regions(data)} />
    </>
  );
}
