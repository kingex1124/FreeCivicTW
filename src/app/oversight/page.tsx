import { StructuredData, Breadcrumbs } from '@/View/SeoView';
import { PageIntro } from '@/View/SiteView';
import { OversightView } from '@/View/OversightView';
import { OversightService } from '@/Service/OversightService';
import { SeoService } from '@/Service/SeoService';
import { SourceService } from '@/Service/SourceService';

const data = OversightService.get();
export const metadata = SeoService.metadataFor('/oversight/');

export default function OversightPage() {
  return (
    <>
      <StructuredData
        path="/oversight/"
        details={{
          name: data.title,
          description: data.description,
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
        }}
      />
      <PageIntro
        breadcrumbs={<Breadcrumbs path="/oversight/" />}
        eyebrow="民間監督 / CITIZENS KEEP WATCH"
        title="選後，也有人持續看著權力。"
        description={data.description}
      />
      <OversightView data={data} />
    </>
  );
}
