import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { SourcesPage } from '@/View/SourceCatalogView';
import { SeoService } from '@/Service/SeoService';
import { SourceService } from '@/Service/SourceService';
export const metadata = SeoService.metadataFor('/sources/');
export default function Sources() {
  return (
    <>
      <StructuredData
        path="/sources/"
        details={{
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: SourceService.get().sources.length,
            itemListElement: SourceService.get().sources.map((source, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: source.title,
              url: source.url,
            })),
          },
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/sources/" />}
        eyebrow="來源與更正 / CHECK THE SOURCE"
        title="每一個解釋，都應該有依據。"
        description="我們盡力說清楚，也保留被修正的空間。你可以沿著來源，自己再看一次。"
      />
      <SourcesPage />
    </>
  );
}
