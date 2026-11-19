import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { PublicResourcesView } from '@/View/PublicResourcesView';
import { PublicResourceService } from '@/Service/PublicResourceService';
import { SeoService } from '@/Service/SeoService';

const data = PublicResourceService.get();
export const metadata = SeoService.metadataFor('/resources/');
export default function ResourcesPage() {
  return (
    <>
      <StructuredData
        path="/resources/"
        details={{
          name: data.title,
          description: data.description,
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
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/resources/" />}
        eyebrow="便民查詢 / FIND THE SOURCE"
        title="生活裡的疑問，從資料來源開始查。"
        description={data.description}
      />
      <PublicResourcesView data={data} regions={PublicResourceService.regions(data)} />
    </>
  );
}
